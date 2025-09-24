import { Router, useNavigate } from '@solidjs/router';
import { defaultTemplate } from '@we/templates/solid';
import { ParentProps } from 'solid-js';

import { useAdamStore, useModalStore, useSpaceStore, useThemeStore } from '@/stores';

// Template registry for local templates (can be replaced with dynamic import for npm later)
const templates = [defaultTemplate];

export default function TemplateProvider() {
  // Select template
  const templateId = 'default'; // theme.state.currentTemplate || 'default';
  const template = templates.find((t) => t.id === templateId) || templates[0];
  const { component: Template, getPropsFromApp, propSchema, routes } = template;

  function Layout(props: ParentProps) {
    // Gather all store props and utility functions
    const adamStore = useAdamStore();
    const spaceStore = useSpaceStore();
    const modalStore = useModalStore();
    const themeStore = useThemeStore();
    const navigate = useNavigate();
    const appProps = { stores: { adamStore, spaceStore, modalStore, themeStore }, navigate };

    // Get props required for template
    const templateProps = getPropsFromApp(appProps);

    // Validate template props against zod schema
    const parseResult = propSchema.safeParse(templateProps);
    if (!parseResult.success) {
      return <div>Template props validation failed: {parseResult.error.message}</div>;
    }

    return <Template {...parseResult.data}>{props.children}</Template>;
  }

  return <Router root={Layout}>{routes}</Router>;
}
