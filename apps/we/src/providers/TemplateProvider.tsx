import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, type JSX, ParentProps } from 'solid-js';

import { SchemaRenderer } from '@/renderers/SchemaRenderer';
import { useAdamStore, useModalStore, useSpaceStore, useTemplateStore, useThemeStore } from '@/stores';

export default function TemplateProvider() {
  // Gather stores
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const templateStore = useTemplateStore();
  const stores = { adamStore, spaceStore, modalStore, themeStore };

  // Get current schema
  const schema = templateStore.currentSchema();

  // Build the root layout component for the router
  function Layout(props: ParentProps): JSX.Element {
    // Store the navigate function in the Adam store so schema actions can use it
    const navigate = useNavigate();
    createEffect(() => {
      adamStore.setNavigateFunction(() => navigate);
    });

    // React to route changes
    const location = useLocation();
    createEffect(() => {
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) spaceStore.setSpaceId(pageId);
    });

    // Return the rendered schema with the routes as children
    return SchemaRenderer({ node: schema.root, stores, children: props.children }) as JSX.Element;
  }

  // Build the routes
  const routes = schema.routes.map((route) => ({
    path: route.path,
    component: () => SchemaRenderer({ node: route, stores }) as JSX.Element,
  }));

  return (
    <Router root={Layout}>
      {routes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
      {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <span>Page Not Found</span>} />}
    </Router>
  );
}
