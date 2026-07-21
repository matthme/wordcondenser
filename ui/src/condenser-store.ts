import { lazyLoadAndPoll, Unsubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  Record as HolochainRecord,
  encodeHashToBase64,
  AppClient,
  ActionHashMap,
  ActionHash,
} from '@holochain/client';
import { WeaveClient } from '@theweave/api';

import { CravingService } from './craving-service';
import { CravingStore } from './craving-store';
import { Craving } from './condenser/types';
import { getLocalStorageItem } from './utils';

export class CondenserStore {
  private _cravingStores: ActionHashMap<CravingStore> =
    new ActionHashMap<CravingStore>();

  private _pollingUnsubscriber: Unsubscriber | undefined;

  constructor(
    protected appWebsocket: AppClient,
    protected weaveClient: WeaveClient,
  ) {
    this.reSubscribeToPolling();
  }

  /** Here comes the Cravings logic */

  cravingStore(cravingHash: ActionHash) {
    return this._cravingStores.get(cravingHash);
  }

  reSubscribeToPolling() {
    if (this._pollingUnsubscriber) this._pollingUnsubscriber();

    let unsubscribers: Array<Unsubscriber> = [];

    Array.from(this._cravingStores.values()).forEach(store => {
      const unsubscribe1 = (store as CravingStore).associationsCount.subscribe(
        () => undefined,
      );
      const unsubscribe2 = (store as CravingStore).offersCount.subscribe(
        () => undefined,
      );
      const unsubscribe3 = (
        store as CravingStore
      ).allReflectionsCount.subscribe(() => undefined);
      const unsubscribe4 = (store as CravingStore).allCommentsCount.subscribe(
        () => undefined,
      );
      unsubscribers = [unsubscribe1, unsubscribe2, unsubscribe3, unsubscribe4];
    });
    this._pollingUnsubscriber = () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Create a new craving as the original poster
   *
   * @param craving
   * @param networkSeed
   * @returns
   */
  async createCraving(craving: Craving): Promise<EntryRecord<Craving>> {
    const record = await this.appWebsocket.callZome({
      role_name: 'craving',
      zome_name: 'craving',
      fn_name: 'create_craving',
      payload: craving,
    });

    const entryRecord = new EntryRecord<Craving>(record);

    const cravingService = new CravingService(
      this.appWebsocket,
      'craving',
      'craving',
      entryRecord.actionHash,
      entryRecord,
    );

    const cravingStore = await CravingStore.connect(
      cravingService,
      this.weaveClient,
    );
    this._cravingStores.set(entryRecord.actionHash, cravingStore);

    this.reSubscribeToPolling();

    return entryRecord;
  }

  async getAllCravings(local = true): Promise<Array<HolochainRecord>> {
    return this.appWebsocket.callZome({
      role_name: 'craving',
      zome_name: 'craving',
      fn_name: 'get_all_cravings',
      payload: {
        input: null,
        local,
      },
    });
  }

  async getAllCravingsAndUpdateStores(
    local = true,
  ): Promise<EntryRecord<Craving>[]> {
    const allCravingRecords = await this.getAllCravings(local);

    // Check against known cravings
    // - if craving is not known at all, send OS notification / notification to Moss
    // - if craving has no CravingStore yet, create one

    const allCravingEntryRecords = allCravingRecords.map(
      record => new EntryRecord<Craving>(record),
    );

    await Promise.all(
      allCravingEntryRecords.map(async entryRecord => {
        const cravingDiscovered = getLocalStorageItem<number>(
          `cravingDiscovered#${encodeHashToBase64(entryRecord.actionHash)}`,
        );

        if (!cravingDiscovered) {
          // TODO! Notify Moss
          // This is a new Craving :) Send OS notification
          try {
            await this.weaveClient.notifyFrame([
              {
                title: 'New Craving',
                body: 'A new craving is available.',
                notification_type: 'craving',
                urgency: 'high',
                timestamp: Date.now(),
                icon_src: undefined,
              },
            ]);
          } catch (e) {
            console.warn(`Failed to send OS notification: ${e}`);
          }
          window.localStorage.setItem(
            `cravingDiscovered#${encodeHashToBase64(entryRecord.actionHash)}`,
            JSON.stringify(Date.now()),
          );
        }

        // if no CravingStore has been added yet, add one
        const cravingStoreExists = this._cravingStores.get(
          entryRecord.actionHash,
        );
        if (!cravingStoreExists) {
          const cravingService = new CravingService(
            this.appWebsocket,
            'craving',
            'craving',
            entryRecord.actionHash,
            entryRecord,
          );
          const cravingStore = await CravingStore.connect(
            cravingService,
            this.weaveClient,
          );
          console.log(
            'Setting craving store for action hash ',
            encodeHashToBase64(entryRecord.actionHash),
          );
          this._cravingStores.set(entryRecord.actionHash, cravingStore);
        }
      }),
    );

    return allCravingEntryRecords;
  }

  /**
   * Used only to display the count of available cravings, i.e. newly arrived cravings
   */
  allCravings = lazyLoadAndPoll(
    async () => this.getAllCravingsAndUpdateStores(false),
    5000,
    // On first load, fetch cravings locally
    async () => this.getAllCravingsAndUpdateStores(true),
  );
}
