import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

import type { TemplateSchema } from '../types';
import { asVoid, clone } from '../utils';

const defaultSchema = {
  id: 'default',
  name: 'Default Template',
  description: 'A simple template with a sidebar, header, and page area.',
  type: 'DefaultTemplate',
  slots: {
    sidebar: {
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
    },
    header: {
      type: 'Row',
      props: { p: '400', ax: 'end', ay: 'center' },
      children: [
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
    modals: {
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
    },
  },
  children: [{ type: '$routes' }],
  routes: [
    { path: '*', type: 'PageNotFound' },
    { path: '/', type: 'HomePage' },
    {
      path: '/space/:spaceId',
      type: 'SpacePage',
      slots: {
        sidebar: {
          type: 'SpaceSidebarWidget',
          props: {
            name: { $store: 'spaceStore.space.name' },
            description: { $store: 'spaceStore.space.description' },
          },
        },
        header: {
          type: 'Row',
          props: { bg: 'ui-100', p: '400', gap: '400', ay: 'center' },
          children: [
            { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Space route'] },
            {
              type: 'we-button',
              props: {
                variant: 'subtle',
                onClick: { $action: 'adamStore.navigate', args: ['.'] },
                children: ['About'],
              },
            },
            {
              type: 'we-button',
              props: {
                variant: 'subtle',
                onClick: { $action: 'adamStore.navigate', args: ['./posts'] },
                children: ['Posts'],
              },
            },
            {
              type: 'we-button',
              props: {
                variant: 'subtle',
                onClick: { $action: 'adamStore.navigate', args: ['./users'] },
                children: ['Users'],
              },
            },
          ],
        },
      },
      children: [{ type: '$routes' }],
      routes: [
        {
          path: '/*',
          type: 'we-text',
          props: { size: '800' },
          children: ['Space page not found...!'],
        },
        {
          path: '/',
          type: 'Row',
          props: { bg: 'ui-200', ay: 'center', px: '400', style: { height: '60px' } },
          children: [{ type: 'we-text', props: { size: '600', nomargin: true }, children: ['About sub-route'] }],
        },
        {
          path: '/posts',
          children: [
            {
              type: 'Row',
              props: { bg: 'ui-200', ay: 'center', gap: '400', px: '400', style: { height: '60px' } },
              children: [
                { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Posts sub-route'] },
                {
                  type: 'we-button',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['./1'] },
                    children: ['Post 1'],
                  },
                },
                {
                  type: 'we-button',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['./2'] },
                    children: ['Post 2'],
                  },
                },
                {
                  type: 'we-button',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['../users'] },
                    children: ['Return back up to users'],
                  },
                },
              ],
            },
            {
              type: 'Column',
              props: { bg: 'ui-300', p: '400' },
              children: [{ type: '$routes' }],
            },
          ],
          routes: [
            { path: '/*', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post not found...'] },
            { path: '/', type: 'we-text', props: { size: '600', nomargin: true }, children: ['No posts selected...'] },
            { path: '/1', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 1 sub-sub-route'] },
            { path: '/2', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 2 sub-sub-route'] },
          ],
        },
        {
          path: '/users',
          type: 'Row',
          props: { bg: 'ui-200', ay: 'center', px: '400', style: { height: '60px' } },
          children: [{ type: 'we-text', props: { size: '600', nomargin: true }, children: ['User sub-route'] }],
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

  // Setters
  setTemplates: (templates: TemplateSchema[]) => void;
  setCurrentTemplate: (id: string) => void;
  setCurrentSchema: (schema: TemplateSchema) => void;
}

const TemplateContext = createContext<TemplateStore>();

export function TemplateStoreProvider(props: ParentProps) {
  // Get the initial template from localStorage if available
  const savedTemplateId = (typeof window !== 'undefined' && localStorage.getItem(TEMPLATE_KEY)) || TEMPLATES[0].id;
  const savedTemplate = TEMPLATES.find((t) => t.id === savedTemplateId) ?? TEMPLATES[0];

  const [templates, setTemplates] = createSignal<TemplateSchema[]>(clone(TEMPLATES));
  const [currentTemplate, setCurrentTemplateSignal] = createSignal<TemplateSchema>(clone(savedTemplate));
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

    // Setters
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
