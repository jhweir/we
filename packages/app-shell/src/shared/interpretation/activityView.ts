/**
 * Rules about a feed of extraction passes that are worth deciding once and testing without a store.
 *
 * Small on purpose: everything here is a sentence about rows, and the reason it is a file rather
 * than an inline predicate is that its one rule was got wrong twice in the store it used to live in
 * — and the failure is a footnote that stays on screen after the thing it explains has stopped
 * being true, which nobody reports as a bug.
 */

/** What the shell's feed carries, narrowed to the fields a rule here reads. */
export interface ActivityRow {
  running: boolean;
  /** This agent's own pass, as opposed to a peer's. */
  mine: boolean;
  /** Whether the prompt and response are available to open. */
  hasDetail: boolean;
}

/**
 * Whether to explain that a peer's exchange is not on offer because the space keeps them private.
 *
 * Gated on the **setting**, not on "a peer row with nothing to open". The latter is what this used
 * to test, and it is true for reasons the footnote does not explain: a peer's pass that has not
 * reached the model yet, a skipped pass that never had an exchange, a row broadcast before the
 * switch synced to its runner. Each of those kept the note up after somebody turned sharing on —
 * the one moment it is plainly wrong.
 *
 * A settled row, because a running pass has no exchange yet whatever the space has decided; and
 * somebody else's, because this agent's own rows always carry theirs.
 */
export function detailWithheld(rows: readonly ActivityRow[], shared: boolean): boolean {
  if (shared) return false;
  return rows.some((row) => !row.mine && !row.running && !row.hasDetail);
}

/**
 * What a settled automatic pass should be written down as, or nothing.
 *
 * A pass somebody pressed for is written by the run that returned — it has the turns, the target
 * list and the outcome in hand when it resolves. A watched pass has no such moment: it runs inside
 * the executor and only ever reports, so the record has to be written by whoever is listening. The
 * point of writing it is that the two kinds then sit in one list, told apart by `trigger` rather
 * than by which surface happens to be on screen.
 *
 * Four refusals, and each removes a row that should not become a record:
 *
 * - **not `auto`** — a one-shot is already written by its own run, and writing it twice would put
 *   every manual pass in the log in duplicate.
 * - **not `mine`** — every peer receives the same events, so a row per peer would make the history
 *   a record of who was watching rather than of what was read.
 * - **no `collection`** — a pass this client neither started nor watches has nothing to hang a
 *   record off; the log is scoped by containment, so an unparented row would be invisible anyway.
 * - **not settled** — a pass in flight has no outcome yet.
 *
 * Takes the **merged** row rather than the event that settled it. The exchange arrives on
 * `llmRequestSent` and `llmResponseReceived`, both of them several steps before the `processed`
 * that carries the ids and the outcome — so reading the settling event alone stored every watched
 * pass with an empty prompt and response, which is the one thing this was added to keep.
 */
export function watchPassRecord(row: {
  trigger?: 'manual' | 'auto';
  mine: boolean;
  collection?: string;
  phase: string;
  settled: boolean;
  ids?: readonly string[];
  detail?: string;
  llm?: { prompt?: string; response?: string };
}): {
  collection: string;
  outcome: string;
  recordCount: number;
  error?: string;
  prompt?: string;
  response?: string;
} | null {
  if (row.trigger !== 'auto' || !row.mine || !row.collection || !row.settled) return null;
  return {
    collection: row.collection,
    // The feed's three settled phases are the record's three outcomes, in the same words.
    outcome: row.phase,
    recordCount: row.ids?.length ?? 0,
    error: row.phase === 'failed' ? row.detail : undefined,
    prompt: row.llm?.prompt,
    response: row.llm?.response,
  };
}
