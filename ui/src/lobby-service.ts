import { AppClient, Record } from '@holochain/client';
import { ZomeClient } from '@holochain-open-dev/utils';
import { DnaRecipe, LobbyName, LobbySignal } from './types';

export interface LobbyEvents {
  ['signal']: LobbySignal;
}

export class LobbyService extends ZomeClient<LobbySignal> {
  constructor(
    public client: AppClient,
    public zomeName = 'cravings',
    public roleName = 'lobby',
  ) {
    super(client, roleName, zomeName);
  }

  // on<Name extends keyof LobbyEvents>(
  //   eventName: Name | readonly Name[],
  //   listener: (eventData: LobbyEvents[Name]) => void | Promise<void>,
  // ): UnsubscribeFunction {
  //   return this.client.on(eventName, async signal => {
  //     if (
  //       JSON.stringify(signal.cell_id) === JSON.stringify(this.cellId) &&
  //       this.zomeName === signal.zome_name
  //     ) {
  //       listener(signal.payload as LobbySignal);
  //     }
  //   });
  // }

  /**
   * Gets the Records of all associations (deduplicated)
   *
   * @returns
   */
  async getAllCravingRecipes(local: boolean = true): Promise<Array<Record>> {
    const recipes: Array<Record> = await this.callZome(
      'get_all_craving_recipes',
      {
        input: null,
        local,
      },
    );

    return recipes;
  }

  async createLobbyInfo(
    description: string,
    logoSrc: string,
    unenforcedRules: string | undefined,
    networkSeed: string,
  ): Promise<Record> {
    const record = await this.callZome('create_lobby_info', {
      description,
      logo_src: logoSrc,
      unenforced_rules: unenforcedRules,
      network_seed: networkSeed,
    });

    return record;
  }

  async getLobbyInfo(local: boolean = true): Promise<Record | undefined> {
    const record: Record | undefined = await this.callZome('get_lobby_info', {
      input: null,
      local,
    });

    return record;
  }

  async getLobbyName(local: boolean = true): Promise<LobbyName> {
    const lobbyName: LobbyName = await this.callZome('get_lobby_name', null);

    return lobbyName;
  }

  async registerCraving(dnaRecipe: DnaRecipe): Promise<Record> {
    // console.log(`@lobbyService: registering craving with dnaRecipe: ${JSON.stringify(dnaRecipe)}}`);
    // console.log(`@lobbyService: regisetring craving with dna hash: ${encodeHashToBase64(dnaRecipe.resulting_dna_hash)}`)
    return this.callZome('create_dna_recipe', dnaRecipe);
  }
}
