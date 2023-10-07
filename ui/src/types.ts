/* eslint-disable no-shadow */
import { Create, DnaHash, SignedActionHashed, Record as HolochainRecord, MembraneProof, DnaHashB64, ActionHashB64 } from "@holochain/client";
import { CravingDnaProperties } from "./condenser/types";

export enum DashboardMode {
  Home,
  CravingView,
  CreateCravingView,
  LobbyView,
  CreateLobbyView,
  JoinLobbyView,
  Settings,
  NoCookiesEVER,
}


export interface DnaRecipe {
  title: string;
  network_seed: string | undefined;
  properties: CravingDnaProperties;
  origin_time: number | undefined;
  membrane_proof: MembraneProof | undefined;
  resulting_dna_hash: DnaHash;
}


export interface LobbyInfo {
  description: string;
  unenforced_rules: string;
  logo_src: string;
  network_seed: string;
}

export type LobbyName = string;


export type LobbySignal =
  | {
      type: "EntryCreated";
      action: SignedActionHashed<Create>;
      record: HolochainRecord;
      app_entry: EntryTypes;
    };

export type EntryTypes =
  | { type: "DnaRecipe" } & DnaRecipe
  | { type: "LobbyInfo" } & LobbyInfo;


// data structure that stores counts of associations/reflections/comments/offers
export type MessageStore = Record<DnaHashB64, CravingMessageStore>;

export type CravingMessageStore = { // dna hash of the craving
  association_count: number | undefined, // number of associations
  latest_association_update: number | undefined, // timestamp of the latest update to the association count
  latest_association_read: number | undefined, // timestamp of the latest readout of to the association count --> used to decide whether to trigger OS notification
  offers_count: number | undefined, // numver of offers
  latest_offer_update: number | undefined, // timestamp of the latest update to the offer count
  latest_offer_read: number | undefined, // timestamp of the latest readout of the offer count --> used to decide whether to trigger OS notification
  reflections: Record<ActionHashB64, {
    comments_count: number, // number of comments
    latest_update: number, // timestamp of when the comments_count for this reflection hash was last updated
  }>,
};



