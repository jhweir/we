import type { JSX } from 'solid-js';

import { RenderSchema } from './SchemaRenderer';
import type { ComponentRegistry, RendererOutput, SchemaNode } from './types';

// Helper function to render child nodes
export function renderChildren(
  children: unknown[] | undefined,
  context: Record<string, unknown>,
  stores: Record<string, unknown>,
  registry: ComponentRegistry,
  routedChild?: JSX.Element,
): (RendererOutput | string)[] | undefined {
  return children?.map((child): RendererOutput | string => {
    // If the child is a string (i.e when passing text to <we-text>), return it directly
    if (typeof child === 'string') return child;

    // Otherwise render the child node
    return RenderSchema({ node: child as SchemaNode, stores, registry, context, children: routedChild });
  });
}

// Determines which children to render based on schema and props
export function resolveRenderedChildren(
  node: SchemaNode,
  stores: Record<string, unknown>,
  registry: ComponentRegistry,
  context: Record<string, unknown>,
  routedChild: JSX.Element | undefined,
): JSX.Element | undefined {
  // If schema children exist, render them
  const hasSchemaChildren = Array.isArray(node.children) && node.children.length > 0;
  if (hasSchemaChildren) return renderChildren(node.children, context, stores, registry, routedChild) as JSX.Element;

  // If no schema children and no explicit props.children, fallback to the routed child
  const hasExplicitPropsChildren = !!(node.props && Object.prototype.hasOwnProperty.call(node.props, 'children'));
  if (!hasExplicitPropsChildren) return routedChild;

  // If props.children exists, render nothing here (component handles its own children)
  return undefined;
}
