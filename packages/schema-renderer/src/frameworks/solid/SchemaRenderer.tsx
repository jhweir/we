import { createMemo, For, JSX } from 'solid-js';

import { resolveProp, resolveProps, resolveStoreProp } from '../../shared/propResolvers';
import type { ComponentRegistry, RendererOutput, RenderSchemaProps, SchemaNode } from './types';
import { resolveRenderedChildren } from './utils';

// Helper function to render child nodes
// export function renderChildren(
//   children: unknown[] | undefined,
//   context: Record<string, unknown>,
//   stores: Record<string, unknown>,
//   registry: ComponentRegistry,
//   routedChild?: JSX.Element,
// ): (RendererOutput | string)[] | undefined {
//   return children?.map((child, index): RendererOutput | string => {
//     // If the child is a string (i.e when passing text to <we-text>), return child directly
//     if (typeof child === 'string') return child;

//     // Otherwise render the child node, passing key if present
//     const schemaNode = child as SchemaNode;
//     const key = schemaNode.key ?? index;
//     console.log('key for child node:', key);
//     return (
//       <RenderSchema
//         node={schemaNode}
//         stores={stores}
//         registry={registry}
//         context={context}
//         children={routedChild}
//         key={key}
//       />
//     );
//   });
// }

// export function renderChildren(
//   children: unknown[] | undefined,
//   context: Record<string, unknown>,
//   stores: Record<string, unknown>,
//   registry: ComponentRegistry,
//   routedChild?: JSX.Element,
// ): RendererOutput {
//   if (!children) return undefined;
//   return (
//     <For each={children} fallback={null}>
//       {(child, index) => {
//         if (typeof child === 'string') return child;
//         const schemaNode = child as SchemaNode;
//         // const key = schemaNode.key ?? index();
//         // console.log('key for child node:', key);
//         return (
//           <RenderSchema
//             node={schemaNode}
//             stores={stores}
//             registry={registry}
//             context={context}
//             children={routedChild}
//             key={schemaNode.key ?? index()}
//           />
//         );
//       }}
//     </For>
//   );
// }

// export function renderChildren(
//   children: unknown[] | undefined,
//   context: Record<string, unknown>,
//   stores: Record<string, unknown>,
//   registry: ComponentRegistry,
//   routedChild?: JSX.Element,
// ): (RendererOutput | string)[] | undefined {
//   return children?.map((child): RendererOutput | string => {
//     // If the child is a string (i.e when passing text to <we-text>), return it directly
//     if (typeof child === 'string') return child;

//     // Otherwise render the child node
//     return RenderSchema({ node: child as SchemaNode, stores, registry, context, children: routedChild });
//   });
// }

export function renderChildren(
  children: unknown[] | undefined,
  context: Record<string, unknown>,
  stores: Record<string, unknown>,
  registry: ComponentRegistry,
  routedChild?: JSX.Element,
): RendererOutput {
  if (!children) return undefined;
  return (
    <For each={children} fallback={null}>
      {(child) => {
        // if (typeof child === 'string') return child;
        return RenderSchema({ node: child as SchemaNode, stores, registry, context, children: routedChild });
      }}
    </For>
  );
}

export function RenderSchema({ node, stores, registry, context = {}, children }: RenderSchemaProps): RendererOutput {
  const renderedNode = createMemo(() => {
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

      // console.log(`Rendering $forEach node: ${as}`, itemsArray);

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
              {renderChildren((slotNode as any).children, context, stores, registry, children)}
            </SlotComponent>
          );
        } else {
          out[slotKey] = <div>{renderChildren((slotNode as any).children, context, stores, registry)}</div>;
        }
      }
      return out;
    });

    // If no type is provided, render children in a JSX fragment
    if (!node.type) {
      return <div>{renderChildren(node.children, context, stores, registry, children)}</div>;
    }

    // Otherwise get the component from the registry and render it with its resolved props, slots, and children
    const Component = registry[node.type ?? ''];
    if (!Component) throw new Error(`Schema node has unknown type "${node.type}".`);
    return (
      <Component {...resolveProps(node.props, stores, context, createMemo)} {...slotElements()}>
        {resolveRenderedChildren(node, stores, registry, context, children)}
      </Component>
    );
  });

  return renderedNode();
}
