import type { TemplateSchema } from '@we/schema-renderer/solid';
import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

import { isValidTemplateKey, TemplateKey, templateRegistry } from '../registries/templateRegistry';

const TEMPLATE_KEY = 'we.template';

export interface TemplateStore {
  // State
  templates: Accessor<TemplateSchema[]>;
  currentTemplate: Accessor<TemplateSchema>;

  // Setters
  setTemplates: (templates: TemplateSchema[]) => void;
  setCurrentTemplate: (templateKey: TemplateKey) => void;
}

const TemplateContext = createContext<TemplateStore>();

export function TemplateStoreProvider(props: ParentProps) {
  // Get saved template key from localStorage if available
  const savedTemplateKey = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_KEY) : null;
  const initialTemplateKey: TemplateKey = isValidTemplateKey(savedTemplateKey) ? savedTemplateKey : 'default';

  const [templates, setTemplates] = createSignal<TemplateSchema[]>(Object.values(templateRegistry));
  const [currentTemplateKey, setCurrentTemplateKey] = createSignal<TemplateKey>(initialTemplateKey);

  const currentTemplate: Accessor<TemplateSchema> = () => templateRegistry[currentTemplateKey()];

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

    // Setters
    setTemplates,
    setCurrentTemplate,
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
