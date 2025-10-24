import type { TemplateSchema } from '@we/schema-renderer/solid';
import { updateSchemaNode } from '@we/schema-renderer/solid';
import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { isValidTemplateKey, TemplateKey, templateRegistry } from '../registries/templateRegistry';
import { deepClone } from '../utils';

const TEMPLATE_KEY = 'we.template';

type TemplateWithMeta = TemplateSchema & { id: string; name: string; icon: string };

export interface TemplateStore {
  // State
  templates: Accessor<TemplateSchema[]>;
  currentTemplate: Accessor<TemplateSchema>;
  currentSchema: TemplateSchema;

  // Setters
  setTemplates: (templates: TemplateSchema[]) => void;
  setCurrentTemplate: (templateKey: TemplateKey) => void;
  setCurrentSchema: (schema: TemplateSchema) => void;

  // Testing
  removeTemplateHeaderSlot: () => void;
  addTemplateHeaderSlot: () => void;
  changeTemplateHeaderProp: () => void;
  changeTemplateHeaderChildProp: () => void;
  editSpacePageHeaderButton: () => void;
  editPostsPageHeaderButton: () => void;
  addPostsPageHeaderButton: () => void;
  addSidebarButton: () => void;
  changeSidebarProp: () => void;
}

const TemplateContext = createContext<TemplateStore>();

// Map registry entries to include id, name, and icon
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
    templates().find((t) => t.id === currentTemplateKey()) ?? mapTemplate('default', templateRegistry.default);

  // Update the current template and persist the choice in localStorage
  function setCurrentTemplate(templateKey: TemplateKey) {
    if (isValidTemplateKey(templateKey)) {
      setCurrentTemplateKey(templateKey);
      localStorage.setItem(TEMPLATE_KEY, templateKey);
    }
  }

  // Schema update tests
  function removeTemplateHeaderSlot() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    delete newSchema.slots.header;
    // newSchema.slots.header = { children: [] };
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  // TODO: currently completely resets via deep clone
  function addTemplateHeaderSlot() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.slots.header = {
      type: 'Row',
      props: { p: '400', gap: '400', ax: 'end', ay: 'center' },
      children: [
        { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Header!'] },
        {
          type: 'PopoverMenu',
          props: {
            options: { $store: 'themeStore.themes' },
            currentOption: { $store: 'themeStore.currentTheme' },
            setOption: { $store: 'themeStore.setCurrentTheme' },
          },
        },
        {
          type: 'PopoverMenu',
          props: {
            options: {
              $map: {
                items: { $store: 'templateStore.templates' },
                select: { id: '$item.id', name: '$item.name', icon: '$item.icon' },
              },
            },
            currentOption: {
              $pick: {
                from: { $store: 'templateStore.currentTemplate' },
                props: ['name', 'icon'],
              },
            },
            setOption: { $store: 'templateStore.setCurrentTemplate' },
          },
        },
        { type: 'RerenderLog', props: { location: 'Template Header' } },
      ],
    }; // templateRegistry.default.slots?.header; // deepClone(templateRegistry.default.slots?.header);
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function changeTemplateHeaderProp() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.slots.header.props.bg = 'ui-900';
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function changeTemplateHeaderChildProp() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.slots.header.children[0].props.color = 'ui-900';
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function changeSidebarProp() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.slots.sidebar.props.bg = 'ui-900';
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function editSpacePageHeaderButton() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.routes[2].slots.header.children[1].props.variant = 'primary';
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function editPostsPageHeaderButton() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.routes[2].routes[2].children[0].children[2].props.variant = 'primary';
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function addPostsPageHeaderButton() {
    const newSchema = deepClone(currentSchema);
    const newButton = { type: 'we-button', props: { variant: 'subtle', children: ['New button'] } };
    // @ts-expect-error ts-ignore
    newSchema.routes[2].routes[2].children[0].children.push(newButton);
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
  }

  function addSidebarButton() {
    const newSchema = deepClone(currentSchema);
    const newButton = { type: 'we-button', props: { variant: 'subtle', children: ['New button'] } };
    // @ts-expect-error ts-ignore
    newSchema.slots.sidebar.children[1].children.push(newButton);
    updateSchemaNode(currentSchema, newSchema, setCurrentSchema);
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
    removeTemplateHeaderSlot,
    addTemplateHeaderSlot,
    changeTemplateHeaderProp,
    changeTemplateHeaderChildProp,
    editSpacePageHeaderButton,
    editPostsPageHeaderButton,
    addPostsPageHeaderButton,
    addSidebarButton,
    changeSidebarProp,
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
