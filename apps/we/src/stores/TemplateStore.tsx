import type { TemplateSchema } from '@we/schema-renderer/solid';
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
  changeNestedSchemaProp: () => void;
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

  const templateSidebar = {
    type: 'Column',
    props: { bg: 'ui-0', p: '500', ay: 'between' },
    children: [
      {
        type: 'Column',
        props: { ax: 'center', gap: '500' },
        children: [
          {
            type: 'CircleButton',
            props: {
              label: 'Home',
              image: 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4',
              onClick: { $action: 'adamStore.navigate', args: ['/'] },
            },
          },
          {
            type: 'CircleButton',
            props: {
              label: 'Search',
              icon: 'magnifying-glass',
              onClick: { $action: 'adamStore.navigate', args: ['/search'] },
            },
          },
          {
            type: '$forEach',
            props: { items: { $store: 'adamStore.mySpaces' }, as: 'space' },
            children: [
              {
                type: 'CircleButton',
                props: {
                  label: { $expr: 'space.name' },
                  onClick: { $action: 'adamStore.navigate', args: [{ $expr: '`/space/${space.uuid}`' }] },
                },
              },
            ],
          },
          {
            type: 'CircleButton',
            props: {
              label: 'Change label...',
              icon: 'plus',
              onClick: { $action: 'templateStore.changeNestedSchemaProp' },
            },
          },
        ],
      },
      {
        type: 'Column',
        props: { ax: 'center', gap: '500' },
        children: [
          {
            type: 'CircleButton',
            props: {
              label: 'New Space',
              icon: 'plus',
              onClick: { $action: 'modalStore.openModal', args: ['create-space'] },
            },
          },
        ],
      },
    ],
  };

  const templateHeader = {
    type: 'Row',
    props: { p: '400', gap: '400', ax: 'end', ay: 'center' },
    children: [
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
    ],
  };

  const templateModals = {
    children: [
      {
        type: '$if',
        props: {
          condition: { $store: 'modalStore.createSpaceModalOpen' },
          then: {
            type: 'CreateSpaceModalWidget',
            props: {
              adamClient: { $store: 'adamStore.adamClient' },
              close: { $action: 'modalStore.closeModal', args: ['create-space'] },
              save: { $action: 'adamStore.addNewSpace' },
            },
          },
        },
      },
    ],
  };

  const emptyNode = {
    type: 'Column',
    children: [],
  };

  const newSlots = {
    sidebar: undefined, // templateSidebar,
    // header: undefined, // null, //emptyNode,
    header: templateHeader,
    modals: templateModals,
  };

  const newButton = {
    type: 'CircleButton',
    props: {
      label: 'Search',
      icon: 'magnifying-glass',
      onClick: { $action: 'adamStore.navigate', args: ['/search'] },
    },
  };

  const newSchema = deepClone(templateRegistry.default);
  delete newSchema.slots.sidebar.children[0].children[1]; // works
  // newSchema.slots.sidebar.children[0].children.push(newButton); // works

  // newSchema.slots.header = templateHeader;
  console.log('newSchema after delete:', newSchema);

  const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
  const isPrimitive = (v: any) => v === null || (typeof v !== 'object' && typeof v !== 'function');

  // apply a deep but pragmatic diff: issue path updates for primitives/objects, replace arrays/subtrees when needed,
  // and remove keys by returning a shallow-copied parent without the key (so Solid sees the change).
  function applySchemaPatch(newSchema: TemplateSchema) {
    const old = currentSchema as any;

    function diffObject(path: (string | number)[], a: any, b: any) {
      const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
      for (const k of keys) {
        const oldVal = a?.[k];
        const newVal = b?.[k];
        const keyPath = [...path, k];

        // removed
        if (newVal === undefined && oldVal !== undefined) {
          // set the nested path to undefined instead of deleting the key.
          // renderer treats falsy slotNode values as absent (it skips them),
          // and this avoids flaky delete-notifications from the store.
          (setCurrentSchema as any)(...keyPath, undefined);
          continue;
        }

        // added
        if (oldVal === undefined && newVal !== undefined) {
          (setCurrentSchema as any)(...keyPath, newVal);
          continue;
        }

        // both primitives -> compare
        if (isPrimitive(oldVal) || isPrimitive(newVal)) {
          if (oldVal !== newVal) (setCurrentSchema as any)(...keyPath, newVal);
          continue;
        }

        // arrays -> replace whole array when different (cheap fallback)
        if (Array.isArray(oldVal) || Array.isArray(newVal)) {
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) (setCurrentSchema as any)(...keyPath, newVal);
          continue;
        }

        // both objects -> recurse
        if (isObject(oldVal) && isObject(newVal)) {
          diffObject(keyPath, oldVal, newVal);
          continue;
        }

        // fallback: replace
        if (oldVal !== newVal) (setCurrentSchema as any)(...keyPath, newVal);
      }
    }

    // top-level keys to consider (extend if your schema has others)
    const topLevelKeys = new Set([...Object.keys(old || {}), ...Object.keys(newSchema || {})]);
    for (const k of topLevelKeys) {
      if (k === 'slots' || k === 'routes' || k === 'children' || k === 'props' || k === 'meta') {
        const oldVal = (old as any)[k];
        const newVal = (newSchema as any)[k];
        if (isObject(oldVal) && isObject(newVal)) {
          diffObject([k], oldVal, newVal);
        } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) (setCurrentSchema as any)(k, newVal);
        } else {
          if (oldVal !== newVal) (setCurrentSchema as any)(k, newVal);
        }
      } else {
        // for any other top-level keys just replace if different
        const oldVal = (old as any)[k];
        const newVal = (newSchema as any)[k];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) (setCurrentSchema as any)(k, newVal);
      }
    }
  }

  function changeNestedSchemaProp() {
    console.log('Changing nested schema prop...');
    // // works:
    // setCurrentSchema('slots', 'header', newSlots.header);
    // // doesn't work:
    // setCurrentSchema(newSchema);

    applySchemaPatch(newSchema);

    // setCurrentSchema('slots', (slots) => {
    //   const copy = { ...(slots as Record<string, any>) };
    //   delete copy.header;
    //   console.log('after delete slots keys:', Object.keys(copy));
    //   return copy;
    // });

    // // doesn't work:
    // setCurrentSchema((schema) => ({
    //   ...schema,
    //   slots: { ...schema.slots, header: { type: 'Column', children: [] } },
    // }));
    // doesnt't work:
    // setCurrentSchema('slots', (slots) => ({ ...slots, header: templateRegistry.default.slots.header }));

    // setCurrentSchema('slots', 'sidebar', 'children', 0, 'children', 1, 'props', 'icon', 'head-circuit');
    // setCurrentSchema(
    //   'routes',
    //   2, // third route: path '/space/:spaceId'
    //   'slots',
    //   'header',
    //   'children',
    //   1, // second child: the first we-button
    //   'props',
    //   'variant',
    //   'primary',
    // );

    // setCurrentSchema(templateRegistry.secondary);
    // console.log('new schema: ', currentSchema.meta);
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
    changeNestedSchemaProp,
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
