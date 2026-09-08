/**
 * A kanban board whose columns are records, and whose membership is still a query.
 *
 * ## The one decision everything follows from
 *
 * **State is a fact about the work; position is a fact about the pair.** A task's `status` is read
 * by every surface in WE; where it sits on *this* board is nobody else's business. So a column is
 * two things at once, and the split is deliberate:
 *
 * - **What is in it** comes from the task's `status` matching the column's `slug`. A query, so work
 *   arrives on its own — an extraction pass writes three tasks and no board writes at all, and they
 *   appear on every board that has a column for that state, including one made tomorrow.
 * - **Where each card sits** is the column's ordered `children`. Position hints over a membership
 *   defined elsewhere, which is the same relationship AD4M's ordering entries have to the links they
 *   order, one level up.
 *
 * A column is therefore *a saved query with an arrangement*, which is the sentence to keep in mind
 * when this looks like a hybrid. Pure containment — a card is in To-do because To-do holds a link to
 * it — is the obvious alternative and it is the one that breaks: membership then has to be
 * maintained per board forever, a board made tomorrow is empty until somebody backfills it, and its
 * failure mode is a task that is *invisible* rather than one that is visibly misfiled.
 *
 * That asymmetry is also what makes this safe under a partition. The links can end up inconsistent —
 * a card in two columns' children, or in none — and the board still renders exactly one answer,
 * because status decides and hints are advisory.
 *
 * ## Two kinds of column
 *
 * | | Bound (`slug` set) | Local lane (`slug` empty) |
 * |---|---|---|
 * | Membership | the query above, plus its arrangement | containment only |
 * | Dropping a card | writes `status` — every board follows | writes one link — this board only |
 * | New matching work | arrives on its own | never arrives on its own |
 *
 * A lane is how somebody organises without imposing: "Thursday", "Waiting on Ana". Never filling
 * itself is the price of claiming no shared meaning, and it is the right price. A lane that turns
 * out to matter is promoted by naming it in Settings → Vocabulary, which makes it a slug.
 *
 * A card placed in a lane is excluded from the status columns **on this board** — otherwise it would
 * appear twice — and is unaffected everywhere else.
 *
 * ## What is not built, and how it would fit
 *
 * Swimlanes are the feature most likely to arrive next, and they need no restructure. A board would
 * gain a second axis; a column is the one-axis case of a **group**, and a group with two bindings is
 * a cell. Order stays where it is, on the group. Written down so the next person does not conclude
 * the shape has to change: see `docs/architecture/boards.md`.
 */
import { field, formModal } from '@we/schema-kit';
import type { QueryStateField, SchemaNode, SchemaProp } from '@we/schema-shared';

import { agentByline } from './agentByline.ts';

/** The board being read, with its columns and their cards — one query for the whole structure. */
const BOARD = 'first(local.board)';
/** The columns, in the order this board reads them. */
const COLUMNS = `${BOARD}.children`;

/**
 * Whether a card is positioned somewhere on this board that currently shows it.
 *
 * The `!k.slug ||` half is what keeps a stale hint from hiding work. A card whose state was changed
 * on another surface still has a hint in the column it used to be in; that column no longer shows it
 * (its arranged list filters on the slug), so if this counted the card as placed it would vanish
 * from the board entirely. Reading "placed" as *placed somewhere that shows it* means the card falls
 * back to being unarranged in whichever column its state now names.
 */
const PLACED = `${COLUMNS}.exists(k, (!k.slug || k.slug == t.status) && k.children.exists(c, c.id == t.id))`;

/** The cards somebody has arranged in this column: its own children, minus any stale hint. */
const ARRANGED = `col.slug ? col.children.filter(c, c.status == col.slug) : col.children`;

/**
 * The cards this column's state gathers that nobody has positioned.
 *
 * Empty for a lane, which gathers nothing — that is the whole difference between the two kinds.
 */
const UNARRANGED = `col.slug ? local.allTasks.filter(t, t.status == col.slug && !(${PLACED})) : []`;

/**
 * Work this board has nowhere to put: a state no column here names.
 *
 * Retired, deleted, invented by an agent writing through MCP, or simply named after this board was
 * made — a board's columns are its own, so a state added later does not appear on it. Whatever the
 * cause, the work is real and somebody has to be able to reach it. Filtering it out would be tidier
 * and would hide work, which is the one failure this whole design exists to prevent.
 */
