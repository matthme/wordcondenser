import { derived, get, Readable, writable, Writable } from "@holochain-open-dev/stores";
import { decodeEntry, DnaHashMap } from "@holochain-open-dev/utils";
import { DnaModifiers, AppAgentWebsocket, CellId, CellType, ClonedCell, DnaHash, encodeHashToBase64, Record as HolochainRecord } from "@holochain/client";
import { decode } from '@msgpack/msgpack';

import { CravingService } from "./craving-service";
import { CravingStore } from "./craving-store";
import { CravingDnaProperties } from "./condenser/types";
import { LobbyService } from "./lobby-service";
import { LobbyStore } from "./lobby-store";
import { ProfilesClient } from "./lobby/profiles/profiles-client";
import { ProfilesStore } from "./lobby/profiles/profiles-store";
import { DnaRecipe, LobbyInfo } from "./types";

import md5 from "md5";


export interface CravingData {
  title: string, // in case it is not installed, we have info about the title from the DnaRecipe
  dnaHash: DnaHash, // DNA hash of the craving
  enabled: boolean, // is this craving installed and enabled?
  installed: boolean, // is this craving installed?
  lobbies: LobbyData[], // which lobbies is this craving referenced/listed in?
}


export interface LobbyData {
  name: string,
  info: LobbyInfo | undefined,
  dnaHash: DnaHash, // DNA hash of the lobby cell
}


export class CondenserStore {

  private _installedCravings: Writable<DnaHashMap<CravingStore>> = writable(new DnaHashMap<CravingStore>());
  private _disabledCravings: Writable<Record<string, ClonedCell>> = writable({}); // keys are the clone's names
  private _lobbies: Writable<DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>> = writable(new DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>());
  private _disabledLobbies: Writable<Record<string, ClonedCell>> = writable({});

  private _cravingLobbyMapping: Writable<DnaHashMap<[DnaRecipe, LobbyData[]]>> // dna hash of craving as keys
    = writable(new DnaHashMap<[DnaRecipe, LobbyData[]]>);


  constructor(
    protected appAgentWebsocket: AppAgentWebsocket,
    installedCravings: DnaHashMap<CravingStore>,
    disabledCravings: Record<string, ClonedCell>,
    lobbies: DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>,
    disabledLobbies: Record<string, ClonedCell>,
    cravingLobbyMapping: DnaHashMap<[DnaRecipe, LobbyData[]]>,
  ) {
    this._installedCravings.set(installedCravings);
    this._disabledCravings.set(disabledCravings);
    this._lobbies.set(lobbies);
    this._disabledLobbies.set(disabledLobbies);
    this._cravingLobbyMapping.set(cravingLobbyMapping);
      // console.log("@CondenserStore constructor: installedCravings: ", installedCravings.values());
      // console.log("@CondeserStore constructor: this._installedCravings: ", get(this._installedCravings));
  }

  static async connect(
    appAgentWebsocket: AppAgentWebsocket
  ) {
    // console.log("%%% Connecting to CondenserStore... %%%");

    const [installedCravings, disabledCravings, lobbies, disabledLobbies] = await this.fetchCells(appAgentWebsocket);
    // console.log("%%% @connect(): installedCravings: ", installedCravings);
    // console.log("%%% @connect(): disabledCravings: ", disabledCravings);

    const cravingLobbyMapping = new DnaHashMap<[DnaRecipe, LobbyData[]]>;

    await Promise.all(Array.from(lobbies.entries()).map(async ([dnaHash, [lobbyStore, _profilesStore]]) => {
      const allRecipeRecords = await lobbyStore.service.getAllCravingRecipes();
      const allRecipes = allRecipeRecords.map((record) => decodeEntry(record) as DnaRecipe);


      // create a mapping beteen cravings and the lobbies this craving is shared with
      allRecipes.forEach((recipe) => {
        const lobbyData: LobbyData = {
          name: lobbyStore.lobbyName,
          info: lobbyStore.lobbyInfo ? decodeEntry(lobbyStore.lobbyInfo) : undefined,
          dnaHash,
        }

        try { // if cravingLobbyMapping already has a value for this key, push to it
          const [existingRecipe, existingValue]: [DnaRecipe, LobbyData[]] = cravingLobbyMapping.get(recipe.resulting_dna_hash);
          existingValue.push(lobbyData);
          cravingLobbyMapping.set(recipe.resulting_dna_hash, [existingRecipe, existingValue]);
        } catch (e) { // if cravingLobbyMapping is does not have a value for this key yet, set it
          cravingLobbyMapping.set(recipe.resulting_dna_hash, [recipe, [lobbyData]]);
        }
      })

      // filter recipes by the ones that are not installed


    }));

    // console.log("@connect: cravingLobbyMapping: ", cravingLobbyMapping);


    return new CondenserStore(
      appAgentWebsocket,
      installedCravings,
      disabledCravings,
      lobbies,
      disabledLobbies,
      cravingLobbyMapping,
    );
  }

