import type { SchemaNode, TemplateSchema } from '@we/schema-shared';
import {
  anchorBanner,
  anchorScope,
  emptyState,
  field,
  formModal,
  moveTaskMenu,
  stateBoard,
  taskCard,
} from '@we/template-kit';

/**
 * The space's tasks, as a board.
 *
 * ## Columns come from `status`, not from containment
 *
 * This is the opposite choice from the showcase `KanbanTemplate`, which makes a card's *column* its
 * status — boards and columns are `CollectionBlock`s there, and moving a card is a relink. That is
 * the more general model and it is right for a board somebody builds by hand: a community invents
 * whatever columns it needs, and the card and the board cannot disagree because there is only one
 * fact.
 *
 * It cannot work here, and the reason is extraction. A task written by a model has no column,
 * because the engine emits forward relations from the instance it creates and a card's membership
 * is a link from the *column* — the wrong direction. Nothing could put it on a board without either
 * a second truth on the task or a designated inbox column that every extracted task piles into
 * regardless of what it is about. Meanwhile the model does fill `status`, from a closed vocabulary,
 * because that is a property of the work.
 *
 * The columns themselves come from `spaceStore.taskStates` — the states this community has defined,
 * or the defaults if it has defined none — so a space can invent "Blocked" and get a column while a
 * task still appears the moment a model finds it. What a community *names* is free; what everything
 * else reads is the state's `semantic`, which is why a renamed vocabulary does not make the space
 * illegible to a peer, an agent, or a view that has never heard of it.
 *
 * ## What is left here, and what moved
 *
 * The board itself is `stateBoard` in `@we/template-kit`: columns, cards, the trough, the stray
 * column, the drop zones. It is shared with the Boards view, which was the same three hundred lines
 * with two differences. What stays here is what makes this route *this* route — its header, its
 * composer, and the fact that it has no board to arrange onto.
 *
 * ## Ordering, and why this route has none
 *
 * Dragging *across* columns works: a column is a state, so that is a one-scalar write everything
 * else reads. Dragging *within* one does nothing, and that is a property of what this route is
 * rather than a missing capability — ordering belongs to a relation's membership, and a column here
 * is a query, `where: { status }` over the space. A filtered query has no membership for an ordering
 * to attach to. A **board** supplies one: its ordered `children` are position hints over the same
 * membership, which is the Boards view.
 *
 * ## Anchoring
 *
 * `?anchor=<collection id>` narrows the whole route to one container's children — the work from one
 * call, rather than the work in the space. Absent means the space, which is what this route has
 * always shown. See `anchorScope`.
 */

/** Moving a card by menu — the keyboard path, and the only way out of the stray column. */
const moveMenu: SchemaNode = moveTaskMenu({
  $action: 'record.update',
  args: ['TaskBlock', { $: 'task.id' }, { status: { $: 'arg.id' } }],
});

/**
 * Creating a task by hand — the other way work gets onto this board, beside extraction.
 *
 * The drafts are declared on the modal rather than on the view, so closing it discards them: the
 * modal is mounted only while open, and remounting is what resets a draft. Written the other way
 * they had to be cleared by hand in `onSuccess`, and `draftStatus` was the one that got forgotten —
 * so a task filed under "Done" left the picker on "Done" for the next one.
 */
const composer: SchemaNode = formModal({
  open: { $: 'local.composerOpen' },
  close: { $setLocal: 'composerOpen', value: false },
  title: 'New task',
  size: 'sm',
  localState: {
    draftTitle: { type: 'string', initial: '' },
    draftDescription: { type: 'string', initial: '' },
    draftStatus: { type: 'string', initial: 'todo' },
  },
  children: [
    field({ name: 'draftTitle', label: 'What needs doing?', placeholder: 'Ship the docs' }),
    field({ name: 'draftDescription', label: 'Notes', control: 'textarea', placeholder: 'Optional' }),
    field({
      name: 'draftStatus',
      label: 'Status',
      control: 'select',
      props: { options: { $: 'spaceStore.offeredTaskStates.map(s, { label: s.name, value: s.slug })' } },
    }),
  ],
  disabled: { $: '!local.draftTitle' },
  // `draftStatus` is excluded: it has a default and a picker, so it is set from the first frame
  // and a guard including it would fire on a form nobody has touched.
  discardWhen: { $: 'local.draftTitle || local.draftDescription' },
  submitLabel: 'Add task',
  submit: {
    $action: 'record.create',
    args: [
      'TaskBlock',
      {
        title: { $: 'local.draftTitle' },
        description: { $: 'local.draftDescription' },
        status: { $: 'local.draftStatus' },
      },
    ],
  },
});

export const tasksView: TemplateSchema = {
  meta: {
    name: 'Tasks',
    description: "The space's tasks, grouped by state — every column a state this community named",
    icon: 'check-square',
    role: 'view',
    segment: 'tasks',
  },
  type: 'Column',
  props: { width: '100%', ax: 'center', p: '500' },
  // The drafts live on the composer itself — see `composer`. Only the gate that opens it is here,
  // since the button that sets it is in this view's header.
  $localState: {
    composerOpen: { type: 'boolean', initial: false },
  },
  children: [
    {
      type: 'Column',
      props: { width: '100%', maxWidth: 'var(--we-layout-lg)', gap: '400' },
      children: [
        {
          type: 'Row',
          props: { width: '100%', ay: 'center', gap: '300' },
          children: [
            { type: 'we-text', props: { variant: 'heading-sm' }, children: ['Tasks'] },
            {
              type: 'we-button',
              props: { size: 'sm', ml: 'auto', onClick: { $setLocal: 'composerOpen', value: true } },
              children: ['New task'],
            },
          ],
        },
        anchorBanner({ label: 'tasks' }),
        composer,
        stateBoard({
          scope: anchorScope(),
          card: taskCard({ actions: moveMenu }),
          // No `onReorder`: see the note above. A cross-column drop writes the task's own state,
          // which is a property of the work rather than of any board.
          onMoved: {
            $action: 'record.update',
            args: ['TaskBlock', { $: 'arg.detail.id' }, { status: { $: 'arg.detail.to' } }],
          },
          empty: emptyState({
            icon: 'check-square',
            label: 'tasks',
            message: 'No tasks yet. Add one, or record a call — extraction writes down the work people commit to.',
          }),
        }),
      ],
    },
  ],
};
