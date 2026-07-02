import { createContext } from '@lit-labs/context';
import { AppClient } from '@holochain/client';
import { CravingStore } from './craving-store';
import { CondenserStore } from './condenser-store';
import { LobbyStore } from './lobby-store';

export const clientContext = createContext<AppClient>(
  '@word-condenser/appClient',
);
export const cravingStoreContext = createContext<CravingStore>(
  '@word-condenser/cravingStore',
);
export const lobbyStoreContext = createContext<LobbyStore>(
  '@word-condenser/lobbyStore',
);
export const condenserContext = createContext<CondenserStore>(
  '@word-condenser/condenserStore',
);
