/**
 * A board whose columns are the community's task states.
 *
 * The shape behind both of WE's kanban surfaces: the Tasks view, which is every task in the space,
 * and a Board, which is the same tasks in an order somebody chose. They differ in exactly two
 * places — what a column's cards are, and what a drag writes — and were otherwise the same three
 * hundred lines twice, which is how the Tasks view ended up with a move menu and a stray column
 * while a Board had neither.
 *
 * ## Columns are states, not containers
 *
 * A column binds to a `TaskState` from `spaceStore.taskStates` — the community's own vocabulary, or
 * the defaults where it has named none. Membership comes from the task's `status`, so a task
 * appears the moment it exists: extraction writes a state and no board, and a model emits forward
 * relations from the instance it creates, so a card's membership in a container would have to be a
 * link from the *column* — the wrong direction.
 *
 * That is the opposite choice from `kanbanBoard` in `@we/schema-kit`, where a card's column *is* its
 * container. Both are right for what they are: that one is portable and knows nothing about states,
 * this one is WE's task vocabulary made visible. **Do not mix them in one view** — a status control
 * beside containment columns is two sources of truth for one fact.
 *
 * ## Position over a membership defined elsewhere
 *
 * Ordering *within* a column is not membership, so a board that has one supplies `cards` as its own
 * expression — its arranged children first, everything else after — and `onReorder` to record what a
 * drag rearranged. A surface with no board to write to omits both and gets a board that can still be
 * dragged across columns, because that is a state change rather than an arrangement.
 */
import { field, formModal } from '@we/schema-kit';
import type { QueryStateField, SchemaNode, SchemaProp } from '@we/schema-shared';

import { agentByline } from './agentByline.ts';

/** Every task in the state a column stands for, oldest first — the default `cards` expression. */
export const COLUMN_TASKS = 'local.columnTasks';

/**
 * The colour a column heading takes when the community has not chosen one.
 *
 * From the `semantic` rather than the name, which is what the semantic is for: a community that
 * renames "Done" to "Shipped" keeps the colour that means finished, and one that invents "Blocked"
 * gets a sensible one without being asked.
 */
const HEADING_COLOR =
  "state.color ? state.color : state.semantic == 'done' ? 'success-text' : state.semantic == 'active' ? 'accent-text' : 'text-muted'";

export interface TaskCardOptions {
  /** Controls shown at the end of the card's meta row — usually {@link moveTaskMenu}. */
  actions?: SchemaNode;
  /** Context key the card reads. Defaults to `'task'`, which is what {@link stateBoard} binds. */
  as?: string;
  /**
   * Show who wrote the task.
   *
   * Off by default, because on a space's own board every card is the community's and a row of
   * identical faces says nothing. It earns its place where the *provenance* is the question: for an
   * extracted task the author is whichever agent's node ran the pass, so the byline answers "where
   * did this come from" on a surface built around a conversation.
   */
  byline?: boolean;
}

/**
 * One task, as a card.
 *
 * Shows what triage needs and no more; the rest belongs on the task's own page. Every optional field
 * is gated, and `priority` shows only when it is not the default — otherwise a board is a wall of
 * "medium".
 */
