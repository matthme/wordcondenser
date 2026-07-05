import {
  derived,
  get,
  lazyLoadAndPoll,
  Readable,
  Unsubscriber,
  writable,
  Writable,
} from '@holochain-open-dev/stores';
import { decodeEntry } from '@holochain-open-dev/utils';
import {
  CellId,
  CellType,
  ClonedCell,
  DnaHash,
  encodeHashToBase64,
  DnaHashMap,
  AppClient,
  CreateCloneCellRequest,
} from '@holochain/client';
import { WeaveClient } from '@theweave/api';
import { decode, encode } from '@msgpack/msgpack';

import md5 from 'md5';

import { CravingService } from './craving-service';
import { CravingStore } from './craving-store';
import { CravingDnaProperties } from './condenser/types';
import { LobbyService } from './lobby-service';
import { LobbyStore } from './lobby-store';
import { DnaRecipe, LobbyInfo } from './types';
import { getLocalStorageItem, notifyOS } from './utils';

export interface CravingData {
  title: string; // in case it is not installed, we have info about the title from the DnaRecipe
  dnaHash: DnaHash; // DNA hash of the craving
  enabled: boolean; // is this craving installed and enabled?
  installed: boolean; // is this craving installed?
  lobbies: LobbyData[]; // which lobbies is this craving referenced/listed in?
}

export interface LobbyData {
  name: string;
  info: LobbyInfo | undefined;
}

export type CravingCreationTime = number;

export class CondenserStore {
  private _installedCravings: Writable<DnaHashMap<CravingStore>> = writable(
    new DnaHashMap<CravingStore>(),
  );

  private _disabledCravings: Writable<Record<string, ClonedCell>> = writable(
    {},
  ); // keys are the clone's names

  private _knownCravings: Writable<
    DnaHashMap<[CravingCreationTime, DnaRecipe]>
  > = // dna hash of craving as keys
    writable(new DnaHashMap<[CravingCreationTime, DnaRecipe]>());

  private _lobbyStore: LobbyStore;

  private _filterGroup: Writable<DnaHash | undefined> = writable(undefined);

  private _pollingUnsubscriber: Unsubscriber | undefined;

  constructor(
    protected appWebsocket: AppClient,
    protected weaveClient: WeaveClient,
    installedCravings: DnaHashMap<CravingStore>,
    disabledCravings: Record<string, ClonedCell>,
    lobbyStore: LobbyStore,
  ) {
    this._installedCravings.set(installedCravings);
    this._disabledCravings.set(disabledCravings);
    this._lobbyStore = lobbyStore;
    this.reSubscribeToPolling();
    // console.log("@CondenserStore constructor: installedCravings: ", installedCravings.values());
    // console.log("@CondeserStore constructor: this._installedCravings: ", get(this._installedCravings));
  }

  static async connect(appClient: AppClient, weaveClient: WeaveClient) {
    // console.log("%%% Connecting to CondenserStore... %%%");

    const [installedCravings, disabledCravings, lobbyStore] =
      await this.fetchCells(appClient);
    // console.log("%%% @connect(): installedCravings: ", installedCravings);
    // console.log("%%% @connect(): disabledCravings: ", disabledCravings);

    return new CondenserStore(
      appClient,
      weaveClient,
      installedCravings,
      disabledCravings,
      lobbyStore,
    );
  }

  filterByGroup(lobbyDnaHash: DnaHash) {
    if (get(this._filterGroup)) {
      if (
        encodeHashToBase64(get(this._filterGroup)!) ===
        encodeHashToBase64(lobbyDnaHash)
      ) {
        this._filterGroup.set(undefined);
      } else {
        this._filterGroup.set(lobbyDnaHash);
      }
    } else {
      this._filterGroup.set(lobbyDnaHash);
    }
  }

  clearGroupFilter() {
    this._filterGroup.set(undefined);
  }

  /**
   * Whether this raving is filtered out because none of the groups (lobbies) it's related to is the _filterGroup
   * @param lobbyDnaHash
   */
  amIFiltered(lobbyDnaHashes: DnaHash[]): Readable<boolean> {
    const base64Hashes = lobbyDnaHashes.map(hash => encodeHashToBase64(hash));
    return derived(
      this._filterGroup,
      store => !!store && !base64Hashes.includes(encodeHashToBase64(store)),
    );
  }

  activeGroupFilter(): Readable<DnaHash | undefined> {
    return derived(this._filterGroup, store => store);
  }

  /**
   * Fetches the stores freshly. This is useful for example to make sure the stores get updated
   * after disabling/enabling a cell
   *
   */
  async fetchStores() {
    const [installedCravings, disabledCravings, lobbyStore] =
      await CondenserStore.fetchCells(this.appWebsocket);

    const knownCravings = new DnaHashMap<[CravingCreationTime, DnaRecipe]>();

    const allRecipeRecords = await lobbyStore.service.getAllCravingRecipes();
    const allRecipesWithCreationTime: Array<[number, DnaRecipe]> =
      allRecipeRecords.map(record => [
        record.signed_action.hashed.content.timestamp,
        decodeEntry(record) as DnaRecipe,
      ]);

    allRecipesWithCreationTime.forEach(([creationTime, recipe]) => {
      knownCravings.set(recipe.resulting_dna_hash, [creationTime, recipe]);
    });

    this._installedCravings.set(installedCravings);
    this._disabledCravings.set(disabledCravings);
    this._lobbyStore = lobbyStore;
  }

