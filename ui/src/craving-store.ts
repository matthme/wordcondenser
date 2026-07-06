import { AsyncReadable, lazyLoadAndPoll } from '@holochain-open-dev/stores';
import { LazyHoloHashMap } from '@holochain/client';
import {
  ActionHash,
  AgentPubKey,
  encodeHashToBase64,
  EntryHash,
  NewEntryAction,
  Record,
} from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { isWeaveContext, WeaveClient } from '@theweave/api';

import { CravingService } from './craving-service';
import { Craving } from './condenser/types';
import { CravingMessageStore } from './types';
import {
  getCravingNotificationSettings,
  getLocalStorageItem,
  getNotifiedAssociationsCount,
  getNotifiedCommentsCount,
  getNotifiedOffersCount,
  getNotifiedReflectionsCount,
  newAssociationsCount,
  newCommentsCount,
  newOffersCount,
  newReflectionsCount,
  reloadableLazyLoadAndPoll,
  setNotifiedAssociationsCount,
  setNotifiedCommentsCount,
  setNotifiedOffersCount,
  setNotifiedReflectionsCount,
} from './utils';

export interface AssociationData {
  record: Record;
  resonators: AgentPubKey[];
  iResonated: boolean;
  timestamp: number;
}

export interface OfferData {
  record: Record;
  resonators: AgentPubKey[];
  iResonated: boolean;
  timestamp: number;
}

export class CravingStore {
  // public networkSeed: string;

  private constructor(
    public service: CravingService,
    public weaveClient: WeaveClient,
    public craving: EntryRecord<Craving>,
    public messageStore: CravingMessageStore | undefined, // networkSeed: string,
  ) {
    // this.networkSeed = networkSeed;
  }

  static async connect(service: CravingService, weaveClient: WeaveClient) {
    const craving = service.craving;

    // get message store for this Craving from localStorage

    const messageStore = getLocalStorageItem<CravingMessageStore>(
      encodeHashToBase64(service.cravingHash),
    );

    return new CravingStore(service, weaveClient, craving, messageStore);
  }

  /**
   * Updates the comments count in localStorage for a reflection.
   * If there was no entry for that reflection before, it will be added.
   * @param relfectionHash
   */
  updateCommentsCount(relfectionHash: EntryHash, newCount: number) {
    const b64hash = encodeHashToBase64(relfectionHash);
    if (this.messageStore) {
      this.messageStore.reflections[b64hash] = {
        comments_count: newCount,
        latest_update: Date.now(),
      };
    } else {
      const messageStore: CravingMessageStore = {
        association_count: undefined,
        latest_association_update: undefined,
        offers_count: undefined,
        latest_offer_update: undefined,
        reflections: {},
      };
      messageStore.reflections[b64hash] = {
        comments_count: newCount,
        latest_update: Date.now(),
      };
      this.messageStore = messageStore;
    }

    // write to localStorage
    window.localStorage.setItem(
      encodeHashToBase64(this.service.cravingHash),
      JSON.stringify(this.messageStore),
    );
  }

  /**
   * Updates the associations count in localStorage for the craving.
   */
  updateAssociationsCount(newCount: number) {
    if (this.messageStore) {
      this.messageStore.association_count = newCount;
      this.messageStore.latest_association_update = Date.now();
    } else {
      this.messageStore = {
        association_count: newCount,
        latest_association_update: Date.now(),
        offers_count: undefined,
        latest_offer_update: undefined,
        reflections: {},
      };
    }

    // write to localStorage
    window.localStorage.setItem(
      encodeHashToBase64(this.service.cravingHash),
      JSON.stringify(this.messageStore),
    );
  }

  /**
   * Updates the associations count in localStorage for the craving.
   */
  updateReflectionsCount(reflectionHashes: ActionHash[]) {
    if (!this.messageStore) {
      this.messageStore = {
        association_count: undefined,
        latest_association_update: undefined,
        offers_count: undefined,
        latest_offer_update: undefined,
        reflections: {},
      };
    }

    reflectionHashes.forEach(hash => {
      const reflectionHash = encodeHashToBase64(hash);
      if (!this.messageStore?.reflections[reflectionHash]) {
        // if there is no entry for this reflection hash yet, create one
        this.messageStore!.reflections[reflectionHash] = {
          comments_count: 0,
          latest_update: Date.now(),
        };
      }
    });

    // write to localStorage
    window.localStorage.setItem(
      encodeHashToBase64(this.service.cravingHash),
      JSON.stringify(this.messageStore),
    );
  }

