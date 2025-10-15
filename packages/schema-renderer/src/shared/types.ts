// Generic schema types for UI rendering

// These types are framework-agnostic and use a generic JSXType parameter.
// Each framework should extend or specialize these types by passing its own JSX type
// (e.g. JSX.Element for Solid, React.ReactNode for React) to ensure correct typing.

export type ComponentRegistry<JSXType = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (props: any) => JSXType;
};

export type SchemaPropValue<JSXType = unknown> =
  | string
  | number
  | boolean
  | JSXType
  | Record<string, unknown>
  | SchemaPropValue<JSXType>[]
  | undefined;

export type SchemaNode<JSXType = unknown> = {
  type?: string;
  props?: Record<string, SchemaPropValue<JSXType>>;
  slots?: Record<string, SchemaNode<JSXType>>;
  routes?: RouteSchema<JSXType>[];
  children?: (SchemaNode<JSXType> | string)[];
};

export type TemplateSchema<JSXType = unknown> = { id: string; name: string; description: string } & SchemaNode<JSXType>;

export type RouteSchema<JSXType = unknown> = { path: string; routes?: RouteSchema<JSXType>[] } & SchemaNode<JSXType>;

export type RenderSchemaProps<JSXType = unknown> = {
  node: SchemaNode<JSXType> | null;
  stores: Record<string, unknown>;
  registry: ComponentRegistry<JSXType>;
  context?: Record<string, unknown>;
  children?: JSXType;
};

export type RendererOutput<JSXType = unknown> = JSXType | Record<string, JSXType> | null;
