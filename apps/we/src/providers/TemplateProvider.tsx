import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, type JSX, ParentProps } from 'solid-js';

import { SchemaRenderer } from '@/renderers/SchemaRenderer';
import { useAdamStore, useModalStore, useSpaceStore, useTemplateStore, useThemeStore } from '@/stores';
import type { FlattenedRoute, RouteSchema, Stores, TemplateSchema } from '@/types';

// Creates the root layout component for the router
function createLayout(stores: Stores, schema: TemplateSchema) {
  return function Layout(props: ParentProps): JSX.Element {
    // Access the router hooks now we're inside the router context
    const navigate = useNavigate();
    const location = useLocation();

    // Store the navigate function in the Adam store so schema actions can use it
    createEffect(() => {
      stores.adamStore.setNavigateFunction(() => navigate);
    });

    // React to route changes and update relevant stores
    createEffect(() => {
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) stores.spaceStore.setSpaceId(pageId);
    });

    // Return the rendered schema with the routes as children
    return SchemaRenderer({ node: schema, stores, children: props.children }) as JSX.Element;
  };
}

// Flattens nested route schemas into a list of paths and components
function flattenRoutes(
  stores: Stores,
  routes: RouteSchema[],
  parentPath = '',
  parentRoute: RouteSchema | null = null,
): FlattenedRoute[] {
  return routes.flatMap((route) => {
    const fullPath = parentPath + route.path;

    // If the route has children, recurse, otherwise return the route with its component
    return route.routes?.length
      ? flattenRoutes(stores, route.routes, fullPath, route)
      : [
          {
            path: fullPath,
            component: () => {
              // Render the route, wrapping in parent if present
              const child = SchemaRenderer({ node: route, stores }) as JSX.Element;
              return parentRoute
                ? (SchemaRenderer({ node: parentRoute, stores, children: child }) as JSX.Element)
                : child;
            },
          },
        ];
  });
}

export default function TemplateProvider() {
  // Gather up the stores
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const templateStore = useTemplateStore();
  const stores = { adamStore, spaceStore, modalStore, themeStore };

  // Get the current schema
  const schema = templateStore.currentSchema();

  // Build the routes
  const routes = flattenRoutes(stores, schema.routes ?? []);

  // Return the router with the layout and routes
  return (
    <Router root={createLayout(stores, schema)}>
      {routes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
      {/* Fallback incase the schema doesn't define a wildcard route */}
      {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <span>Page Not Found</span>} />}
    </Router>
  );
}
