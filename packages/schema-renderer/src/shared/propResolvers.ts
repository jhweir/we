import { hasToken, resolveRelativePath } from './helpers';

type Props = Record<string, unknown>;
type MapProp = { items: unknown; select: Props };
type PickProp = { from: unknown; props: string[] };
type Memo = <T>(fn: () => T) => T; // Framework specific memoization function (e.g. Solid's createMemo)
const noMemo: Memo = (fn) => fn(); // Fallback if no memoization provided

// Resolves $store props: { $store: 'userStore.profile.name' }
export function resolveStoreProp(value: unknown, stores: Props, memo: Memo = noMemo): unknown {
  const storePath = (value as { $store: string }).$store.split('.');
  const [storeName, ...propertyPath] = storePath;

  // Block entire store access
  if (propertyPath.length === 0) throw new Error(`Schema error: Cannot pass entire store "${storeName}"`);

  // Return the accessor directly for single-level access
  if (propertyPath.length === 1) return (stores[storeName] as Props)[propertyPath[0]];

  // Create a derived accessor for nested paths
  return memo(() => {
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

// Resolves $expr props: { $expr: 'space.name' } or { $expr: '`/space/${space.uuid}`' }
export function resolveExpressionProp(value: unknown, context: Props): unknown {
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

// Resolves $action props: { $action: 'adamStore.navigate', args: ['/home'] }
export function resolveActionProp(value: unknown, context: Props, stores: Props, memo: Memo): unknown {
  // Split the $action string into store name and method name
  const [storeName, methodName] = (value as { $action: string }).$action.split('.');

  // Retrieve args and resolve any expressions within them
  const args = (value as { args?: unknown[] }).args ?? [];
  const resolvedArgs = args.map((arg) => resolveProp(arg, stores, context, memo));

  // Get the method from the store
  const store = stores[storeName] as Props | undefined;
  const method = store?.[methodName];

  // Return a callable function if the method exists
  if (typeof method === 'function') {
    return () => {
      // Handle special case for relative paths used in router navigation
      if (storeName === 'adamStore' && methodName === 'navigate' && typeof resolvedArgs[0] === 'string') {
        const path = resolvedArgs[0].trim();
        const isAbsolute = path.startsWith('/') || path.startsWith('http');
        const baseDepth = (context?.$nav as { baseDepth?: number })?.baseDepth;

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

// Resolves $map props: { $map: { items: { "$store": "templateStore.templates" }, select: { "name": "$item.meta.name", "icon": "$item.meta.icon" } } }
function resolveMapProp(map: MapProp, stores: Props, context: Props, memo: Memo): unknown {
  return memo(() => {
    const items = resolveProp(map.items, stores, context, memo);
    const itemsArray = typeof items === 'function' ? items() : items;
    if (!Array.isArray(itemsArray)) return [];
    return itemsArray.map((item) => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(map.select)) {
        if (typeof value === 'string' && value.startsWith('$item.')) {
          const path = value.slice(6).split('.');
          let current = item;
          for (const p of path) current = current?.[p];
          result[key] = current;
        } else {
          result[key] = value;
        }
      }
      return result;
    });
  });
}

// Resolves $pick props: { $pick: { from: { "$store": "userStore.profile" }, props: ["name", "email"] } }
function resolvePickProp(pick: PickProp, stores: Props, context: Props, memo: Memo): unknown {
  return memo(() => {
    // Resolve the source object
    const source = resolveProp(pick.from, stores, context, memo);
    // If source is an accessor, call it
    const resolvedSource = typeof source === 'function' ? source() : source;
    if (typeof resolvedSource !== 'object' || resolvedSource === null) return {};
    // Pick the specified props, wrapping each in a memo accessor
    const result: Record<string, unknown> = {};
    for (const key of pick.props) result[key] = (resolvedSource as Record<string, unknown>)[key];
    return result;
  });
}

// Resolve any prop based on its token type
export function resolveProp(value: unknown, stores: Props, context: Props, memo: Memo = noMemo): unknown {
  if (hasToken(value, '$store', 'string')) return resolveStoreProp(value, stores, memo);
  if (hasToken(value, '$expr', 'string')) return resolveExpressionProp(value, context);
  if (hasToken(value, '$action', 'string')) return resolveActionProp(value, context, stores, memo);
  if (hasToken(value, '$map', 'object')) return resolveMapProp(value['$map'] as MapProp, stores, context, memo);
  if (hasToken(value, '$pick', 'object')) return resolvePickProp(value['$pick'] as PickProp, stores, context, memo);
  return value;
}

// Resolve all props in an object
export function resolveProps(props: Props | undefined, stores: Props, context: Props, memo: Memo = noMemo): Props {
  const resolvedProps: Props = {};
  for (const [key, value] of Object.entries(props ?? {}))
    resolvedProps[key] = resolveProp(value, stores, context, memo);
  return resolvedProps;
}
