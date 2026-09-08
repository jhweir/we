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

/** The board record, read for one thing: the order it puts its columns in. */
const BOARD = 'first(local.board)';

/**
 * The columns, as records, in the order the board puts them.
 *
 * Two subscriptions rather than one, and the split is what makes the board update at all.
 *
 * A card moving between columns changes a **column's** links. The board's own links are untouched —
 * its children are the columns, and they are the same columns in the same order — so a subscription
 * on the board is not obliged to re-run, and a card hydrated through the board's `include` could
 * stay as it was until something else happened to invalidate the query. That showed up as a move
 * that did not appear until the route was left and come back to, and as a card drawn in two columns
 * at once because two parts of one render disagreed about which column held it.
 *
 * So each subscription now covers exactly what changes under it: the board for the column *order*,
 * which changes only when columns are added, removed or rearranged; and the columns themselves for
 * their contents, where a record whose own links changed is a record the query is watching.
 *
 * The board is still the source of order, because a `scope` lowers to a filter by parent link and
 * loses it — only reading the ordered relation gives the sequence back.
 */
const COLUMNS = `${BOARD}.children.map(c, find(local.columns, { id: c.id })).filter(k, k.id)`;

/**
 * Whether a card is positioned somewhere on this board that currently shows it.
 *
 * The `!k.slug ||` half is what keeps a stale hint from hiding work. A card whose state was changed
 * on another surface still has a hint in the column it used to be in; that column no longer shows it
 * (its arranged list filters on the slug), so if this counted the card as placed it would vanish
 * from the board entirely. Reading "placed" as *placed somewhere that shows it* means the card falls
 * back to being unarranged in whichever column its state now names.
 */
export const PLACED_EXPR = `${COLUMNS}.exists(k, (!k.slug || k.slug == t.status) && t.id in k.children)`;

/**
 * Whether this board draws work in, or only shows what somebody put on it.
 *
 * Two kinds gather. **Everything** is the space's catch-all: nothing in the space can hide from it,
 * which is the property that lets every other board be curated. **A container's board** — a call's —
 * gathers that container's work, so a pass that extracts three tasks puts them on it without anyone
 * placing anything.
 *
 * A board somebody *made* gathers nothing. That is the difference between a workstream and a view of
 * everything: a hiring board and a content calendar hold different work, and a board that showed the
 * whole space would make every board a duplicate of every other with different column headings.
 *
 * Supplied by the caller rather than read off the board, because which board is canonical is a fact
 * about its **container** — `Space.board`, `CollectionBlock.board` — and the board record cannot see
 * a link pointing at it. A marker on the board would be visible from here and is the design this
 * replaced: it could not stop two boards claiming to be the one, where a single-valued link
 * converges.
 */
const gathersOf = (opts: TaskBoardOptions) => (opts.gathers ? `(${opts.gathers})` : 'false');

/**
 * The work this board could show: everything in scope, or only what it holds.
 *
 * A made board's **membership is the union of its columns' children** — no separate relation, and
 * nothing to keep in step with the columns. Placing a card anywhere on the board makes it a member;
 * which *column* shows it is still its `status`, so a member marked done elsewhere moves to this
 * board's done column rather than disappearing from it.
 */
const poolOf = (opts: TaskBoardOptions) =>
  `${gathersOf(opts)} ? local.allTasks : local.allTasks.filter(m, ${COLUMNS}.exists(k, m.id in k.children))`;

/**
 * The cards somebody has arranged in this column: its own children, minus any stale hint.
 *
 * `col.children` comes back as **ids**, not records, and deliberately so. The board is read with
 * `include: { children: true }`, which hydrates the columns — but a second hop to hydrate *their*
 * children cannot work: `children` is polymorphic, so the ORM does not know what class the columns
 * are until it has read them, and therefore cannot look up the relation metadata for the level
 * below. A nested include here fails at the backend with "the relation declares no target class".
 *
 * So the ids are resolved against `local.allTasks`, which this board is already subscribed to. That
 * is cheaper as well as possible: the tasks are hydrated once rather than twice.
 *
 * An id that resolves to nothing drops out — a card outside this board's scope, or one deleted since
 * the hint was written. `c.id &&` is what does it, since reading a field off nothing is `undefined`
 * rather than an error.
 */
export const ARRANGED_EXPR = `col.children.map(i, find(local.allTasks, { id: i })).filter(c, c.id && (!col.slug || c.status == col.slug))`;

/**
 * The cards this column's state gathers that nobody has positioned.
 *
 * Empty for a lane, which gathers nothing — that is the whole difference between the two kinds.
 */
export const unarrangedExpr = (opts: TaskBoardOptions) =>
  `col.slug ? (${poolOf(opts)}).filter(t, t.status == col.slug && !(${PLACED_EXPR})) : []`;

