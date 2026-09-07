import type { SchemaNode, TemplateSchema } from '@we/schema-shared';
import { emptyState, field, formModal } from '@we/template-kit';

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
 * So this route reads `status` and a hand-built board reads containment, and the two are different
 * templates over the same records rather than two truths inside one. The kit's own warning applies
 * and is worth restating: **do not mix them in one view.** A status dropdown beside containment
 * columns is the disagreement both designs exist to avoid.
 *
 * The columns are no longer a fixed vocabulary. They come from `spaceStore.taskStates` — the states
 * this community has defined, or the defaults if it has defined none — so a space can invent
 * "Blocked" and get a column, while a task still appears here the moment a model finds it. That is
 * the "columns as saved queries" this note used to describe as where it was going.
 *
 * What a community names is free; what everything else reads is the state's `semantic`, which is why
 * a renamed vocabulary does not make the space illegible to a peer, an agent, or a view that has
 * never heard of it.
 *
 * ## Ordering
 *
 * By creation, and no drag-to-reorder, which is a property of the columns being queries: ordering
 * belongs to a relation's membership, and a filtered query has no membership to order. See the long
 * note on the sortable below — a board whose columns *contain* their cards is the shape that gets
 * it, and is a different surface rather than a change to this one.
 */
/**
 * The tasks in one state, oldest first.
 *
 * Declared per column *inside* the loop rather than hoisted on the view root, which is the one
 * structural consequence of the columns being data. A hoisted `$queries` name is fixed when the
 * schema is written, and there is no name to give a column a community has not invented yet — so
 * each column carries its own subscription, the way a group over a dynamic model list does.
 *
 * The documented cost applies: a schema cannot total a set of queries whose length it does not
 * know, so the "is this board empty" test reads its own query rather than summing the columns.
 */
const columnTasks = {
  entity: 'TaskBlock',
  where: { status: { $: 'state.slug' } },
  order: { createdAt: 'asc' },
  limit: 100,
};

/**
 * The colour a column's heading takes when the community has not chosen one.
 *
 * From the semantic rather than the name, which is the point of the semantic: a community that
 * renames "Done" to "Shipped" keeps the colour that means finished, and one that invents "Blocked"
 * gets a sensible one without being asked.
 */
const HEADING_COLOR =
  "state.color ? state.color : state.semantic == 'done' ? 'success-text' : state.semantic == 'active' ? 'accent-text' : 'text-muted'";

/**
 * Moving a card is a `record.update` of one scalar.
 *
 * Cheap precisely because status is the truth here: no relinking, no read-modify-write, and two
 * people moving the same card concurrently converge on whichever wrote last rather than dropping
 * one of the writes.
 */
const moveMenu: SchemaNode = {
  type: 'DropdownMenu',
  props: {
    triggerIcon: 'arrows-left-right',
    // Names the menu, since the glyph alone does not. Until icon-only triggers were inferred this
    // read "Options" beside the arrows — the fallback label, which no caller here ever asked for.
    triggerTitle: 'Move this task',
    size: 'xs',
    /*
      Items from the space's own states, and one handler rather than a handler per item.

      A per-item `onAction` cannot be built from data: an expression produces values, and a handler
      is a token — nested inside a mapped object it would be stored as the object rather than
      resolved. `onSelect` fires once with the item that was chosen, so the id carries the slug and
      the menu becomes an ordinary mapped list.
    */
    items: { $: 'spaceStore.offeredTaskStates.map(s, { id: s.slug, label: `Move to ${s.name}` })' },
    onSelect: { $action: 'record.update', args: ['TaskBlock', { $: 'task.id' }, { status: { $: 'arg.id' } }] },
  },
};

