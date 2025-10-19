// Generic schema types for UI rendering

// These types are framework-agnostic and use a generic NodeType parameter.
// Each framework should specialize the types with its own node type
// (e.g. JSX.Element for Solid, React.ReactNode for React) to ensure correct typing.

export type ComponentRegistry<NodeType = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (props: any) => NodeType;
};

export type SchemaPropValue<NodeType = unknown> =
  | string
  | number
  | boolean
  | NodeType
  | Record<string, unknown>
  | SchemaPropValue<NodeType>[]
  | undefined;

export type SchemaNode<NodeType = unknown> = {
  type?: string; // Component type (if not included, children rendered in a fragment)
  props?: Record<string, SchemaPropValue<NodeType>>; // Component props
  slots?: Record<string, SchemaNode<NodeType>>; // Named slots for components that support them
  routes?: RouteSchema<NodeType>[]; // Child routes for route components
  children?: (SchemaNode<NodeType> | string)[]; // Child nodes (or strings for text nodes)
  key?: string | number; // Optional key for identifying nodes in lists
};

export type TemplateMeta = {
  name: string;
  description: string;
  icon: string;
};

export type TemplateSchema<NodeType = unknown> = { meta: TemplateMeta } & SchemaNode<NodeType>;

export type RouteSchema<NodeType = unknown> = {
  path: string;
  routes?: RouteSchema<NodeType>[];
} & SchemaNode<NodeType>;

export type RenderSchemaProps<NodeType = unknown> = {
  node: SchemaNode<NodeType> | null;
  stores: Record<string, unknown>;
  registry: ComponentRegistry<NodeType>;
  context?: Record<string, unknown>;
  children?: NodeType;
  key?: string | number;
};

// export type RendererOutput<NodeType = unknown> = NodeType | Record<string, NodeType> | null;

export type RendererOutput<NodeType = unknown> = NodeType | null;