  /**
   * Fetches the stores freshly. This is useful for example to make sure the stores get updated
   * after disabling/enabling a cell
   *
   */
  async fetchStores() {
    const [installedCravings, disabledCravings, lobbies, disabledLobbies] = await CondenserStore.fetchCells(this.appAgentWebsocket);

    const cravingLobbyMapping = new DnaHashMap<[DnaRecipe, LobbyData[]]>;

    await Promise.all(Array.from(lobbies.entries()).map(async ([dnaHash, [lobbyStore, _profilesStore]]) => {
      const allRecipeRecords = await lobbyStore.service.getAllCravingRecipes();
      const allRecipes = allRecipeRecords.map((record) => decodeEntry(record) as DnaRecipe);
      allRecipes.forEach((recipe) => {
        const lobbyData: LobbyData = {
          name: lobbyStore.lobbyName,
          info: lobbyStore.lobbyInfo ? decodeEntry(lobbyStore.lobbyInfo) : undefined,
          dnaHash,
        }

        const [existingRecipe, existingValue]: [DnaRecipe, LobbyData[]] | undefined = cravingLobbyMapping.get(recipe.resulting_dna_hash);

        if (existingRecipe && existingValue) {
          existingValue.push(lobbyData);
          cravingLobbyMapping.set(recipe.resulting_dna_hash, [existingRecipe, existingValue]);
        } else {
          cravingLobbyMapping.set(recipe.resulting_dna_hash, [recipe, [lobbyData]]);
        }
      })
    }));

    // console.log("@fetchStores: cravingLobbyMapping: ", cravingLobbyMapping);


    this._installedCravings.set(installedCravings);
    this._disabledCravings.set(disabledCravings);
    this._lobbies.set(lobbies);
    this._disabledLobbies.set(disabledLobbies);
    this._cravingLobbyMapping.set(cravingLobbyMapping);
  }

