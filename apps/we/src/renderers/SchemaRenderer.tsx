import { For, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

type Props = Record<string, unknown>;
type SchemaRendererProps = { node: SchemaNode | null; stores: Stores; context?: Props };
type RendererOutput = JSX.Element | Record<string, JSX.Element> | null;

// Helper function to render children nodes
function renderChildren(
  children: unknown[] | undefined,
  context: Props,
  stores: Stores,
): (RendererOutput | string)[] | undefined {
  return children?.map((child): RendererOutput | string =>
    typeof child === 'string' ? child : (SchemaRenderer({ node: child as SchemaNode, stores, context }) as JSX.Element),
  );
}

// Type guard to check for presence of a specific string token in an object
function hasToken(value: unknown, token: string): value is Record<string, string> {
  const tokenExists = value != null && typeof value === 'object' && token in value;
  return tokenExists && typeof (value as Props)[token] === 'string';
}

// Resolves $store props (e.g. { $store: 'spaceStore.currentSpace' })
function resolveStoreProp(value: unknown, stores: Stores): unknown {
  if (!hasToken(value, '$store')) return value;

  // Split the $store string into store name and property path
  const storePath = (value as { $store: string }).$store.split('.');
  const [storeName, ...propertyPath] = storePath;

  // Traverse nested properties starting from the store to get the final value
  let ref: unknown = stores[storeName];
  for (const prop of propertyPath) {
    if (ref && typeof ref === 'object' && prop in ref) ref = (ref as Props)[prop];
  }
  return ref;
}

// Resolves $expr props (e.g. { $expr: 'space.name' } or { $expr: '`/space/${space.uuid}`' })
function resolveExpressionProp(value: unknown, context: Props): unknown {
  if (!hasToken(value, '$expr')) return value;

  try {
    // Create a function with context keys as arguments
    const expression = (value as { $expr: string }).$expr;
    const argNames = Object.keys(context);
    const argValues = Object.values(context);
    const fn = new Function(...argNames, `return (${expression});`);

    // Call the function with context values to evaluate the expression
    return fn(...argValues);
  } catch (e) {
    console.error('Error evaluating $expr:', value, context, e);
    return undefined;
  }
}

// Resolves $action props (e.g. { $action: 'adamStore.navigate', args: ['/home'] })
function resolveActionProp(value: unknown, context: Props, stores: Stores): unknown {
  if (!hasToken(value, '$action')) return value;

  // Split the $action string into store name and method name
  const [storeName, methodName] = (value as { $action: string }).$action.split('.');

  // Retrieve args and resolve any expressions within them
  const args = (value as { args?: unknown[] }).args ?? [];
  const resolvedArgs = args.map((arg) => resolveProp(arg, stores, context));

  // Get the method from the store and return a callable function
  const store = stores[storeName] as Props | undefined;
  const method = store?.[methodName];
  if (typeof method === 'function') return () => method(...resolvedArgs);
}

// Resolve a single prop through the full chain: $store → $expr → $action
function resolveProp(value: unknown, stores: Stores, context: Props): unknown {
  let resolved = resolveStoreProp(value, stores);
  resolved = resolveExpressionProp(resolved, context);
  return resolveActionProp(resolved, context, stores);
}

// Resolve all props in an object through the full chain
function resolveProps(props: Props | undefined, stores: Stores, context: Props): Props {
  const resolvedProps: Props = {};
  for (const [key, value] of Object.entries(props ?? {})) resolvedProps[key] = resolveProp(value, stores, context);
  return resolvedProps;
}

export function SchemaRenderer({ node, stores, context = {} }: SchemaRendererProps): RendererOutput {
  if (!node) return null;

  // Handle slots
  if (node.slots) {
    const slotElements: Record<string, JSX.Element> = {};
    for (const [key, slotNode] of Object.entries(node.slots)) {
      if (slotNode.type) {
        // Validate slot component and render it with resolved props and children
        const SlotComponent = componentRegistry[slotNode.type];
        if (!SlotComponent) throw new Error(`Schema slot "${key}" has unknown type "${slotNode.type}".`);

        slotElements[key] = (
          <SlotComponent {...resolveProps(slotNode.props, stores, context)}>
            {renderChildren(slotNode.children, context, stores)}
          </SlotComponent>
        );
      } else {
        // If no type is provided for the slot, render children in a JSX fragment
        slotElements[key] = <>{renderChildren(slotNode.children, context, stores)}</>;
      }
    }
    return slotElements;
  }

  // Handle conditional rendering
  if (node.type === '$if') {
    const condition = resolveProp(node.props?.condition, stores, context);
    const conditionMet = typeof condition === 'function' ? condition() : condition;
    const nodeToRender = node.props?.[conditionMet ? 'then' : 'else'] as SchemaNode;
    return SchemaRenderer({ node: nodeToRender, stores, context }) ?? null;
  }

  // Handle forEach loops
  if (node.type === '$forEach') {
    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores);
    const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    const itemsArray = Array.isArray(items) ? items : [];
    const itemKey = String(node.props?.as ?? 'item');

    // Return a list rendering each item with the provided children
    return (
      <For each={itemsArray}>
        {(item) => <>{renderChildren(node.children, { ...context, [itemKey]: item }, stores)}</>}
      </For>
    );
  }

  // Get the component from the registry
  const Component = componentRegistry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);

  // Render the component with resolved props and rendered children
  return (
    <Component {...resolveProps(node.props, stores, context)}>
      {renderChildren(node.children, context, stores)}
    </Component>
  );
}
