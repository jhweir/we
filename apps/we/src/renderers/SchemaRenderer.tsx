import { createMemo, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

type Props = Record<string, unknown>;
type SchemaRendererProps = { node: SchemaNode | null; stores: Stores; context?: Props; children?: JSX.Element };
type RendererOutput = JSX.Element | Record<string, JSX.Element> | null;

// Helper function to render child nodes
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

// Resolves $store props (e.g. { $store: 'userStore.profile.name' })
function resolveStoreProp(value: unknown, stores: Stores): unknown {
  const storePath = (value as { $store: string }).$store.split('.');
  const [storeName, ...propertyPath] = storePath;

  // Block entire store access
  if (propertyPath.length === 0) throw new Error(`Schema error: Cannot pass entire store "${storeName}"`);

  // Return the accessor directly for single-level access
  if (propertyPath.length === 1) return (stores[storeName] as Props)[propertyPath[0]];

  // Create a derived accessor for nested paths
  return createMemo(() => {
    // Walk down property path to get final value (userStore → userStore.profile → userStore.profile.name)
    let current = stores[storeName];
    for (const prop of propertyPath) {
      if (current && typeof current === 'object' && prop in current) {
        const propValue = (current as Props)[prop];
        current = typeof propValue === 'function' ? propValue() : propValue;
      } else {
        return undefined;
      }
    }
    return current;
  });
}

// Resolves $expr props (e.g. { $expr: 'space.name' } or { $expr: '`/space/${space.uuid}`' })
function resolveExpressionProp(value: unknown, context: Props): unknown {
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

// Resolve any prop based on its token type
function resolveProp(value: unknown, stores: Stores, context: Props): unknown {
  if (hasToken(value, '$store')) return resolveStoreProp(value, stores);
  if (hasToken(value, '$expr')) return resolveExpressionProp(value, context);
  if (hasToken(value, '$action')) return resolveActionProp(value, context, stores);

  return value; // No processing needed
}

// Resolve all props in an object
function resolveProps(props: Props | undefined, stores: Stores, context: Props): Props {
  const resolvedProps: Props = {};
  for (const [key, value] of Object.entries(props ?? {})) resolvedProps[key] = resolveProp(value, stores, context);
  return resolvedProps;
}

export function SchemaRenderer({ node, stores, context = {}, children }: SchemaRendererProps): RendererOutput {
  if (!node) return null;

  // Handle slots
  const slotElements: Record<string, JSX.Element> = {};
  if (node.slots) {
    for (const [key, slotNode] of Object.entries(node.slots)) {
      if (slotNode.type) {
        // Get the slot component from the component registry
        const SlotComponent = componentRegistry[slotNode.type];
        if (!SlotComponent) throw new Error(`Schema slot "${key}" has unknown type "${slotNode.type}".`);

        // Render the slot component with its resolved props and children
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
  }

  // Handle conditional rendering
  if (node.type === '$if') {
    const condition = resolveProp(node.props?.condition, stores, context);
    const conditionMet = typeof condition === 'function' ? condition() : condition;
    const nodeToRender = node.props?.[conditionMet ? 'then' : 'else'] as SchemaNode;
    return SchemaRenderer({ node: nodeToRender, stores, context }) ?? null;
  }

  // Handle for-each loops
  if (node.type === '$forEach') {
    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores);
    const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    const itemsArray = Array.isArray(items) ? items : [];
    const itemKey = String(node.props?.as ?? 'item');

    // Return the items with their rendered children
    return <>{itemsArray.map((item) => renderChildren(node.children, { ...context, [itemKey]: item }, stores))}</>;
  }

  // Get the component from the registry
  const Component = componentRegistry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);

  // Render the component with resolved props, slot elements, and rendered children
  return (
    <Component {...resolveProps(node.props, stores, context)} {...slotElements}>
      {children || renderChildren(node.children, context, stores)}
    </Component>
  );
}
