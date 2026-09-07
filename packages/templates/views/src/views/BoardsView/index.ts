import type { SchemaNode, TemplateSchema } from '@we/schema-shared';
import { emptyState, field, formModal } from '@we/template-kit';

/**
 * Boards — the same tasks as the Tasks view, in an order somebody chose.
 *
 * ## What a board is, and what it is not
 *
 * A board is a `CollectionBlock` (`kind: 'board'`, `mode: 'feed'`) whose ordered `children` are the
 * cards somebody has arranged. It does **not** own its tasks. Membership in a column comes from the
 * task's state, exactly as it does on the Tasks view; `children` says only where a card sits.
 *
 * That split is the whole design, and every property worth having follows from it:
 *
 * - **A board can never hide work.** Delete the board and every task is still in its state. Take a
 *   card out of `children` and it still appears, merely unpositioned — at the end, which is the
 *   behaviour an ordered relation already gives a member with no entry.
 * - **A task appears the moment it exists.** Extraction writes a state and no board, so there is
 *   nothing to place and no backlog to fish it out of. This is why a column is not a container: a
 *   model emits forward relations from the instance it creates, and a card's membership would be a
 *   link from the column — the wrong direction.
 * - **The same task sits differently on two boards.** Position is a fact about the pair, so each
 *   board keeps its own `children`. State is a fact about the work, so both boards agree on it. A
 *   card marked done on one board is done on the other, which is the answer somebody expects.
 *
 * It is the same relationship AD4M's ordering entries have to the links they order — position hints
 * over a membership something else defines — one level up.
 *
 * ## Why the columns are the space's states
 *
 * Because two boards showing the same task must not disagree about whether it is finished. A lane
 * that claims a shared meaning has to share it; a lane that is purely local must not. Every column
 * here claims one, so every column binds to a state, and a community changes what the columns are by
 * changing its vocabulary in Settings → Vocabulary.
 *
 * Local lanes — "Thursday", "Waiting on Ana" — are the additive half of that design and are not
 * built. They need containment membership rather than a query, which the ordered `children` relation
 * already supports, so nothing here has to change to gain them.
 */

/** The board being read, with the cards somebody has arranged on it, in order. */
const boardQuery = {
  entity: 'CollectionBlock',
  where: { id: { $: 'local.boardId' } },
  include: { children: true },
  limit: 1,
};

/**
 * Every task in one state.
 *
 * Membership, not arrangement — the column shows these whether or not anybody has positioned them.
 */
const columnTasks = {
  entity: 'TaskBlock',
  where: { status: { $: 'state.slug' } },
  order: { createdAt: 'asc' },
  limit: 100,
};

/**
 * The cards of this column, arranged first and unarranged after.
 *
 * The board's `children` come back in its own order, so filtering them by state yields this column's
 * arrangement directly — no sort, because the order is already the data. Anything in the state that
 * nobody has placed follows, oldest first, which is what "a member with no entry appends" means when
 * a person is looking at it.
 */
const ARRANGED = 'first(local.board).children.filter(c, c.status == state.slug)';
const ARRANGED_IDS = `${ARRANGED}.map(c, c.id)`;
const UNARRANGED = `local.columnTasks.filter(t, !(t.id in ${ARRANGED_IDS}))`;
const COLUMN_CARDS = `${ARRANGED} + ${UNARRANGED}`;

const HEADING_COLOR =
  "state.color ? state.color : state.semantic == 'done' ? 'success-text' : state.semantic == 'active' ? 'accent-text' : 'text-muted'";

/** One card. Deliberately the same shape the Tasks view uses, so the two read as one thing. */
const cardBody: SchemaNode = {
  type: 'Column',
  props: { width: '100%', gap: '200', bg: 'surface', r: '300', p: '300', border: '1px solid border' },
  children: [
    { type: 'we-text', props: { fontWeight: 'semibold' }, children: [{ $: 'task.title' }] },
    {
      type: '$if',
      props: {
        condition: { $: 'task.description' },
        then: {
          type: 'we-text',
          props: { fontSize: '200', color: 'text-muted', truncate: true },
          children: [{ $: 'task.description' }],
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
            condition: { $: "task.priority != 'medium'" },
            then: {
              type: 'we-badge',
              props: { size: 'xs', variant: { $: "task.priority == 'high' ? 'danger' : 'neutral'" } },
              children: [{ $: 'task.priority' }],
            },
          },
        },
        {
          type: '$if',
          props: {
            condition: { $: 'task.assignee' },
            then: {
              type: 'we-text',
              props: { fontSize: '200', color: 'text-muted', ml: 'auto' },
              children: [{ $: '`@${task.assignee}`' }],
            },
          },
        },
      ],
    },
  ],
};

/*
  The draggable box, on a native div rather than the Column.

  A component's non-event props are assigned as DOM *properties*, so the `data-we-id` attribute
  `we-sortable` looks for would never exist on one — the same reason the Tasks view and the sidebar
  rail both wrap their rows this way. This div is also the box the drag geometry measures, hence the
  explicit width.
*/
const card: SchemaNode = {
  type: 'div',
  props: { 'data-we-id': { $: 'task.id' }, style: { width: '100%', cursor: 'grab' } },
  children: [cardBody],
};

