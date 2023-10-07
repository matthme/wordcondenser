/* eslint-disable no-shadow */
import {
  Create,
  DnaHash,
  SignedActionHashed,
  Record as HolochainRecord,
  MembraneProof,
  DnaHashB64,
  ActionHashB64,
} from '@holochain/client';
import { CravingDnaProperties } from './condenser/types';

export enum DashboardMode {
  Home,
  CravingView,
  CreateCravingView,
  LobbyView,
  CreateLobbyView,
  JoinLobbyView,
  JoinLobbyFromLink,
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

export type LobbySignal = {
  type: 'EntryCreated';
  action: SignedActionHashed<Create>;
  record: HolochainRecord;
  app_entry: EntryTypes;
};

export type EntryTypes =
  | ({ type: 'DnaRecipe' } & DnaRecipe)
  | ({ type: 'LobbyInfo' } & LobbyInfo);

export interface NotificationPayload {
  title: string;
  body: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface CravingNotificationSettings {
  associations: {
    os: boolean;
    systray: boolean;
    inApp: boolean;
  };
  comments: {
    os: boolean;
    systray: boolean;
    inApp: boolean;
  };
  reflections: {
    os: boolean;
    systray: boolean;
    inApp: boolean;
  };
  offers: {
    os: boolean;
    systray: boolean;
    inApp: boolean;
  };
}

// data structure that stores counts of associations/reflections/comments/offers
export type MessageStore = Record<DnaHashB64, CravingMessageStore>;

export type CravingMessageStore = {
  /**
   * Number of read Associations in this Craving
   */
  association_count: number | undefined;
  /**
   * Timestamp of the latest update to the association count
   */
  latest_association_update: number | undefined;
  /**
   * Number of read Offers in this Craving
   */
  offers_count: number | undefined; // number of offers
  /**
   * Timestamp of the latest update to the Offer count
   */
  latest_offer_update: number | undefined;
  /**
   * Reflections of this Craving (read)
   */
  reflections: Record<
    ActionHashB64,
    {
      /**
       * Number of read comments for this Reflectoin
       */
      comments_count: number;
      /**
       * Timestamp of when the comments count for this Reflection hash was last updated
       */
      latest_update: number;
    }
  >;
};
