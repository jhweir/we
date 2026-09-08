/**
 * The board's expressions, evaluated against fixture data.
 *
 * These exist because the two worst bugs on this feature were both expressions that **validated and
 * computed the wrong thing**, which no other check in the repo can see:
 *
 * - `arranged + unarranged` — `+` is arithmetic and string joining, so two lists coerced to numbers
 *   and answered `0`. Every column rendered empty.
 * - a nested `include` through a polymorphic relation, which the backend refuses, leaving the board
 *   query empty and every card in the unplaced column.
 *
 * The validator checks grammar, store members and prop names. It cannot check *meaning*. So the four
 * expressions that decide what a column shows are evaluated here against records shaped like the
 * ones the backend returns — columns holding **ids**, tasks holding a `status`.
 */
import { evaluateExpression, getFunction, parseExpression } from '@we/schema-shared';
import { describe, expect, it } from 'vitest';

import { ARRANGED_EXPR, PLACED_EXPR, unarrangedExpr, unplacedExpr } from './taskBoard.ts';

/*
  Whether a board gathers is the caller's to say — it is a fact about the board's *container*, which
  the board record cannot see. These stand in for the two callers: the Boards view comparing the open
  board against `Space.board` / the anchor's `board`, and a made board passing nothing.
*/
const board_ = (gathers?: string): Parameters<typeof unarrangedExpr>[0] => ({
  boardId: { $: 'local.boardId' },
  empty: { type: 'Column' },
  ...(gathers ? { gathers } : {}),
});
const GATHERING = board_('true');
const CURATED = board_();
const UNARRANGED_EXPR = unarrangedExpr(GATHERING);
const UNPLACED_EXPR = unplacedExpr(GATHERING);
const UNARRANGED_CURATED = unarrangedExpr(CURATED);
const UNPLACED_CURATED = unplacedExpr(CURATED);

type Row = Record<string, unknown>;

/**
 * The two subscriptions, as the queries hand them over.
 *
 * `board` carries the column *order* and `columns` carries their contents — two queries rather than
 * one because a card moving between columns changes a column's links and not the board's, so a
 * subscription on the board is not obliged to re-run. See `COLUMNS` in the fragment.
 *
 * A column's own `children` are ids, not records: the board is read one level deep, because a second
 * hop through a polymorphic relation cannot be hydrated.
 */
const boardWith = (columns: Row[], held: string[] = []) => ({
  // A board's children are its columns, and — on a made board — whatever it holds in no column.
  // Hydrated, so a card among them is an object with an id, exactly as the columns are.
  board: [{ id: 'b1', children: [...columns, ...held.map((id) => ({ id }))] }],
  columns,
});

const evaluate = (source: string, roots: Record<string, unknown>) =>
  evaluateExpression(parseExpression(source), {
    root: (name) => (name in roots ? { bound: true, value: roots[name] } : { bound: false, value: undefined }),
    // The same convention `propResolvers/expression.ts` uses: the whole argument list, then
    // the call env. Getting this wrong makes every function answer `undefined`, which reads as an
    // expression bug rather than a harness one.
    call: (name, args) => getFunction(name)?.impl(args, { context: {}, stores: {} }),
  });

const todo = { id: 't1', title: 'One', status: 'todo' };
const doing = { id: 't2', title: 'Two', status: 'doing' };
const done = { id: 't3', title: 'Three', status: 'done' };
const orphan = { id: 't4', title: 'Four', status: 'archived' };

