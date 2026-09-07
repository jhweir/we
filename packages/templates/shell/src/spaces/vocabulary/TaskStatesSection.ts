import type { SchemaNode } from '@we/schema-shared';
import { field, formModal, sectionCard } from '@we/template-kit';

/**
 * The states this community's work moves through.
 *
 * The third of the same kind, beside Signal Types and Connection Types, and the same act each time:
 * a community naming what it means by something, as data, in its own space. A signal type says what
 * a reaction here *is*; a connection type, what a link here *is*; a state, what a stage of work here
 * *is*.
 *
 * ## Why every state carries a semantic
 *
 * A name is for people and cannot be reasoned about. Once "Done" is "Shipped" and "Parked" sits
 * beside it, "what work is outstanding here" is answerable only by something that learned this
 * community's vocabulary — which is nothing: not another view, not a peer, not an agent. The
 * semantic is the small closed fact underneath the free one, and picking it is the one part of
 * adding a state that is not merely naming.
 *
 * Three values because those are the only distinctions anything outside a board needs, and the
 * picker says what each is *for* rather than what it is called, since the whole point is that the
 * name is the community's and the meaning is shared.
 *
 * ## Why states are retired rather than deleted
 *
 * A task names its state by slug, so removing the state leaves the work holding a word nothing
 * defines. Unlike a connection type — where deleting leaves a connection that keeps its label and
 * loses its colour, a fair degradation — a task with an unrecognised state falls out of every
 * column. It is not lost (the tasks view gathers those into a column of their own so they can be
 * moved somewhere real), but it is displaced, and displacing somebody's work to tidy a vocabulary
 * is not a trade this offers. `SignalType` reached the same conclusion first.
 */

/** A label over a control the kit's `field` has no case for. */
const labelled = (label: string, control: SchemaNode): SchemaNode => ({
  type: 'we-form-field',
  props: { label, width: '100%' },
  children: [control],
});

const createModal: SchemaNode = formModal({
  open: { $: 'local.createTaskStateOpen' },
  close: { $setLocal: 'createTaskStateOpen', value: false },
  title: 'New state',
  size: 'sm',
  localState: {
    stateName: { type: 'string', initial: '' },
    stateSemantic: { type: 'string', initial: 'open' },
    stateColor: { type: 'string', initial: '' },
  },
  children: [
    field({
      name: 'stateName',
      label: 'Name',
      placeholder: 'Blocked',
    }),
    labelled('Counts as', {
      type: 'we-select',
      props: {
        value: { $: 'local.stateSemantic' },
        onChange: { $setLocal: 'stateSemantic', value: { $: 'event.detail' } },
        options: [
          { label: 'Not started', value: 'open' },
          { label: 'Being worked on', value: 'active' },
          { label: 'Finished', value: 'done' },
        ],
      },
    }),
    {
      type: 'we-text',
      props: { variant: 'footnote', color: 'text-muted' },
      children: [
        'What this state means to everything outside this board — another view, a peer, an agent asking what is outstanding. The name is yours; this is the part they read.',
      ],
    },
    labelled('Colour', {
      type: 'we-color-picker',
      props: {
        tokens: true,
        value: { $: 'local.stateColor' },
        onChange: { $setLocal: 'stateColor', value: { $: 'event.detail' } },
      },
    }),
  ],
  disabled: { $: '!local.stateName' },
  // `stateSemantic` and `stateColor` both start set, so including them would fire the guard on a
  // form nobody has touched.
  discardWhen: { $: 'local.stateName' },
  submitLabel: 'Add state',
  submit: {
    $action: 'spaceStore.createTaskState',
    args: [
      {
        name: { $: 'local.stateName' },
        semantic: { $: 'local.stateSemantic' },
        color: { $: 'local.stateColor' },
      },
    ],
  },
});

/** How a semantic reads when it is not the state's own name. */
const SEMANTIC_LABEL =
  "state.semantic == 'done' ? 'finished' : state.semantic == 'active' ? 'in flight' : 'not started'";

