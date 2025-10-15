import type { AdamStore, ModalStore, SpaceStore, ThemeStore } from '@/stores';

export type Stores = {
  adamStore: AdamStore;
  modalStore: ModalStore;
  spaceStore: SpaceStore;
  themeStore: ThemeStore;
} & Record<string, unknown>;
