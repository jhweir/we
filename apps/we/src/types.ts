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

export type Stores = {
  adamStore: AdamStore;
  modalStore: ModalStore;
  spaceStore: SpaceStore;
  themeStore: ThemeStore;
} & Record<string, unknown>;

// export type AppProps = {
//   stores: Stores;
//   navigate: (to: string, options?: { replace?: boolean }) => void;
// };

export type { RouteDefinition } from '@solidjs/router';

// Schema types
export type SchemaPropValue = string | number | boolean | Record<string, unknown> | SchemaPropValue[] | undefined;

export type SchemaNode = {
  type?: string;
  props?: Record<string, SchemaPropValue>;
  children?: (SchemaNode | string)[];
  slots?: Record<string, SchemaNode>;
};

export type RouteSchema = { path: string } & SchemaNode;

export type TemplateSchema = {
  id: string;
  name: string;
  description: string;
  root: SchemaNode;
  routes: RouteSchema[];
};
