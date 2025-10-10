import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, ParentProps } from 'solid-js';

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
  function Layout(props: ParentProps) {
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

    // Render slots from schema
    const slotElements = SchemaRenderer({ node: schema.root, stores });

    // Select template
    const Template = componentRegistry[schema.root.type];

    // If slotElements is an object, spread as props; otherwise, pass as children
    return typeof slotElements === 'object' && !Array.isArray(slotElements) ? (
      <Template {...slotElements}>{props.children}</Template>
    ) : (
      <Template>
        {slotElements}
        {props.children}
      </Template>
    );
  }

  // Build route list from schema
  const routes =
    schema.routes?.map((route) => ({
      path: route.path,
      component: () => {
        const rendered = SchemaRenderer({ node: route, stores });
        if (rendered && typeof rendered === 'object' && !Array.isArray(rendered)) {
          // If it's a slot map, render all slot values in a fragment
          return <>{Object.values(rendered)}</>;
        }
        return rendered ?? <></>;
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
