/**
 * The board fragment is arrangement, and this holds it to that.
 *
 * What a column shows is decided by `arrangedBoard`, a function the host registers, and tested where
 * it lives (`app-shell/tests/arrangedBoard.test.ts`). What is left to check here is that the fragment
 * reaches it — every list on the board reads from the one call — and that the three subscriptions it
 * feeds are the ones the function documents, with no limit on the pool.
 */
import { describe, expect, it } from 'vitest';

import { taskBoard } from './taskBoard.ts';

const board = taskBoard({ boardId: { $: 'local.boardId' }, empty: { type: 'Column' } });
const json = JSON.stringify(board);

describe('the task board', () => {
  it('declares the three subscriptions the host function reads, and does not cap the pool', () => {
    const queries = (board as { $queries?: Record<string, Record<string, unknown>> }).$queries ?? {};
    expect(Object.keys(queries).sort()).toEqual(['board', 'columns', 'pool']);
    expect(queries.board.include).toEqual({ children: true });
    expect(queries.pool.entity).toBe('TaskBlock');
    // A limit here was the one place the design broke its own rule: the card past it did not land
    // in Unplaced, it vanished.
    expect(queries.pool.limit).toBeUndefined();
    expect(queries.columns.limit).toBeUndefined();
  });

  it('reads every list off the host function rather than computing one in an expression', () => {
    expect(json).toContain('arrangedBoard({');
    expect(json).not.toMatch(/\.filter\([a-z], [^)]*status/);
    expect(json).not.toContain('.exists(');
  });

  it('lets a board arrange another record, as lanes', () => {
    const posts = taskBoard({
      boardId: { $: 'local.boardId' },
      empty: { type: 'Column' },
      entity: 'CollectionBlock',
      where: { kind: 'post' },
      lanesOnly: true,
    });
    const queries = (posts as { $queries: Record<string, Record<string, unknown>> }).$queries;
    expect(queries.pool.entity).toBe('CollectionBlock');
    expect(queries.pool.where).toEqual({ kind: 'post' });
    // No Unplaced column and no state picker on a board where nothing binds.
    const text = JSON.stringify(posts);
    expect(text).not.toContain('Unplaced');
    expect(text).not.toContain('A state everyone shares');
  });
});