/** One column: a state, and the cards in it. */
const column: SchemaNode = {
  type: 'Column',
  $queries: { columnTasks },
  props: {
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
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-muted', ml: 'auto', text: { $: 'count(local.columnTasks)' } },
        },
      ],
    },
    {
      type: 'we-sortable',
      props: {
        zone: { $: 'state.slug' },
        group: 'board',
        gap: 'var(--we-space-300)',
        // The zone must be the whole trough, or an empty column is a zero-height rectangle nothing
        // can be dropped into — see the note in the Tasks view.
        flex: '1',
        width: '100%',
        /*
          Two different events, because a drag within a column and a drag across one change different
          facts. `onReorder` carries this zone's new order and writes only this board's arrangement.
          `onMoved` carries the zone landed in — a state — and writes the task's own status, which
          every other surface reads.
        */
        onReorder: {
          $action: 'spaceStore.arrangeBoardColumn',
          args: [{ $: 'local.boardId' }, { $: 'arg.detail' }],
        },
        onMoved: {
          $action: 'spaceStore.moveTaskOnBoard',
          args: [{ $: 'local.boardId' }, { $: 'arg.detail.id' }, { $: 'arg.detail.to' }],
        },
      },
      children: [
        {
          type: '$each',
          props: { items: { $: COLUMN_CARDS }, as: 'task' },
          children: [card],
        },
      ],
    },
  ],
};

const createModal: SchemaNode = formModal({
  open: { $: 'local.createBoardOpen' },
  close: { $setLocal: 'createBoardOpen', value: false },
  title: 'New board',
  size: 'sm',
  localState: { boardTitle: { type: 'string', initial: '' } },
  children: [field({ name: 'boardTitle', label: 'What is this board for?', placeholder: 'Sprint 12' })],
  disabled: { $: '!local.boardTitle' },
  submitLabel: 'Create board',
  submit: { $action: 'spaceStore.createBoard', args: [{ $: 'local.boardTitle' }] },
});

/** The boards this space has, as a list to pick from. */
const boardList: SchemaNode = {
  type: 'Column',
  props: { width: '100%', gap: '300' },
  children: [
    {
      type: '$if',
      props: {
        condition: { $: 'count(local.boards)' },
        then: {
          type: '$each',
          props: { items: { $: 'local.boards' }, as: 'board' },
          children: [
            {
              type: 'we-button',
              props: {
                variant: 'bare',
                width: '100%',
                onClick: { $setLocal: 'boardId', value: { $: 'board.id' } },
              },
              children: [
                {
                  type: 'Row',
                  props: {
                    width: '100%',
                    gap: '300',
                    ay: 'center',
                    p: '300',
                    bg: 'surface',
                    r: '300',
                    border: '1px solid border',
                    hoverProps: { bg: 'surface-hover' },
                  },
                  children: [
                    { type: 'we-icon', props: { name: 'kanban', color: 'accent-text' } },
                    { type: 'we-text', props: { fontWeight: 'semibold' }, children: [{ $: 'board.title' }] },
                  ],
                },
              ],
            },
          ],
        },
        else: emptyState({
          icon: 'kanban',
          label: 'boards',
          message:
            'No boards yet. A board arranges the tasks this space already has — making one never moves work, and deleting one never loses any.',
        }),
      },
    },
  ],
};

/** One board, opened. */
const boardDetail: SchemaNode = {
  type: 'Column',
  props: { width: '100%', gap: '400' },
  $queries: { board: boardQuery },
  children: [
    {
      type: 'Row',
      props: { width: '100%', gap: '300', ay: 'center' },
      children: [
        {
          type: 'we-button',
          props: { variant: 'ghost', size: 'sm', onClick: { $setLocal: 'boardId', value: '' } },
          children: [
            { type: 'we-icon', props: { name: 'arrow-left' } },
            { type: 'we-text', children: ['All boards'] },
          ],
        },
        {
          type: 'we-text',
          props: { variant: 'heading-sm' },
          children: [{ $: 'first(local.board).title' }],
        },
      ],
    },
    {
      type: 'Row',
      props: { width: '100%', gap: '400', ay: 'start', overflow: 'auto' },
      children: [{ type: '$each', props: { items: { $: 'spaceStore.taskStates' }, as: 'state' }, children: [column] }],
    },
    {
      type: 'we-text',
      props: { variant: 'footnote', color: 'text-faint' },
      children: ['Columns come from this space’s task states. Add or rename them in Settings → Vocabulary.'],
    },
  ],
};

export const boardsView: TemplateSchema = {
  meta: {
    name: 'Boards',
    description: "The space's tasks arranged on boards — the same work, in an order somebody chose",
    icon: 'kanban',
    role: 'view',
    segment: 'boards',
  },
  type: 'Column',
  props: { width: '100%', ax: 'center', p: '500' },
  /*
    `boardId` mirrors into the URL because it is view state: somebody sharing a link to a board means
    the board, and the recipient should see what the sender saw. `createBoardOpen` stays ephemeral —
    a half-open modal is nobody else's business.
  */
  $localState: {
    boardId: { type: 'string', initial: '', syncParam: { name: 'board', push: true } },
    createBoardOpen: { type: 'boolean', initial: false },
  },
  $queries: {
    boards: { entity: 'CollectionBlock', where: { kind: 'board' }, order: { createdAt: 'desc' }, limit: 50 },
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
            { type: 'we-text', props: { variant: 'heading-sm' }, children: ['Boards'] },
            {
              type: 'we-button',
              props: { size: 'sm', ml: 'auto', onClick: { $setLocal: 'createBoardOpen', value: true } },
              children: ['New board'],
            },
          ],
        },
        createModal,
        { type: '$if', props: { condition: { $: 'local.boardId' }, then: boardDetail, else: boardList } },
      ],
    },
  ],
};
