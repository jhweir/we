import type { JSX } from 'solid-js';

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

// Schema types
export type SchemaPropValue =
  | string
  | number
  | boolean
  | JSX.Element
  | Record<string, unknown>
  | SchemaPropValue[]
  | undefined;

export type SchemaNode = {
  type?: string;
  props?: Record<string, SchemaPropValue>;
  slots?: Record<string, SchemaNode>;
  routes?: RouteSchema[];
  children?: (SchemaNode | string)[];
};

export type TemplateSchema = { id: string; name: string; description: string } & SchemaNode;

export type RouteSchema = { path: string; routes?: RouteSchema[] } & SchemaNode;

export type FlattenedRoute = { path: string; component: () => JSX.Element };