export function taskCard(opts: TaskCardOptions = {}): SchemaNode {
  const as = opts.as ?? 'task';
  return {
    type: 'Column',
    props: { width: '100%', gap: '200', bg: 'surface', r: '300', p: '300', border: '1px solid border' },
    children: [
      { type: 'we-text', props: { fontWeight: 'semibold' }, children: [{ $: `${as}.title` }] },
      {
        type: '$if',
        props: {
          condition: { $: `${as}.description` },
          then: {
            type: 'we-text',
            props: { fontSize: '200', color: 'text-muted', truncate: true },
            children: [{ $: `${as}.description` }],
          },
        },
      },
      {
        type: 'Row',
        props: { gap: '200', ay: 'center' },
        children: [
          {
            type: '$if',
            props: {
              condition: { $: `${as}.priority != 'medium'` },
              then: {
                type: 'we-badge',
                props: { size: 'xs', variant: { $: `${as}.priority == 'high' ? 'danger' : 'neutral'` } },
                children: [{ $: `${as}.priority` }],
              },
            },
          },
          {
            type: '$if',
            props: {
              condition: { $: `${as}.dueDate` },
              then: {
                type: 'we-text',
                props: { fontSize: '200', color: 'text-muted' },
                children: [{ $: `${as}.dueDate` }],
              },
            },
          },
          {
            type: '$if',
            props: {
              condition: { $: `${as}.assignee` },
              then: {
                type: 'we-text',
                props: { fontSize: '200', color: 'text-muted' },
                children: [{ $: '`@${' + as + '.assignee}`' }],
              },
            },
          },
          ...(opts.byline ? [agentByline({ did: { $: `${as}.author` }, as: 'author', avatarSize: 'xxs' })] : []),
          ...(opts.actions ? [{ type: 'Row', props: { ml: 'auto' }, children: [opts.actions] }] : []),
        ],
      },
    ],
  };
}

/**
 * The menu that moves a task to another state.
 *
 * The keyboard-and-menu path beside dragging, and the only way out of the stray column, which has no
 * drop zone to drag into.
 *
 * One `onSelect` rather than a handler per item, because the items come from data: an expression
 * yields values and a handler is a token, so a handler nested inside a mapped object would be stored
 * as the object rather than resolved. The chosen row arrives as `arg`, carrying the slug as its id.
 */
export function moveTaskMenu(onSelect: SchemaProp): SchemaNode {
  return {
    type: 'DropdownMenu',
    props: {
      triggerIcon: 'arrows-left-right',
      // Names the menu, since the glyph alone does not.
      triggerTitle: 'Move this task',
      size: 'xs',
      items: { $: 'spaceStore.offeredTaskStates.map(s, { id: s.slug, label: `Move to ${s.name}` })' },
      onSelect,
    },
  };
}

export interface StateBoardOptions {
  /** The card, rendered once per `task`. Usually {@link taskCard}. */
  card: SchemaNode;
  /**
   * The cards of one column, as an expression. Defaults to {@link COLUMN_TASKS}.
   *
   * A board with an arrangement passes its own — its arranged children first, then everything in the
   * state nobody has placed. Whatever it returns, membership is still the state: an expression that
   * dropped rows would hide work.
   */
  cards?: string;
  /** What a drag *across* columns writes — a task's state. Required: a column is a state. */
  onMoved: SchemaProp;
  /** What a drag *within* a column writes. Omit where there is no arrangement to record. */
  onReorder?: SchemaProp;
  /** `scope` for the queries — pass `anchorScope()` to narrow the whole board to one container. */
  scope?: QueryStateField['scope'];
  /** Extra `where` conditions, ANDed onto every task query. */
  where?: Record<string, unknown>;
  /** Shown when there is no work here at all. */
  empty: SchemaNode;
  /** Controls on each card — usually {@link moveTaskMenu}. */
  actions?: SchemaNode;
  /**
   * Extra options for the `record.create` a column's quick-add makes — usually `anchorParent()`.
   *
   * A narrowed board has to create *into* what it is narrowed to, or the task is made, the modal
   * closes, and nothing appears: the record is real and in the space, and not among the children
   * being shown. Omit on a board that is never narrowed.
   */
  createOptions?: SchemaProp;
  /**
   * `we-sortable` group name. Defaults to `'tasks'`.
   *
   * What lets this board's columns exchange cards while leaving every other sortable on the page —
   * the space sidebar, for one — out of it. Two boards on one screen want different groups.
   */
  group?: string;
}

/**
 * The tasks in one state.
 *
 * Declared per column *inside* the loop rather than hoisted on the board, which is the one
 * structural consequence of the columns being data: a hoisted `$queries` name is fixed when the
 * schema is written, and there is no name to give a column a community has not invented yet. So each
 * column carries its own subscription, the way a group over a dynamic model list does — and the
 * documented cost applies, that a schema cannot total a set of queries whose length it does not
 * know, which is why the empty state below asks its own question rather than adding the columns up.
 */
