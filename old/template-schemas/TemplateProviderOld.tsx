import { Route, Router, useLocation, useNavigate } from '@solidjs/router';
import { PageNotFound } from '@we/pages/solid';
import type { DefaultTemplateProps, DynamicTemplateProps } from '@we/templates/solid';
import { createContext, createEffect, useContext } from 'solid-js';
import { ParentProps } from 'solid-js';

import { useAdamStore, useModalStore, useSpaceStore, useTemplateStore, useThemeStore } from '@/stores';

type TemplatePropsMap = { default: DefaultTemplateProps; dynamic: DynamicTemplateProps };
type TemplateId = keyof TemplatePropsMap;
type TemplateProps = TemplatePropsMap[TemplateId];

export default function TemplateProvider() {
  // Gather all store props and utilities
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const templateStore = useTemplateStore();
  // TODO: not needed if we store the navigate function in a signal in the app store (also avoids needing Layout component and context)
  const navigate = () => null; // Dummy function for validation, replaced in Layout when we have access to the router
  const appProps = { stores: { adamStore, spaceStore, modalStore, themeStore }, navigate };

  // Select template
  const { component: Template, getProps, getRoutes, propSchema } = templateStore.currentTemplate();
  // type TemplateProps = TemplatePropsMap[typeof template.id];
  // type TemplateId = keyof TemplatePropsMap;
  // type TemplateProps = TemplatePropsMap[TemplateId];

  // Parse and validate props
  console.log('templateStore.currentSchema()', templateStore.currentSchema());
  const templateProps = getProps(appProps, templateStore.currentSchema());
  const parseResult = propSchema.safeParse(templateProps);
  if (!parseResult.success) return <div>Template props validation failed: {parseResult.error.message}</div>;
  const validatedProps = parseResult.data;

  // Generate routes with validated props
  const routes = getRoutes(validatedProps, templateStore.currentSchema());

  // Create a context for the validated props
  const TemplatePropsContext = createContext<TemplateProps>();

  function Layout(props: ParentProps) {
    // Now in router context, we can react to route changes
    const location = useLocation();
    createEffect(() => {
      // Update spaceId in spaceStore if on a space page
      const [page, pageId] = location.pathname.split('/').filter(Boolean);
      if (page === 'space' && pageId) spaceStore.setSpaceId(pageId);
    });

    // Get validated props from context & add navigate function from router
    const contextProps = useContext(TemplatePropsContext);
    const finalProps = { ...contextProps, navigate: useNavigate() };

    return <Template {...(finalProps as TemplateProps)}>{props.children}</Template>;
  }

  return (
    <TemplatePropsContext.Provider value={validatedProps}>
      <Router root={Layout}>
        {routes.map((route) => (
          <Route path={route.path} component={route.component} />
        ))}
        {/* Fallback for unmatched routes if wildcard route not provided by template */}
        {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <PageNotFound />} />}
      </Router>
    </TemplatePropsContext.Provider>
  );
}
