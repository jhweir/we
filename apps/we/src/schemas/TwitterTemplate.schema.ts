import type { TemplateSchema } from '@we/schema-renderer/shared';

const sidebarLeft = {
  type: 'Column',
  props: { bg: 'ui-0', p: '500' },
  children: [
    {
      type: 'IconLabelButton',
      props: { icon: 'house', label: 'Home', onClick: { $action: 'adamStore.navigate', args: ['/'] } },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'magnifying-glass',
        label: 'Explore',
        onClick: { $action: 'adamStore.navigate', args: ['/explore'] },
      },
    },
  ],
};

const sidebarRight = {
  type: 'Column',
  props: { bg: 'ui-0', p: '500' },
  children: [
    {
      type: 'IconLabelButton',
      props: { icon: 'house', label: 'Home', onClick: { $action: 'adamStore.navigate', args: ['/'] } },
    },
    {
      type: 'IconLabelButton',
      props: {
        icon: 'magnifying-glass',
        label: 'Explore',
        onClick: { $action: 'adamStore.navigate', args: ['/explore'] },
      },
    },
  ],
};

const modals = {
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
  ],
};

export const twitterTemplateSchema: TemplateSchema = {
  meta: {
    name: 'Twitter Template',
    description: 'A simple template with a sidebar, header, and page area.',
    icon: 'x-logo',
  },
  type: 'CenteredTemplate',
  props: { bg: 'ui-0' },
  slots: { sidebarLeft, sidebarRight, modals },
  children: [{ type: '$routes' }],
  routes: [{ path: '/', type: 'HomePage' }],
};
