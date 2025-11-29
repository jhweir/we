import type { TemplateSchema } from '@we/schema-renderer/shared';

export const subscriptionTestingSchema: TemplateSchema = {
  meta: { name: 'Subscriptions', description: '', icon: 'rss' },
  type: 'Column',
  props: { ax: 'center', ay: 'center', width: '100%', height: '100%' },
  children: [
    {
      type: 'Row',
      props: { gap: '500' },
      children: [
        // {
        //   type: '$forEach',
        //   props: {
        //     items: [
        //       { name: 'a' },
        //       { name: 'b' },
        //       { name: 'c' },
        //       { name: 'd' },
        //       { name: 'e' },
        //       { name: 'f' },
        //       { name: 'g' },
        //       { name: 'h' },
        //       { name: 'i' },
        //       { name: 'j' },
        //     ],
        //     as: 'item',
        //   },
        //   children: [
        //     {
        //       type: 'Column',
        //       props: { bg: 'ui-100' },
        //       children: [
        //         {
        //           type: '$forEach',
        //           props: { items: { $store: { $expr: '`adamStore.${item.name}`' } }, as: 'a' },
        //           children: [
        //             {
        //               type: 'we-text',
        //               props: { text: { $expr: 'a.textA' } },
        //             },
        //           ],
        //         },
        //       ],
        //     },
        //   ],
        // },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['A'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.a' }, as: 'a' },
              children: [{ type: 'we-text', props: { text: { $expr: 'a.textA' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['B'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.b' }, as: 'b' },
              children: [{ type: 'we-text', props: { text: { $expr: 'b.textB' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['C'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.c' }, as: 'c' },
              children: [{ type: 'we-text', props: { text: { $expr: 'c.textC' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['D'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.d' }, as: 'd' },
              children: [{ type: 'we-text', props: { text: { $expr: 'd.textD' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['E'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.e' }, as: 'e' },
              children: [{ type: 'we-text', props: { text: { $expr: 'e.textE' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['F'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.f' }, as: 'f' },
              children: [{ type: 'we-text', props: { text: { $expr: 'f.textF' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['G'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.g' }, as: 'g' },
              children: [{ type: 'we-text', props: { text: { $expr: 'g.textG' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['H'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.h' }, as: 'h' },
              children: [{ type: 'we-text', props: { text: { $expr: 'h.textH' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['I'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.i' }, as: 'i' },
              children: [{ type: 'we-text', props: { text: { $expr: 'i.textI' } } }],
            },
          ],
        },
        {
          type: 'Column',
          props: { bg: 'ui-100' },
          children: [
            { type: 'we-text', children: ['J'] },
            {
              type: '$forEach',
              props: { items: { $store: 'adamStore.j' }, as: 'j' },
              children: [{ type: 'we-text', props: { text: { $expr: 'j.textJ' } } }],
            },
          ],
        },

        // {
        //   type: 'Column',
        //   children: [
        //     {
        //       type: '$forEach',
        //       props: { items: { $store: 'adamStore.a' }, as: 'a' },
        //       children: [
        //         {
        //           type: 'we-text',
        //           props: { text: { $expr: 'a.textA' } },
        //         },
        //       ],
        //     },
        //     // {
        //     //   type: 'we-button',
        //     //   props: { onClick: { $action: 'adamStore.addItem' }, hoverProps: { bg: 'ui-200' } },
        //     //   children: ['Add Item'],
        //     // },
        //   ],
        // },
      ],
    },
    {
      type: 'we-button',
      props: { onClick: { $action: 'adamStore.addItems' }, hoverProps: { bg: 'danger-500' } },
      children: ['Add Items'],
    },
  ],
};
