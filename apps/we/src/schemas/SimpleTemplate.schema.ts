import type { TemplateSchema } from '@we/schema-renderer/solid';

export const simpleTemplateSchema: TemplateSchema = {
  meta: {
    name: 'Simple template',
    description: 'Testing',
    icon: 'sidebar',
  },
  type: 'Row',
  props: { bg: 'ui-100', p: '400', gap: '400', ay: 'center' },
  children: [
    { type: 'RerenderLog', props: { location: 'Simple template child 1' } },
    {
      type: 'CircleButton',
      props: { label: 'Search', icon: 'magnifying-glass' },
    },
    {
      type: 'CircleButton',
      props: { label: 'Search', icon: 'plus', onClick: { $action: 'templateStore.addChild' } },
    },
  ],
};

// export const simpleTemplateSchema: TemplateSchema = {
//   meta: {
//     name: 'Simple template',
//     description: 'Testing',
//     icon: 'sidebar',
//   },
//   type: 'Column',
//   children: [
//     {
//       type: 'Row',
//       props: { bg: 'ui-100', p: '400', gap: '400', ay: 'center' },
//       children: [
//         {
//           type: 'we-button',
//           props: {
//             variant: 'subtle',
//             onClick: { $action: 'templateStore.addChild' },
//             children: ['Add child'],
//           },
//         },
//       ],
//     },
//     {
//       type: 'Row',
//       props: { bg: 'ui-25', p: '400', gap: '400', ay: 'center' },
//       children: [
//         { type: 'RerenderLog', props: { location: 'Simple template child 1' } },
//         {
//           type: 'CircleButton',
//           props: { label: 'Search', icon: 'magnifying-glass' },
//         },
//         {
//           type: 'CircleButton',
//           props: { label: 'Search', icon: 'plus' },
//         },
//       ],
//     },
//   ],
// };
