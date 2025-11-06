import type { TemplateSchema } from '@we/schema-renderer/shared';

export const aiSampleTemplateSchema: TemplateSchema = {
  meta: { name: 'Base', description: '', icon: '' },
  type: 'Row',
  children: [
    {
      type: 'Column',
      children: [
        {
          type: 'we-button',
          props: { onClick: { $action: 'routeStore.navigate', args: ['/'] } },
          children: ['Home'],
        },
      ],
    },
    { type: 'Column', children: [{ type: '$routes' }] },
  ],
  routes: [{ path: '/', type: 'we-text', children: ['Home page'] }],
};
