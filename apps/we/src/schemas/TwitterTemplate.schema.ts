import type { TemplateSchema } from '@we/schema-renderer/shared';

const border = '1px solid var(--we-color-ui-50)';

const sidebarLeft = {
  type: 'Column',
  props: { ax: 'start', bg: 'ui-0', py: '400', pr: '600', gap: '300', width: '275px', height: '100%' },
  children: [
    {
      type: 'we-button',
      props: {
        p: '300',
        r: 'full',
        bg: 'ui-0',
        color: 'ui-1000',
        hoverProps: { bg: 'ui-100' },
        onClick: { $action: 'routeStore.navigate', args: ['/'] },
      },
      children: [{ type: 'we-icon', props: { name: 'x-logo', size: 'lg' } }],
    },
    {
      type: '$forEach',
      props: {
        items: [
          { icon: 'house', label: 'Home', path: '/' },
          { icon: 'magnifying-glass', label: 'Explore', path: '/explore', bold: true },
          { icon: 'bell', label: 'Notifications', path: '/notifications' },
          { icon: 'envelope-simple', label: 'Messages', path: '/messages', bold: true },
          { icon: 'clipboard-text', label: 'Lists', path: '/lists' },
          { icon: 'bookmark-simple', label: 'Bookmarks', path: '/bookmarks' },
          { icon: 'users', label: 'Communities', path: '/communities' },
          { icon: 'x-logo', label: 'Premium', path: '/premium', bold: true },
          { icon: 'user', label: 'Profile', path: '/profile' },
          { icon: 'dots-three-circle', label: 'More', path: '/more' },
        ],
        as: 'button',
      },
      children: [
        {
          type: 'we-button',
          props: {
            pl: '300',
            pr: '600',
            gap: '400',
            r: 'pill',
            bg: 'ui-0',
            height: '50px',
            hoverProps: { bg: 'ui-100' },
            onClick: { $action: 'routeStore.navigate', args: [{ $expr: 'button.path' }] },
          },
          children: [
            {
              type: 'we-icon',
              props: {
                name: { $expr: 'button.icon' },
                color: 'ui-1000',
                weight: {
                  $if: {
                    condition: { $eq: [{ $store: 'routeStore.currentPath' }, { $expr: 'button.path' }] },
                    then: { $if: { condition: { $expr: 'button.bold' }, then: 'bold', else: 'fill' } },
                    else: 'regular',
                  },
                },
              },
            },
            {
              type: 'we-text',
              props: {
                text: { $expr: 'button.label' },
                size: '600',
                color: 'ui-1000',
                weight: {
                  $if: {
                    condition: { $eq: [{ $store: 'routeStore.currentPath' }, { $expr: 'button.path' }] },
                    then: '600',
                    else: '400',
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'we-button',
      props: {
        r: 'pill',
        bg: 'ui-1000',
        width: '100%',
        height: '50px',
        // m: '400',
        // p: '900',
        hoverProps: { bg: 'ui-800', width: '50%' },
        // hoverProps: { bg: 'ui-800', width: '100%' },
        onClick: { $action: 'routeStore.navigate', args: ['/post'] },
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
  props: { width: '600px', height: '100%', styles: { 'border-left': border, 'border-right': border } },
  children: [{ type: '$routes' }],
};

const sidebarRight = {
  type: 'Column',
  props: { ax: 'start', gap: '300', p: '500', width: '350px', height: '100%' },
  children: [
    {
      type: 'we-button',
      props: { height: '80px' },
      children: ['Button'],
    },
    {
      type: 'we-button',
      props: { height: '60px', hoverProps: { height: '80px' } },
      children: ['Hover Button'],
    },
    {
      type: 'we-button',
      props: {},
      children: [
        { type: 'we-icon', props: { name: 'magnifying-glass' } },
        { type: 'we-text', props: { text: 'Button with icon' } },
      ],
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
  props: { bg: 'ui-0', ax: 'center', width: '100%', height: '100%' },
  children: [
    {
      type: 'Row',
      props: { bg: 'ui-0', height: '100%' },
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
            activeKey: { $store: 'routeStore.currentPath' },
            width: '50%',
            height: '50px',
            // ax: 'start',
            // ay: 'start',
          },
          children: [
            {
              type: 'we-tab',
              slot: 'tab',
              props: {
                label: 'For you',
                key: '/',
                // width: '50%',
                hoverProps: { bg: 'ui-500' },
                onClick: { $action: 'routeStore.navigate', args: ['/'] },
                // style: { flex: 1 },
              },
            },
            {
              type: 'we-tab',
              slot: 'tab',
              props: {
                label: 'Following',
                key: '/following',
                // width: '50%',
                hoverProps: { bg: 'ui-500' },
                onClick: { $action: 'routeStore.navigate', args: ['/following'] },
                // style: { flex: 1 },
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
