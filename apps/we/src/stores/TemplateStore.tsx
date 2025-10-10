import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

import type { TemplateSchema } from '../types';
import { asVoid, clone } from '../utils';

const defaultSchema = {
  id: 'default',
  name: 'Default Template',
  description: 'A simple template with a sidebar, header, and page area.',
  root: {
    type: 'DefaultTemplate',
    slots: {
      sidebar: {
        type: 'Column',
        props: { bg: 'ui-50', p: '500', ay: 'between' },
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
                  route: '/',
                },
              },
              { type: 'CircleButton', props: { label: 'Search', icon: 'magnifying-glass', route: '/search' } },
              {
                type: '$forEach',
                props: { items: { $store: 'adamStore.mySpaces' }, as: 'space' },
                children: [
                  {
                    type: 'CircleButton',
                    props: {
                      name: { $expr: 'space.name' },
                      icon: 'users',
                      route: { $expr: '`/space/${space.uuid}`' },
                    },
                  },
                ],
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
                  onClick: { $action: 'openModal', args: ['create-space'] },
                },
              },
            ],
          },
        ],
      },
      header: {
        type: 'Row',
        props: { bg: 'ui-50', px: '500', ax: 'end' },
        children: [
          {
            type: 'Column',
            props: { bg: 'ui-50' },
            children: [
              { type: 'we-text', children: ['Header menu goes here...'] },
              {
                type: 'PopoverMenu',
                props: {
                  options: { $store: 'themeStore.themes' },
                  currentOption: { $store: 'themeStore.currentTheme' },
                  setOption: { $store: 'themeStore.setCurrentTheme' },
                },
              },
            ],
          },
        ],
      },
      pages: {
        type: 'Column',
        props: { bg: 'ui-100', p: '600' },
        children: [{ type: '$route' }],
      },
    },
  },
  routes: [
    { path: '*', type: 'PageNotFound' },
    { path: '/', type: 'HomePage' },
    {
      path: '/posts',
      type: 'Column',
      props: { bg: 'ui-300' },
      children: [
        {
          type: 'Row',
          props: { bg: 'ui-50' },
          children: [{ type: 'we-text', children: ['Post 1...'] }],
        },
        {
          type: 'Row',
          props: { bg: 'ui-50' },
          children: [{ type: 'we-text', children: ['Post 2...'] }],
        },
      ],
    },
  ],
};

const TEMPLATES = [defaultSchema];

const TEMPLATE_KEY = 'we.template';

export interface TemplateStore {
  // State
  templates: Accessor<TemplateSchema[]>;
  currentTemplate: Accessor<TemplateSchema>;
  currentSchema: Accessor<TemplateSchema>;
  // Actions
  setTemplates: (templates: TemplateSchema[]) => void;
  setCurrentTemplate: (id: string) => void;
  setCurrentSchema: (schema: TemplateSchema) => void;
}

const TemplateContext = createContext<TemplateStore>();

export function TemplateStoreProvider(props: ParentProps) {
  // Get the initial template from localStorage if available before creating signals
  const savedTemplateId = (typeof window !== 'undefined' && localStorage.getItem(TEMPLATE_KEY)) || TEMPLATES[0].id;

  const [templates, setTemplates] = createSignal<TemplateSchema[]>(clone(TEMPLATES));
  const [currentTemplate, setCurrentTemplateSignal] = createSignal<TemplateSchema>(
    clone(TEMPLATES.find((t) => t.id === savedTemplateId) ?? TEMPLATES[0]),
  );
  const [currentSchema, setCurrentSchema] = createSignal<TemplateSchema>(defaultSchema);

  const setCurrentTemplate = asVoid((id: string) => {
    const found = templates().find((t) => t.id === id);
    if (found) {
      setCurrentTemplateSignal(clone(found));
      if (typeof window !== 'undefined') localStorage.setItem(TEMPLATE_KEY, id);
    }
  });

  const store: TemplateStore = {
    // State
    templates,
    currentTemplate,
    currentSchema,
    // Actions
    setTemplates,
    setCurrentTemplate,
    setCurrentSchema,
  };

  return <TemplateContext.Provider value={store}>{props.children}</TemplateContext.Provider>;
}

export function useTemplateStore(): TemplateStore {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplateStore must be used within TemplateStoreProvider');
  return ctx;
}

export default TemplateStoreProvider;
