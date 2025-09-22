import { useNavigate } from '@solidjs/router';
import { DefaultTemplate, defaultTemplatePropsSchema, getPropsFromApp } from '@we/templates/solid';
import { ParentProps } from 'solid-js';

import { useAdamStore } from '@/stores/AdamStore';
import { useModalStore } from '@/stores/ModalStore';
import { useThemeStore } from '@/stores/ThemeStore';

// 1. Template registry for local templates (can be replaced with dynamic import for npm later)
const templates = [
  {
    id: 'default',
    component: DefaultTemplate,
    schema: defaultTemplatePropsSchema,
  },
  // Add more templates here as needed
];

// 2. Helper to select template by id
function getTemplateById(id: string) {
  return templates.find((t) => t.id === id) || templates[0];
}

export default function TemplateProvider(props: ParentProps) {
  // Gather stores/context
  const adam = useAdamStore();
  const theme = useThemeStore();
  const modal = useModalStore();
  const navigate = useNavigate();

  // Select template (could be dynamic, e.g., from theme or user settings)
  const templateId = 'default'; // theme.state.currentTemplate || 'default';
  const { component: TemplateComponent, schema } = getTemplateById(templateId);

  // Compose all available sources
  const appProps = { stores: { adam, theme, modal }, navigate };

  // Dynamically map props based on schema keys
  const templateProps = getPropsFromApp(appProps);

  // Validate props (optional, but recommended)
  const parseResult = schema.safeParse(templateProps);
  if (!parseResult.success) {
    return <div>Template props validation failed: {parseResult.error.message}</div>;
  }

  // Render template with validated props
  return <TemplateComponent {...parseResult.data}>{props.children}</TemplateComponent>;
}
