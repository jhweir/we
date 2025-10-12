import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, type JSX, ParentProps } from 'solid-js';

import { componentRegistry } from '@/renderers/componentRegistry';
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

  // Build the layout component
  function Layout(props: ParentProps): JSX.Element {
    // Get navigate function and location now we're inside the router context
    const navigate = useNavigate();
    const location = useLocation();

    // Store the navigate function in the Adam store
    createEffect(() => {
      adamStore.setNavigateFunction(() => navigate);
    });

    // React to route changes
    createEffect(() => {
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) spaceStore.setSpaceId(pageId);
    });

    // Get the template from the component registry
    const Template = componentRegistry[schema.root.type ?? ''];
    if (!Template) throw new Error(`Schema template has unknown type: "${schema.root.type}"`);

    // Return the template with its rendered slots
    const slots = SchemaRenderer({ node: schema.root, stores }) as Record<string, JSX.Element>;
    return <Template {...slots}>{props.children}</Template>;
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
