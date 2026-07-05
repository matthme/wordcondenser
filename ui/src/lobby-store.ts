import { asyncReadable } from '@holochain-open-dev/stores';
import { Record } from '@holochain/client';

import { LobbyService } from './lobby-service';
import { LobbyName, LobbySignal } from './types';

export class LobbyStore {
  constructor(
    public service: LobbyService,
    public lobbyInfo: Record | undefined,
    public lobbyName: LobbyName,
  ) {}

  static async connect(service: LobbyService) {
    let lobbyInfo;
    console.log('Made it to here');

    try {
      lobbyInfo = await service.getLobbyInfo();
    } catch (e) {
      if (
        JSON.stringify(e).includes(
          'There is no link pointing to the lobby info yet.',
        )
      ) {
        // ignore since maybe just no other peer is online yet
        // console.log("Failed to fetch lobby info.")
      } else {
        throw new Error(JSON.stringify(e));
      }
    }

    return new LobbyStore(service, lobbyInfo, 'default-lobby');
  }

  // create instead a data structure here that also contains the info about resonances and iResonated
  allCravingRecipes = asyncReadable<Array<Record>>(async set => {
    const cravingRecipes = await this.service.getAllCravingRecipes();

    set(cravingRecipes);

    return this.service.client.on('signal', signal => {
      if (
        signal.type === 'app' &&
        (signal.value.payload as LobbySignal).type === 'EntryCreated' &&
        (signal.value.payload as LobbySignal).app_entry.type === 'DnaRecipe'
      ) {
        cravingRecipes.push((signal.value.payload as LobbySignal).record);
        set(cravingRecipes);
      }
    });
  });
}
