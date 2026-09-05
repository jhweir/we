import { describe, expect, it } from 'vitest';

import { placementsFor, resolvePlacement } from './placements';

describe('placementsFor', () => {
  it('groups every row a node has, rather than keeping the last one', () => {
    const byNode = placementsFor([
      { node: 'a', x: 1 },
      { node: 'b', x: 2 },
      { node: 'a', x: 3 },
    ]);
    expect(byNode.get('a')).toHaveLength(2);
    expect(byNode.get('b')).toHaveLength(1);
  });

  it('drops a row naming no node', () => {
    // A placement whose node link never wrote points at nothing, and what it meant is not knowable.
    expect(placementsFor([{ x: 1 }, { node: '', x: 2 }, { node: 5, x: 3 }]).size).toBe(0);
  });
});

describe('resolvePlacement', () => {
  it('answers with the one placement a node has today', () => {
    expect(resolvePlacement([{ node: 'a', x: 40 }])).toEqual({ node: 'a', x: 40 });
  });

  it('answers with nothing when there is nothing', () => {
    expect(resolvePlacement([])).toBeUndefined();
  });

  it('treats a tierless placement as applying everywhere', () => {
    const rows = [{ x: 1 }];
    expect(resolvePlacement(rows)).toBe(rows[0]);
    expect(resolvePlacement(rows, 'lg')).toBe(rows[0]);
  });

  it('takes the most specific placement at or below the current tier', () => {
    const rows = [{ x: 1 }, { tier: 'md', x: 2 }, { tier: 'lg', x: 3 }];
    expect(resolvePlacement(rows, 'base')).toEqual({ x: 1 });
    expect(resolvePlacement(rows, 'sm')).toEqual({ x: 1 });
    expect(resolvePlacement(rows, 'md')).toEqual({ tier: 'md', x: 2 });
    // Min-width, so `md` still applies at `lg` when there is nothing more specific — the same
    // cascade `mdUpProps` has, because it is the same ladder.
    expect(resolvePlacement([{ x: 1 }, { tier: 'md', x: 2 }], 'lg')).toEqual({ tier: 'md', x: 2 });
    expect(resolvePlacement(rows, 'lg')).toEqual({ tier: 'lg', x: 3 });
  });

  it('considers only tierless rows when the caller cannot see the width', () => {
    // A seed runs in the data layer. Picking a tier-keyed row there would be picking one at random.
    expect(resolvePlacement([{ tier: 'lg', x: 3 }, { x: 1 }])).toEqual({ x: 1 });
    expect(resolvePlacement([{ tier: 'lg', x: 3 }])).toBeUndefined();
  });

  it('ignores a tier name it does not know, rather than reading it as "everywhere"', () => {
    expect(resolvePlacement([{ tier: 'xxl', x: 9 }], 'lg')).toBeUndefined();
    expect(resolvePlacement([{ x: 1 }, { tier: 'xxl', x: 9 }], 'lg')).toEqual({ x: 1 });
  });

  it('is last-write-wins between equally specific rows', () => {
    // Two placements at the same specificity is two people dragging the same card, and that is
    // the answer that conflict already resolves to.
    expect(resolvePlacement([{ x: 1 }, { x: 2 }])).toEqual({ x: 2 });
  });
});
