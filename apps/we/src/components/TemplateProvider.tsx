import { Route, Router, useNavigate } from '@solidjs/router';
import { PageNotFound } from '@we/pages/solid';
import type { DefaultTemplateProps } from '@we/templates/solid';
import { defaultTemplate } from '@we/templates/solid';
import { createContext, useContext } from 'solid-js';
import { ParentProps } from 'solid-js';

import { useAdamStore, useModalStore, useSpaceStore, useThemeStore } from '@/stores';

// List of available templates and their prop types
// TODO: Enable templates from npm packages or other source
const templates = [defaultTemplate];
type TemplatePropsMap = {
  default: DefaultTemplateProps;
};

export default function TemplateProvider() {
  // Select template
  const templateId = 'default';
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const { component: Template, getProps, getRoutes, propSchema } = template;
  type TemplateProps = TemplatePropsMap[typeof templateId];

  // Gather all store props and utilities
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const navigate = () => null; // Dummy function for validation, replaced in Layout when we have access to the router
  const appProps = { stores: { adamStore, spaceStore, modalStore, themeStore }, navigate };

  // Parse and validate props
  const templateProps = getProps(appProps);
  const parseResult = propSchema.safeParse(templateProps);
  if (!parseResult.success) return <div>Template props validation failed: {parseResult.error.message}</div>;
  const validatedProps = parseResult.data;

  // Generate routes with validated props
  const routes = getRoutes(validatedProps);

  // Create a context for the validated props
  const TemplatePropsContext = createContext<TemplateProps>();

  function Layout(props: ParentProps) {
    // Now in router context, get real navigate
    const navigate = useNavigate();
    // Get validated props from context
    const contextProps = useContext(TemplatePropsContext);
    // Overwrite navigate fucntion with real one
    const finalProps = { ...contextProps, navigate };

    return <Template {...(finalProps as TemplateProps)}>{props.children}</Template>;
  }

  return (
    <TemplatePropsContext.Provider value={validatedProps}>
      <Router root={Layout}>
        {routes.map((route) => (
          <Route path={route.path} component={route.component} />
        ))}
        {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <PageNotFound />} />}
      </Router>
    </TemplatePropsContext.Provider>
  );
}
