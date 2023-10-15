import { AsyncReadable, lazyLoadAndPoll } from '@holochain-open-dev/stores';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  encodeHashToBase64,
  EntryHash,
  NewEntryAction,
  Record,
} from '@holochain/client';

import { CravingService } from './craving-service';
import { CravingDnaProperties } from './condenser/types';
import { CravingMessageStore } from './types';
import {
  getCravingNotificationSettings,
  getLocalStorageItem,
  getNotifiedAssociationsCount,
  getNotifiedCommentsCount,
  getNotifiedOffersCount,
  getNotifiedReflectionsCount,
  isKangaroo,
  newAssociationsCount,
  newCommentsCount,
  newOffersCount,
  newReflectionsCount,
  notifyOS,
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
    public craving: CravingDnaProperties,
    public initTime: number, // timestamp in ms when the cell was installed, i.e. the OpenChain action was commited
    public messageStore: CravingMessageStore | undefined, // networkSeed: string,
  ) {
    // this.networkSeed = networkSeed;
  }

  static async connect(service: CravingService) {
    const craving = await service.getCraving();
    // console.log("&&& @CravingStore.connect(): got craving: ", craving);
    const initTime = await service.getInitTime();

    // get message store for this Craving from localStorage

    const messageStore = getLocalStorageItem<CravingMessageStore>(
      encodeHashToBase64(service.cellId[0]),
    );

    return new CravingStore(service, craving, initTime, messageStore);
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
      encodeHashToBase64(this.service.cellId[0]),
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
      encodeHashToBase64(this.service.cellId[0]),
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
      encodeHashToBase64(this.service.cellId[0]),
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
      encodeHashToBase64(this.service.cellId[0]),
      JSON.stringify(this.messageStore),
    );
  }

  allAssociations = lazyLoadAndPoll(async () => {
    const associationRecords = await this.service.getAllAssociations();

    const myPubKey = this.service.cellId[1];

    // here: Promise.all( ... fetch resonances for each of the records ... )
    return Promise.all(
      associationRecords.map(async record => {
        const resonances = await this.service.getResonatorsForEntry(
          (record.signed_action.hashed.content as NewEntryAction).entry_hash,
        );
        const iResonated = resonances
          .map(hash => JSON.stringify(hash))
          .includes(JSON.stringify(myPubKey));
        const associationData: AssociationData = {
          record,
          resonators: resonances,
          iResonated,
          timestamp: record.signed_action.hashed.content.timestamp,
        };

        return associationData;
      }),
    );
  }, 1500);

  // useful for immediately displaying the number of new associations on the craving detail card
  // no need to also get number of drops
  // returns [{total count}, {count of new associations}]
  associationsCount = lazyLoadAndPoll(async () => {
    const allAssociations = await this.service.getAllAssociations();
    const cravingDnaHash = this.service.cellId[0];
    const currentCount = allAssociations.length;
    const newCount = newAssociationsCount(this.service.cellId[0], currentCount);

    const notifiedCount =
      getNotifiedAssociationsCount(encodeHashToBase64(cravingDnaHash)) || 0;

    if (isKangaroo() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(cravingDnaHash),
      );
      if (
        notificationSettings.associations.os ||
        notificationSettings.associations.systray
      ) {
        try {
          const notification = {
            title: 'New Association',
            body: 'New Association',
            urgency: 'medium' as 'medium' | 'high' | 'low',
          };
          await notifyOS(
            notification,
            notificationSettings.associations.os,
            notificationSettings.associations.systray,
          );
          setNotifiedAssociationsCount(
            encodeHashToBase64(cravingDnaHash),
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
    const allOffers = await this.service.getAllOffers();
    const cravingDnaHash = this.service.cellId[0];
    const currentCount = allOffers.length;
    const newCount = newOffersCount(cravingDnaHash, currentCount);
    const notifiedCount =
      getNotifiedOffersCount(encodeHashToBase64(cravingDnaHash)) || 0;

    if (isKangaroo() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(cravingDnaHash),
      );
      if (
        notificationSettings.offers.os ||
        notificationSettings.offers.systray
      ) {
        try {
          const notification = {
            title: 'New Offer',
            body: 'New Offer',
            urgency: 'medium' as 'medium' | 'high' | 'low',
          };
          await notifyOS(
            notification,
            notificationSettings.offers.os,
            notificationSettings.offers.systray,
          );
          setNotifiedOffersCount(
            encodeHashToBase64(cravingDnaHash),
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
    const reflectionRecords = await this.service.getAllReflections();
    let currentCount = 0;
    await Promise.all(
      reflectionRecords.map(async record => {
        const commentRecords = await this.service.getAllCommentsOnReflection(
          record.signed_action.hashed.hash,
        );
        currentCount += commentRecords.length;
      }),
    );

    const cravingDnaHash = this.service.cellId[0];
    const newCount = newCommentsCount(cravingDnaHash, currentCount);
    const notifiedCount =
      getNotifiedCommentsCount(encodeHashToBase64(cravingDnaHash)) || 0;
    if (isKangaroo() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(cravingDnaHash),
      );
      if (
        notificationSettings.comments.os ||
        notificationSettings.comments.systray
      ) {
        try {
          const notification = {
            title: 'New Comment',
            body: 'New Comment',
            urgency: 'medium' as 'medium' | 'high' | 'low',
          };
          await notifyOS(
            notification,
            notificationSettings.comments.os,
            notificationSettings.comments.systray,
          );
          setNotifiedCommentsCount(
            encodeHashToBase64(cravingDnaHash),
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
    () => this.service.getAllReflections(),
    1500,
  );

  // useful for immediately displaying the number of new associations on the craving detail card
  // no need to also get number of drops
  // returns [{total count}, {count of new associations}]
  allReflectionsCount = lazyLoadAndPoll(async () => {
    const allReflections = await this.service.getAllReflections();
    const cravingDnaHash = this.service.cellId[0];
    const currentCount = allReflections.length;
    const newCount = newReflectionsCount(this.service.cellId[0], currentCount);

    const notifiedCount =
      getNotifiedReflectionsCount(encodeHashToBase64(cravingDnaHash)) || 0;

    if (isKangaroo() && currentCount > notifiedCount) {
      const notificationSettings = getCravingNotificationSettings(
        encodeHashToBase64(cravingDnaHash),
      );
      if (
        notificationSettings.reflections.os ||
        notificationSettings.reflections.systray
      ) {
        try {
          const notification = {
            title: 'New Reflection',
            body: 'New Reflection',
            urgency: 'medium' as 'medium' | 'high' | 'low',
          };
          await notifyOS(
            notification,
            notificationSettings.reflections.os,
            notificationSettings.reflections.systray,
          );
          setNotifiedReflectionsCount(
            encodeHashToBase64(cravingDnaHash),
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
  ): AsyncReadable<Array<Record>> {
    return this.commentsOnReflections.get(reflectionHash);
  }

  allOffers = lazyLoadAndPoll(async () => {
    const offerRecords = await this.service.getAllOffers();

    const myPubKey = this.service.cellId[1];

    // here: Promise.all( ... fetch resonances for each of the records ... )
    return Promise.all(
      offerRecords.map(async record => {
        const resonances = await this.service.getResonatorsForEntry(
          (record.signed_action.hashed.content as NewEntryAction).entry_hash,
        );
        const iResonated = resonances
          .map(hash => JSON.stringify(hash))
          .includes(JSON.stringify(myPubKey));
        const offerData: OfferData = {
          record,
          resonators: resonances,
          iResonated,
          timestamp: record.signed_action.hashed.content.timestamp,
        };

        return offerData;
      }),
    );
  }, 1000);
}
