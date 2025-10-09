import { For, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

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
    const itemsDef = node.props?.items as { $store?: string } | undefined;
    if (itemsDef && typeof itemsDef.$store === 'string') {
      const [storeName, ...propertyPath] = itemsDef.$store.split('.');
      const storeObj = (stores as Record<string, unknown>)?.[storeName];
      items = propertyPath.reduce(
        (acc: unknown, prop: string) =>
          acc && typeof acc === 'object' && prop in (acc as object) ? (acc as Record<string, unknown>)[prop] : [],
        storeObj,
      );
      if (typeof items === 'function') items = items();
    }
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

  // Render children
  const children = node.children?.map((child) =>
    typeof child === 'string' ? child : (SchemaRenderer({ node: child, context, stores }) as JSX.Element),
  );

  // Pass props, context, stores
  return (
    <Component {...node.props} stores={stores}>
      {children}
    </Component>
  );
}
