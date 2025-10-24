import type { TemplateSchema } from '@we/schema-renderer/solid';

const testButtons = {
  type: 'Row',
  props: { bg: 'ui-200', ay: 'center', gap: '400', p: '400' },
  children: [
    { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Testing buttons'] },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.removeTemplateHeaderSlot' },
        children: ['removeTemplateHeaderSlot'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.addTemplateHeaderSlot' },
        children: ['addTemplateHeaderSlot'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.changeTemplateHeaderProp' },
        children: ['changeTemplateHeaderProp'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.changeTemplateHeaderChildProp' },
        children: ['changeTemplateHeaderChildProp'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.changeSidebarProp' },
        children: ['changeSidebarProp'],
      },
    },
    // {
    //   type: 'we-button',
    //   props: {
    //     variant: 'subtle',
    //     onClick: { $action: 'templateStore.editSpacePageHeaderButton' },
    //     children: ['editSpacePageHeaderButton'],
    //   },
    // },
    // {
    //   type: 'we-button',
    //   props: {
    //     variant: 'subtle',
    //     onClick: { $action: 'templateStore.editPostsPageHeaderButton' },
    //     children: ['editPostsPageHeaderButton'],
    //   },
    // },
    // {
    //   type: 'we-button',
    //   props: {
    //     variant: 'subtle',
    //     onClick: { $action: 'templateStore.addPostsPageHeaderButton' },
    //     children: ['addPostsPageHeaderButton'],
    //   },
    // },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.addSidebarButton' },
        children: ['addSidebarButton'],
      },
    },
  ],
};

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
    { type: 'RerenderLog', props: { location: 'Template Sidebar' } },
  ],
};

const templateHeader = {
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
            addNewSpace: { $action: 'adamStore.addNewSpace' },
          },
        },
      },
    },
    { type: 'RerenderLog', props: { location: 'Template Modals' } },
  ],
};

const spacePageSidebar = {
  type: 'SpaceSidebarWidget',
  props: {
    name: { $store: 'spaceStore.space.name' },
    description: { $store: 'spaceStore.space.description' },
  },
  children: [{ type: 'RerenderLog', props: { location: 'SpacePage Sidebar' } }],
};

const spacePageHeader = {
  type: 'Row',
  props: { bg: 'ui-100', p: '400', gap: '400', ay: 'center' },
  children: [
    { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Space page'] },
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
    { type: 'RerenderLog', props: { location: 'SpacePage Header' } },
  ],
};

export const defaultTemplateSchema: TemplateSchema = {
  meta: {
    name: 'Default template',
    description: 'A simple template with a sidebar, header, and page area.',
    icon: 'layout',
  },
  type: 'DefaultTemplate',
  slots: { sidebar: templateSidebar, header: templateHeader, modals: templateModals },
  children: [testButtons, { type: '$routes' }],
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
          children: [
            { type: 'we-text', props: { size: '600', nomargin: true }, children: ['About sub-page'] },
            { type: 'RerenderLog', props: { location: 'AboutPage' } },
          ],
        },
        {
          path: '/posts',
          children: [
            {
              type: 'Row',
              props: { bg: 'ui-200', ay: 'center', gap: '400', px: '400', style: { height: '60px' } },
              children: [
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
                { type: 'RerenderLog', props: { location: 'PostsPage header buttons' } },
              ],
            },
            {
              type: 'Column',
              props: { bg: 'ui-300', p: '400' },
              children: [{ type: '$routes' }],
            },
            { type: 'RerenderLog', props: { location: 'PostsPage' } },
          ],
          routes: [
            { path: '/*', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post not found...'] },
            { path: '/', type: 'we-text', props: { size: '600', nomargin: true }, children: ['No posts selected...'] },
            { path: '/1', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 1 sub-sub-page'] },
            { path: '/2', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 2 sub-sub-page'] },
          ],
        },
        {
          path: '/users',
          type: 'Row',
          props: { bg: 'ui-200', ay: 'center', px: '400', style: { height: '60px' } },
          children: [
            { type: 'we-text', props: { size: '600', nomargin: true }, children: ['User sub-page'] },
            { type: 'RerenderLog', props: { location: 'UserPage' } },
          ],
        },
      ],
    },
  ],
};
