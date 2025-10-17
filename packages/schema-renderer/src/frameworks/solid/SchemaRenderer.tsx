import { createMemo, JSX } from 'solid-js';

import { resolveProp, resolveProps, resolveStoreProp } from '../../shared/propResolvers';
import type { RendererOutput, RenderSchemaProps, SchemaNode } from './types';
import { renderChildren, resolveRenderedChildren } from './utils';

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
    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores, createMemo);
    const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
    const itemsArray = Array.isArray(items) ? items : [];
    const itemKey = String(node.props?.as ?? 'item');

    // Return the items with their rendered children
    return (
      <>
        {itemsArray.map((item) =>
          renderChildren(node.children, { ...context, [itemKey]: item }, stores, registry, children),
        )}
      </>
    );
  }

  // Handle slots
  const slotElements = createMemo<Record<string, JSX.Element>>(() => {
    const out: Record<string, JSX.Element> = {};
    const slots = node.slots ?? {};
    for (const [key, slotNode] of Object.entries(slots)) {
      console.log('Rendering slot:', key, slotNode);
      if (!slotNode) continue;
      if ((slotNode as any).type) {
        const SlotComponent = registry[(slotNode as any).type];
        if (!SlotComponent) throw new Error(`Schema slot "${key}" has unknown type "${(slotNode as any).type}".`);
        out[key] = (
          <SlotComponent {...resolveProps((slotNode as any).props, stores, context, createMemo)}>
            {renderChildren((slotNode as any).children, context, stores, registry, children)}
          </SlotComponent>
        );
      } else {
        out[key] = <>{renderChildren((slotNode as any).children, context, stores, registry)}</>;
      }
    }
    return out;
  });

  // If no type is provided, render children in a JSX fragment
  if (!node.type) return <>{renderChildren(node.children, context, stores, registry, children)}</>;

  // Otherwise get the component from the registry and render it with its resolved props, slots, and children
  const Component = registry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);
  return (
    <Component {...resolveProps(node.props, stores, context, createMemo)} {...slotElements()}>
      {resolveRenderedChildren(node, stores, registry, context, children)}
    </Component>
  );
  // });

  // return renderedNode();
}