/**
 * Work this board has nowhere to put: a state no column here names.
 *
 * Retired, deleted, invented by an agent writing through MCP, or simply named after this board was
 * made — a board's columns are its own, so a state added later does not appear on it. Whatever the
 * cause, the work is real and somebody has to be able to reach it. Filtering it out would be tidier
 * and would hide work, which is the one failure this whole design exists to prevent.
 */
export const unplacedExpr = (opts: TaskBoardOptions) =>
  `(${poolOf(opts)}).filter(t, !(${PLACED_EXPR}) && !${COLUMNS}.exists(k, k.slug == t.status))`;

/**
 * The colour a column heading takes when the community has not chosen one.
 *
 * Looked up by slug rather than stored on the column, so a state recoloured in the vocabulary
 * recolours every board at once — the colour is a fact about the state, not about this board.
 */
const STATE = 'find(spaceStore.taskStates, { slug: col.slug })';
const HEADING_COLOR =
  `${STATE}.color ? ${STATE}.color : ` +
  `${STATE}.semantic == 'done' ? 'success-text' : ` +
  `${STATE}.semantic == 'cancelled' ? 'text-faint' : ` +
  `${STATE}.semantic == 'active' ? 'accent-text' : ` +
  `${STATE}.semantic == 'blocked' ? 'warning-text' : 'text-muted'`;

/**
 * The icon a column heading carries: the community's own, or the shape its semantic implies.
 *
 * Falling back rather than showing nothing where a state has no icon, so a board does not come out
 * ragged — some columns marked and some not — the first time somebody sets one. The shapes are the
 * same ones Settings → Vocabulary draws, so a state reads the same in both places, and they carry
 * the distinction the five semantics exist for: stuck and dropped are visible at a glance rather
 * than only in the column's name.
 */
const HEADING_ICON =
  `${STATE}.icon ? ${STATE}.icon : ` +
  `${STATE}.semantic == 'done' ? 'check-circle' : ` +
  `${STATE}.semantic == 'cancelled' ? 'x-circle' : ` +
  `${STATE}.semantic == 'active' ? 'circle-half' : ` +
  `${STATE}.semantic == 'blocked' ? 'warning-circle' : 'circle'`;

