import { createMemo, For, JSX, untrack } from 'solid-js';

import { resolveProp, resolveProps, resolveStoreProp } from '../../shared/propResolvers';
import type { ComponentRegistry, RendererOutput, RenderSchemaProps, SchemaNode } from './types';

export function renderChildren(
  children: () => unknown[] | undefined,
  context: Record<string, unknown>,
  stores: Record<string, unknown>,
  registry: ComponentRegistry,
  routedChild?: JSX.Element,
): RendererOutput {
  // Delegate to ChildList so the parent doesn't directly read `children` during its memo.
  if (!children) return undefined;
  return (
    <For each={children() ?? []} fallback={null}>
      {(child) => {
        if (typeof child === 'string') return child;
        return RenderSchema({ node: child as SchemaNode, stores, registry, context, children: routedChild });
      }}
    </For>
  );
}

export function RenderSchema({ node, stores, registry, context = {}, children }: RenderSchemaProps): RendererOutput {
  // const renderedNode = createMemo(() => {
  if (!node) return null;

  // Render routed children at $routes token
  if (node.type === '$routes') return children ?? null;

  // Handle conditional rendering
  if (node.type === '$if') {
    const condition = resolveProp(node.props?.condition, stores, context, createMemo);
    const conditionMet = typeof condition === 'function' ? condition() : condition;
    const nodeToRender = node.props?.[conditionMet ? 'then' : 'else'] as SchemaNode;
    return RenderSchema({ node: nodeToRender, stores, registry, context, children }) ?? null;
  }

  // Handle for-each loops
  if (node.type === '$forEach') {
    // console.log('Rendering $forEach node:', node);
    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores, createMemo);
    // console.log('Resolved items for $forEach:', (resolvedItems as any)());
    // const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    // const itemsArray = Array.isArray(items) ? items : [];
    const itemsArray = createMemo(() =>
      Array.isArray(typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems)
        ? typeof resolvedItems === 'function'
          ? resolvedItems()
          : resolvedItems
        : [],
    );
    const as = String(node.props?.as ?? 'item');

    // Return the items with their rendered children
    return (
      <For each={itemsArray()}>
        {(item) =>
          RenderSchema({
            node: (node as any).children[0] as any,
            stores,
            registry,
            context: { ...context, [as]: item },
            children,
          })
        }
      </For>
      // <>
      //   {itemsArray().map((item: any) =>
      //     renderChildren(node.children, { ...context, [as]: item }, stores, registry, children),
      //   )}
      // </>
    );
  }

  // Handle slots
  const slotElements = createMemo<Record<string, JSX.Element>>(() => {
    const out: Record<string, JSX.Element> = {};
    const slots = node.slots ?? {};
    for (const [slotKey, slotNode] of Object.entries(slots)) {
      // console.log('Rendering slot:', slotKey, slotNode);
      if (!slotNode) continue;
      if ((slotNode as any).type) {
        const SlotComponent = registry[(slotNode as any).type];
        if (!SlotComponent) throw new Error(`Schema slot "${slotKey}" has unknown type "${(slotNode as any).type}".`);
        out[slotKey] = (
          <SlotComponent {...resolveProps((slotNode as any).props, stores, context, createMemo)}>
            {renderChildren(() => (slotNode as any).children, context, stores, registry, children)}
          </SlotComponent>
        );
      } else {
        out[slotKey] = <div>{renderChildren(() => (slotNode as any).children, context, stores, registry)}</div>;
      }
    }
    return out;
  });

  // If no type is provided, render children in a JSX fragment
  if (!node.type) {
    return <div>{renderChildren(() => node.children, context, stores, registry, children)}</div>;
  }

  // Otherwise get the component from the registry and render it with its resolved props, slots, and children
  const Component = registry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);

  let renderedChildren: JSX.Element | undefined;

  const hasSchemaChildren = untrack(() => Array.isArray(node.children) && node.children.length > 0);
  const hasExplicitPropsChildren = untrack(
    () => !!(node.props && Object.prototype.hasOwnProperty.call(node.props, 'children')),
  );

  if (hasSchemaChildren) {
    renderedChildren = renderChildren(() => node.children, context, stores, registry, children) as JSX.Element;
  } else if (!hasExplicitPropsChildren) {
    // only use routed child when there are NO schema children
    renderedChildren = children;
  } else {
    // props.children exists -> render nothing here (component handles its own children)
    renderedChildren = undefined;
  }

  return (
    <Component {...resolveProps(node.props, stores, context, createMemo)} {...slotElements()}>
      {renderedChildren}
    </Component>
  );
}
