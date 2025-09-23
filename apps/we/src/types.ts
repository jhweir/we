import type { AdamStore, ModalStore, ThemeStore } from '@/stores';

type Stores = { adam: AdamStore; theme: ThemeStore; modal: ModalStore };

export type AppProps = {
  stores: Stores;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};