  /**
   * Queries the conductor to get all craving and lobby cells and creates stores for the enabled ones
   *
   * @param appAgentWebsocket
   * @returns
   */
  static async fetchCells(appAgentWebsocket: AppAgentWebsocket)
    : Promise<
    [
      DnaHashMap<CravingStore>,
      Record<string, ClonedCell>,
      DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>,
      Record<string, ClonedCell>
    ]>
     {
    const installedCravings = new DnaHashMap<CravingStore>();
    const disabledCravings: Record<string, ClonedCell> = {};
    const lobbies = new DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>();
    const disabledLobbies: Record<string, ClonedCell> = {};

    const appInfo = await appAgentWebsocket.appInfo();
    // console.log("%%% AppInfo: ", appInfo);
    const cravingCells = appInfo.cell_info.craving;
    await Promise.all(cravingCells.map(async (cellInfo) => {
      // console.log("@CondenserStore.connect(): Found cell: ", cellInfo);
      if (CellType.Cloned in cellInfo) {

        const cloneInfo = cellInfo[CellType.Cloned];
        const cellId = cloneInfo.cell_id;


        // For every craving cell, create a CravingStore and add it to the DnaHashMap, if the cell is running
        // if the craving cell is enabled
        if (cloneInfo.enabled) {
          const cravingService = new CravingService(
            appAgentWebsocket,
            "craving",
            cellId,
          );

          // const networkSeed = cellInfo[CellType.Cloned].dna_modifiers.network_seed;
          try {
            let cravingStore = await CravingStore.connect(cravingService);
            installedCravings.set(cellId[0], cravingStore);
          } catch (e) {
            console.warn(`Failed to connect to craving store: ${JSON.stringify(e)}`);
          }
        } else { // if the craving cell is disabled
            // Here either take the name of the group from the dna properties or from the clone name
          disabledCravings[cloneInfo.name] = cloneInfo;
        }
      }
    }));


    const lobbyCells = appInfo.cell_info.lobby;
    await Promise.all(lobbyCells.map(async (cellInfo) => {
      // console.log("@CondenserStore.connect(): Found cell: ", cellInfo);
      if (CellType.Cloned in cellInfo) {

        const cloneInfo = cellInfo[CellType.Cloned];
        const cellId = cloneInfo.cell_id;

        if (cloneInfo.enabled) {
          // For every lobby cell, create a LobbyStore and add it to the DnaHashMap
          const lobbyService = new LobbyService(
            appAgentWebsocket,
            "cravings",
            cellId,
          );

          try {
            let lobbyStore = await LobbyStore.connect(lobbyService);

            const profilesService = new ProfilesClient(appAgentWebsocket, cellId);
            const profilesStore = new ProfilesStore(profilesService, { additionalFields: ["A little something about you"]});

            lobbies.set(cellId[0], [lobbyStore, profilesStore, cloneInfo.dna_modifiers]);
          } catch(e) {
            console.warn(`Failed to set up lobby and profiles store: ${JSON.stringify(e)}`);
          }
        } else {
          // Here either take the name of the group from the dna properties or from the clone name
          disabledLobbies[cloneInfo.name] = cloneInfo;
        }

        }
    }));

    return [installedCravings, disabledCravings, lobbies, disabledLobbies]
  }


  /** Here comes the Cravings logic */

  getCravingRecipe(cravingCellId: CellId): DnaRecipe {
    return get(this._cravingLobbyMapping).get(cravingCellId[0])[0];
  }

  cravingStore(cellId: CellId) {
    return derived(this._installedCravings, (store) => store.get(cellId[0]));
  }

  getAllInstalledCravings(): Readable<DnaHashMap<CravingStore>> {
    return derived(this._installedCravings, (cravings) => cravings);
  }

  getAllDisabledCravings(): Readable<Record<string, ClonedCell>> {
    return derived(this._disabledCravings, (cravings) => cravings);
  }

  /**
   * Create a new craving as the original poster
   *
   * @param craving
   * @param networkSeed
   * @returns
   */
  async createCraving(properties: CravingDnaProperties, networkSeed: string, originTime: number): Promise<ClonedCell> {



    const cloneCellRequest = {
      role_name: "craving",
      modifiers: {
        network_seed: networkSeed,
        properties,
        origin_time: originTime,
      },
      name: properties.title,
    };


    // console.log("@createCraving: clonecellrequest: ", cloneCellRequest);
    const requestHash = md5(JSON.stringify(cloneCellRequest));
    // console.log("@createCraving: Hash of create clone cell request: ", requestHash)

    const cellInfo = await this.appAgentWebsocket.createCloneCell(cloneCellRequest);

    const cellId = cellInfo.cell_id;

    // console.log(`@condenser-store: created craving with dna hash: ${encodeHashToBase64(cellId[0])}`);

    let cravingService = new CravingService(
      this.appAgentWebsocket,
      "craving",
      cellId,
    );

    let cravingStore = await CravingStore.connect(cravingService);

    this._installedCravings.update((store) => store.set(cellId[0], cravingStore));

    return cellInfo;
  }