/** One card. Shows only what a board needs to triage; the detail belongs on the task itself. */
const cardBody: SchemaNode = {
  type: 'Column',
  props: {
    width: '100%',
    gap: '200',
    bg: 'surface-sunken',
    r: '300',
    p: '300',
    border: '1px solid border',
  },
  children: [
    { type: 'we-text', props: { fontWeight: 'semibold' }, children: [{ $: 'task.title' }] },
    {
      type: '$if',
      props: {
        condition: { $: 'task.description' },
        then: {
          type: 'we-text',
          props: { fontSize: '200', color: 'text', truncate: true },
          children: [{ $: 'task.description' }],
        },
      },
    },
    {
      type: 'Row',
      props: { gap: '200', ay: 'center' },
      children: [
        {
          // Only when it is not the default, so a board is not a wall of "medium".
          type: '$if',
          props: {
            condition: { $: "task.priority != 'medium'" },
            then: {
              type: 'we-badge',
              props: {
                size: 'xs',
                variant: { $: "task.priority == 'high' ? 'danger' : 'neutral'" },
              },
              children: [{ $: 'task.priority' }],
            },
          },
        },
        {
          type: '$if',
          props: {
            condition: { $: 'task.dueDate' },
            then: {
              type: 'we-text',
              props: { fontSize: '200', color: 'text' },
              children: [{ $: 'task.dueDate' }],
            },
          },
        },
        {
          type: '$if',
          props: {
            condition: { $: 'task.assignee' },
            then: {
              type: 'we-text',
              props: { fontSize: '200', color: 'text' },
              children: [{ $: '`@${task.assignee}`' }],
            },
          },
        },
        { type: 'Row', props: { ml: 'auto' }, children: [moveMenu] },
      ],
    },
  ],
};

/**
 * One card, wrapped in the native div the sortable drags by.
 *
 * `data-we-id` goes on a plain `div` rather than on the `Column`, for the reason `rail.ts` documents
 * at length: a component's non-event props are assigned as DOM *properties*, so the attribute
 * `we-sortable` looks for would never exist — and a native element is the one node type the prop
 * validator has no list for, so a data attribute on it is not reported as unknown.
 *
 * The explicit width matters for the same reason it does there: this div is the box the drag
 * geometry measures.
 */
const card: SchemaNode = {
  type: 'div',
  props: { 'data-we-id': { $: 'task.id' }, style: { width: '100%', cursor: 'grab' } },
  children: [cardBody],
};

/** One column: a heading with a count, and the cards in that state. */
const column: SchemaNode = {
  type: 'Column',
  $queries: { columnTasks },
  props: {
    // A column has to read as a *trough* even when it is empty, or a board with one card in it
    // looks like a card with a stray heading. Hence the minimum height and the border. Sunken is
    // right here and the cards inside it are `surface`: the column is the one place on this route
    // that genuinely is recessed into the page rather than sitting on it.
    width: '300px',
    minHeight: '200px',
    gap: '300',
    bg: 'surface-sunken',
    border: '1px solid border',
    r: '400',
    p: '300',
    ay: 'start',
  },
  children: [
    {
      type: 'Row',
      props: { gap: '200', ay: 'center', width: '100%' },
      children: [
        {
          type: 'we-text',
          props: { variant: 'footnote', uppercase: true, color: { $: HEADING_COLOR } },
          children: [{ $: 'state.name' }],
        },
        {
          // The count as a **prop**, not a child. A `$query` is hoisted into a subscription at
          // component setup, which is safe for a prop and not for a child — written as a child it
          // resolves to 0, silently, on a column with cards in it.
          type: 'we-text',
          props: {
            variant: 'footnote',
            color: 'text-muted',
            ml: 'auto',
            text: { $: 'count(local.columnTasks)' },
          },
        },
      ],
    },
    /*
        The cards, in a drop zone.

        `zone` is the status, which is what makes the drop handler a one-line `record.update`: the
        event says which zone an item landed in, and here a zone *is* a status. A containment board
        would read the same event and relink instead — the primitive reports intent and stays out of
        it.

        `group` is what lets the three columns exchange cards while leaving every other sortable on
        the page — the space sidebar, for one — out of it.

        `index` is deliberately ignored, so a drag across columns persists and a drag within one is
        visual only.

        This used to say it was waiting on the AD4M CRDT ordering work. That has landed, and it is
        not enough — the note was pointing at the wrong thing. Ordering is a property of a
        *relation's membership*: the array you assign to a relation is the array you get back. A
        column here is a **query**, `where: { status }` over every `TaskBlock` in the space, and a
        filtered query has no membership to order. There is nothing for an ordering to attach to.

        What is actually undecided is whether a column is a query or a container. Make it a
        container — a `CollectionBlock` per column, tasks as its `children`, status expressed by
        which one holds them — and order comes free, a cross-column drag becomes `moveChild`, and
        `we-sortable`'s `index` starts meaning something. The cost is that a task then has to be
        *placed* to appear at all, so a `TaskBlock` written by extraction or by any other surface
        stops showing up here until something parents it, and `status` becomes a denormalised copy
        of where it lives. That is a modelling decision about what a board *is*, not a missing
        capability, and it should be made deliberately rather than arrived at by adding a scalar.

        A `position` scalar remains the wrong answer for the reason it always was: two people
        reordering the same column write the same numbers and one of them loses.
      */
    {
      type: 'we-sortable',
      props: {
        zone: { $: 'state.slug' },
        group: 'tasks',
        gap: 'var(--we-space-300)',
        /*
          The zone has to be the whole trough, not just the cards in it.

          A drop target is hit-tested by its own bounding rectangle, so a sortable holding nothing is
          a zero-height rectangle and nothing can be dropped into it — which is exactly the column
          you most need to drop into, an empty one. The column around it looked droppable (it has the
          minimum height and the border that make it read as a trough) and was not: the pointer was
          over the `Column`, which is not a zone.

          `flex: '1'` takes the height the trough already reserves, and `width: '100%'` the width its
          `ay: 'start'` would otherwise leave unclaimed — so the area that *reads* as the drop target
          is the area that is one.
        */
        flex: '1',
        width: '100%',
        onMoved: {
          $action: 'record.update',
          args: ['TaskBlock', { $: 'arg.detail.id' }, { status: { $: 'arg.detail.to' } }],
        },
      },
      children: [
        {
          type: '$each',
          props: { items: { $: 'local.columnTasks' }, as: 'task' },
          children: [card],
        },
      ],
    },
  ],
};

