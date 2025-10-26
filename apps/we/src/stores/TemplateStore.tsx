import type { TemplateSchema } from '@we/schema-renderer/shared';
import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { isValidTemplateKey, TemplateKey, templateRegistry } from '@/registries/templateRegistry';
import { testMutations } from '@/schemas/TestTemplate.schema';
import { deepClone } from '@/utils';

const TEMPLATE_KEY = 'we.template';

type TemplateWithMeta = TemplateSchema & { id: string; name: string; icon: string };

export interface TemplateStoreBase {
  templates: Accessor<TemplateSchema[]>;
  currentTemplate: Accessor<TemplateSchema>;
  currentSchema: TemplateSchema;

  setTemplates: (templates: TemplateSchema[]) => void;
  setCurrentTemplate: (templateKey: TemplateKey) => void;
  setCurrentSchema: (schema: TemplateSchema) => void;
}

export type TemplateStore = TemplateStoreBase & ReturnType<typeof testMutations>;

const TemplateContext = createContext<TemplateStore>();

// Map template metadata into templates
function mapTemplate(key: TemplateKey, template: TemplateSchema): TemplateWithMeta {
  return { id: key, name: template.meta.name, icon: template.meta.icon, ...template };
}

// Get all templates from the registry with metadata
function getMappedTemplates(): TemplateWithMeta[] {
  return Object.entries(templateRegistry).map(([key, template]) => mapTemplate(key as TemplateKey, template));
}

// Get initial template key from localStorage if available otherwise fall back to the first key in the registry
function getInitialTemplateKey(): TemplateKey {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_KEY) : null;
  const fallback = Object.keys(templateRegistry)[0] as TemplateKey;
  return isValidTemplateKey(saved) ? saved : fallback;
}

export function TemplateStoreProvider(props: ParentProps) {
  const [templates, setTemplates] = createSignal<TemplateWithMeta[]>(getMappedTemplates());
  const [currentTemplateKey, setCurrentTemplateKey] = createSignal<TemplateKey>(getInitialTemplateKey());
  const [currentSchema, setCurrentSchema] = createStore<TemplateSchema>(
    deepClone(templateRegistry[getInitialTemplateKey()]),
  );

  // Derive the current template based on the currentTemplateKey
  const currentTemplate = () =>
    templates().find((t) => t.id === currentTemplateKey()) ?? mapTemplate('test', templateRegistry.test);

  // Update the current template and persist the choice in localStorage
  function setCurrentTemplate(templateKey: TemplateKey) {
    if (isValidTemplateKey(templateKey)) {
      setCurrentTemplateKey(templateKey);
      localStorage.setItem(TEMPLATE_KEY, templateKey);
    }
  }

  const store: TemplateStore = {
    // State
    templates,
    currentTemplate,
    currentSchema,

    // Setters
    setTemplates,
    setCurrentTemplate,
    setCurrentSchema,

    // Testing
    ...testMutations(currentSchema, setCurrentSchema),
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