  /**
   * Share an existing craving with another group
   *
   * @param cravingCellId
   * @param lobbyCellId
   * @returns
   */
  async shareCraving(cravingCellId: CellId, lobbyDnaHashes: DnaHash[]): Promise<void> {

    const recipe = this.getCravingRecipe(cravingCellId);

    await Promise.all(lobbyDnaHashes.map(async (dnaHash) => {
      const [lobbyStore, _profileStore] = this.lobbyStore(dnaHash);
      await lobbyStore.service.registerCraving(recipe);
    }))

    window.location.reload();
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


    const cloneCellRequest = {
      role_name: "craving",
      modifiers: {
        network_seed: dnaRecipe.network_seed,
        properties: dnaRecipe.properties,
        origin_time: dnaRecipe.origin_time,
      },
      name: dnaRecipe.title,
    };

    // console.log("@joinCraving: cloneCellRequest: ", cloneCellRequest);
    const requestHash = md5(JSON.stringify(cloneCellRequest));
    // console.log("@joinCraving: Hash of create clone cell request: ", requestHash)

    const cellInfo = await this.appAgentWebsocket.createCloneCell(cloneCellRequest);


    const cellId = cellInfo.cell_id;

    // console.log(`@condenser-store: @joinCraving: created cell clone with dna hash: ${encodeHashToBase64(cellId[0])}`);

    // console.log("@CondenserStore: @joinCraving: Created clone cell: ", cellInfo);

    let cravingService = new CravingService(
      this.appAgentWebsocket,
      "craving",
      cellId,
    );

    let cravingStore = await CravingStore.connect(cravingService);

    this._installedCravings.update((store) => store.set(cellId[0], cravingStore));

    return cellInfo;
  }

  /**
   * Disables the craving
   *
   * @param cellId
   *
   */
  async disableCraving(cellId: CellId) {
    await this.appAgentWebsocket.disableCloneCell({
      clone_cell_id: cellId,
    });

    alert(`Disabled Craving. To delete it permanently, delete the corresponding cloned cell with the DNA hash\n\n"${encodeHashToBase64(cellId[0])}"\n\nin the Holochain Launcher Admin.\n\nWARNING: If you delete a Craving permanently, you won't ever be able to rejoin it with this installation of the Word Condenser.`);
  }

    /**
   * Enables the craving
   *
   * @param cellId
   *
   */
    async enableCraving(cellId: CellId) {
      await this.appAgentWebsocket.enableCloneCell({
        clone_cell_id: cellId,
      });

      alert(`Enabled Craving.`);
    }


  /** Here comes the Lobby logic */

  lobbyStore(dnaHash: DnaHash) {
    return get(this._lobbies).get(dnaHash);
  }

  lobbyStoreReadable(cellId: CellId) {
    return derived(this._lobbies, (store) => store.get(cellId[0]));
  }

  getAllLobbies(): Readable<DnaHashMap<[LobbyStore, ProfilesStore, DnaModifiers]>> {
    return derived(this._lobbies, (lobbies) => lobbies);
  }

  getDisabledLobbies(): Readable<Record<string, ClonedCell>> {
    return derived(this._disabledLobbies, (lobbies) => lobbies);
  }

  getLobbiesForCraving(cravingDnaHash: DnaHash): Readable<LobbyData[]> {
    // console.log("@getLobbiesForCraving: get(this._cravingLobbyMapping)", get(this._cravingLobbyMapping));
    // console.log("@getLobbiesForCraving: got cravingDnaHash: ", cravingDnaHash);
    // console.log("@getLobbiesForCraving: got cravingDnaHash B64: ", encodeHashToBase64(cravingDnaHash));
    return derived(this._cravingLobbyMapping, (store) => store.get(cravingDnaHash)[1]);
  }

  /**
   * Gets the cravings that are available but neither installed nor disabled.
   */
  getAvailableCravings(): Readable<Array<[DnaHash, [DnaRecipe, LobbyData[]]]>> {
    return derived(this._cravingLobbyMapping, (mapping) => {
      const installedCravingsHashes = Array.from(get(this._installedCravings).values()).map((store) => store.service.cellId[0])
        .map((hash) => JSON.stringify(hash));
      const disabledCravingsHashes = Object.values(get(this._disabledCravings)).map((cloneInfo) => cloneInfo.cell_id[0])
        .map((hash) => JSON.stringify(hash));

      return Array.from(mapping.entries()).filter(([dnaHash, [_recipe, _lobbyDatas]]) => {
        const stringifiedHash = JSON.stringify(dnaHash);
        return !installedCravingsHashes.includes(stringifiedHash) && !disabledCravingsHashes.includes(stringifiedHash)
      })
    })
  }

