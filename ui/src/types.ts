import { Create, DnaHash, SignedActionHashed, Record, MembraneProof } from "@holochain/client";
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
      record: Record;
      app_entry: EntryTypes;
    };

export type EntryTypes =
  | { type: "DnaRecipe" } & DnaRecipe
  | { type: "LobbyInfo" } & LobbyInfo;