  /**
   * Queries the conductor to get all craving and lobby cells and creates stores for the enabled ones
   *
   * @param appWebsocket
   * @returns
   */
  static async fetchCells(
    appWebsocket: AppClient,
  ): Promise<
    [DnaHashMap<CravingStore>, Record<string, ClonedCell>, LobbyStore]
  > {
    const installedCravings = new DnaHashMap<CravingStore>();
    const disabledCravings: Record<string, ClonedCell> = {};

    const appInfo = await appWebsocket.appInfo();
    if (!appInfo) {
      throw new Error('AppInfo is null.');
    }
    // console.log("%%% AppInfo: ", appInfo);
    const cravingCells = appInfo.cell_info.craving;
    await Promise.all(
      cravingCells.map(async cellInfo => {
        // console.log("@CondenserStore.connect(): Found cell: ", cellInfo);
        if (cellInfo.type === CellType.Cloned) {
          const cloneInfo = cellInfo;
          const cellId = cloneInfo.value.cell_id;

          // For every craving cell, create a CravingStore and add it to the DnaHashMap, if the cell is enabled
          if (cloneInfo.value.enabled) {
            const cravingService = new CravingService(
              appWebsocket,
              'craving',
              cellId,
            );

            // const networkSeed = cellInfo[CellType.Cloned].dna_modifiers.network_seed;
            try {
              const cravingStore = await CravingStore.connect(cravingService);
              installedCravings.set(cellId[0], cravingStore);
            } catch (e) {
              console.warn(
                `Failed to connect to craving store: ${JSON.stringify(e)}`,
              );
            }
          } else {
            // if the craving cell is disabled
            // Here either take the name of the group from the dna properties or from the clone name
            disabledCravings[cloneInfo.value.name] = cloneInfo.value;
          }
        }
      }),
    );

    // // Get the lobby cell
    // const provisionedLobbyCellInfo = appInfo.cell_info.lobby.find(
    //   cellInfo => cellInfo.type === CellType.Provisioned,
    // );
    const lobbyService = new LobbyService(appWebsocket, 'cravings');
    const lobbyStore = await LobbyStore.connect(lobbyService);

    return [installedCravings, disabledCravings, lobbyStore];
  }

  /** Here comes the Cravings logic */

  cravingStore(cellId: CellId) {
    return derived(this._installedCravings, store => store.get(cellId[0]));
  }

  getAllInstalledCravings(): Readable<DnaHashMap<CravingStore>> {
    return derived(this._installedCravings, cravings => cravings);
  }

  getAllDisabledCravings(): Readable<Record<string, ClonedCell>> {
    return derived(this._disabledCravings, cravings => cravings);
  }

