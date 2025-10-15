import { hasToken, resolveRelativePath } from './helpers';

type Props = Record<string, unknown>;
type Memo = <T>(fn: () => T) => T; // Framework specific memoization function (e.g. Solid's createMemo)
const noMemo: Memo = (fn) => fn(); // Fallback for if no memoization provided, just returns fn()

// Resolves $store props (e.g. { $store: 'userStore.profile.name' })
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

// Resolves $expr props (e.g. { $expr: 'space.name' } or { $expr: '`/space/${space.uuid}`' })
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

// Resolves $action props (e.g. { $action: 'adamStore.navigate', args: ['/home'] })
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

// Resolve any prop based on its token type
export function resolveProp(value: unknown, stores: Props, context: Props, memo: Memo = noMemo): unknown {
  if (hasToken(value, '$store')) return resolveStoreProp(value, stores, memo);
  if (hasToken(value, '$expr')) return resolveExpressionProp(value, context);
  if (hasToken(value, '$action')) return resolveActionProp(value, context, stores, memo);
  return value;
}

// Resolve all props in an object
export function resolveProps(props: Props | undefined, stores: Props, context: Props, memo: Memo = noMemo): Props {
  const resolvedProps: Props = {};
  for (const [key, value] of Object.entries(props ?? {}))
    resolvedProps[key] = resolveProp(value, stores, context, memo);
  return resolvedProps;
}