describe('what a bound column shows', () => {
  const col = { id: 'c1', slug: 'todo', children: ['t1'] };
  const local = { ...boardWith([col]), allTasks: [todo, doing] };

  it('lists the cards it has arranged, resolved from the ids it holds', () => {
    // The regression guard for the nested include: a column's children are ids, and the cards are
    // resolved from the task query rather than hydrated a second time.
    expect(evaluate(ARRANGED_EXPR, { col, local })).toEqual([todo]);
  });

  it('lists matching work nobody has placed, after it', () => {
    const unplacedTodo = { id: 't5', title: 'Five', status: 'todo' };
    const scope = { col, local: { ...local, allTasks: [todo, unplacedTodo] } };
    expect(evaluate(ARRANGED_EXPR, scope)).toEqual([todo]);
    expect(evaluate(UNARRANGED_EXPR, scope)).toEqual([unplacedTodo]);
  });

  it('does not list a card twice — arranged cards are not also unarranged', () => {
    const arranged = evaluate(ARRANGED_EXPR, { col, local }) as Row[];
    const unarranged = evaluate(UNARRANGED_EXPR, { col, local }) as Row[];
    const ids = [...arranged, ...unarranged].map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
    A card whose state changed on another surface still has a hint in the column it left. That column
    must stop showing it — and, more importantly, the card must not be treated as placed, or it would
    vanish from the board rather than reappearing where its state now says.
  */
  it('drops a stale hint, and does not let it hide the card', () => {
    const stale = { id: 'c1', slug: 'todo', children: ['t2'] };
    const doingCol = { id: 'c2', slug: 'doing', children: [] as string[] };
    const local = { ...boardWith([stale, doingCol]), allTasks: [doing] };
    expect(evaluate(ARRANGED_EXPR, { col: stale, local })).toEqual([]);
    expect(evaluate(UNARRANGED_EXPR, { col: doingCol, local })).toEqual([doing]);
  });

  it('drops an id that resolves to nothing — a card out of scope, or deleted', () => {
    const dangling = { id: 'c1', slug: 'todo', children: ['gone', 't1'] };
    expect(evaluate(ARRANGED_EXPR, { col: dangling, local })).toEqual([todo]);
  });
});

describe('what a local lane shows', () => {
  const lane = { id: 'c9', slug: '', children: ['t3'] };
  const doneCol = { id: 'c3', slug: 'done', children: [] as string[] };
  const local = { ...boardWith([lane, doneCol]), allTasks: [done] };

  it('shows only what somebody put there, whatever its state', () => {
    expect(evaluate(ARRANGED_EXPR, { col: lane, local })).toEqual([done]);
  });

  it('gathers nothing on its own', () => {
    expect(evaluate(UNARRANGED_EXPR, { col: lane, local })).toEqual([]);
  });

  /* A card in a lane must not also appear in its state's column on the same board. */
  it('takes its cards out of the state column on this board', () => {
    expect(evaluate(UNARRANGED_EXPR, { col: doneCol, local })).toEqual([]);
    expect(evaluate(PLACED_EXPR, { t: done, local })).toBe(true);
  });
});

describe('the unplaced column', () => {
  it('catches work whose state no column here names', () => {
    const col = { id: 'c1', slug: 'todo', children: [] as string[] };
    const local = { ...boardWith([col]), allTasks: [todo, orphan] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([orphan]);
  });

  /*
    A board with no record shows nothing, and that is deliberate now.

    It used to catch everything, as a safety net for a board that could not render its structure.
    That net belonged to a world where every board gathered — with curated boards it would make an
    empty board indistinguishable from a broken one, and would show the whole space on the first
    frame of every board that had simply not loaded yet. The catch-all is a *board* (Everything,
    `type: 'space'`, which gathers because its record says so) rather than a fallback hidden inside
    every board. The view gates on `boardLoaded` so this reads as "loading", never as "empty".
  */
  it('shows nothing when there is no board record, rather than everything', () => {
    const local = { board: [] as Row[], columns: [] as Row[], allTasks: [todo, doing] };
    expect(evaluate(UNPLACED_CURATED, { local })).toEqual([]);
  });

  /*
    A gathering board with no record would answer with everything, and that is fine because it is
    never asked: with no board there are no columns, and the view renders the empty state — gated on
    `boardLoaded`, so an unanswered query reads as loading rather than as an empty board. Asserted so
    that the gate and this expression are known to depend on each other.
  */
  it('a gathering board relies on the view’s loaded gate, not on this', () => {
    const local = { board: [] as Row[], columns: [] as Row[], allTasks: [todo, doing] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([todo, doing]);
  });

  it('leaves placed work alone', () => {
    const col = { id: 'c1', slug: 'todo', children: ['t1'] };
    const local = { ...boardWith([col]), allTasks: [todo] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([]);
  });
});

describe('the lists are lists', () => {
  /*
    The `+` regression, guarded directly. Every one of these must answer with an array — a column
    whose cards coerce to a number renders nothing at all, silently, which is exactly what shipped.
  */
  it('every card expression answers with an array', () => {
    const col = { id: 'c1', slug: 'todo', children: ['t1'] };
    const local = { ...boardWith([col]), allTasks: [todo, orphan] };
    for (const source of [ARRANGED_EXPR, UNARRANGED_EXPR]) {
      expect(Array.isArray(evaluate(source, { col, local }))).toBe(true);
    }
    expect(Array.isArray(evaluate(UNPLACED_EXPR, { local }))).toBe(true);
  });
});

describe('what a board draws from', () => {
  const col = { id: 'c1', slug: 'todo', children: [] as string[] };
  const held = { id: 'c1', slug: 'todo', children: ['t1'] };

  it('a gathering board draws from everything in scope', () => {
    // Everything draws the space; a container's board draws that container's work, which the query's
    // own scope has already narrowed. Both are told they gather by the view that opened them.
    const local = { ...boardWith([col]), allTasks: [todo] };
    expect(evaluate(UNARRANGED_EXPR, { col, local })).toEqual([todo]);
  });

  /*
    The change this test exists for. A board somebody made starts empty and stays that way until
    somebody puts something on it — otherwise every board is the same card set with different column
    headings, which is what a hiring pipeline and a content calendar are not.
  */
  it('a board somebody made gathers nothing', () => {
    const local = { ...boardWith([col]), allTasks: [todo] };
    expect(evaluate(UNARRANGED_CURATED, { col, local })).toEqual([]);
    expect(evaluate(UNPLACED_CURATED, { local })).toEqual([]);
  });

  it('but does show what it holds', () => {
    const local = { ...boardWith([held]), allTasks: [todo] };
    expect(evaluate(ARRANGED_EXPR, { col: held, local })).toEqual([todo]);
  });

  /*
    Membership is the union of the columns' children, and the *column* is still decided by state. So
    a member marked done elsewhere moves to this board's done column rather than falling off it.
  */
  it('follows a member whose state changed to another of its columns', () => {
    const doneCol = { id: 'c2', slug: 'done', children: [] as string[] };
    const moved = { id: 't1', title: 'One', status: 'done' };
    const local = { ...boardWith([held, doneCol]), allTasks: [moved] };
    expect(evaluate(ARRANGED_EXPR, { col: held, local })).toEqual([]);
    expect(evaluate(UNARRANGED_CURATED, { col: doneCol, local })).toEqual([moved]);
  });

  it('keeps a member whose state no column here names, in Unplaced', () => {
    const moved = { id: 't1', title: 'One', status: 'archived' };
    const local = { ...boardWith([held]), allTasks: [moved] };
    expect(evaluate(UNPLACED_CURATED, { local })).toEqual([moved]);
  });

  /*
    What a made board holds in no column, and why it has to be able to.

    Membership on a made board is containment, so before this the column being deleted held the only
    record that its cards were on the board at all — deleting a lane took the card off the board
    silently, which is the one failure this design exists to prevent. `removeBoardColumn` hands them
    to the board; these say what happens to them once it has.
  */
  it('shows work the board holds in no column, in the column its state names', () => {
    const todoCol = { id: 'c1', slug: 'todo', children: [] as string[] };
    const local = { ...boardWith([todoCol], ['t1']), allTasks: [todo] };
    expect(evaluate(UNARRANGED_CURATED, { col: todoCol, local })).toEqual([todo]);
  });

  it('drops it to Unplaced when no column here names its state', () => {
    const todoCol = { id: 'c1', slug: 'todo', children: [] as string[] };
    const local = { ...boardWith([todoCol], ['t4']), allTasks: [orphan] };
    expect(evaluate(UNPLACED_CURATED, { local })).toEqual([orphan]);
  });

  /* The lane case end to end: a card sat in a lane, the lane went, the board kept the card. */
  it('keeps a card whose lane was deleted, in the column its state names', () => {
    const lane = { id: 'c9', slug: '', children: ['t1'] };
    const todoCol = { id: 'c1', slug: 'todo', children: [] as string[] };
    const before = { ...boardWith([lane, todoCol]), allTasks: [todo] };
    expect(evaluate(ARRANGED_EXPR, { col: lane, local: before })).toEqual([todo]);

    // What `removeBoardColumn` writes: the lane gone from the board, its card held by the board.
    const after = { ...boardWith([todoCol], ['t1']), allTasks: [todo] };
    expect(evaluate(UNARRANGED_CURATED, { col: todoCol, local: after })).toEqual([todo]);
    expect(evaluate(UNPLACED_CURATED, { local: after })).toEqual([]);
  });

  it('never lets a made board hide work — a non-member is simply not its business', () => {
    // The card is still on Everything, which is what makes curating safe.
    const local = { ...boardWith([held]), allTasks: [todo, doing] };
    const shown = [
      ...(evaluate(ARRANGED_EXPR, { col: held, local }) as Row[]),
      ...(evaluate(UNARRANGED_CURATED, { col: held, local }) as Row[]),
      ...(evaluate(UNPLACED_CURATED, { local }) as Row[]),
    ].map((row) => row.id);
    expect(shown).toEqual(['t1']);
  });
});
