// Re-export store types so consumers can resolve all referenced types
// Removing these prevents templates using AppProps from compiling
export * from './stores/AdamStore';
export * from './stores/ModalStore';
export * from './stores/ThemeStore';
export * from './stores/SpaceStore';

import type { AdamStore } from './stores/AdamStore';
import type { ModalStore } from './stores/ModalStore';
import type { SpaceStore } from './stores/SpaceStore';
import type { ThemeStore } from './stores/ThemeStore';

export type AppProps = {
  stores: {
    adamStore: AdamStore;
    modalStore: ModalStore;
    spaceStore: SpaceStore;
    themeStore: ThemeStore;
  };
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

export type { RouteDefinition } from '@solidjs/router';
