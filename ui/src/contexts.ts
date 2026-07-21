import { createContext } from '@lit-labs/context';
import { AppClient } from '@holochain/client';
import { CravingStore } from './craving-store';
import { CondenserStore } from './condenser-store';

export const clientContext = createContext<AppClient>(
  '@word-condenser/appClient',
);
export const cravingStoreContext = createContext<CravingStore>(
  '@word-condenser/cravingStore',
);
export const condenserContext = createContext<CondenserStore>(
  '@word-condenser/condenserStore',
);
