import { asyncReadable } from "@holochain-open-dev/stores";
import { Record } from "@holochain/client";

import { LobbyService } from "./lobby-service";
import { LobbyName } from "./types";


export class LobbyStore {

  constructor(
    public service: LobbyService,
    public lobbyInfo: Record | undefined,
    public lobbyName: LobbyName,
  ) {}


  static async connect(service: LobbyService) {
    let lobbyInfo = undefined;
    try {
      lobbyInfo = await service.getLobbyInfo();
    } catch(e) {
      if (JSON.stringify(e).includes("There is no link pointing to the lobby info yet.")) {
        // ignore since maybe just no other peer is online yet
        // console.log("Failed to fetch lobby info.")
      } else {
        throw new Error(JSON.stringify(e));
      }
    }
    const lobbyName = await service.getLobbyName();
    return new LobbyStore(service, lobbyInfo, lobbyName);
  }

  // create instead a data structure here that also contains the info about resonances and iResonated
  allCravingRecipes = asyncReadable<Array<Record>>(async (set) => {
    const cravingRecipes = await this.service.getAllCravingRecipes();

    set(cravingRecipes);

    return this.service.on("signal", (signal) => {
      if (signal.type === "EntryCreated" && signal.app_entry.type === "DnaRecipe") {
        cravingRecipes.push(signal.record);
        set(cravingRecipes)
      }
    })
  });

}

