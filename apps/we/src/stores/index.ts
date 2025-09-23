export * from './AdamStore';
export * from './ModalStore';
export * from './SpaceStore';
export * from './StoreProvider';
export * from './ThemeStore';

import type { AdamStore } from './AdamStore';
import type { ModalStore } from './ModalStore';
import type { ThemeStore } from './ThemeStore';

export type Stores = {
  adam: AdamStore;
  theme: ThemeStore;
  modal: ModalStore;
};