export interface TaskCardOptions {
  /** Controls shown at the end of the card's meta row — usually {@link moveTaskMenu}. */
  actions?: SchemaNode;
  /** Context key the card reads. Defaults to `'task'`, which is what {@link taskBoard} binds. */
  as?: string;
  /**
   * When to show the card's state on it — an expression, evaluated per row. Omit for never.
   *
   * A bound column *is* the state, so a badge there would repeat the column's own heading on every
   * card. The two places it is worth showing are the ones where the column says nothing about it: a
   * **lane**, which claims no state and deliberately leaves a card's alone, and the **unplaced**
   * column, whose whole meaning is "no column here names this card's state". Those are exactly the
   * cards whose state is otherwise invisible.
   */
  showState?: string;
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
          // The card's state, where the caller says the column does not already give it away.
          {
            type: '$if',
            props: {
              condition: { $: `(${opts.showState ?? 'false'}) && ${as}.status` },
              then: {
                type: 'we-badge',
                props: {
                  size: 'xs',
                  variant: 'neutral',
                  title: 'The state this work is in — a lane does not change it',
                },
                children: [
                  {
                    $: `find(spaceStore.taskStates, { slug: ${as}.status }).name ?? ${as}.status`,
                  },
                ],
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
  /**
   * Whether this board draws work in — an expression. Omit for a board somebody made.
   *
   * True for the space's own board and for a container's, which are the two the container points at
   * through `Space.board` / `CollectionBlock.board`. See {@link gathersOf}.
   */
  gathers?: string;
}

/**
 * Adding a card to the column somebody pressed `+` on — a new one, or work that already exists.
 *
 * Both, in one modal, because a curated board that could only hold work *born on it* would be nearly
 * as useless as one that showed everything: you could never build a sprint board out of a backlog.
 * The picker offers anything in scope this board does not already hold.
 *
 * The Pocket would be the nicer route for moving several cards between boards, and is deliberately
 * closed to a template: `modules.pocket.gather` is chrome-only, because the Pocket writes to the
 * agent's own root dataset and a space template arriving from a stranger must not be able to file
 * things there or enumerate what somebody keeps. The interaction it leaves open — a button that
 * opens the panel, and the person drags the card in themselves — needs the drag arbitration
 * `we-draggable` and `we-sortable` do not yet have, since both claim `pointerdown`. So: a picker.
 */
function addCardModal(opts: TaskBoardOptions): SchemaNode {
  return formModal({
    open: { $: 'local.addOpen' },
    close: { $setLocal: 'addOpen', value: false },
    // Names the column, so a modal opened from the wrong `+` is obvious before anything is typed.
    title: { $: '`Add to ${col.title}`' },
    size: 'sm',
    localState: {
      addTitle: { type: 'string', initial: '' },
      addExisting: { type: 'string', initial: '' },
    },
    children: [
      field({ name: 'addTitle', label: 'What needs doing?', placeholder: 'Ship the docs' }),
      {
        type: 'we-form-field',
        props: { label: 'Or bring in work that already exists' },
        children: [
          {
            type: 'we-select',
            props: {
              placeholder: 'Nothing selected',
              searchable: true,
              value: { $: 'local.addExisting' },
              // Anything in scope this board is not already holding — which for a made board is the
              // whole space, and for a call's board is that call's work.
              options: {
                $: `local.allTasks.filter(t, !${COLUMNS}.exists(k, t.id in k.children)).map(t, { label: t.title, value: t.id })`,
              },
              onChange: { $setLocal: 'addExisting', value: { $: 'event.detail' } },
            },
          },
        ],
      },
    ],
    disabled: { $: '!local.addTitle && !local.addExisting' },
    submitLabel: 'Add',
    /*
      One or the other. Bringing in an existing card is a *move into this column* — the same action a
      drag makes, so it writes the state the column names, exactly as dropping it there would.
      Creating one goes through `addTaskToColumn`, which parents it to the board's anchor as well so
      every other scoped surface finds it.
    */
    submit: {
      $if: {
        condition: { $: 'local.addExisting' },
        then: {
          $action: 'spaceStore.moveCardToColumn',
          args: ['', { $: 'col.id' }, { $: 'local.addExisting' }],
          onSuccess: [{ $setLocal: 'addOpen', value: false }],
        },
        else: {
          $action: 'spaceStore.addTaskToColumn',
          args: [{ $: 'col.id' }, { $: 'local.addTitle' }, opts.anchorId ?? ''],
          onSuccess: [{ $setLocal: 'addOpen', value: false }],
        },
      },
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
  const card = taskCard({ actions: moveTaskMenu('col.id'), byline: opts.byline, showState: '!col.slug' });
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
      /*
        `ids` is the target column's whole new order, with the card already at the index it was
        dropped at — so a cross-column drop seats it where the pointer put it. Without it the store
        can only append, which is what "move to that column" means from the menu and not what a drag
        means.
      */
      onMoved: {
        $action: 'spaceStore.moveCardToColumn',
        args: [{ $: 'arg.detail.from' }, { $: 'arg.detail.to' }, { $: 'arg.detail.id' }, { $: 'arg.detail.ids' }],
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
      { type: '$each', props: { items: { $: ARRANGED_EXPR }, as: 'task' }, children: [draggable] },
      { type: '$each', props: { items: { $: unarrangedExpr(opts) }, as: 'task' }, children: [draggable] },
    ],
  };
}

/** One column: its heading and controls, and the cards in it. */
function column(opts: TaskBoardOptions): SchemaNode {
  return {
    type: 'div',
    /*
      The column is an item of the board's own sortable, so it carries the id that one drags by — and
      the *whole* column drags, not a grip on its heading.

      No `data-we-handle`, because nesting already arbitrates: the cards' sortable sits inside this
      element and claims the press through `dragSession` before this one sees it. So pressing a card
      drags the card, and pressing anywhere else — the heading, the padding, the empty trough below
      the cards — drags the column. A handle was narrower than that and, worse, invisible: nothing on
      screen said the heading could be dragged at all, which is what `cursor: grab` now says.
    */
    props: { 'data-we-id': { $: 'col.id' }, style: { flex: '0 0 auto', cursor: 'grab' } },
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
            type: 'Row',
            props: { gap: '200', ay: 'center', width: '100%' },
            children: [
              // The state's own icon, where the community picked one. A lane has no state and so none.
              {
                type: '$if',
                props: {
                  // A lane stands for no state, so it has no shape to fall back to either.
                  condition: { $: 'col.slug' },
                  then: {
                    type: 'we-icon',
                    props: { name: { $: `(${HEADING_ICON})` }, size: 'xs', color: { $: HEADING_COLOR } },
                  },
                },
              },
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
                  text: { $: `count(${ARRANGED_EXPR}) + count(${unarrangedExpr(opts)})` },
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
      condition: { $: `count(${unplacedExpr(opts)})` },
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
                props: {
                  variant: 'footnote',
                  color: 'text-muted',
                  ml: 'auto',
                  text: { $: `count(${unplacedExpr(opts)})` },
                },
              },
            ],
          },
          {
            type: 'we-text',
            props: { fontSize: '200', color: 'text-muted' },
            children: ['This board has no column for the state these are in. Move them somewhere it does.'],
          },
          /*
            A zone you can drag *out* of and never into.

            `locked` refuses incoming drops while leaving the press that starts a drag alone, which is
            exactly the asymmetry this column wants: there is no state to drop *into* here, so taking
            a card would mean taking it and doing nothing. It used to have no zone at all, on that
            reasoning — but the reasoning was one-directional. Dragging a card *out* is the whole
            rescue, and without it the only way out was the menu, which puts a card at the end of its
            new column and needs a second drag to place it.

            The card's menu stays for the keyboard.
          */
          {
            type: 'we-sortable',
            props: {
              zone: 'unplaced',
              group: 'board-cards',
              locked: true,
              gap: 'var(--we-space-300)',
              width: '100%',
              flex: '1',
              /*
                The drop is reported on the zone the card *left*, so this column needs its own
                handler — its events no longer bubble to a shared one above, which is what stops a
                card drag rewriting the board's columns.

                `from` is `'unplaced'`, which resolves to no record, so nothing is unlinked: there was
                no placement to undo. What matters is the target, which adds the card and — being a
                bound column — writes its state, so a card here because it was `blocked` on a board
                with no blocked column becomes `todo` by being dropped in To do. That is the rescue
                this column exists for.
              */
              onMoved: {
                $action: 'spaceStore.moveCardToColumn',
                // No `from`, given literally rather than forwarded: `arg.detail.from` is this zone's
                // *name*, and a name is not a record id — passing `'unplaced'` had the backend try to
                // parse it as an IRI and refuse the whole query. There is nothing to unlink anyway.
                args: ['', { $: 'arg.detail.to' }, { $: 'arg.detail.id' }, { $: 'arg.detail.ids' }],
              },
            },
            children: [
              {
                type: '$each',
                props: { items: { $: unplacedExpr(opts) }, as: 'task' },
                children: [
                  {
                    type: 'div',
                    props: { 'data-we-id': { $: 'task.id' }, style: { width: '100%', cursor: 'grab' } },
                    children: [taskCard({ actions: moveTaskMenu("''"), byline: opts.byline, showState: 'true' })],
                  },
                ],
              },
            ],
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

      `board` and `columns` together bring the structure back — the order from one, the contents from
      the other, for the reason `COLUMNS` gives. Between them a column can ask about its siblings (is
      this card placed somewhere else?) without a query per column. `allTasks` is the membership
      side: everything in scope, which each bound column filters by its own slug and which the
      arranged ids resolve against.
    */
    $queries: {
      /*
        The board, for the order of its columns and nothing else — see `COLUMNS`. One level of
        `include`, because a second hop through a polymorphic relation cannot be hydrated: the ORM
        does not know what class the columns are until it has read them.
      */
      board: {
        entity: 'CollectionBlock',
        where: { id: opts.boardId as Record<string, unknown> },
        include: { children: true },
        limit: 1,
      },
      /* The columns as records of their own, so a change to one is a change this query is watching. */
      columns: {
        entity: 'CollectionBlock',
        where: { kind: 'column' },
        scope: { anchor: 'CollectionBlock', via: 'children', anchorId: opts.boardId as Record<string, unknown> },
        limit: 50,
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
          /*
            The columns decide whether there is a board to show, not the work.

            It used to fall back to the tasks as well, so a board whose record had not arrived still
            drew everything in the space. That was a safety net when every board gathered; it is
            wrong now that a made board is meant to start empty, and it would make one indisplayable
            from a board that had simply not loaded. The catch-all is a *board* — Everything — rather
            than a fallback inside every board, so the honest answer here is the empty state, once
            the query has actually answered.
          */
          condition: { $: `count(${COLUMNS})` },
          then: {
            type: 'Row',
            props: { width: '100%', gap: '400', ay: 'start', overflowX: 'auto' },
            children: [
              {
                type: 'we-sortable',
                props: {
                  // The columns are themselves a sortable, in its own group so a card can never be
                  // dropped among them.
                  direction: 'horizontal',
                  zone: 'columns',
                  group: 'board-columns',
                  gap: 'var(--we-space-400)',
                  ay: 'start',
                  onReorder: {
                    $action: 'spaceStore.reorderBoardColumns',
                    args: [opts.boardId, { $: 'arg.detail' }],
                  },
                },
                children: [{ type: '$each', props: { items: { $: COLUMNS }, as: 'col' }, children: [column(opts)] }],
              },
              /*
                Outside the sortable, because it is not one of the board's columns.

                `we-sortable` treats every child as an item, so sitting inside it made this look
                draggable — it picked up, showed a drop line, and then did nothing, because it has no
                record and no id to reorder. A column with no id is not a column.
              */
              unplacedColumn(opts),
            ],
          },
          // Gated on the *board* having answered: an empty first frame is not an empty board, and
          // the tasks arriving says nothing about whether the columns have.
          else: { type: '$if', props: { condition: { $: 'local.boardLoaded' }, then: opts.empty } },
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
