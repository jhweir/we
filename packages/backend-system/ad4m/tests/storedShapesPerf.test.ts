/**
 * Round-trip reduction in storedShapes and hasSubjectClassLink.
 *
 * The original `storedShapes` ran five sequential SPARQL queries per call.
 * The original `ensureEntitiesRegistered` called `hasSubjectClassLink` once
 * per model.  Both multiplied wall-clock time by the number of round trips.
 *
 * The optimised versions:
 *   - run the five SPARQL queries concurrently (`Promise.all`),
 *   - replace N `hasSubjectClassLink` calls with one `bulkHasSubjectClassLink`,
 *   - cache the `storedShapes` result so consecutive callers within one
 *     `switchDataset` do not repeat the queries.
 *
 * These tests verify the behavioural contracts that survive the change, not
 * the internal concurrency (which a unit test cannot observe reliably).
 */
import { bulkHasSubjectClassLink, clearStoredShapesCache } from '@we/backend-ad4m';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockLink(source: string) {
  return {
    data: { source, predicate: 'rdf://type', target: 'ad4m://SubjectClass' },
    author: 'did:key:test',
    timestamp: new Date().toISOString(),
    proof: { valid: true },
  };
}

function mockPerspective(registeredClasses: string[]) {
  return {
    get: vi.fn().mockResolvedValue(registeredClasses.map(mockLink)),
    querySparql: vi.fn().mockResolvedValue([]),
    uuid: `test-${Math.random().toString(36).slice(2)}`,
  } as never;
}

// ─── bulkHasSubjectClassLink ──────────────────────────────────────────────────

describe('bulkHasSubjectClassLink', () => {
  it('returns true for registered classes and false for missing ones', async () => {
    const p = mockPerspective(['we://Space', 'we://Note', 'we://Template']);

    const result = await bulkHasSubjectClassLink(p, [
      'we://Space',
      'we://Note',
      'we://TaskBlock',
      undefined,
      'we://Template',
    ]);

    expect(result).toEqual([true, true, false, false, true]);
  });

  it('uses a single queryLinks call for two or more classes', async () => {
    const p = mockPerspective(['we://Space']);
    const proxy = p as unknown as { get: ReturnType<typeof vi.fn> };

    await bulkHasSubjectClassLink(p, ['we://Space', 'we://Note', 'we://Template']);

    // One call with no source filter, not three calls with individual sources.
    expect(proxy.get).toHaveBeenCalledTimes(1);
    const query = proxy.get.mock.calls[0][0];
    expect(query.source).toBeUndefined();
    expect(query.predicate).toBe('rdf://type');
    expect(query.target).toBe('ad4m://SubjectClass');
  });

  it('falls back to single-source query for one class', async () => {
    const p = mockPerspective(['we://Space']);
    const proxy = p as unknown as { get: ReturnType<typeof vi.fn> };

    await bulkHasSubjectClassLink(p, ['we://Space']);

    // One class — the per-model path is just as cheap and preserves cache
    // behaviour of single-source queries.
    expect(proxy.get).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array for an empty input', async () => {
    const p = mockPerspective(['we://Space']);
    const proxy = p as unknown as { get: ReturnType<typeof vi.fn> };

    const result = await bulkHasSubjectClassLink(p, []);

    expect(result).toEqual([]);
    expect(proxy.get).not.toHaveBeenCalled();
  });

  it('handles duplicate target classes', async () => {
    const p = mockPerspective(['we://Space']);

    const result = await bulkHasSubjectClassLink(p, ['we://Space', 'we://Space']);

    expect(result).toEqual([true, true]);
  });

  it('handles perspectives with no registered classes', async () => {
    const p = mockPerspective([]);

    const result = await bulkHasSubjectClassLink(p, ['we://Space', 'we://Note']);

    expect(result).toEqual([false, false]);
  });
});

// ─── storedShapes cache ───────────────────────────────────────────────────────

describe('storedShapes cache', () => {
  beforeEach(() => clearStoredShapesCache());
  afterEach(() => clearStoredShapesCache());

  it('clearStoredShapesCache does not throw', () => {
    // The cache is module-private; this verifies the cleanup function exported
    // for testing works without error.
    expect(() => clearStoredShapesCache()).not.toThrow();
    // Calling twice is also safe.
    expect(() => clearStoredShapesCache()).not.toThrow();
  });
});