const stateRow: SchemaNode = {
  type: 'Row',
  props: { gap: '300', ay: 'center', width: '100%', py: '300', borderBottom: '1px solid border' },
  children: [
    {
      type: 'we-icon',
      props: {
        name: {
          $: "state.semantic == 'done' ? 'check-circle' : state.semantic == 'active' ? 'circle-half' : 'circle'",
        },
        color: {
          $: "state.color ? state.color : state.semantic == 'done' ? 'success-text' : state.semantic == 'active' ? 'accent-text' : 'text-muted'",
        },
      },
    },
    {
      type: 'Column',
      props: { gap: '100', flex: '1' },
      children: [
        {
          type: 'Row',
          props: { gap: '200', ay: 'center', wrap: true },
          children: [
            { type: 'we-text', props: { fontWeight: '600' }, children: [{ $: 'state.name' }] },
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: [{ $: SEMANTIC_LABEL }],
            },
            {
              type: '$if',
              props: {
                condition: { $: 'state.retired' },
                then: { type: 'we-badge', props: { size: 'xs' }, children: ['withdrawn'] },
              },
            },
            {
              /*
                A state the space has never written down.

                Worth showing rather than hiding: it explains why there is nothing to withdraw yet,
                and it is honest about the fallback — these three are what a space has until it
                decides otherwise, and adding any state writes all of them down at once.
              */
              type: '$if',
              props: {
                condition: { $: '!state.defined' },
                then: {
                  type: 'we-text',
                  props: { variant: 'footnote', color: 'text-faint' },
                  children: ['default'],
                },
              },
            },
          ],
        },
        {
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-faint' },
          children: [{ $: '`tasks store this as “${state.slug}”`' }],
        },
      ],
    },
    {
      /*
        Withdraw, not delete — and absent entirely for a state the space has not written down, which
        has no record to withdraw. Adding any state materialises these, and then they can be.
      */
      type: '$if',
      props: {
        condition: { $: 'state.defined' },
        then: {
          type: 'we-button',
          props: {
            size: 'xs',
            variant: 'ghost',
            title: { $: "state.retired ? 'Bring this state back' : 'Stop offering this state'" },
            onClick: {
              $action: 'spaceStore.setTaskStateRetired',
              args: [{ $: 'state.id' }, { $: '!state.retired' }],
            },
          },
          children: [
            { type: 'we-icon', props: { name: { $: "state.retired ? 'arrow-counter-clockwise' : 'eye-slash'" } } },
          ],
        },
      },
    },
  ],
};

export const taskStatesSection: SchemaNode = sectionCard({
  title: 'Task States',
  description:
    'The stages work moves through here — "To do", "Blocked", "Shipped". Each becomes a column on the tasks board, and each says what it counts as so the rest of the app can still tell finished work from outstanding.',
  aside: {
    type: 'we-button',
    props: { variant: 'secondary', size: 'sm', onClick: { $setLocal: 'createTaskStateOpen', value: true } },
    children: [
      { type: 'we-icon', props: { name: 'plus' } },
      { type: 'we-text', children: ['Add State'] },
    ],
  },
  children: [
    {
      /*
        Drag to reorder, which is the order a board's columns appear in.

        Written as an ordered relation on the space rather than a number on each state — so two
        people reordering at once converge instead of one write discarding the other. That is the
        same reason a card's position lives on the board rather than on the task.

        Locked until the space has states of its own: the defaults have no records and so nothing to
        order, and the first state named writes all of them down.
      */
      type: 'we-sortable',
      props: {
        direction: 'vertical',
        width: '100%',
        locked: { $: '!first(spaceStore.taskStates).defined' },
        onReorder: { $action: 'spaceStore.reorderTaskStates', args: [{ $: 'arg.detail' }] },
      },
      children: [
        {
          // From the store rather than a `$query`, because the list a space *uses* is not the list
          // it has written down: with none defined it is the defaults, and a query would show
          // nothing at all on exactly the spaces that most need explaining.
          type: '$each',
          props: { items: { $: 'spaceStore.taskStates' }, as: 'state' },
          children: [
            {
              // `data-we-id` on a native element: a component's props are assigned as DOM
              // properties, so the attribute the sortable looks for would never exist on one.
              type: 'div',
              props: { 'data-we-id': { $: 'state.id' }, style: { width: '100%' } },
              children: [stateRow],
            },
          ],
        },
      ],
    },
    createModal,
  ],
});
