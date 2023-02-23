import { AsyncReadable, asyncReadable } from "@holochain-open-dev/stores";
import { decodeEntry, LazyHoloHashMap } from "@holochain-open-dev/utils";
import { ActionHash, AgentPubKey, encodeHashToBase64, NewEntryAction, Record } from "@holochain/client";

import { CravingService } from "./craving-service";
import { CommentOnReflection, CravingDnaProperties } from "./condenser/types";



export interface AssociationData {
  record: Record,
  resonators: AgentPubKey[],
  iResonated: boolean,
  timestamp: number,
}

export interface OfferData {
  record: Record,
  resonators: AgentPubKey[],
  iResonated: boolean,
  timestamp: number,
}

export class CravingStore {

  // public networkSeed: string;

  private constructor(
    public service: CravingService,
    public craving: CravingDnaProperties,
    public initTime: number, // timestamp in ms when the cell was installed, i.e. the OpenChain action was commited
    // networkSeed: string,
  ) {
    // this.networkSeed = networkSeed;
  }

  static async connect(service: CravingService) {
    const craving = await service.getCraving();
    console.log("&&& @CravingStore.connect(): got craving: ", craving);
    const initTime = await service.getInitTime();

    return new CravingStore(service, craving, initTime);
  }



  // create instead a data structure here that also contains the info about resonances and iResonated
  allAssociations = asyncReadable<Array<AssociationData>>(async (set) => {
    const associationRecords = await this.service.getAllAssociations();

    const myPubKey = this.service.cellId[1];

    // here: Promise.all( ... fetch resonances for each of the records ... )
    let associationDatas = await Promise.all(associationRecords.map(async (record) => {
      const resonances = await this.service.getResonatorsForEntry((record.signed_action.hashed.content as NewEntryAction).entry_hash);
      const iResonated = resonances.map((hash) => JSON.stringify(hash)).includes(JSON.stringify(myPubKey));
      const associationData: AssociationData = {
        record,
        resonators: resonances,
        iResonated,
        timestamp: record.signed_action.hashed.content.timestamp,
      };

      return associationData;

    }))

    set(associationDatas);

    return this.service.on("signal", (signal) => {
      console.log("||| RECEIVED SIGNAL |||: ", signal);
      if (signal.type === "EntryCreated" && signal.app_entry.type === "Association") {
        const associationData: AssociationData = {
          record: signal.record,
          resonators: [], // if the entry has just been created there can't be any resonators yet
          iResonated: false,
          timestamp: signal.record.signed_action.hashed.content.timestamp,
        }
        associationDatas.push(associationData);
        set(associationDatas)
      }

      if (signal.type === "LinkCreated" && "EntryToResonator" in signal.link_type) {
        const updatedAssociationDatas = associationDatas.map((data) => {
          if ( // if the base address of the link is the entry, update the data
            JSON.stringify((data.record.signed_action.hashed.content as NewEntryAction).entry_hash)
            === JSON.stringify(signal.action.hashed.content.base_address)
          ) {
            data.resonators.push(signal.action.hashed.content.target_address);
            // if it was me that resonated, set iResonated to true
            if (JSON.stringify(signal.action.hashed.content.author) === JSON.stringify(myPubKey)) {
              data.iResonated = true;
            }
          }

          return data;
        });

        associationDatas = updatedAssociationDatas;
        set(associationDatas)
      }

      if (signal.type === "LinkDeleted" && "EntryToResonator" in signal.link_type) {

        const updatedAssociationDatas = associationDatas.map((data) => {

          if ( // if the base address of the link is the entry, update the data
            JSON.stringify((data.record.signed_action.hashed.content as NewEntryAction).entry_hash)
            === JSON.stringify(signal.action.hashed.content.base_address)
          ) {
            data.resonators = data.resonators.filter((pubKey) => encodeHashToBase64(pubKey).slice(5) !== encodeHashToBase64(myPubKey).slice(5));
            if (JSON.stringify(signal.action.hashed.content.author) === JSON.stringify(myPubKey)) {
              data.iResonated = false;
            }
          }
          return data;
        });
        associationDatas = updatedAssociationDatas;
        set(associationDatas)
      }
    })
  });


  // create instead a data structure here that also contains all the comments and resonances for a reflection
  allReflections = asyncReadable<Array<Record>>(async (set) => {
    let reflectionRecords = await this.service.getAllReflections();
    set(reflectionRecords);

    return this.service.on("signal", (signal) => {
      if (signal.type === "EntryCreated" && signal.app_entry.type === "Reflection") {
        reflectionRecords.push(signal.record);
        set(reflectionRecords)
      }
    })
  });