const UNPLACED = `local.allTasks.filter(t, !(${PLACED}) && !${COLUMNS}.exists(k, k.slug == t.status))`;

/**
 * The colour a column heading takes when the community has not chosen one.
 *
 * Looked up by slug rather than stored on the column, so a state recoloured in the vocabulary
 * recolours every board at once — the colour is a fact about the state, not about this board.
 */
const HEADING_COLOR =
  'find(spaceStore.taskStates, { slug: col.slug }).color ? find(spaceStore.taskStates, { slug: col.slug }).color : ' +
  "find(spaceStore.taskStates, { slug: col.slug }).semantic == 'done' ? 'success-text' : " +
  "find(spaceStore.taskStates, { slug: col.slug }).semantic == 'active' ? 'accent-text' : 'text-muted'";

export interface TaskCardOptions {
  /** Controls shown at the end of the card's meta row — usually {@link moveTaskMenu}. */
  actions?: SchemaNode;
  /** Context key the card reads. Defaults to `'task'`, which is what {@link taskBoard} binds. */
  as?: string;
  /**
   * Show who wrote the task.
   *
   * Off by default: on a community's own board every card is the community's and a row of identical
   * faces says nothing. It earns its place where *provenance* is the question — for an extracted
   * task the author is whichever agent's node ran the pass.
   */
  byline?: boolean;
}

/**
 * One task, as a card.
 *
 * Shows what triage needs and no more; the rest belongs on the task's own page. `priority` shows
 * only when it is not the default, or a board is a wall of "medium".
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
 * The menu that moves a card to another column.
 *
 * The keyboard path beside dragging, and the only way out of the unplaced column, which has no drop
 * zone to drag into. It offers this board's columns rather than the space's states, because those
 * are two different lists once a board owns its columns.
 *
 * One `onSelect` rather than a handler per item: the rows come from data, an expression yields
 * values, and a handler nested in a mapped object would be stored as the object rather than
 * resolved. The chosen row arrives as `arg`, carrying the target column's id.
 */
export function moveTaskMenu(from: string): SchemaNode {
  return {
    type: 'DropdownMenu',
    props: {
      triggerIcon: 'arrows-left-right',
      triggerTitle: 'Move this card',
      size: 'xs',
      items: { $: `${COLUMNS}.map(k, { id: k.id, label: \`Move to \${k.title}\` })` },
      onSelect: {
        $action: 'spaceStore.moveCardToColumn',
        args: [{ $: from }, { $: 'arg.id' }, { $: 'task.id' }],
      },
    },
  };
}

export interface TaskBoardOptions {
  /** The board's record id, as an expression. */
  boardId: SchemaProp;
  /** `scope` for the task query — `anchorScope()` narrows the board to one container's work. */
  scope?: QueryStateField['scope'];
  /** The anchor a new card is parented to, as an expression. Usually `ANCHOR_ID` or a call. */
  anchorId?: SchemaProp;
  /** Shown when there is no work here at all. */
  empty: SchemaNode;
  /** Show the author on each card — see {@link TaskCardOptions.byline}. */
  byline?: boolean;
}

/** Adding a card straight into the column somebody pressed `+` on. */
function addCardModal(opts: TaskBoardOptions): SchemaNode {
  return formModal({
    open: { $: 'local.addOpen' },
    close: { $setLocal: 'addOpen', value: false },
    // Names the column, so a modal opened from the wrong `+` is obvious before anything is typed.
    title: { $: '`New card in ${col.title}`' },
    size: 'sm',
    localState: { addTitle: { type: 'string', initial: '' } },
    children: [field({ name: 'addTitle', label: 'What needs doing?', placeholder: 'Ship the docs' })],
    disabled: { $: '!local.addTitle' },
    submitLabel: 'Add card',
    /*
      One action rather than `record.create`, because two links have to be right: the task is
      parented to the board's *anchor* so every other call-scoped surface finds it, and linked into
      the column so it opens where the person was looking. A bound column also gives it that
      column's state.
    */
    submit: {
      $action: 'spaceStore.addTaskToColumn',
      args: [{ $: 'col.id' }, { $: 'local.addTitle' }, opts.anchorId ?? ''],
      onSuccess: [{ $setLocal: 'addOpen', value: false }],
    },
  });
}

