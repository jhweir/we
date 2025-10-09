import { For, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

// Helper to resolve $store props with type safety
function resolveStoreProp(value: unknown, stores: Stores | undefined): unknown {
  if (
    value &&
    typeof value === 'object' &&
    '$store' in value &&
    typeof (value as { $store: unknown }).$store === 'string'
  ) {
    const storePath = (value as { $store: string }).$store.split('.');
    const [storeName, ...propertyPath] = storePath;
    let ref: unknown = (stores as Record<string, unknown>)?.[storeName];
    for (const prop of propertyPath) {
      if (ref && typeof ref === 'object' && prop in ref) {
        ref = (ref as Record<string, unknown>)[prop];
      }
    }
    return ref;
  }
  return value;
}

type SchemaRendererProps = {
  node: SchemaNode | null;
  context?: Record<string, unknown>;
  stores?: Stores;
};

export function SchemaRenderer({ node, context = {}, stores }: SchemaRendererProps) {
  if (!node) return null;

  // Handle slots: return an object mapping slot names to JSX elements
  if (node.slots) {
    const slotElements: Record<string, JSX.Element> = {};
    for (const [key, slotNode] of Object.entries(node.slots)) {
      slotElements[key] = SchemaRenderer({ node: slotNode as SchemaNode, context, stores }) as JSX.Element;
    }
    return slotElements;
  }

  // $forEach
  if (!node) return null;

  // Handle slots: return an object mapping slot names to JSX elements (for template root)
  if (node.slots) {
    const slotElements: Record<string, JSX.Element> = {};
    for (const [key, slotNode] of Object.entries(node.slots ?? {})) {
      slotElements[key] = SchemaRenderer({ node: slotNode as SchemaNode, context, stores }) as JSX.Element;
    }
    return slotElements;
  }

  // $forEach
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
                  node: child as SchemaNode,
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

  // Find component
  const Component = componentRegistry[node.type];
  if (!Component) return null;

  // Resolve props: handle $store references everywhere (DRY)
  const resolvedProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.props ?? {})) {
    resolvedProps[key] = resolveStoreProp(value, stores);
  }

  // Render children
  const children = node.children?.map((child) =>
    typeof child === 'string' ? child : (SchemaRenderer({ node: child, context, stores }) as JSX.Element),
  );

  // Pass resolved props, context, stores
  return (
    <Component {...resolvedProps} stores={stores}>
      {children}
    </Component>
  );
}
