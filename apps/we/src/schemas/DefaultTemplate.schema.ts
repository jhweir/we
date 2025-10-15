import type { TemplateSchema } from '@we/schema-renderer/solid';

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
            select: { name: '$item.meta.name', icon: '$item.meta.icon' },
          },
        },
        currentOption: {
          $pick: {
            from: { $store: 'templateStore.currentTemplate.meta' },
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

const spacePageSidebar = {
  type: 'SpaceSidebarWidget',
  props: {
    name: { $store: 'spaceStore.space.name' },
    description: { $store: 'spaceStore.space.description' },
  },
};

const spacePageHeader = {
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
};

export const defaultTemplateSchema: TemplateSchema = {
  id: 'default',
  meta: {
    name: 'Default Template',
    description: 'A simple template with a sidebar, header, and page area.',
    icon: 'layout',
  },
  type: 'DefaultTemplate',
  slots: { sidebar: templateSidebar, header: templateHeader, modals: templateModals },
  children: [{ type: '$routes' }],
  routes: [
    { path: '*', type: 'PageNotFound' },
    { path: '/', type: 'HomePage' },
    {
      path: '/space/:spaceId',
      type: 'SpacePage',
      slots: { sidebar: spacePageSidebar, header: spacePageHeader },
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
