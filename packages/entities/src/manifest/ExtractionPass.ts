import type { CoreEntityDef } from './defs';

/**
 * That a call was read by a model, and how it went.
 *
 * ## Why the records are not enough
 *
 * An extraction pass produces records, and those are real, stored and queryable — so what a call
 * yielded survives on its own. What did not survive was everything about the *reading*: whether it
 * happened at all, when, who spent the tokens, and whether it failed. `interpretationStore` reports
 * all of that beautifully and reports it from a live subscription that starts empty and is thrown
 * away on every space change, so the moment you reload — or walk to another space and back — a call
 * that was read an hour ago is indistinguishable from one that never was, and a pass that *failed*
 * is indistinguishable from one that found nothing. Both of those are questions somebody asks about
 * a meeting they are reviewing, and the answer was gone.
 *
 * ## Why the prompt and the response are not here
 *
 * They are the most useful thing about a pass and the most expensive to keep. A prompt is the whole
 * transcript, so storing one per pass in a shared neighbourhood means every member replicating a
 * second copy of every conversation — for a payload almost nobody opens. And `shareExtractionDetail`
 * is off by default precisely because the exchange is sensitive: "prompts stay on each person's
 * machine" is a promise this would quietly retract.
 *
 * So the exchange stays where it is — in the live feed, on the machine that ran the pass, for as
 * long as the session lasts. This is the part that is safe to write down and worth having later: a
 * few short fields per pass, bounded, and true about the call rather than about the model.
 *
 * ## Why it hangs off the call
 *
 * `CollectionBlock.extractionPasses`, so a panel showing one call reads its passes with the same
 * subject it reads everything else with. Before this, the readout had no call id to be scoped by at
 * all — the store's rows describe *every* pass this agent knows about — so a panel open on a past
 * call listed the live call's activity above that call's records and said nothing about the
 * mismatch.
 *
 * Its own relation rather than `children`, which holds a collection's *content*: a pass is a fact
 * about the collection, not something in it, and putting it in `children` would put it on the board.
 */
export const ExtractionPass: CoreEntityDef = {
  base: 'Ad4mModel',
  entity: {
    flag: { predicate: 'we://flag', value: 'we://extraction_pass' },
    properties: {
      /**
       * How it ended — `done`, `failed`, or `skipped`.
       *
       * Three rather than a boolean because they are three different things to say to somebody
       * reviewing a call: it read the conversation, it tried and could not, or it had nothing to
       * look for. A `success: false` covering the last two is the shape that made a failed pass and
       * an empty one look identical in the live readout, which is the confusion this exists to end.
       */
      outcome: { type: 'string', predicate: 'we://outcome', default: 'done' },
      /**
       * How many records it wrote. `0` is a real answer and the common one on a short call.
       *
       * Stored rather than counted from the collection, because the records are not evidence of the
       * pass that made them: a second pass updates what the first found rather than duplicating it,
       * so counting afterwards attributes every record to whichever pass ran last.
       */
      recordCount: { type: 'number', predicate: 'we://record_count', default: 0 },
      /**
       * What it was looking for, as a JSON array of entity names.
       *
       * A blob because it is read back whole and never filtered on — and because the alternative, a
       * relation per target, would be a handful of links per pass for a list nobody queries across.
       * It is also the one thing that explains a pass that found nothing: a call looking for two
       * models finds none of a third, and without this the row says "0 records" and leaves the
       * reader to guess whether the conversation or the configuration was at fault.
       */
      targets: { type: 'string', predicate: 'we://extraction_targets', default: '' },
      /** Why it failed, verbatim from the backend. Empty on any other outcome. */
      error: { type: 'string', predicate: 'we://error', default: '' },
    },
    // None. Who ran it is `author`, which every record carries, and when is `createdAt`.
    relations: {},
  },
};