/**
 * Work whose state nothing recognises.
 *
 * A task holds a state's *slug*, so it outlives the state: retired, deleted, renamed by a community
 * that did not realise the slug was the stored value, or invented by an agent writing through MCP.
 * Whatever the cause, the task is real and somebody has to be able to reach it.
 *
 * Shown as a trailing column and only when it has something in it, so an ordinary board is
 * unaffected. It has no drop zone — there is no state to drop *into* — and the way out is the card's
 * own move menu, which offers the states that do exist. That makes this self-clearing: rescue the
 * work and the column disappears.
 *
 * The alternative was to filter these out, which would have been tidier and would have hidden work.
 */
const strayColumn: SchemaNode = {
  type: '$if',
  props: {
    condition: { $: 'count(local.strayTasks)' },
    then: {
      type: 'Column',
      props: {
        width: '300px',
        minHeight: '200px',
        gap: '300',
        bg: 'surface-sunken',
        border: '1px dashed border-strong',
        r: '400',
        p: '300',
        ay: 'start',
      },
      children: [
        {
          type: 'Row',
          props: { gap: '200', ay: 'center', width: '100%' },
          children: [
            {
              type: 'we-text',
              props: { variant: 'footnote', uppercase: true, color: 'warning-text' },
              children: ['Unknown state'],
            },
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted', ml: 'auto', text: { $: 'count(local.strayTasks)' } },
            },
          ],
        },
        {
          type: 'we-text',
          props: { fontSize: '200', color: 'text-muted' },
          children: ['These are filed under a state this space no longer has. Move them somewhere that exists.'],
        },
        {
          type: '$each',
          props: { items: { $: 'local.strayTasks' }, as: 'task' },
          children: [cardBody],
        },
      ],
    },
  },
};

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
    description: "The space's tasks, grouped by status and filterable by assignee",
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
  /*
    Two subscriptions the columns cannot supply.

    `anyTasks` answers "is this board empty" in one row. The columns each own their own query now,
    and a schema cannot sum a set of queries whose length it does not know — so the empty state asks
    its own question rather than adding the columns up.

    `strayTasks` is the work whose state nothing recognises: written under a state since retired or
    deleted, or by an agent that invented one. It must be *shown*, not filtered away — hiding work is
    the single failure this whole vocabulary is designed against, and a task nobody can see is a task
    nobody can rescue.
  */
  $queries: {
    anyTasks: { entity: 'TaskBlock', limit: 1 },
    strayTasks: {
      entity: 'TaskBlock',
      where: { status: { not: { $: 'spaceStore.taskStates.map(s, s.slug)' } } },
      order: { createdAt: 'asc' },
      limit: 100,
    },
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
        composer,
        {
          type: '$if',
          props: {
            condition: { $: 'count(local.anyTasks)' },
            then: {
              type: 'Row',
              props: { width: '100%', gap: '400', ay: 'start', overflow: 'auto' },
              children: [
                { type: '$each', props: { items: { $: 'spaceStore.taskStates' }, as: 'state' }, children: [column] },
                strayColumn,
              ],
            },
            else: emptyState({
              icon: 'check-square',
              label: 'tasks',
              message: 'No tasks yet. Add one, or record a call — extraction writes down the work people commit to.',
            }),
          },
        },
      ],
    },
  ],
};