/** Renaming a column — the label on this board. Its slug, which is its meaning, is untouched. */
const renameModal: SchemaNode = formModal({
  open: { $: 'local.renameOpen' },
  close: { $setLocal: 'renameOpen', value: false },
  title: 'Rename column',
  size: 'sm',
  localState: { renameTitle: { type: 'string', initial: { $: 'col.title' } } },
  children: [field({ name: 'renameTitle', label: 'Column name', placeholder: 'In review' })],
  disabled: { $: '!local.renameTitle' },
  submitLabel: 'Rename',
  submit: {
    $action: 'spaceStore.renameBoardColumn',
    args: [{ $: 'col.id' }, { $: 'local.renameTitle' }],
    onSuccess: [{ $setLocal: 'renameOpen', value: false }],
  },
});

/** The cards of one column, in a drop zone. Shared by every column, bound or lane. */
function columnCards(opts: TaskBoardOptions): SchemaNode {
  const card = taskCard({ actions: moveTaskMenu('col.id'), byline: opts.byline });
  /*
    The draggable box, on a native div rather than on the card.

    A component's non-event props are assigned as DOM *properties*, so the `data-we-id` attribute
    `we-sortable` looks for would never exist on one. This div is also the box the drag geometry
    measures, hence the explicit width.
  */
  const draggable: SchemaNode = {
    type: 'div',
    props: { 'data-we-id': { $: 'task.id' }, style: { width: '100%', cursor: 'grab' } },
    children: [card],
  };
  return {
    type: 'we-sortable',
    props: {
      // The zone is the column's **record id**, which is what makes a drop a two-line write: the
      // event says which zone the card landed in, and the store resolves both ends from those ids.
      zone: { $: 'col.id' },
      group: 'board-cards',
      gap: 'var(--we-space-300)',
      /*
        The zone has to be the whole trough. A drop target is hit-tested by its own bounding
        rectangle, so a sortable holding nothing is a zero-height rectangle and nothing can be
        dropped into it — which is exactly the column you most need to drop into, an empty one.
      */
      flex: '1',
      width: '100%',
      onReorder: { $action: 'spaceStore.arrangeColumn', args: [{ $: 'col.id' }, { $: 'arg.detail' }] },
      onMoved: {
        $action: 'spaceStore.moveCardToColumn',
        args: [{ $: 'arg.detail.from' }, { $: 'arg.detail.to' }, { $: 'arg.detail.id' }],
      },
    },
    /*
      Two loops rather than one concatenated list, and this is load-bearing rather than stylistic:
      `+` in the expression language is arithmetic and string joining, so `arranged + unarranged`
      coerces both lists to numbers and answers `0` — an `$each` over which renders nothing at all.
      Two `$each` blocks inside one sortable produce one continuous run of items, which is what the
      primitive reads, and needs no addition to the grammar.
    */
    children: [
      { type: '$each', props: { items: { $: ARRANGED }, as: 'task' }, children: [draggable] },
      { type: '$each', props: { items: { $: UNARRANGED }, as: 'task' }, children: [draggable] },
    ],
  };
}

