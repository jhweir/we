import { Route, Router, useNavigate } from '@solidjs/router';
import { PageNotFound } from '@we/pages/solid';
import { defaultTemplate } from '@we/templates/solid';
import { createContext, useContext } from 'solid-js';
import { ParentProps } from 'solid-js';
import { z } from 'zod';

import { useAdamStore, useModalStore, useSpaceStore, useThemeStore } from '@/stores';

const templates = [defaultTemplate];

// Context for the validated props
const TemplatePropsContext = createContext<z.infer<typeof defaultTemplate.propSchema>>();

export default function TemplateProvider() {
  // Select template
  const templateId = 'default';
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const { component: Template, getPropsFromApp, getRoutes, propSchema } = template;

  // Gather all store props and utilities
  const adamStore = useAdamStore();
  const spaceStore = useSpaceStore();
  const modalStore = useModalStore();
  const themeStore = useThemeStore();
  const navigate = () => null; // Dummy fucntion for validation, replaced in Layout when we have acces to the router
  const appProps = { stores: { adamStore, spaceStore, modalStore, themeStore }, navigate };

  // Parse and validate props
  const templateProps = getPropsFromApp(appProps);
  const parseResult = propSchema.safeParse(templateProps);
  if (!parseResult.success) return <div>Template props validation failed: {parseResult.error.message}</div>;
  const validatedProps = parseResult.data;

  // Generate routes with validated props
  const routes = getRoutes(validatedProps);

  function Layout(props: ParentProps) {
    // Now in router context, get real navigate
    const navigate = useNavigate();
    // Get validated props from context
    const contextProps = useContext(TemplatePropsContext);
    // Overwrite navigate fucntion with real one
    const finalProps = { ...contextProps, navigate };

    return <Template {...(finalProps as z.infer<typeof propSchema>)}>{props.children}</Template>;
  }

  return (
    <TemplatePropsContext.Provider value={validatedProps}>
      <Router>
        <Route path="/*" component={Layout}>
          {routes.map((route) => (
            <Route path={route.path} component={route.component} />
          ))}
          {!routes.find((route) => route.path === '*') && <Route path="*" component={() => <PageNotFound />} />}
        </Route>
      </Router>
    </TemplatePropsContext.Provider>
  );
}
