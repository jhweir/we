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
 * Five values, sized by the questions that have to be answerable from outside a space — see the
 * table on `TaskState.semantic` — and the picker says what each is *for* rather than what it is
 * called, since the whole point is that the name is the community's and the meaning is shared.
 *
 * ## Why the defaults are shown but not stored
 *
 * A space starts with three states it has never written down. They are listed here as "default"
 * because they are real — every task in a new space holds one of their slugs — but nothing is
 * written until somebody acts on one: dragging it into an order, withdrawing it, or naming a state
 * with its slug. That act adopts it. Writing all three down the moment anybody added a fourth was
 * the alternative, and two members doing so on two nodes at once wrote six.
 *
 * ## Why states are retired rather than deleted
 *
 * A task names its state by slug, so removing the state leaves the work holding a word nothing
 * defines. Unlike a connection type — where deleting leaves a connection that keeps its label and
 * loses its colour, a fair degradation — a task with an unrecognised state falls out of every
 * column. It is not lost (a board gathers those into a column of their own so they can be moved
 * somewhere real), but it is displaced, and displacing somebody's work to tidy a vocabulary
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
    stateIcon: { type: 'string', initial: '' },
  },
  children: [
    field({
      name: 'stateName',
      label: 'Name',
      placeholder: 'Blocked',
    }),
    /*
      What the rest of the app should read this as — not what it is called, and not literally what
      stage of work it is.

      These used to read "Not started / Being worked on / Finished", which asked about *history* and
      made naming "Blocked" confusing: blocked work has started, so nothing fitted. The question is
      whether work in this state is outstanding, and if so whether anybody is on it, which every
      state answers cleanly.
    */
    labelled('The rest of the app reads this as', {
      type: 'we-select',
      props: {
        value: { $: 'local.stateSemantic' },
        onChange: { $setLocal: 'stateSemantic', value: { $: 'event.detail' } },
        options: [
          { label: 'Still to do — nobody on it', value: 'open' },
          { label: 'Being worked on', value: 'active' },
          { label: 'Stuck — waiting on something', value: 'blocked' },
          { label: 'Finished', value: 'done' },
          { label: 'Dropped — not finished, not outstanding', value: 'cancelled' },
        ],
      },
    }),
    // The vocabulary's own field, which nothing offered a way to set. A state with an icon reads at a
    // glance on a board heading; one without falls back to a shape derived from its semantic.
    labelled('Icon', {
      type: 'we-icon-picker',
      props: {
        value: { $: 'local.stateIcon' },
        onChange: { $setLocal: 'stateIcon', value: { $: 'event.detail' } },
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
        icon: { $: 'local.stateIcon' },
      },
    ],
  },
});

/**
 * How a semantic reads when it is not the state's own name.
 *
 * Every chain over `semantic` in the app ends in the outstanding branch rather than in an error, so a
 * value a peer's older code does not recognise reads as "still to do" — right for `blocked`, and for
 * `cancelled` an over-count of outstanding work rather than finished work quietly disappearing.
 */
const SEMANTIC_LABEL =
  "state.semantic == 'done' ? 'finished' : " +
  "state.semantic == 'cancelled' ? 'dropped' : " +
  "state.semantic == 'active' ? 'in flight' : " +
  "state.semantic == 'blocked' ? 'stuck' : 'not started'";

/** The shape a state takes when nobody has picked an icon for it. */
const SEMANTIC_ICON =
  "state.semantic == 'done' ? 'check-circle' : " +
  "state.semantic == 'cancelled' ? 'x-circle' : " +
  "state.semantic == 'active' ? 'circle-half' : " +
  "state.semantic == 'blocked' ? 'warning-circle' : 'circle'";

/** And the colour, where the community has not chosen one. */
const SEMANTIC_COLOR =
  'state.color ? state.color : ' +
  "state.semantic == 'done' ? 'success-text' : " +
  "state.semantic == 'cancelled' ? 'text-faint' : " +
  "state.semantic == 'active' ? 'accent-text' : " +
  "state.semantic == 'blocked' ? 'warning-text' : 'text-muted'";

const stateRow: SchemaNode = {
  type: 'Row',
  props: { gap: '300', ay: 'center', width: '100%', py: '300', borderBottom: '1px solid border' },
  children: [
    {
      type: 'we-icon',
      props: {
        // The community's own icon where it chose one, and the semantic's shape where it did not.
        name: { $: `state.icon ? state.icon : ${SEMANTIC_ICON}` },
        color: { $: SEMANTIC_COLOR },
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

                Worth showing rather than hiding: it is honest about the fallback — these three are
                what a space has until it decides otherwise — and it says what will happen: acting on
                one makes it the community's own.
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
        Withdraw, not delete. By slug, so a default can be withdrawn too: the store adopts it — writes
        the record — as part of the same act, which is the only moment a default becomes one.
      */
      type: 'we-button',
      props: {
        size: 'xs',
        variant: 'ghost',
        title: { $: "state.retired ? 'Bring this state back' : 'Stop offering this state'" },
        onClick: {
          $action: 'spaceStore.setTaskStateRetired',
          args: [{ $: 'state.slug' }, { $: '!state.retired' }],
        },
      },
      children: [
        { type: 'we-icon', props: { name: { $: "state.retired ? 'arrow-counter-clockwise' : 'eye-slash'" } } },
      ],
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

        The rows are keyed by slug rather than id, because a default has no id until it is placed in
        an order — and placing it is what adopts it.
      */
      type: 'we-sortable',
      props: {
        direction: 'vertical',
        width: '100%',
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
              props: { 'data-we-id': { $: 'state.slug' }, style: { width: '100%' } },
              children: [stateRow],
            },
          ],
        },
      ],
    },
    createModal,
  ],
});