function columnQuery(opts: StateBoardOptions): QueryStateField {
  return {
    entity: 'TaskBlock',
    where: { status: { $: 'state.slug' }, ...opts.where },
    ...(opts.scope && { scope: opts.scope }),
    order: { createdAt: 'asc' },
    limit: 100,
  };
}

/**
 * Adding a task to the column you are looking at.
 *
 * A quick-add per column rather than one form with a state picker, because on a board the column
 * *is* the answer to "what state" — asking again in a dropdown, having just been told by which `+`
 * was pressed, is a question with its answer already in it. `status` comes from the column, so
 * there is one field to fill in.
 *
 * The drafts live on the modal, which is mounted only while open — so closing discards them with no
 * `onSuccess` clearing to forget. And because the modal is inside the `$each` over states, each
 * column has its own instance and its own `addOpen`, which is what makes per-column state possible
 * without a name per column: `$localState` names are fixed when a schema is written, and the columns
 * are data.
 */
function addTaskModal(opts: StateBoardOptions): SchemaNode {
  return formModal({
    open: { $: 'local.addOpen' },
    close: { $setLocal: 'addOpen', value: false },
    // Names the column, so a modal opened from the wrong `+` is obvious before anything is typed.
    title: { $: '`New task in ${state.name}`' },
    size: 'sm',
    localState: { addTitle: { type: 'string', initial: '' } },
    children: [field({ name: 'addTitle', label: 'What needs doing?', placeholder: 'Ship the docs' })],
    disabled: { $: '!local.addTitle' },
    submitLabel: 'Add task',
    submit: {
      $action: 'record.create',
      args: [
        'TaskBlock',
        { title: { $: 'local.addTitle' }, status: { $: 'state.slug' } },
        ...(opts.createOptions ? [opts.createOptions] : []),
      ],
      onSuccess: [{ $setLocal: 'addOpen', value: false }],
    },
  });
}

