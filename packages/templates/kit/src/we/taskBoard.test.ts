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

import { ARRANGED_EXPR, PLACED_EXPR, UNARRANGED_EXPR, UNPLACED_EXPR } from './taskBoard.ts';

type Row = Record<string, unknown>;

/**
 * The board as the queries hand it over: columns hydrated, their children still ids.
 *
 * `type` decides whether it gathers. `'space'` is Everything and `'anchor'` is a container's own;
 * anything else is a board somebody made, which shows only what it holds.
 */
const board = (columns: Row[], type = 'space') => [{ id: 'b1', type, children: columns }];

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
  const local = { board: board([col]), allTasks: [todo, doing] };

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
    const local = { board: board([stale, doingCol]), allTasks: [doing] };
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
  const local = { board: board([lane, doneCol]), allTasks: [done] };

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
    const local = { board: board([col]), allTasks: [todo, orphan] };
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
    const local = { board: [] as Row[], allTasks: [todo, doing] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([]);
  });

  it('leaves placed work alone', () => {
    const col = { id: 'c1', slug: 'todo', children: ['t1'] };
    const local = { board: board([col]), allTasks: [todo] };
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
    const local = { board: board([col]), allTasks: [todo, orphan] };
    for (const source of [ARRANGED_EXPR, UNARRANGED_EXPR]) {
      expect(Array.isArray(evaluate(source, { col, local }))).toBe(true);
    }
    expect(Array.isArray(evaluate(UNPLACED_EXPR, { local }))).toBe(true);
  });
});

describe('what a board draws from', () => {
  const col = { id: 'c1', slug: 'todo', children: [] as string[] };
  const held = { id: 'c1', slug: 'todo', children: ['t1'] };

  it('Everything gathers the whole space', () => {
    const local = { board: board([col], 'space'), allTasks: [todo] };
    expect(evaluate(UNARRANGED_EXPR, { col, local })).toEqual([todo]);
  });

  it('a container’s board gathers that container’s work', () => {
    // `allTasks` is already scoped to the container by the query; the type is what says it gathers.
    const local = { board: board([col], 'anchor'), allTasks: [todo] };
    expect(evaluate(UNARRANGED_EXPR, { col, local })).toEqual([todo]);
  });

  /*
    The change this test exists for. A board somebody made starts empty and stays that way until
    somebody puts something on it — otherwise every board is the same card set with different column
    headings, which is what a hiring pipeline and a content calendar are not.
  */
  it('a board somebody made gathers nothing', () => {
    const local = { board: board([col], ''), allTasks: [todo] };
    expect(evaluate(UNARRANGED_EXPR, { col, local })).toEqual([]);
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([]);
  });

  it('but does show what it holds', () => {
    const local = { board: board([held], ''), allTasks: [todo] };
    expect(evaluate(ARRANGED_EXPR, { col: held, local })).toEqual([todo]);
  });

  /*
    Membership is the union of the columns' children, and the *column* is still decided by state. So
    a member marked done elsewhere moves to this board's done column rather than falling off it.
  */
  it('follows a member whose state changed to another of its columns', () => {
    const doneCol = { id: 'c2', slug: 'done', children: [] as string[] };
    const moved = { id: 't1', title: 'One', status: 'done' };
    const local = { board: board([held, doneCol], ''), allTasks: [moved] };
    expect(evaluate(ARRANGED_EXPR, { col: held, local })).toEqual([]);
    expect(evaluate(UNARRANGED_EXPR, { col: doneCol, local })).toEqual([moved]);
  });

  it('keeps a member whose state no column here names, in Unplaced', () => {
    const moved = { id: 't1', title: 'One', status: 'archived' };
    const local = { board: board([held], ''), allTasks: [moved] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([moved]);
  });

  it('never lets a made board hide work — a non-member is simply not its business', () => {
    // The card is still on Everything, which is what makes curating safe.
    const local = { board: board([held], ''), allTasks: [todo, doing] };
    const shown = [
      ...(evaluate(ARRANGED_EXPR, { col: held, local }) as Row[]),
      ...(evaluate(UNARRANGED_EXPR, { col: held, local }) as Row[]),
      ...(evaluate(UNPLACED_EXPR, { local }) as Row[]),
    ].map((row) => row.id);
    expect(shown).toEqual(['t1']);
  });
});