/** One column: its heading and controls, and the cards in it. */
function column(opts: TaskBoardOptions): SchemaNode {
  return {
    type: 'div',
    // The column is an item of the board's own sortable, so it carries the id that one drags by.
    props: { 'data-we-id': { $: 'col.id' }, style: { flex: '0 0 auto' } },
    children: [
      {
        type: 'Column',
        // One per column, because the modals are inside the `$each` — which is also what makes
        // per-column state possible without a name per column, since `$localState` names are fixed
        // when a schema is written and the columns are data.
        $localState: {
          addOpen: { type: 'boolean', initial: false },
          renameOpen: { type: 'boolean', initial: false },
        },
        props: {
          /*
            A column has to read as a *trough* even when empty, or a board with one card in it looks
            like a card with a stray heading. Sunken is right here and the cards inside it are
            `surface`: the column is the one place on the route genuinely recessed into the page.
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
            /*
              The grab area for reordering columns, on a native div for the reason `data-we-id` is:
              a component's non-event props are assigned as DOM *properties*, so the attribute
              `we-sortable` looks for would never exist on a `Row`. Without a handle a press on a
              *card* would start dragging the whole column, since an item with none drags from
              anywhere.
            */
            type: 'div',
            props: { 'data-we-handle': true, style: { width: '100%' } },
            children: [
              {
                type: 'Row',
                props: { gap: '200', ay: 'center', width: '100%' },
                children: [
                  {
                    type: 'we-text',
                    props: {
                      variant: 'footnote',
                      uppercase: true,
                      truncate: true,
                      // A lane claims no shared meaning, so it takes no state colour.
                      color: { $: `col.slug ? (${HEADING_COLOR}) : 'text-muted'` },
                    },
                    children: [{ $: 'col.title' }],
                  },
                  // Says which columns propagate and which do not, at the only moment it matters.
                  {
                    type: '$if',
                    props: {
                      condition: { $: '!col.slug' },
                      then: {
                        type: 'we-badge',
                        props: {
                          size: 'xs',
                          variant: 'neutral',
                          title: 'A lane on this board only — dropping a card here changes no state',
                        },
                        children: ['lane'],
                      },
                    },
                  },
                  {
                    type: 'we-text',
                    props: {
                      variant: 'footnote',
                      color: 'text-muted',
                      ml: 'auto',
                      text: { $: `count(${ARRANGED}) + count(${UNARRANGED})` },
                    },
                  },
                  {
                    type: 'we-button',
                    props: {
                      variant: 'ghost',
                      size: 'xs',
                      square: true,
                      title: { $: '`Add a card to ${col.title}`' },
                      onClick: { $setLocal: 'addOpen', value: true },
                    },
                    children: [{ type: 'we-icon', props: { name: 'plus' } }],
                  },
                  {
                    type: 'DropdownMenu',
                    props: {
                      triggerIcon: 'dots-three',
                      triggerTitle: 'Column options',
                      size: 'xs',
                      items: [
                        { id: 'rename', label: 'Rename' },
                        { id: 'remove', label: 'Remove column', variant: 'danger' },
                      ],
                      onSelect: [
                        {
                          $if: {
                            condition: { $: "arg.id == 'rename'" },
                            then: { $setLocal: 'renameOpen', value: true },
                            // Removing takes the column record and nothing else: the cards keep their
                            // state, so they reappear in another column bound to it or in Unplaced.
                            else: {
                              $action: 'spaceStore.removeBoardColumn',
                              args: [opts.boardId, { $: 'col.id' }],
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          addCardModal(opts),
          renameModal,
          columnCards(opts),
        ],
      },
    ],
  };
}

/** Work no column here claims — shown only when there is some, and cleared through a card's menu. */
function unplacedColumn(opts: TaskBoardOptions): SchemaNode {
  return {
    type: '$if',
    props: {
      condition: { $: `count(${UNPLACED})` },
      then: {
        type: 'Column',
        props: {
          width: '300px',
          minHeight: '240px',
          flex: '0 0 auto',
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
                children: ['Unplaced'],
              },
              {
                type: 'we-text',
                props: { variant: 'footnote', color: 'text-muted', ml: 'auto', text: { $: `count(${UNPLACED})` } },
              },
            ],
          },
          {
            type: 'we-text',
            props: { fontSize: '200', color: 'text-muted' },
            children: ['This board has no column for the state these are in. Move them somewhere it does.'],
          },
          /*
            No drop zone, deliberately: there is no state to drop *into*, so a zone here could only
            take a card and do nothing with it. The card's own menu is the way out, which makes this
            column self-clearing — rescue the work and it disappears.
          */
          {
            type: '$each',
            props: { items: { $: UNPLACED }, as: 'task' },
            children: [taskCard({ actions: moveTaskMenu("''"), byline: opts.byline })],
          },
        ],
      },
    },
  };
}

/** Adding a column — a state everybody shares, or a lane of this board's own. */
function addColumnModal(opts: TaskBoardOptions): SchemaNode {
  return formModal({
    open: { $: 'local.addColumnOpen' },
    close: { $setLocal: 'addColumnOpen', value: false },
    title: 'New column',
    size: 'sm',
    localState: {
      columnName: { type: 'string', initial: '' },
      /*
        Empty means a lane. The picker offers the space's states, so the ordinary case — "this board
        should also show Blocked" — is one choice rather than a name somebody has to spell the same
        way twice.
      */
      columnSlug: { type: 'string', initial: '' },
    },
    children: [
      {
        type: 'we-form-field',
        props: {
          label: 'A state everyone shares',
          description: 'Cards dropped here change state on every board. Leave empty for a lane on this board only.',
        },
        children: [
          {
            type: 'we-select',
            props: {
              placeholder: 'A lane on this board only',
              value: { $: 'local.columnSlug' },
              options: {
                $: `spaceStore.offeredTaskStates.filter(s, !${COLUMNS}.exists(k, k.slug == s.slug)).map(s, { label: s.name, value: s.slug })`,
              },
              // Naming the state names the column, so the common case needs one choice, not two.
              onChange: [
                { $setLocal: 'columnSlug', value: { $: 'event.detail' } },
                { $setLocal: 'columnName', value: { $: 'find(spaceStore.taskStates, { slug: event.detail }).name' } },
              ],
            },
          },
        ],
      },
      field({ name: 'columnName', label: 'Column name', placeholder: 'Waiting on Ana' }),
    ],
    disabled: { $: '!local.columnName' },
    submitLabel: 'Add column',
    submit: {
      $action: 'spaceStore.addBoardColumn',
      args: [opts.boardId, { $: 'local.columnName' }, { $: 'local.columnSlug' }],
      onSuccess: [{ $setLocal: 'addColumnOpen', value: false }],
    },
  });
}

export function taskBoard(opts: TaskBoardOptions): SchemaNode {
  return {
    type: 'Column',
    props: { width: '100%', gap: '300' },
    $localState: { addColumnOpen: { type: 'boolean', initial: false } },
    /*
      Two subscriptions for the whole board.

      `board` brings the structure back in one query — columns in order, each with its cards — which
      is what lets a column ask about its siblings (is this card placed somewhere else?) without a
      query per column. `allTasks` is the membership side: everything in scope, which each bound
      column filters by its own slug.

      The tasks are hydrated twice, once as column children and once here. That is the cost of
      having both facts available to one expression, and it is bounded by the board's own limit.
    */
    $queries: {
      board: {
        entity: 'CollectionBlock',
        where: { id: opts.boardId as Record<string, unknown> },
        include: { children: { include: { children: true } } },
        limit: 1,
      },
      allTasks: {
        entity: 'TaskBlock',
        ...(opts.scope && { scope: opts.scope }),
        order: { createdAt: 'asc' },
        limit: 200,
      },
    },
    children: [
      addColumnModal(opts),
      {
        type: '$if',
        props: {
          condition: { $: `count(${COLUMNS}) || count(local.allTasks)` },
          then: {
            type: 'we-sortable',
            props: {
              // The columns are themselves a sortable, in its own group so a card can never be
              // dropped among them. Each column drags by its heading — see the handle there.
              direction: 'horizontal',
              zone: 'columns',
              group: 'board-columns',
              gap: 'var(--we-space-400)',
              width: '100%',
              ay: 'start',
              overflowX: 'auto',
              onReorder: {
                $action: 'spaceStore.reorderBoardColumns',
                args: [opts.boardId, { $: 'arg.detail' }],
              },
            },
            children: [
              { type: '$each', props: { items: { $: COLUMNS }, as: 'col' }, children: [column(opts)] },
              unplacedColumn(opts),
            ],
          },
          // Gated on the query having answered: an empty first frame is not an empty board.
          else: { type: '$if', props: { condition: { $: 'local.allTasksLoaded' }, then: opts.empty } },
        },
      },
      {
        type: 'Row',
        props: { width: '100%', gap: '300', ay: 'center' },
        children: [
          {
            type: 'we-button',
            props: { variant: 'ghost', size: 'sm', onClick: { $setLocal: 'addColumnOpen', value: true } },
            children: [
              { type: 'we-icon', props: { name: 'plus' } },
              { type: 'we-text', children: ['Add column'] },
            ],
          },
          {
            type: 'we-text',
            props: { variant: 'footnote', color: 'text-faint' },
            children: ['Columns are this board’s own. States everyone shares are named in Settings → Vocabulary.'],
          },
        ],
      },
    ],
  };
}