  /**
   * Updates the associations count in localStorage for the craving.
   */
  updateOffersCount(newCount: number) {
    if (this.messageStore) {
      this.messageStore.offers_count = newCount;
      this.messageStore.latest_offer_update = Date.now();
    } else {
      this.messageStore = {
        association_count: undefined,
        latest_association_update: undefined,
        offers_count: newCount,
        latest_offer_update: Date.now(),
        reflections: {},
      };
    }

    // write to localStorage
    window.localStorage.setItem(
      encodeHashToBase64(this.service.cravingHash),
      JSON.stringify(this.messageStore),
    );
  }

  allAssociations = reloadableLazyLoadAndPoll(
    async () => {
      const associationRecords = await this.service.getAllAssociations(
        this.service.cravingHash,
        false,
      );

      const myPubKey = this.service.client.myPubKey;

      // here: Promise.all( ... fetch resonances for each of the records ... )
      return Promise.all(
        associationRecords.map(async record => {
          const resonances = await this.service.getResonatorsForEntry(
            (record.signed_action.hashed.content as NewEntryAction).entry_hash,
          );
          const iResonated = resonances
            .map(pubkey => encodeHashToBase64(pubkey))
            .includes(encodeHashToBase64(myPubKey));
          const associationData: AssociationData = {
            record,
            resonators: resonances,
            iResonated,
            timestamp: record.signed_action.hashed.content.timestamp,
          };

          return associationData;
        }),
      );
    },
    4_000,
    'Failed to get all associations',
    async () => {
      const associationRecords = await this.service.getAllAssociations(
        this.service.cravingHash,
        true, // Get associations locally in the first run
      );

      console.log('#1 Fetched associations');

      const myPubKey = this.service.cravingHash;

      // here: Promise.all( ... fetch resonances for each of the records ... )
      return Promise.all(
        associationRecords.map(async record => {
          const resonances = await this.service.getResonatorsForEntry(
            (record.signed_action.hashed.content as NewEntryAction).entry_hash,
          );
          const iResonated = resonances
            .map(pubkey => encodeHashToBase64(pubkey))
            .includes(encodeHashToBase64(myPubKey));
          const associationData: AssociationData = {
            record,
            resonators: resonances,
            iResonated,
            timestamp: record.signed_action.hashed.content.timestamp,
          };

          return associationData;
        }),
      );
    },
  );

