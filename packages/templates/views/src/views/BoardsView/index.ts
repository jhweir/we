import type { SchemaNode, TemplateSchema } from '@we/schema-shared';
import {
  ANCHOR_ID,
  anchorBanner,
  anchorParent,
  anchorScope,
  COLUMN_TASKS,
  emptyState,
  field,
  formModal,
  moveTaskMenu,
  stateBoard,
  taskCard,
} from '@we/template-kit';

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
 *
 * ## Anchoring
 *
 * `?anchor=<collection id>` narrows both lists: which boards are shown, and which tasks their
 * columns draw from. A board made from a call's page belongs to that call and arranges that call's
 * work, and it is the same parameter and the same `scope` the Tasks and Cards views take. Absent
 * means the space.
 */

/** The board being read, with the cards somebody has arranged on it, in order. */
const boardQuery = {
  entity: 'CollectionBlock',
  where: { id: { $: 'local.boardId' } },
  include: { children: true },
  limit: 1,
};

/**
 * The cards of this column, arranged first and unarranged after.
 *
 * The board's `children` come back in its own order, so filtering them by state yields this column's
 * arrangement directly — no sort, because the order is already the data. Anything in the state that
 * nobody has placed follows, oldest first, which is what "a member with no entry appends" means when
 * a person is looking at it.
 *
 * `local.columnTasks` is the per-column subscription `stateBoard` declares; `state` is the column it
 * binds to. Both are in scope because this expression is evaluated inside the column the fragment
 * renders.
 */
const ARRANGED = 'first(local.board).children.filter(c, c.status == state.slug)';
const ARRANGED_IDS = `${ARRANGED}.map(c, c.id)`;
const UNARRANGED = `${COLUMN_TASKS}.filter(t, !(t.id in ${ARRANGED_IDS}))`;
const COLUMN_CARDS = `${ARRANGED} + ${UNARRANGED}`;

/**
 * Moving a card by menu.
 *
 * The same two writes a cross-column drag makes, reached without a pointer — and the only way out of
 * the stray column, which has no drop zone because there is no state to drop into.
 */
const moveMenu: SchemaNode = moveTaskMenu({
  $action: 'spaceStore.moveTaskOnBoard',
  args: [{ $: 'local.boardId' }, { $: 'task.id' }, { $: 'arg.id' }],
});

const createModal: SchemaNode = formModal({
  open: { $: 'local.createBoardOpen' },
  close: { $setLocal: 'createBoardOpen', value: false },
  title: 'New board',
  size: 'sm',
  localState: { boardTitle: { type: 'string', initial: '' } },
  children: [field({ name: 'boardTitle', label: 'What is this board for?', placeholder: 'Sprint 12' })],
  disabled: { $: '!local.boardTitle' },
  submitLabel: 'Create board',
  // The anchor is passed as the parent, so a board made while the view is narrowed belongs to the
  // container it was made in — otherwise it would be created into a list that does not list it.
  submit: { $action: 'spaceStore.createBoard', args: [{ $: 'local.boardTitle' }, ANCHOR_ID] },
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
    stateBoard({
      scope: anchorScope(),
      createOptions: anchorParent(),
      cards: COLUMN_CARDS,
      card: taskCard({ actions: moveMenu }),
      // Two events rather than one, because a drag within a column and a drag across one change
      // different facts. `onReorder` carries this zone's new order and writes only this board's
      // arrangement; `onMoved` carries the zone landed in — a state — and writes the task's own
      // status, which every other surface reads.
      onReorder: {
        $action: 'spaceStore.arrangeBoardColumn',
        args: [{ $: 'local.boardId' }, { $: 'arg.detail' }],
      },
      onMoved: {
        $action: 'spaceStore.moveTaskOnBoard',
        args: [{ $: 'local.boardId' }, { $: 'arg.detail.id' }, { $: 'arg.detail.to' }],
      },
      // A board is a *layout* of work that exists elsewhere, so an empty one is a statement about
      // the space rather than about the board. It still says where the nearest `+` is: a board with
      // no columns showing is the one place a person cannot see that each column has one.
      empty: emptyState({
        icon: 'check-square',
        label: 'tasks',
        message:
          'No tasks to arrange yet. Add one to a column, or record a call — extraction writes down the work people commit to.',
      }),
      // Its own group, so a board and any other sortable on the page cannot exchange cards.
      group: 'board',
    }),
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
    boards: {
      entity: 'CollectionBlock',
      where: { kind: 'board' },
      scope: anchorScope(),
      order: { createdAt: 'desc' },
      limit: 50,
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
            { type: 'we-text', props: { variant: 'heading-sm' }, children: ['Boards'] },
            {
              type: 'we-button',
              props: { size: 'sm', ml: 'auto', onClick: { $setLocal: 'createBoardOpen', value: true } },
              children: ['New board'],
            },
          ],
        },
        anchorBanner({ label: 'boards' }),
        createModal,
        { type: '$if', props: { condition: { $: 'local.boardId' }, then: boardDetail, else: boardList } },
      ],
    },
  ],
};
