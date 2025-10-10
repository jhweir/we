import { For, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

type SchemaRendererProps = {
  node: SchemaNode | null;
  context?: Record<string, unknown>;
  stores?: Stores;
};

function resolveStoreProp(value: unknown, stores: Stores | undefined): unknown {
  // Helper to resolve $store props (e.g. { $store: 'spaceStore.currentSpace' })
  if (
    value &&
    typeof value === 'object' &&
    '$store' in value &&
    typeof (value as { $store: unknown }).$store === 'string'
  ) {
    // Split the $store string into store name and property path
    const storePath = (value as { $store: string }).$store.split('.');
    const [storeName, ...propertyPath] = storePath;
    // Traverse nested properties starting from the store
    let ref: unknown = (stores as Record<string, unknown>)?.[storeName];
    for (const prop of propertyPath) {
      if (ref && typeof ref === 'object' && prop in ref) ref = (ref as Record<string, unknown>)[prop];
    }
    return ref;
  }

  // Return original value if not a $store binding
  return value;
}

function resolveExpressionProp(value: unknown, context: Record<string, unknown>): unknown {
  // Helper to resolve $expr props (e.g. { $expr: 'space.name' } or { $expr: '`/space/${space.uuid}`' })
  if (
    value &&
    typeof value === 'object' &&
    '$expr' in value &&
    typeof (value as { $expr: unknown }).$expr === 'string'
  ) {
    try {
      // Create a function with context keys as arguments
      const expr = (value as { $expr: string }).$expr;
      const argNames = Object.keys(context);
      const argValues = Object.values(context);

      const fn = new Function(...argNames, `return (${expr});`);
      return fn(...argValues);
    } catch (e) {
      console.error('Error evaluating $expr:', value, context, e);
      return undefined;
    }
  }

  // Return original value if not a $expr binding
  return value;
}

export function SchemaRenderer({ node, context = {}, stores }: SchemaRendererProps) {
  if (!node) return null;

  // Handle template slots
  if (node.slots) {
    const slotElements: Record<string, JSX.Element> = {};
    for (const [key, slotNode] of Object.entries(node.slots)) {
      // Validate slot node
      if (!slotNode.type) throw new Error(`Slot "${key}" is missing a "type" property.`);
      const SlotComponent = componentRegistry[slotNode.type];
      if (!SlotComponent) throw new Error(`Slot "${key}" has unknown type "${slotNode.type}".`);
      // Store the rendered slot element
      slotElements[key] = (
        <SlotComponent {...slotNode.props}>
          {(slotNode.children ?? []).map((child) =>
            typeof child === 'string' ? child : SchemaRenderer({ node: child, context, stores }),
          )}
        </SlotComponent>
      );
    }
    return slotElements;
  }

  // Handle forEach loops
  if (node.type === '$forEach') {
    let items: unknown = [];
    const itemsDef = node.props?.items;
    const resolvedItems = resolveStoreProp(itemsDef, stores);
    items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    const arr = Array.isArray(items) ? items : [];
    return (
      <For each={arr}>
        {(item) =>
          node.children?.map((child) =>
            typeof child === 'object' && child !== null
              ? (SchemaRenderer({
                  node: child,
                  context: { ...context, [String(node.props?.as ?? '')]: item },
                  stores,
                }) as JSX.Element)
              : child,
          )
        }
      </For>
    );
  }

  // $route: handled by router, just a placeholder
  if (node.type === '$route') return null;

  // Get the component from the registry
  const Component = componentRegistry[node.type];
  if (!Component) return null;

  // Resolve dynamic bindings in props
  const resolvedProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.props ?? {})) {
    // Resolve $store references
    let resolved = resolveStoreProp(value, stores);
    // Resolve $expr references
    resolved = resolveExpressionProp(resolved, context);
    // Store the final resolved prop
    resolvedProps[key] = resolved;
  }

  // Recursively render children
  const children = node.children?.map((child) =>
    typeof child === 'string' ? child : SchemaRenderer({ node: child, context, stores }),
  );

  // Render the component with resolved props and children
  return <Component {...resolvedProps}>{children}</Component>;
}
