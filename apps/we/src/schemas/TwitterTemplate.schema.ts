import type { TemplateSchema } from '@we/schema-renderer/shared';

const border = '1px solid var(--we-color-ui-50)';

function createSidebarButton(icon: string, label: string, path: string, bold?: boolean) {
  return {
    type: 'we-button',
    props: {
      pl: '300',
      pr: '600',
      gap: '400',
      r: 'pill',
      onClick: { $action: 'routeStore.navigate', args: [path] },
      styles: { height: '50px' },
      hover: { bg: 'ui-100', styles: { height: '100px' } },
    },
    children: [
      {
        type: 'we-icon',
        props: {
          name: icon,
          color: 'ui-1000',
          weight: {
            $if: {
              condition: { $eq: [{ $store: 'routeStore.currentPath' }, path] },
              then: bold ? 'bold' : 'fill',
              else: 'regular',
            },
          },
        },
      },
      {
        type: 'we-text',
        props: {
          size: '600',
          color: 'ui-1000',
          weight: {
            $if: { condition: { $eq: [{ $store: 'routeStore.currentPath' }, path] }, then: '600', else: '400' },
          },
        },
        children: [label],
      },
    ],
  };
}

const sidebarLeft = {
  type: 'Column',
  props: { bg: 'ui-0', py: '400', pr: '600', gap: '300', styles: { width: '275px', height: '100%' } },
  children: [
    {
      type: 'we-button',
      props: {
        p: '300',
        r: 'full',
        color: 'ui-1000',
        hover: { bg: 'ui-100', p: '500', styles: { width: '500px' } },
        onClick: { $action: 'routeStore.navigate', args: ['/'] },
      },
      children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
    },
    createSidebarButton('house', 'Home', '/'),
    createSidebarButton('magnifying-glass', 'Explore', '/explore', true),
    createSidebarButton('bell', 'Notifications', '/notifications'),
    createSidebarButton('envelope-simple', 'Messages', '/messages', true),
    createSidebarButton('clipboard-text', 'Lists', '/lists'),
    createSidebarButton('bookmark-simple', 'Bookmarks', '/bookmarks'),
    createSidebarButton('users', 'Communities', '/communities'),
    createSidebarButton('x-logo', 'Premium', '/premium', true),
    createSidebarButton('user', 'Profile', '/profile'),
    createSidebarButton('dots-three-circle', 'More', '/more'),
    {
      type: 'we-button',
      props: {
        r: 'pill',
        bg: 'ui-1000',
        hover: { bg: 'ui-800' },
        onClick: { $action: 'routeStore.navigate', args: ['/post'] },
        styles: { width: '100%', height: '50px' },
      },
      children: [
        {
          type: 'we-text',
          props: { color: 'ui-0', size: '500', weight: '800' },
          children: ['Post'],
        },
      ],
    },
  ],
};

const centerContent = {
  type: 'Column',
  props: { styles: { width: '600px', height: '100%', 'border-left': border, 'border-right': border } },
  children: [{ type: '$routes' }],
};

const sidebarRight = {
  type: 'Column',
  props: { bg: 'ui-0', p: '500', styles: { width: '350px', height: '100%' } },
  children: [
    {
      type: 'IconLabelButton',
      props: { icon: 'house', label: 'Home', onClick: { $action: 'routeStore.navigate', args: ['/'] } },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'magnifying-glass',
        label: 'Explore',
        onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
      },
    },
  ],
};

export const twitterTemplateSchema: TemplateSchema = {
  meta: {
    name: 'Twitter',
    description: 'A template for Twitter-like apps.',
    icon: 'x-logo',
  },
  type: 'Row',
  props: { bg: 'ui-0', ax: 'center', styles: { width: '100%', height: '100%' } },
  children: [
    {
      type: 'Row',
      props: { bg: 'ui-0', styles: { height: '100%' } },
      children: [sidebarLeft, centerContent, sidebarRight],
    },
  ],
  routes: [
    {
      path: '/',
      type: 'Column',
      props: {},
      children: [
        {
          type: 'we-tabs',
          props: {
            value: { $store: 'routeStore.currentPath' }, // controls which tab is selected
            fill: true,
            gap: '400',
            styles: { width: '100%' },
          },
          children: [
            {
              type: 'we-tab',
              slot: 'tab',
              props: {
                label: 'For you',
                value: '/',
                fill: true,
                onClick: { $action: 'routeStore.navigate', args: ['/'] },
                styles: { height: '50px' },
              },
            },
            {
              type: 'we-tab',
              slot: 'tab',
              props: {
                label: 'Following',
                value: '/following',
                fill: true,
                onClick: { $action: 'routeStore.navigate', args: ['/following'] },
              },
            },
          ],
        },
      ],
    },
    {
      path: '/explore',
      type: 'Column',
      props: {},
      children: [{ type: 'we-text', props: { size: '700', weight: '600' }, children: ['Explore Page'] }],
    },
  ],
};

// export const twitterTemplateSchema: TemplateSchema = {
//   meta: {
//     name: 'Twitter Template',
//     description: 'A simple template with a sidebar, header, and page area.',
//     icon: 'x-logo',
//   },
//   type: 'CenteredTemplate',
//   props: { bg: 'ui-0' },
//   slots: { sidebarLeft, sidebarRight, modals },
//   children: [{ type: '$routes' }],
//   routes: [{ path: '/', type: 'HomePage' }],
// };
