import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, createMemo, type JSX, ParentProps } from 'solid-js';

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

  // Layout component for router context
  function Layout(props: ParentProps): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();

    // Expose navigation to stores
    createEffect(() => {
      adamStore.setNavigateFunction(() => navigate);
    });

    // Listen to route changes
    createEffect(() => {
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) spaceStore.setSpaceId(pageId);
    });

    // Return template with slots
    const Template = componentRegistry[schema.root.type];
    const slots = createMemo(() => SchemaRenderer({ node: schema.root, stores }) as Record<string, JSX.Element>);
    return <Template {...slots()}>{props.children}</Template>;
  }

  // Build routes from schema
  const routes =
    (schema.routes ?? []).map((route) => ({
      path: route.path,
      component: () => {
        const el = SchemaRenderer({ node: route, stores }) as JSX.Element | null;
        return el ?? <></>;
      },
    })) || [];

  return (
    <Router root={Layout}>
      {routes.map((route) => (
        <Route path={route.path} component={route.component} />
      ))}
      {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <span>Page Not Found</span>} />}
    </Router>
  );
}
