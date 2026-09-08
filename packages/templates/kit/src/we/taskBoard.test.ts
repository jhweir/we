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

/** The board as the queries hand it over: columns hydrated, their children still ids. */
const board = (columns: Row[]) => [{ id: 'b1', children: columns }];

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
    The failure mode this whole design exists to prevent, as a test: a board that cannot render its
    structure must still show the work rather than swallowing it.
  */
  it('catches everything when the board has no columns at all', () => {
    const local = { board: [] as Row[], allTasks: [todo, doing] };
    expect(evaluate(UNPLACED_EXPR, { local })).toEqual([todo, doing]);
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