  async createLobby(networkSeed: string, name: string, description: string, unenforcedRules: string | undefined, logoSrc: string): Promise<CellId> {

    const cellInfo = await this.appAgentWebsocket.createCloneCell({
      role_name: "lobby",
      modifiers: {
        network_seed: networkSeed,
        properties: {
          name,
          // creator: encodeHashToBase64(this.appAgentWebsocket.myPubKey), // not neeted in Word Condenser 0.1.X to reduce invitation friction
        }, // lobby name will be fixed and part of the properties
      },
      name,
    })

    const cellId = cellInfo.cell_id;

    // console.log("@CondenserStore: @createLobby: Created lobby cell: ", cellInfo);

    let lobbyService = new LobbyService(
      this.appAgentWebsocket,
      "cravings",
      cellId,
    );

    // console.log("@CondenserStore: @createLobby: Created lobbyService: ", lobbyService);

    const lobbyInfoRecord = await lobbyService.createLobbyInfo(description, logoSrc, unenforcedRules, networkSeed);

    // console.log("@CondenserStore: @createLobby: Created LobbyInfo: ", lobbyInfoRecord);

    const lobbyStore = await LobbyStore.connect(lobbyService);

    const profilesService = new ProfilesClient(this.appAgentWebsocket, cellId);
    const profilesStore = new ProfilesStore(profilesService, { additionalFields: ["A little something about you"]});

    // console.log("@CondenserStore: @createLobby: Created ProfilesStore: ", profilesStore);


    this._lobbies.update((store) => store.set(cellId[0], [lobbyStore, profilesStore, cellInfo.dna_modifiers]));

    return cellId;
  }

  async disableLobby(cellId: CellId) {
    await this.appAgentWebsocket.disableCloneCell({
      clone_cell_id: cellId,
    });

    alert(`Disabled Group. To delete it permanently, delete the corresponding cloned cell with the DNA hash\n\n"${encodeHashToBase64(cellId[0])}"\n\nin the Holochain Launcher Admin.\n\nWARNING: If you delete a Group permanently, you won't ever be able to rejoin it with this installation of the Word Condenser.`);
  }

  async enableLobby(cellId: CellId) {
    await this.appAgentWebsocket.enableCloneCell({
      clone_cell_id: cellId,
    });

    alert(`Enabled Group.`);
  }

  async joinLobby(networkSeed: string, name: string): Promise<CellId> {

    // Check that the same lobby does not already exist
    const existingLobbies = Array.from(get(this._lobbies).values());


    // If there is already a lobby with the same name and network seed, then throw an error.
    // This should in pricniple be handled by the conductor but is not the case at the moment (https://github.com/holochain/holochain/issues/1969)
    existingLobbies.forEach(([_lobbyStore, _profilesStore, dnaModifiers]) => {
      if (dnaModifiers.network_seed === networkSeed && (decode(dnaModifiers.properties) as any).name === name) {
        alert("This Group is already installed in your conductor!");
        throw new Error("Group already installed.");
      }
    })

    const cellInfo = await this.appAgentWebsocket.createCloneCell({
      role_name: "lobby",
      modifiers: {
        network_seed: networkSeed,
        properties: {
          name,
          // creator: encodeHashToBase64(this.appAgentWebsocket.myPubKey), // not needed in WOrd Condenser 0.1.X to reduce invitation friction
        }, // lobby name will be fixed and part of the properties
      },
      name,
    })

    const cellId = cellInfo.cell_id;

    // console.log("@CondenserStore: @createLobby: Created lobby cell: ", cellInfo);

    let lobbyService = new LobbyService(
      this.appAgentWebsocket,
      "cravings",
      cellId,
    );

    // console.log("@CondenserStore: @createLobby: Created lobbyService: ", lobbyService);

    // wait 2 seconds in order to get the chance to fetch the lobby info from another peer
    setTimeout(async () => {
      const lobbyStore = await LobbyStore.connect(lobbyService);
      const profilesService = new ProfilesClient(this.appAgentWebsocket, cellId);
      const profilesStore = new ProfilesStore(profilesService, { additionalFields: ["A little something about you"]});
      this._lobbies.update((store) => store.set(cellId[0], [lobbyStore, profilesStore, cellInfo.dna_modifiers]));
    }, 2000);

    return cellId;
  }



