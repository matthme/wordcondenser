import { AppAgentCallZomeRequest, AppAgentClient, CellId, EntryHash, Record, encodeHashToBase64 } from "@holochain/client";
import { UnsubscribeFunction } from "emittery";
import { DnaRecipe, LobbyName, LobbySignal } from "./types";


export interface LobbyEvents {
  ["signal"]: LobbySignal;
}

export class LobbyService {

  constructor(
    public client: AppAgentClient,
    public zomeName = "cravings",
    public cellId: CellId,
  ) {}


  on<Name extends keyof LobbyEvents>(
    eventName: Name | readonly Name[],
    listener: (eventData: LobbyEvents[Name]) => void | Promise<void>
  ): UnsubscribeFunction {
    return this.client.on(eventName, async (signal) => {
      if (
        JSON.stringify(signal.cell_id) === JSON.stringify(this.cellId) &&
        this.zomeName === signal.zome_name
      ) {
        listener(signal.payload as LobbySignal);
      }
    });
  }


  /**
   * Gets the Records of all associations (deduplicated)
   *
   * @returns
   */
  async getAllCravingRecipes(): Promise<Array<Record>> {
    const recipes: Array<Record> = await this.callZome(
      "get_all_craving_recipes",
      null
    );

    return recipes
  }

  async createLobbyInfo(description: string, logoSrc: string, unenforcedRules: string | undefined, networkSeed: string): Promise<Record> {
    const record = await this.callZome(
      "create_lobby_info",
      {
        description,
        logo_src: logoSrc,
        unenforced_rules: unenforcedRules,
        network_seed: networkSeed
      }
    );

    return record;
  }


  async getLobbyInfo(): Promise<Record | undefined> {
    const record: Record | undefined = await this.callZome(
      "get_lobby_info",
      null,
    );

    return record;
  }

  async getLobbyName(): Promise<LobbyName> {
    const lobbyName: LobbyName = await this.callZome(
      "get_lobby_name",
      null,
    );

    return lobbyName;
  }

  async registerCraving(dnaRecipe: DnaRecipe): Promise<Record> {
    // console.log(`@lobbyService: registering craving with dnaRecipe: ${JSON.stringify(dnaRecipe)}}`);
    // console.log(`@lobbyService: regisetring craving with dna hash: ${encodeHashToBase64(dnaRecipe.resulting_dna_hash)}`)
    return await this.callZome(
      "create_dna_recipe",
      dnaRecipe,
    );
  }

  private callZome(fn_name: string, payload: any) {
    const req: AppAgentCallZomeRequest = {
      cell_id: this.cellId,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req);
  }

}






