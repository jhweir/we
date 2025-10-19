import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import type { RouteSchema, TemplateSchema } from '@we/schema-renderer/solid';
import { RenderSchema } from '@we/schema-renderer/solid';
import type { JSX, ParentProps } from 'solid-js';
import { createEffect, createMemo } from 'solid-js';

import { componentRegistry as registry } from '@/registries/componentRegistry';
import { useAdamStore, useModalStore, useSpaceStore, useTemplateStore, useThemeStore } from '@/stores';
import type { Stores } from '@/types';

type FlattenedRoute = { path: string; component: () => JSX.Element };
type ParentStackItem = { node: RouteSchema; fullPath: string; baseDepth: number };

// Creates the root layout component for the router
function createLayout(stores: Stores, schema: TemplateSchema) {
  return function Layout(props: ParentProps): JSX.Element {
    // Access the router hooks now we're inside the router context
    const navigate = useNavigate();
    const location = useLocation();

    // Store the navigate function in the Adam store so schema actions can use it
    createEffect(() => stores.adamStore.setNavigateFunction(() => navigate));

    // React to route changes and update relevant stores
    createEffect(() => {
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) stores.spaceStore.setSpaceId(pageId);
    });

    // Return the rendered schema with the routes as children
    return RenderSchema({ node: schema, stores, registry, children: props.children }) as JSX.Element;
  };
}

// Recursively flattens nested route schemas into a single array of routes with full paths
// function flattenRoutes(
//   stores: Stores,
//   routes: RouteSchema[],
//   parentPath = '',
//   parentStack: ParentStackItem[] = [],
// ): FlattenedRoute[] {
//   return routes.flatMap((route) => {
//     // Get the full route path and base depth (used for relative navigation)
//     const fullPath = route.path === '/' && parentPath ? parentPath : parentPath + route.path;
//     const baseDepth = fullPath.split('/').filter(Boolean).length;
//     const currentMeta = { node: route, fullPath, baseDepth };

//     // Build the route component
//     const buildComponent = () => {
//       // Render the leaf with its own context
//       const leaf = RenderSchema({ node: route, stores, registry, context: { $nav: { baseDepth } } });

//       // Wrap with parents, each rendered with its own baseDepth context
//       return parentStack.reduceRight((child, meta) => {
//         const context = { $nav: { baseDepth: meta.baseDepth } };
//         return RenderSchema({ node: meta.node, stores, registry, context, children: child as JSX.Element });
//       }, leaf) as JSX.Element;
//     };

//     // If the route has children, recursively flatten them too, otherwise just return the route
//     return route.routes?.length
//       ? flattenRoutes(stores, route.routes, fullPath, [...parentStack, currentMeta])
//       : [{ path: fullPath, component: buildComponent }];
//   });
// }

function flattenRoutes(
  stores: Stores,
  routes: RouteSchema[],
  parentPath = '',
  parentStack: ParentStackItem[] = [],
): FlattenedRoute[] {
  return routes.flatMap((route) => {
    // Get the full route path and base depth (used for relative navigation)
    const fullPath = route.path === '/' && parentPath ? parentPath : parentPath + route.path;
    const baseDepth = fullPath.split('/').filter(Boolean).length;
    const currentMeta = { node: route, fullPath, baseDepth };

    // Memoize context objects for stability
    const leafContext = createMemo(() => ({ $nav: { baseDepth } }), [baseDepth]);

    // Build the route component
    const buildComponent = () => {
      // Render the leaf with its own context
      const leaf = RenderSchema({ node: route, stores, registry, context: leafContext() });

      // Wrap with parents, each rendered with its own baseDepth context
      return parentStack.reduceRight((child, meta) => {
        const parentContext = createMemo(() => ({ $nav: { baseDepth: meta.baseDepth } }), [meta.baseDepth]);
        return RenderSchema({
          node: meta.node,
          stores,
          registry,
          context: parentContext(),
          children: child as JSX.Element,
        });
      }, leaf) as JSX.Element;
    };

    // If the route has children, recursively flatten them too, otherwise just return the route
    return route.routes?.length
      ? flattenRoutes(stores, route.routes, fullPath, [...parentStack, currentMeta])
      : [{ path: fullPath, component: buildComponent }];
  });
}

export default function TemplateProvider() {
  // Gather up the stores
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const templateStore = useTemplateStore();
  // const stores = { adamStore, spaceStore, modalStore, themeStore, templateStore };

  const stores = createMemo(() => ({
    adamStore,
    spaceStore,
    modalStore,
    themeStore,
    templateStore,
  }));

  // Get the current template schema
  const templateSchema = templateStore.currentSchema;

  // Build the routes
  const routes = flattenRoutes(stores(), templateSchema.routes ?? []);

  // Return the router with the root layout and routes
  return (
    <Router root={createLayout(stores(), templateSchema)}>
      {routes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
      {/* Fallback incase the schema doesn't define a wildcard route */}
      {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <span>Page Not Found</span>} />}
    </Router>
  );
}
