import { Router, useLocation, useNavigate } from '@solidjs/router';
import { createEffect, createMemo, type JSX } from 'solid-js';

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
  function Layout(): JSX.Element {
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

    // Render template slots
    const slotElements = SchemaRenderer({ node: schema.root, stores });

    // Build the pages slot by rendering the matched route schema inside the schema-defined wrapper
    const pagesSlotSchema =
      schema.root.slots && (schema.root.slots as Record<string, unknown>).pages
        ? (schema.root.slots.pages as { type: string; props?: Record<string, unknown> })
        : undefined;
    const PagesWrapper = pagesSlotSchema ? componentRegistry[pagesSlotSchema.type] : undefined;

    // Basic route matching: exact path match, else '*' fallback (reactive)
    const currentPath = createMemo(() => location.pathname || '/');
    const matched = createMemo(() => {
      const routes = schema.routes ?? [];
      const m = routes.find((r) => r.path === currentPath());
      return m ?? routes.find((r) => r.path === '*') ?? null;
    });
    const pageContent = createMemo<JSX.Element | null>(() => {
      const m = matched();
      return m ? (SchemaRenderer({ node: m, stores }) as JSX.Element) : null;
    });

    const pagesEl = () => {
      const content = pageContent();
      if (PagesWrapper && pagesSlotSchema) return <PagesWrapper {...pagesSlotSchema.props}>{content}</PagesWrapper>;
      return content ?? <></>;
    };

    const Template = componentRegistry[schema.root.type];
    if (typeof slotElements === 'object' && !Array.isArray(slotElements))
      return <Template {...slotElements} pages={pagesEl()} />;
    return <Template>{pagesEl()}</Template>;
  }

  return <Router root={Layout} />;
}
