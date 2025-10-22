import { createMemo, For, JSX, Show } from 'solid-js';

import { resolveProp, resolveProps, resolveStoreProp } from '../../shared/propResolvers';
import type { RendererOutput, RenderSchemaProps, SchemaNode } from './types';

export function RenderSchema({ node, stores, registry, context = {}, children }: RenderSchemaProps): RendererOutput {
  if (!node) return null;

  function renderNode(node?: SchemaNode, nodeContext?: Record<string, unknown>) {
    return (
      <RenderSchema
        node={node ?? null}
        stores={stores}
        registry={registry}
        context={nodeContext ?? context}
        children={children}
      />
    );
  }

  function renderChildren(nodes: (SchemaNode | string)[] | undefined): RendererOutput {
    if (!nodes) return undefined;
    return (
      <For each={nodes ?? []} fallback={null}>
        {(child) => {
          // If the child is a string (i.e when passing text to <we-text>), return it directly
          if (typeof child === 'string') return child;
          // Otherwise render the child node
          return renderNode(child as SchemaNode);
        }}
      </For>
    );
  }

  // If no type is provided, render children in a JSX fragment
  if (!node.type) return <>{renderChildren(node.children)}</>;

  // Render routed children at $routes token
  if (node.type === '$routes') return children ?? null;

  // Handle conditional rendering
  if (node.type === '$if') {
    const condition = resolveProp(node.props?.condition, stores, context, createMemo);
    const conditionMet = createMemo(() => (typeof condition === 'function' ? condition() : condition));

    return (
      <Show when={conditionMet()} fallback={renderNode(node.props?.else as SchemaNode | undefined)}>
        {renderNode(node.props?.then as SchemaNode | undefined)}
      </Show>
    );
  }

  // Handle for-each loops
  if (node.type === '$forEach') {
    // Get the template node used to render each item
    const childTemplate = node.children?.[0] as SchemaNode | undefined;

    // Resolve the items used for iteration
    const resolvedItems = resolveStoreProp(node.props?.items, stores, createMemo);
    const itemsArray = createMemo(() => {
      const items = typeof resolvedItems === 'function' ? resolvedItems() : resolvedItems;
      return Array.isArray(items) ? items : [];
    });

    // Return a list of the rendered items
    return (
      <For each={itemsArray()}>
        {(item) => renderNode(childTemplate, { ...context, [String(node.props?.as ?? 'item')]: item })}
      </For>
    );
  }

  // Build slots if present
  const slotElements = createMemo<Record<string, JSX.Element>>(() => {
    const elements: Record<string, JSX.Element> = {};
    const slots = node.slots ?? {};
    for (const [slotKey, slotNode] of Object.entries(slots)) elements[slotKey] = renderNode(slotNode as SchemaNode);
    return elements;
  });

  // Get the component from the registry
  const Component = registry[node.type ?? ''];
  if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);

  // Determine which children to render
  let renderedChildren: JSX.Element | undefined;
  const hasSchemaChildren = Array.isArray(node.children) && node.children.length > 0;
  const hasExplicitPropsChildren = !!(node.props && Object.prototype.hasOwnProperty.call(node.props, 'children'));
  if (hasSchemaChildren) renderedChildren = renderChildren(node.children);
  else if (hasExplicitPropsChildren) renderedChildren = undefined;
  else renderedChildren = children;

  // Return the rendered component
  return (
    <Component {...resolveProps(node.props, stores, context, createMemo)} {...slotElements()}>
      {renderedChildren}
    </Component>
  );
}
