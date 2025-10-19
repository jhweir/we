import type { TemplateSchema } from '@we/schema-renderer/solid';
import { Accessor, batch, createContext, createSignal, ParentProps, useContext } from 'solid-js';
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
  editSpacePageHeaderButton: () => void;
  editPostsPageHeaderButton: () => void;
  addPostsPageHeaderButton: () => void;
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
  const [currentSchema, setCurrentSchema] = createStore<TemplateSchema>(templateRegistry[getInitialTemplateKey()]);

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

  function updateSchema(oldSchema: TemplateSchema, newSchema: TemplateSchema) {
    const mutations: Array<{ path: (string | number)[]; value: any }> = [];

    function isObject(v: any) {
      return v && typeof v === 'object' && !Array.isArray(v);
    }
    function isPrimitive(v: any) {
      return v === null || (typeof v !== 'object' && typeof v !== 'function');
    }

    function diff(path: (string | number)[], a: any, b: any) {
      // If both are arrays, recurse with numeric indices
      if (Array.isArray(a) && Array.isArray(b)) {
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
          const oldItem = a[i];
          const newItem = b[i];
          const itemPath = [...path, i];

          if (oldItem === undefined && newItem !== undefined) {
            mutations.push({ path: itemPath, value: newItem });
            continue;
          }
          if (newItem === undefined && oldItem !== undefined) {
            mutations.push({ path: itemPath, value: undefined });
            continue;
          }
          if (isPrimitive(oldItem) || isPrimitive(newItem)) {
            if (oldItem !== newItem) mutations.push({ path: itemPath, value: newItem });
            continue;
          }
          if (Array.isArray(oldItem) && Array.isArray(newItem)) {
            diff(itemPath, oldItem, newItem);
            continue;
          }
          if (isObject(oldItem) && isObject(newItem)) {
            diff(itemPath, oldItem, newItem);
            continue;
          }
          // fallback: replace
          if (oldItem !== newItem) mutations.push({ path: itemPath, value: newItem });
        }
        return;
      }

      // If both are objects, recurse with string keys
      if (isObject(a) && isObject(b)) {
        const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
        for (const k of keys) {
          const oldVal = a?.[k];
          const newVal = b?.[k];
          const keyPath = [...path, k];

          // removed
          if (newVal === undefined && oldVal !== undefined) {
            mutations.push({ path: keyPath, value: undefined });
            continue;
          }

          // added
          if (oldVal === undefined && newVal !== undefined) {
            mutations.push({ path: keyPath, value: newVal });
            continue;
          }

          // both primitives -> compare
          if (isPrimitive(oldVal) || isPrimitive(newVal)) {
            if (oldVal !== newVal) mutations.push({ path: keyPath, value: newVal });
            continue;
          }

          // arrays
          if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            diff(keyPath, oldVal, newVal);
            continue;
          }

          // objects
          if (isObject(oldVal) && isObject(newVal)) {
            diff(keyPath, oldVal, newVal);
            continue;
          }

          // fallback: replace
          if (oldVal !== newVal) mutations.push({ path: keyPath, value: newVal });
        }
        return;
      }

      // arrays replaced with objects or vice versa
      if ((Array.isArray(a) && isObject(b)) || (isObject(a) && Array.isArray(b))) {
        mutations.push({ path, value: b });
        return;
      }

      // fallback: replace
      if (a !== b) mutations.push({ path, value: b });
    }

    // Top-level keys: use string keys
    const topLevelKeys = new Set([...Object.keys(oldSchema || {}), ...Object.keys(newSchema || {})]);
    for (const k of topLevelKeys) {
      const oldVal = oldSchema[k];
      const newVal = newSchema[k];
      diff([k], oldVal, newVal);
    }

    console.log('mutations to apply:', mutations);

    batch(() => {
      for (const { path, value } of mutations) {
        (setCurrentSchema as any)(...path, value);
      }
    });
  }

  // Schema update tests
  function removeTemplateHeaderSlot() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    delete newSchema.slots.header;
    updateSchema(currentSchema, newSchema);
  }

  function editSpacePageHeaderButton() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.routes[2].slots.header.children[1].props.variant = 'primary';
    updateSchema(currentSchema, newSchema);
  }

  function editPostsPageHeaderButton() {
    const newSchema = deepClone(currentSchema);
    // @ts-expect-error ts-ignore
    newSchema.routes[2].routes[2].children[0].children[1].props.variant = 'primary';
    updateSchema(currentSchema, newSchema);
  }

  function addPostsPageHeaderButton() {
    // const newSchema = deepClone(currentSchema);
    // console.log('newSchema before addPostsPageHeaderButton:', newSchema);
    // const newButton = {
    //   type: 'we-button',
    //   props: {
    //     variant: 'subtle',
    //     children: ['New button'],
    //   },
    // };
    // // @ts-expect-error ts-ignore
    // newSchema.routes[2].routes[2].children[0].children.push(newButton);
    // updateSchema(currentSchema, newSchema);

    console.log(
      'before',
      currentSchema.routes[2].routes[2].children[0].children.map((child) => child),
    );

    setCurrentSchema('routes', 2, 'routes', 2, 'children', 0, 'children', (children) => [
      ...children,
      // {
      //   type: 'we-button',
      //   key: 'new-btn-' + Date.now(), // or use uuid()
      //   props: {
      //     variant: 'subtle',
      //     children: ['New button'],
      //   },
      // },
      { type: 'RerenderLog', props: { location: 'New button added' } },
    ]);

    console.log(
      'after',
      currentSchema.routes[2].routes[2].children[0].children.map((child) => child),
    );

    // setCurrentSchema('routes', 2, 'routes', 2, 'children', 0, 'children', (children) =>
    //   children.concat({
    //     type: 'we-button',
    //     key: 'new-btn-' + Date.now(),
    //     props: {
    //       variant: 'subtle',
    //       children: ['New button'],
    //     },
    //   }),
    // );
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
    editSpacePageHeaderButton,
    editPostsPageHeaderButton,
    addPostsPageHeaderButton,
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