  reSubscribeToPolling() {
    if (this._pollingUnsubscriber) this._pollingUnsubscriber();

    let unsubscribers: Array<Unsubscriber> = [];

    Array.from(get(this._installedCravings).values()).forEach(store => {
      const unsubscribe1 = store.associationsCount.subscribe(() => undefined);
      const unsubscribe2 = store.offersCount.subscribe(() => undefined);
      const unsubscribe3 = store.allReflectionsCount.subscribe(() => undefined);
      const unsubscribe4 = store.allCommentsCount.subscribe(() => undefined);
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
  async createCraving(
    properties: CravingDnaProperties,
    networkSeed: string,
  ): Promise<ClonedCell> {
    const cloneCellRequest = {
      role_name: 'craving',
      modifiers: {
        network_seed: networkSeed,
        // properties: encode(properties),
        properties,
      },
      name: properties.title,
    };

    // const test = decode(cloneCellRequest);
    // console.log("Deserialized request: ", cloneCellRequest);

    // console.log("@createCraving: clonecellrequest: ", cloneCellRequest);
    const requestHash = md5(JSON.stringify(cloneCellRequest));
    // console.log("@createCraving: Hash of create clone cell request: ", requestHash)

    const cellInfo = await this.weaveClient.createCloneCell(
      cloneCellRequest,
      true,
    );

    const cellId = cellInfo.cell_id;

    // console.log(`@condenser-store: created craving with dna hash: ${encodeHashToBase64(cellId[0])}`);

    const cravingService = new CravingService(
      this.appWebsocket,
      'craving',
      cellId,
    );

    const cravingStore = await CravingStore.connect(cravingService);

    this._installedCravings.update(store => store.set(cellId[0], cravingStore));

    this.reSubscribeToPolling();

    return cellInfo;
  }

  /**
   * Join an existing craving based on the DnaRecipe retrieved from a lobby cell
   *
   * @param dnaRecipe
   * @returns
   */

  async joinCraving(dnaRecipe: DnaRecipe): Promise<ClonedCell> {
    // console.log(`JOINING CRAVING WITH RECIPE: ${JSON.stringify(dnaRecipe)}`);
    // console.log(`JOINING CRAVING WITH resulting dna hash: ${encodeHashToBase64(dnaRecipe.resulting_dna_hash)}`);

    const cloneCellRequest: CreateCloneCellRequest = {
      role_name: 'craving',
      modifiers: {
        network_seed: dnaRecipe.network_seed,
        properties: encode(dnaRecipe.properties),
      },
      name: dnaRecipe.title,
    };

    // console.log("@joinCraving: cloneCellRequest: ", cloneCellRequest);
    const requestHash = md5(JSON.stringify(cloneCellRequest));
    // console.log("@joinCraving: Hash of create clone cell request: ", requestHash)

    const cellInfo = await this.weaveClient.createCloneCell(
      cloneCellRequest,
      false, // We are joining a cell that had already been registered
    );

    const cellId = cellInfo.cell_id;

    // console.log(`@condenser-store: @joinCraving: created cell clone with dna hash: ${encodeHashToBase64(cellId[0])}`);

    // console.log("@CondenserStore: @joinCraving: Created clone cell: ", cellInfo);

    const cravingService = new CravingService(
      this.appWebsocket,
      'craving',
      cellId,
    );

    const cravingStore = await CravingStore.connect(cravingService);

    this._installedCravings.update(store => store.set(cellId[0], cravingStore));

    this.reSubscribeToPolling();

    return cellInfo;
  }

  /**
   * Disables the craving
   *
   * @param cellId
   *
   */
  async disableCraving(cellId: CellId) {
    await this.appWebsocket.disableCloneCell({
      clone_cell_id: { type: 'dna_hash', value: cellId[0] },
    });

    alert(
      `Disabled Craving. To delete it permanently, delete the corresponding cloned cell with the DNA hash\n\n"${encodeHashToBase64(
        cellId[0],
      )}"\n\nin the Holochain Launcher Admin.\n\nWARNING: If you delete a Craving permanently, you won't ever be able to rejoin it with this installation of the Word Condenser.`,
    );
  }

  /**
   * Enables the craving
   *
   * @param cellId
   *
   */
  async enableCraving(cellId: CellId) {
    await this.appWebsocket.enableCloneCell({
      clone_cell_id: { type: 'dna_hash', value: cellId[0] },
    });

    alert(`Enabled Craving.`);
  }

  /** Here comes the Lobby logic */

  lobbyStore() {
    return this._lobbyStore;
  }

  /**
   * Gets the cravings that are available but neither installed nor disabled.
   */
  getAvailableCravings(): Readable<
    Array<[DnaHash, [CravingCreationTime, DnaRecipe]]>
  > {
    return derived(this._knownCravings, mapping => {
      const installedCravingsHashes = Array.from(
        get(this._installedCravings).values(),
      )
        .map(store => store.service.cellId[0])
        .map(hash => JSON.stringify(hash));
      const disabledCravingsHashes = Object.values(get(this._disabledCravings))
        .map(cloneInfo => cloneInfo.cell_id[0])
        .map(hash => JSON.stringify(hash));

      return Array.from(mapping.entries()).filter(
        ([dnaHash, [_creationTime, _recipe]]) => {
          const stringifiedHash = JSON.stringify(dnaHash);
          return (
            !installedCravingsHashes.includes(stringifiedHash) &&
            !disabledCravingsHashes.includes(stringifiedHash)
          );
        },
      );
    });
  }

  /**
   * Used only to display the count of available cravings, i.e. newly arrived cravings
   */
  allAvailableCravings = lazyLoadAndPoll(async () => {
    let allKnownCravingHashes: Array<DnaHash> = [];
    const allRecipeRecords =
      await this._lobbyStore.service.getAllCravingRecipes();
    const allRecipeDnaHashes = allRecipeRecords
      .map(record => decodeEntry(record) as DnaRecipe)
      .map(recipe => recipe.resulting_dna_hash);
    allKnownCravingHashes = [...allKnownCravingHashes, ...allRecipeDnaHashes];

    allRecipeDnaHashes.forEach(async dnaHash => {
      const cravingDiscovered = getLocalStorageItem<number>(
        `cravingDiscovered#${encodeHashToBase64(dnaHash)}`,
      );
      if (!cravingDiscovered) {
        // TODO! Notify Moss
        // This is a new Craving :) Send OS notification and add to discoveredCravings
        try {
          await notifyOS(
            {
              title: 'New Craving',
              body: 'A new Craving is available.',
              urgency: 'medium',
            },
            false,
            true,
          );
        } catch (e) {
          console.warn(`Failed to send OS notification: ${e}`);
        }
        window.localStorage.setItem(
          `cravingDiscovered#${encodeHashToBase64(dnaHash)}`,
          JSON.stringify(Date.now()),
        );
      }
    });

    // Check against installed cells
    const installedCravings = Array.from(
      get(this._installedCravings).keys(),
    ).map(hash => hash.toString());

    return allKnownCravingHashes.filter(
      dnaHash => !installedCravings.includes(dnaHash.toString()),
    );
  }, 5000);
}