function column(opts: StateBoardOptions): SchemaNode {
  return {
    type: 'Column',
    $queries: { columnTasks: columnQuery(opts) },
    // One per column, because the modal is inside the `$each` — see `addTaskModal`.
    $localState: { addOpen: { type: 'boolean', initial: false } },
    props: {
      /*
        A column has to read as a *trough* even when it is empty, or a board with one card in it
        looks like a card with a stray heading. Sunken is right here and the cards inside it are
        `surface`: the column is the one place on the route that genuinely is recessed into the page
        rather than sitting on it.
      */
      width: '300px',
      minHeight: '240px',
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
            // The count as a **prop**, not a child: a `$query` is hoisted into a subscription at
            // component setup, which is safe for a prop and not for a child — written as a child it
            // resolves to 0, silently, on a column with cards in it.
            type: 'we-text',
            props: {
              variant: 'footnote',
              color: 'text-muted',
              ml: 'auto',
              text: { $: `count(${COLUMN_TASKS})` },
            },
          },
          {
            type: 'we-button',
            props: {
              variant: 'ghost',
              size: 'xs',
              square: true,
              title: { $: '`Add a task to ${state.name}`' },
              onClick: { $setLocal: 'addOpen', value: true },
            },
            children: [{ type: 'we-icon', props: { name: 'plus' } }],
          },
        ],
      },
      addTaskModal(opts),
      {
        type: 'we-sortable',
        props: {
          // `zone` is the state's slug, which is what makes a cross-column drop a one-line write:
          // the event says which zone an item landed in, and here a zone *is* a state.
          zone: { $: 'state.slug' },
          group: opts.group ?? 'tasks',
          gap: 'var(--we-space-300)',
          /*
            The zone has to be the whole trough, not just the cards in it.

            A drop target is hit-tested by its own bounding rectangle, so a sortable holding nothing
            is a zero-height rectangle and nothing can be dropped into it — which is exactly the
            column you most need to drop into, an empty one. `flex: '1'` takes the height the trough
            already reserves and `width: '100%'` the width its `ay: 'start'` would otherwise leave
            unclaimed, so the area that *reads* as the drop target is the area that is one.
          */
          flex: '1',
          width: '100%',
          ...(opts.onReorder && { onReorder: opts.onReorder }),
          onMoved: opts.onMoved,
        },
        children: [
          {
            type: '$each',
            props: { items: { $: opts.cards ?? COLUMN_TASKS }, as: 'task' },
            children: [
              /*
                The draggable box, on a native div rather than on the card.

                A component's non-event props are assigned as DOM *properties*, so the `data-we-id`
                attribute `we-sortable` looks for would never exist on one — the same reason the rail
                fragments wrap their rows this way. This div is also the box the drag geometry
                measures, hence the explicit width.
              */
              {
                type: 'div',
                props: { 'data-we-id': { $: 'task.id' }, style: { width: '100%', cursor: 'grab' } },
                children: [opts.card],
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Work whose state nothing recognises.
 *
 * A task holds a state's *slug*, so it outlives the state: retired, deleted, renamed by a community
 * that did not realise the slug was the stored value, or invented by an agent writing through MCP.
 * Whatever the cause, the task is real and somebody has to be able to reach it.
 *
 * A trailing column, shown only when it has something in it, so an ordinary board is unaffected. It
 * has no drop zone — there is no state to drop *into* — and the way out is the card's own move menu,
 * which offers the states that do exist. That makes it self-clearing: rescue the work and the column
 * goes away.
 *
 * The alternative was to filter these out, which would have been tidier and would have hidden work —
 * the one failure this whole vocabulary is designed against.
 */
function strayColumn(opts: StateBoardOptions): SchemaNode {
  return {
    type: '$if',
    props: {
      condition: { $: 'count(local.strayTasks)' },
      then: {
        type: 'Column',
        props: {
          width: '300px',
          minHeight: '240px',
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
            children: [opts.card],
          },
        ],
      },
    },
  };
}

export function stateBoard(opts: StateBoardOptions): SchemaNode {
  return {
    type: 'Column',
    props: { width: '100%', gap: '400' },
    /*
      Two subscriptions the columns cannot supply.

      `anyTasks` answers "is there any work here" in one row, because a schema cannot sum a set of
      queries whose length it does not know.

      `strayTasks` is the work whose state nothing recognises. Both carry the board's own `scope` and
      `where`, so an anchored board asks about the container it is narrowed to rather than about the
      space — otherwise a call with no tasks would show a space's worth of columns, and a space's
      stray work would follow a board into every call.
    */
    $queries: {
      anyTasks: {
        entity: 'TaskBlock',
        ...(opts.where && { where: opts.where }),
        ...(opts.scope && { scope: opts.scope }),
        limit: 1,
      },
      strayTasks: {
        entity: 'TaskBlock',
        where: { status: { not: { $: 'spaceStore.taskStates.map(s, s.slug)' } }, ...opts.where },
        ...(opts.scope && { scope: opts.scope }),
        order: { createdAt: 'asc' },
        limit: 100,
      },
    },
    children: [
      {
        type: '$if',
        props: {
          condition: { $: 'count(local.anyTasks)' },
          then: {
            type: 'Row',
            props: { width: '100%', gap: '400', ay: 'start', overflow: 'auto' },
            children: [
              {
                type: '$each',
                props: { items: { $: 'spaceStore.taskStates' }, as: 'state' },
                children: [column(opts)],
              },
              strayColumn(opts),
            ],
          },
          // Gated on the query having answered: an empty first frame is not an empty space.
          else: { type: '$if', props: { condition: { $: 'local.anyTasksLoaded' }, then: opts.empty } },
        },
      },
      {
        type: 'we-text',
        props: { variant: 'footnote', color: 'text-faint' },
        children: ['Columns come from this space’s task states. Add or rename them in Settings → Vocabulary.'],
      },
    ],
  };
}