  // useful for immediately displaying the number of new associations on the craving detail card
  // no need to also get number of drops
  // returns [{total count}, {count of new associations}]
  associationsCount = lazyLoadAndPoll(async () => {
    const allAssociations = await this.service.getAllAssociations(
      this.service.cravingHash,
    );
    const currentCount = allAssociations.length;
    const newCount = newAssociationsCount(
      this.service.cravingHash,
      currentCount,
    );

    const notifiedCount =
      getNotifiedAssociationsCount(
        encodeHashToBase64(this.service.cravingHash),
      ) || 0;

    if (isWeaveContext() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(this.service.cravingHash),
      );
      if (
        notificationSettings.associations.os ||
        notificationSettings.associations.systray
      ) {
        try {
          await this.weaveClient.notifyFrame([
            {
              title: `New Association for Craving '${this.craving.entry.title}'`,
              body: 'A new association has been added by someone.',
              notification_type: 'association',
              urgency: 'low',
              timestamp: Date.now(),
              icon_src: undefined,
            },
          ]);
          setNotifiedAssociationsCount(
            encodeHashToBase64(this.service.cravingHash),
            currentCount,
          );
        } catch (err) {
          console.warn(`Failed to notify OS: ${err}`);
        }
      }
    }
    return [
      currentCount.toString(),
      newCount ? newCount.toString() : undefined,
    ] as [string, string | undefined];
  }, 2000);

  // useful for immediately displaying the number of new offesr on the craving detail card
  // no need to also get number of drops
  // returns [{total count}, {count of new offers}]
  offersCount = lazyLoadAndPoll(async () => {
    const allOffers = await this.service.getAllOffers(this.service.cravingHash);
    const currentCount = allOffers.length;
    const newCount = newOffersCount(this.service.cravingHash, currentCount);
    const notifiedCount =
      getNotifiedOffersCount(encodeHashToBase64(this.service.cravingHash)) || 0;

    if (isWeaveContext() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(this.service.cravingHash),
      );
      if (
        notificationSettings.offers.os ||
        notificationSettings.offers.systray
      ) {
        try {
          await this.weaveClient.notifyFrame([
            {
              title: `New Offer for Craving '${this.craving.entry.title}'`,
              body: 'A new offer has been added by someone.',
              notification_type: 'offer',
              urgency: 'medium',
              timestamp: Date.now(),
              icon_src: undefined,
            },
          ]);
          setNotifiedOffersCount(
            encodeHashToBase64(this.service.cravingHash),
            currentCount,
          );
        } catch (err) {
          console.warn(`Failed to notify OS: ${err}`);
        }
      }
    }

    return [
      currentCount.toString(),
      newCount ? newCount.toString() : undefined,
    ] as [string, string | undefined];
  }, 2000);

  /**
   * Gets all reflections and all comments for those reflections and returns the number
   * of reflections + comments
   */
  allCommentsCount = lazyLoadAndPoll(async () => {
    const reflectionRecords = await this.service.getAllReflections(
      this.service.cravingHash,
    );
    let currentCount = 0;
    await Promise.all(
      reflectionRecords.map(async record => {
        const commentRecords = await this.service.getAllCommentsOnReflection(
          record.signed_action.hashed.hash,
        );
        currentCount += commentRecords.length;
      }),
    );

    const newCount = newCommentsCount(this.service.cravingHash, currentCount);
    const notifiedCount =
      getNotifiedCommentsCount(encodeHashToBase64(this.service.cravingHash)) ||
      0;
    if (isWeaveContext() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(this.service.cravingHash),
      );
      if (
        notificationSettings.comments.os ||
        notificationSettings.comments.systray
      ) {
        try {
          await this.weaveClient.notifyFrame([
            {
              title: `New Comment for Craving '${this.craving.entry.title}'`,
              body: 'A new offer has been added by someone.',
              notification_type: 'offer',
              urgency: 'medium',
              timestamp: Date.now(),
              icon_src: undefined,
            },
          ]);
          setNotifiedCommentsCount(
            encodeHashToBase64(this.service.cravingHash),
            currentCount,
          );
        } catch (err) {
          console.warn(`Failed to notify OS: ${err}`);
        }
      }
    }
    return [
      currentCount.toString(),
      newCount ? newCount.toString() : undefined,
    ] as [string, string | undefined];
  }, 3500);

  allReflections = lazyLoadAndPoll(
    () => this.service.getAllReflections(this.service.cravingHash),
    1500,
  );

  // useful for immediately displaying the number of new associations on the craving detail card
  // no need to also get number of drops
  // returns [{total count}, {count of new associations}]
  allReflectionsCount = lazyLoadAndPoll(async () => {
    const allReflections = await this.service.getAllReflections(
      this.service.cravingHash,
    );
    const currentCount = allReflections.length;
    const newCount = newReflectionsCount(
      this.service.cravingHash,
      currentCount,
    );

    const notifiedCount =
      getNotifiedReflectionsCount(
        encodeHashToBase64(this.service.cravingHash),
      ) || 0;

    if (isWeaveContext() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(this.service.cravingHash),
      );
      if (
        notificationSettings.reflections.os ||
        notificationSettings.reflections.systray
      ) {
        try {
          await this.weaveClient.notifyFrame([
            {
              title: `New Reflection for Craving '${this.craving.entry.title}'`,
              body: 'A new reflection has been added by someone.',
              notification_type: 'offer',
              urgency: 'medium',
              timestamp: Date.now(),
              icon_src: undefined,
            },
          ]);
          setNotifiedReflectionsCount(
            encodeHashToBase64(this.service.cravingHash),
            currentCount,
          );
        } catch (err) {
          console.warn(`Failed to notify OS: ${err}`);
        }
      }
    }
    return [
      currentCount.toString(),
      newCount ? newCount.toString() : undefined,
    ] as [string, string | undefined];
  }, 2000);

  // // create instead a data structure here that also contains all the comments and resonances for a reflection
  // allReflections = asyncReadable<Array<Record>>(async (set) => {
  //   let reflectionRecords = await this.service.getAllReflections();
  //   set(reflectionRecords);

  //   return this.service.on("signal", (signal) => {
  //     if (signal.type === "EntryCreated" && signal.app_entry.type === "Reflection") {
  //       reflectionRecords.push(signal.record);
  //       set(reflectionRecords)
  //     }
  //   })
  // });

  // all comments on all reflections
  commentsOnReflections = new LazyHoloHashMap(
    (reflectionHash: ActionHash) =>
      lazyLoadAndPoll(
        () => this.service.getAllCommentsOnReflection(reflectionHash),
        1000,
      ),
    // asyncReadable<Array<Record>>(async (set) => {
    //   let commentRecords = await this.service.getAllCommentsOnReflection(reflectionHash);
    //   set(commentRecords);

    //   return this.service.on("signal", (signal) => {

    //     // if ((signal.type === "EntryCreated" || signal.type === "EntryUpdated") && signal.app_entry.type === "CommentOnReflection") {
    //     if (signal.type === "EntryCreated"
    //       && signal.app_entry.type === "CommentOnReflection"
    //       && JSON.stringify((decodeEntry(signal.record) as CommentOnReflection).reflection_hash) === JSON.stringify(reflectionHash)
    //       ) {
    //       commentRecords.push(signal.record)
    //       set(commentRecords);
    //     }

    //     // Updates not implemented yet. The question is how to deal with timestamps because the updated record
    //     // will have a new timestamp and we want to sort comments by timestamps
    //     // if (signal.type === "EntryUpdated" && signal.app_entry.type === "CommentOnReflection") {
    //     //   // find the original record of this update and drop it from the list
    //     //   commentRecords = commentRecords.filter((record) => {
    //     //     !(JSON.stringify(record.signed_action.hashed.hash) === JSON.stringify(signal.original_record.signed_action.hashed))
    //     //   })
    //     //   // push the new record
    //     //   commentRecords.push(signal.record);
    //     //   set(commentRecords);
    //     // }
    //   });
    // })
  );

  commentsOnReflection(
    reflectionHash: ActionHash,
  ): AsyncReadable<Array<Record>> | undefined {
    return this.commentsOnReflections.get(reflectionHash);
  }

  allOffers = reloadableLazyLoadAndPoll(
    async () => {
      const offerRecords = await this.service.getAllOffers(
        this.service.cravingHash,
        false,
      );

      const myPubKey = this.service.client.myPubKey;

      // here: Promise.all( ... fetch resonances for each of the records ... )
      return Promise.all(
        offerRecords.map(async record => {
          const resonances = await this.service.getResonatorsForEntry(
            (record.signed_action.hashed.content as NewEntryAction).entry_hash,
          );
          const iResonated = resonances
            .map(pubkey => encodeHashToBase64(pubkey))
            .includes(encodeHashToBase64(myPubKey));
          const offerData: OfferData = {
            record,
            resonators: resonances,
            iResonated,
            timestamp: record.signed_action.hashed.content.timestamp,
          };

          return offerData;
        }),
      );
    },
    4_000,
    'Failed to get all offers',
    async () => {
      // Get locally in the first iteration
      const offerRecords = await this.service.getAllOffers(
        this.service.cravingHash,
        true,
      );

      const myPubKey = this.service.client.myPubKey;

      // here: Promise.all( ... fetch resonances for each of the records ... )
      return Promise.all(
        offerRecords.map(async record => {
          const resonances = await this.service.getResonatorsForEntry(
            (record.signed_action.hashed.content as NewEntryAction).entry_hash,
          );
          const iResonated = resonances
            .map(pubkey => encodeHashToBase64(pubkey))
            .includes(encodeHashToBase64(myPubKey));
          const offerData: OfferData = {
            record,
            resonators: resonances,
            iResonated,
            timestamp: record.signed_action.hashed.content.timestamp,
          };

          return offerData;
        }),
      );
    },
  );
}