  /** Here comes the logic to get Cravings filtered by lobby a.k.a group */


  // async lobbiesForCraving(cravingDnaHash: DnaHash): Promise<Array<LobbyData>> {
  //   // take the dna hash of the craving and check whether it is part of a lobby's cravings
  //   let lobbyDatas: Array<LobbyData> = [];

  //   // so for each lobby, check whether this craving Dna Hash is part of all cravings of that lobby
  //   Array.from(get(this.getAllLobbies()).entries()).forEach(([_lobbyDnaHash, [lobbyStore, _profilesStore]]) => {
  //     const cravingsOfLobby = get(lobbyStore.allCravingRecipes);

  //     console.log("@lobbiesForCraving: cravingsOfLobby: ", cravingsOfLobby);

  //     // ignore lobbies that have no status "complete"
  //     if (cravingsOfLobby.status === "complete") {
  //       const matchingRecord = cravingsOfLobby.value.find((dnaRecipeRecord) => JSON.stringify((decodeEntry(dnaRecipeRecord) as DnaRecipe).resulting_dna_hash) === JSON.stringify(cravingDnaHash));
  //       if (matchingRecord) {

  //         const lobbyInfoRecord = lobbyStore.lobbyInfo;

  //         let lobbyInfo = undefined;
  //         if(lobbyInfoRecord) {
  //           lobbyInfo = decodeEntry(lobbyInfoRecord) ? (decodeEntry(lobbyInfoRecord) as LobbyInfo) : undefined
  //         }

  //         const lobbyData = {
  //           name: lobbyStore.lobbyName,
  //           info: lobbyInfo,
  //           dnaHash: lobbyStore.service.cellId[0],
  //         }
  //         lobbyDatas.push(lobbyData);
  //       }
  //     }
  //   })

  //   return lobbyDatas;
  // }

  /**
   * Returns all the cravings for the chosen set of lobbies
   *
   * @param lobbies
   * @returns
   */
  // async getCravingsForLobbies(lobbies: Array<DnaHash>): Promise<Array<CravingData>> {

  //   let cravingRecipeRecords: Array<[DnaHash, Record[]]> = []; // DnaHash is the DnaHash of the lobby

  //   lobbies.forEach((lobbyHash) => {
  //     const asyncStatus = get(get(this._lobbies).get(lobbyHash).allCravingRecipes);
  //     if (asyncStatus.status === "complete") {
  //       cravingRecipeRecords.push(asyncStatus.value)
  //     }
  //   });


  //   // // deduplicate cravingRecipeRecords to have a list of deduplicated DNA hahses
  //   // const flattenedDnaHashes = cravingRecipeRecords.flat().map((record) => (decodeEntry(record) as DnaRecipe).resulting_dna_hash);
  //   // const uniqueDnaHashes = [...new Set(flattenedDnaHashes)];

  //   // // return all CravingStores associated with those DNA hashes
  //   // return uniqueDnaHashes.map((dnaHash) => get(this._cravings).get(dnaHash));
  // }

  // @click=${() => this.dispatchEvent(new CustomEvent("selected-craving", {
  //   detail: {
  //     cellId: this.store.service.cellId,
  //     craving,
  //   },
  //   bubbles: true,
  //   composed: true,
  // }))}


  // getAllCravings(): Readable<DnaHashMap<CravingStore>> {
  //   return derived(this._cravings, (cravings) => cravings);
  // }

}
