import type { TemplateSchema } from '@we/schema-renderer/shared';
import { validateSchema } from '@we/schema-renderer/shared';
import { updateSchema } from '@we/schema-renderer/solid';
import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { isValidTemplateId, TemplateId, templateRegistry } from '@/registries/templateRegistry';
import { testMutations } from '@/schemas/TestTemplate.schema';
import { deepClone } from '@/utils';

const TEMPLATE_KEY = 'we.template';

type TemplateOption = { id: string; name: string; icon: string };

export interface TemplateStoreBase {
  // State
  templates: Accessor<TemplateOption[]>;
  selectedTemplate: Accessor<TemplateOption>;
  currentTemplate: TemplateSchema;

  // Actions
  updateTemplate: (newTemplate: TemplateSchema) => void;
  switchTemplate: (newTemplate: TemplateOption) => void;
  removeTemplate: () => void;
}

export type TemplateStore = TemplateStoreBase & ReturnType<typeof testMutations>;

const TemplateContext = createContext<TemplateStore>();

function getTemplateOptions(): TemplateOption[] {
  return Object.entries(templateRegistry).map(([id, template]) => ({
    id,
    name: template.meta.name,
    icon: template.meta.icon,
  }));
}

function getInitialTemplateId(): TemplateId {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_KEY) : null;
  return isValidTemplateId(saved) ? saved : 'default';
}

export function TemplateStoreProvider(props: ParentProps) {
  const initialTemplateOptions = getTemplateOptions();
  const initialTemplateId = getInitialTemplateId();
  const initialSelectedTemplate = initialTemplateOptions.find((t) => t.id === initialTemplateId)!;
  const initialTemplate = deepClone(templateRegistry[initialTemplateId]);

  const [templates] = createSignal<TemplateOption[]>(initialTemplateOptions);
  const [selectedTemplate, setSelectedTemplate] = createSignal<TemplateOption>(initialSelectedTemplate);
  const [currentTemplate, setCurrentTemplate] = createStore<TemplateSchema>(initialTemplate);

  function updateTemplate(newTemplate: TemplateSchema) {
    const { valid, errors } = validateSchema(newTemplate);
    if (valid) updateSchema(currentTemplate, newTemplate, setCurrentTemplate);
    else console.error('Invalid template schema:', errors);
  }

  async function switchTemplate(newTemplate: TemplateOption) {
    if (isValidTemplateId(newTemplate.id)) {
      const clonedTemplate = deepClone(templateRegistry[newTemplate.id]);
      setSelectedTemplate(newTemplate);
      setCurrentTemplate({ type: '', children: [], slots: {}, routes: [] }); // Temp clear to avoid merge issues
      setCurrentTemplate(clonedTemplate);
      localStorage.setItem(TEMPLATE_KEY, newTemplate.id);
    } else {
      console.error(`TemplateStore: switchTemplate - Invalid templateId "${newTemplate.id}"`);
    }
  }

  function removeTemplate() {
    setCurrentTemplate({ type: '', children: [], slots: {} });
    console.log('Template removed', currentTemplate);
  }

  const store: TemplateStore = {
    // State
    templates,
    selectedTemplate,
    currentTemplate,

    // Setters
    updateTemplate,
    switchTemplate,

    removeTemplate,

    // Testing
    ...testMutations(currentTemplate, setCurrentTemplate),
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