  // all comments on all reflections
  commentsOnReflections = new LazyHoloHashMap((reflectionHash: ActionHash) =>
    asyncReadable<Array<Record>>(async (set) => {
      let commentRecords = await this.service.getAllCommentsOnReflection(reflectionHash);
      set(commentRecords);

      return this.service.on("signal", (signal) => {

        // if ((signal.type === "EntryCreated" || signal.type === "EntryUpdated") && signal.app_entry.type === "CommentOnReflection") {
        if (signal.type === "EntryCreated"
          && signal.app_entry.type === "CommentOnReflection"
          && JSON.stringify((decodeEntry(signal.record) as CommentOnReflection).reflection_hash) === JSON.stringify(reflectionHash)
          ) {
          commentRecords.push(signal.record)
          set(commentRecords);
        }

        // Updates not implemented yet. The question is how to deal with timestamps because the updated record
        // will have a new timestamp and we want to sort comments by timestamps
        // if (signal.type === "EntryUpdated" && signal.app_entry.type === "CommentOnReflection") {
        //   // find the original record of this update and drop it from the list
        //   commentRecords = commentRecords.filter((record) => {
        //     !(JSON.stringify(record.signed_action.hashed.hash) === JSON.stringify(signal.original_record.signed_action.hashed))
        //   })
        //   // push the new record
        //   commentRecords.push(signal.record);
        //   set(commentRecords);
        // }
      });
    })
  );

  commentsOnReflection(reflectionHash: ActionHash): AsyncReadable<Array<Record>> {
    return this.commentsOnReflections.get(reflectionHash);
  }


  // create instead a data structure here that also contains all the comments and resonances for an offer
  allOffers = asyncReadable<Array<OfferData>>(async (set) => {
    const offerRecords = await this.service.getAllOffers();

    const myPubKey = this.service.cellId[1];

    // here: Promise.all( ... fetch resonances for each of the records ... )
    let offerDatas = await Promise.all(offerRecords.map(async (record) => {
      const resonances = await this.service.getResonatorsForEntry((record.signed_action.hashed.content as NewEntryAction).entry_hash);
      const iResonated = resonances.map((hash) => JSON.stringify(hash)).includes(JSON.stringify(myPubKey));
      const offerData: OfferData = {
        record,
        resonators: resonances,
        iResonated,
        timestamp: record.signed_action.hashed.content.timestamp,
      };

      return offerData;

    }))

    set(offerDatas);

    return this.service.on("signal", (signal) => {
      console.log("||| RECEIVED SIGNAL |||: ", signal);
      if (signal.type === "EntryCreated" && signal.app_entry.type === "Offer") {
        const offerData: OfferData = {
          record: signal.record,
          resonators: [], // if the entry has just been created there can't be any resonators yet
          iResonated: false,
          timestamp: signal.record.signed_action.hashed.content.timestamp,
        }
        offerDatas.push(offerData);
        set(offerDatas)
      }

      if (signal.type === "LinkCreated" && "EntryToResonator" in signal.link_type) {

        console.log("###@@ myPubKey: ", encodeHashToBase64(myPubKey));
        console.log("###@@ data.resonators: ", offerDatas.map((data) => data.resonators.map((hash) => encodeHashToBase64(hash))));


        const updatedOfferDatas = offerDatas.map((data) => {
          if ( // if the base address of the link is the entry, update the data
            JSON.stringify((data.record.signed_action.hashed.content as NewEntryAction).entry_hash)
            === JSON.stringify(signal.action.hashed.content.base_address)
          ) {
            data.resonators.push(signal.action.hashed.content.target_address);
            // if it was me that resonated, set iResonated to true
            if (JSON.stringify(signal.action.hashed.content.author) === JSON.stringify(myPubKey)) {
              data.iResonated = true;
            }
          }

          return data;
        });

        offerDatas = updatedOfferDatas;
        set(offerDatas)
      }

      if (signal.type === "LinkDeleted" && "EntryToResonator" in signal.link_type) {

        console.log("###@@ myPubKey: ", encodeHashToBase64(myPubKey));
        console.log("###@@ data.resonators: ", offerDatas.map((data) => data.resonators.map((hash) => encodeHashToBase64(hash))));


        const updatedOfferDatas = offerDatas.map((data) => {

          if ( // if the base address of the link is the entry, update the data
            JSON.stringify((data.record.signed_action.hashed.content as NewEntryAction).entry_hash)
            === JSON.stringify(signal.action.hashed.content.base_address)
          ) {
            console.log("½½½½ CONDITION MET ½½½½½½");
            console.log("data.resonators before: ", data.resonators.map((hash) => encodeHashToBase64(hash)));
            console.log("myPubKey: ", encodeHashToBase64(myPubKey));
            data.resonators = data.resonators.filter((pubKey) => encodeHashToBase64(pubKey).slice(5) !== encodeHashToBase64(myPubKey).slice(5));
            console.log("data.resonators after: ", data.resonators.map((hash) => encodeHashToBase64(hash)));
            console.log(data.resonators.filter((pubKey) => JSON.stringify(pubKey).slice(5) !== JSON.stringify(myPubKey)).slice(5));

            if (JSON.stringify(signal.action.hashed.content.author) === JSON.stringify(myPubKey)) {
              data.iResonated = false;
            }
          }
          return data;
        });

        console.log("@craving-store signalCallback: offerDatas before: ", offerDatas);
        console.log("@craving-store signalCallback: updatedOfferDatas: ", updatedOfferDatas);

        offerDatas = updatedOfferDatas;
        set(offerDatas);
      }
    })
  });


}

