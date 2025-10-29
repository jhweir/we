import type { TemplateSchema } from '@we/schema-renderer/shared';

const border = '1px solid var(--we-color-ui-50)';

const sidebarLeft = {
  type: 'Column',
  props: { bg: 'ui-0', py: '400', gap: '400', style: { width: '275px', height: '100%' } },
  children: [
    // { type: 'we-icon', props: { name: 'x-logo', size: 'lg' } },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'x-logo',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'house',
        label: 'Home',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'magnifying-glass',
        label: 'Explore',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/explore'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'bell',
        label: 'Notifications',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/notifications'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'envelope-simple',
        label: 'Messages',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/messages'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'clipboard-text',
        label: 'Lists',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/lists'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'bookmark-simple',
        label: 'Bookmarks',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/bookmarks'] },
      },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'users',
        label: 'Communities',
        variant: 'contrast',
        size: 'lg',
        onClick: { $action: 'routeStore.navigate', args: ['/communities'] },
      },
    },
  ],
};

const centerContent = {
  type: 'Column',
  props: { style: { width: '600px', height: '100%', 'border-left': border, 'border-right': border } },
  children: [{ type: '$routes' }],
};

const sidebarRight = {
  type: 'Column',
  props: { bg: 'ui-0', p: '500', style: { width: '350px', height: '100%' } },
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
    name: 'Twitter Template',
    description: 'A template for Twitter-like apps.',
    icon: 'x-logo',
  },
  type: 'Row',
  props: { bg: 'ui-0', ax: 'center', style: { width: '100%', height: '100%' } },
  children: [
    {
      type: 'Row',
      props: { bg: 'ui-0', style: { height: '100%' } },
      children: [sidebarLeft, centerContent, sidebarRight],
    },
  ],
  routes: [{ path: '/', type: 'HomePage' }],
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
