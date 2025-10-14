import { createMemo, JSX } from 'solid-js';

import type { SchemaNode, Stores } from '../types';
import { componentRegistry } from './componentRegistry';

type Props = Record<string, unknown>;
type SchemaRendererProps = { node: SchemaNode | null; stores: Stores; context?: Props; children?: JSX.Element };
type RendererOutput = JSX.Element | Record<string, JSX.Element> | null;

// TODO: Allow routes with no type to render children directly (like slots)

// Helper function to render child nodes
function renderChildren(
  children: unknown[] | undefined,
  context: Props,
  stores: Stores,
  routedChild?: JSX.Element,
): (RendererOutput | string)[] | undefined {
  return children?.map((child): RendererOutput | string => {
    // If the child is a string (i.e when passing text to <we-text>), return it directly
    if (typeof child === 'string') return child;

    // Otherwise render the child node
    return SchemaRenderer({ node: child as SchemaNode, stores, context, children: routedChild }) as JSX.Element;
  });
}

// Determines which children to render based on schema and props
function resolveRenderedChildren(
  node: SchemaNode,
  stores: Stores,
  context: Props,
  routedChild: JSX.Element | undefined,
): JSX.Element | undefined {
  // If schema children exist, render them
  const hasSchemaChildren = Array.isArray(node.children) && node.children.length > 0;
  if (hasSchemaChildren) return renderChildren(node.children, context, stores, routedChild) as JSX.Element;

  // If no schema children and no explicit props.children, fallback to the routed child
  const hasExplicitPropsChildren = !!(node.props && Object.prototype.hasOwnProperty.call(node.props, 'children'));
  if (!hasExplicitPropsChildren) return routedChild;

  // If props.children exists, render nothing here (component handles its own children)
  return undefined;
}

// Type guard to check for presence of a specific string token in an object
function hasToken(value: unknown, token: string): value is Record<string, string> {
  const tokenExists = value != null && typeof value === 'object' && token in value;
  return tokenExists && typeof (value as Props)[token] === 'string';
}

// Resolves relative paths used in router navigation (e.g. '.', './', '../')
function resolveRelativePath(rawPath: string, baseDepth: number): string {
  // Get current path segments and start from the base depth
  const segs = window.location.pathname.split('/').filter(Boolean);
  let depth = Math.min(baseDepth, segs.length);

  // Navigate to the parent index for '' or '.'
  if (rawPath === '' || rawPath === '.') return `/${segs.slice(0, depth).join('/')}`;

  // Normalize './' and support parent navigation with '../'
  let path = rawPath;
  if (path.startsWith('./')) path = path.slice(2);
  while (path.startsWith('../') && depth > 0) {
    path = path.slice(3);
    depth--;
  }

  // Rebuild the final path and clean up any double slashes
  const base = '/' + segs.slice(0, depth).join('/');
  const finalPath = (base === '/' ? '' : base.replace(/\/+$/, '')) + '/' + path.replace(/^\/+/, '');
  return finalPath.replace(/\/{2,}/g, '/');
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

  if (typeof method === 'function') {
    return () => {
      // Handle relative paths used in router navigation
      if (storeName === 'adamStore' && methodName === 'navigate' && typeof resolvedArgs[0] === 'string') {
        const path = (resolvedArgs[0] as string).trim();
        const isAbsolute = path.startsWith('/') || path.startsWith('http');
        const baseDepth = (context?.$nav as { baseDepth?: number } | undefined)?.baseDepth;

        if (!isAbsolute && typeof baseDepth === 'number') {
          const normalizedPath = resolveRelativePath(path, baseDepth);
          const nextArgs = [normalizedPath, ...resolvedArgs.slice(1)];
          return method.apply(store, nextArgs);
        }
      }

      // Otherwise just call the method with resolved args
      return method.apply(store, resolvedArgs);
    };
  }
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

  // Render routed children at $routes token
  if (node.type === '$routes') return children ?? null;

  // Handle slots
  const slotElements: Record<string, JSX.Element> = {};
  if (node.slots) {
    for (const [key, slotNode] of Object.entries(node.slots)) {
      if (slotNode.type) {
        // Get the slot component from the component registry
        const SlotComponent = componentRegistry[slotNode.type];
        if (!SlotComponent) throw new Error(`Schema slot "${key}" has unknown type "${slotNode.type}".`);

        // Store the slot component with its resolved props and children
        slotElements[key] = (
          <SlotComponent {...resolveProps(slotNode.props, stores, context)}>
            {renderChildren(slotNode.children, context, stores, children)}
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
    return SchemaRenderer({ node: nodeToRender, stores, context, children }) ?? null;
  }

  // Handle for-each loops
  if (node.type === '$forEach') {
    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores);
    const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    const itemsArray = Array.isArray(items) ? items : [];
    const itemKey = String(node.props?.as ?? 'item');

    // Return the items with their rendered children
    return (
      <>{itemsArray.map((item) => renderChildren(node.children, { ...context, [itemKey]: item }, stores, children))}</>
    );
  }

  // Get the component from the registry
  const Component = componentRegistry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);

  // Return the component with its resolved props, slots, and children
  return (
    <Component {...resolveProps(node.props, stores, context)} {...slotElements}>
      {resolveRenderedChildren(node, stores, context, children)}
    </Component>
  );
}
