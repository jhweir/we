// Pure framework-agnostic schema types
export type SchemaProp = string | number | boolean | Record<string, unknown> | SchemaProp[] | undefined;
export type TemplateMeta = { name: string; description: string; icon: string };
export type TemplateSchema = SchemaNode & { meta: TemplateMeta };
export type RouteSchema = SchemaNode & { path: string; routes?: RouteSchema[] };
export type SchemaNode = {
  type?: string; // Used to look up the node's component in the registry (if not included, children rendered in a fragment)
  props?: Record<string, SchemaProp>; // Props to pass to the component
  slots?: Record<string, SchemaNode>; // Named slots for components that support them
  slot?: string; // The name of the slot this node should be rendered into
  routes?: RouteSchema[]; // Routes for routing components
  children?: (SchemaNode | string)[]; // Child nodes (or strings for text nodes like <we-text>)
};

// Types that need to be passed a framework specific NodeType (e.g. JSX.Element for Solid, React.ReactNode for React)
export type ComponentRegistry<NodeType = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (props: any) => NodeType;
};

export type RenderProps<NodeType = unknown> = {
  node: SchemaNode | null;
  stores: Record<string, unknown>;
  registry: ComponentRegistry<NodeType>;
  context?: Record<string, unknown>;
  children?: NodeType;
};

export type RendererOutput<NodeType = unknown> = NodeType | null;
