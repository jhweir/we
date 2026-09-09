/**
 * The transcription panel's shape — the decisions in it that are easy to undo by accident.
 *
 * Most of these assertions lived in `@we/template-showcase`'s tests, because the workshop template
 * used to supply a transcript panel of its own and they were checking that copy. The copy is gone
 * and the behaviour it existed for — following the call the address names — is here now, so the
 * tests are too. That relocation is the point: there is one transcript panel, and one place that
 * says what it must do.
 *
 * Serialised and searched rather than walked, the same way the showcase templates are tested. A
 * schema is data; what matters is whether the token is in the tree, not the path it sits at.
 */
import { evaluateExpression, markReactive, namespace, parseCached } from '@we/schema-shared';
import { describe, expect, it } from 'vitest';

import { extractionActivity } from './ExtractionStatus.schema';
import { transcribeModule } from './index';
import {
  captureMeter,
  EXTRACTION_SUBJECT_EXPR,
  extractionPanel,
  extractionTargets,
  panel,
  pendingUtterance,
  SUBJECT_EXPR,
  transcriptFeed,
  transcriptLines,
} from './Panel.schema';

const panelJson = JSON.stringify(panel);
const feedJson = JSON.stringify(transcriptFeed);
const linesJson = JSON.stringify(transcriptLines);

describe('which call the panel is about', () => {
  it('follows the call the address names, and falls back to the one being recorded', () => {
    /*
      A transcript surface has always had two possible subjects and used to admit to one. The
      workshop template answered that by supplying a whole panel body of its own, which bought
      route-awareness at the price of a second copy of the header, the feed and the gating — and the
      copy drifted, never gaining the coverage readout or the capture status.
    */
    expect(feedJson).toContain(SUBJECT_EXPR);
    expect(SUBJECT_EXPR).toContain('routeStore.params.call');
    expect(SUBJECT_EXPR).toContain('modules.transcribe.collectionId');
  });

  it('publishes the feed under the subject token that is actually in its tree', () => {
    /*
      `$part` substitution is whole-token: a `subject` naming an expression that does not appear
      verbatim in the node rewrites nothing and does so silently, so a template pointing the feed at
      another call would get the live one and no complaint. Naming the bare collection id here — as
      this did before the feed became route-aware — is exactly that failure.
    */
    const declared = transcribeModule.schemas?.transcriptFeed;
    const subject = typeof declared === 'object' && 'subject' in declared ? declared.subject : undefined;

    expect(subject).toBe(SUBJECT_EXPR);
    expect(feedJson).toContain(subject);
  });

  it('says which call it is showing, because it can now be either', () => {
    expect(panelJson).toContain("routeStore.params.call ? 'Past call' : 'Transcript'");
  });
});

describe('what belongs to the live microphone only', () => {
  it('keeps the meter, the coverage readout and the status notes off a call being read back', () => {
    // All three are about the microphone this agent is running now, which says nothing about a
    // meeting somebody opened from a link. A bar moving beside it would measure the wrong thing.
    const live = '{"$":"routeStore.params.call ? false : true"}';
    const meter = panelJson.indexOf('"Microphone"');
    const coverage = panelJson.indexOf('"Coverage"');
    const status = panelJson.indexOf('Starting\u2026');

    // All three inside one gate rather than three of their own: they answer one question between
    // them, and that question is not asked at all of a meeting somebody is reading back.
    const gate = panelJson.lastIndexOf(live, meter);
    expect(gate).toBeGreaterThan(-1);
    expect(coverage).toBeGreaterThan(meter);
    expect(status).toBeGreaterThan(coverage);
    expect(panelJson.lastIndexOf(live, status)).toBe(gate);
  });

  it('gates the unsaved line itself, rather than leaving that to whoever places it', () => {
    /*
      The buffer is this agent's own microphone. A fragment that has to be wrapped in the right
      condition by its consumer is a fragment that will be placed without one — the workshop wrapped
      it by hand, and nothing would have said so if it had been forgotten.
    */
    expect(JSON.stringify(pendingUtterance)).toContain('modules.transcribe.pending && !routeStore.params.call');
  });

  it('offers recording on the live call and continuing on a past one, never both', () => {
    // Continuing is `continueCall` on the record already on screen, then `resume` so the recorder
    // adopts it without waiting for a presence round trip.
    expect(panelJson).toContain('modules.transcribe.toggle');
    expect(panelJson).toContain('modules.call.continueCall');
    expect(panelJson).toContain('modules.transcribe.resume');
  });

  it('stops the address naming the call it has just picked back up', () => {
    /*
      The recorder has adopted this record, so it is the live call now — a parameter still pinning
      to it would say the opposite for the rest of the meeting, and every surface reading the
      subject would go on treating a live call as a past one.
    */
    expect(panelJson).toContain('{"$action":"routeStore.setParam","args":["call",null]}');
  });
});

describe('the feed', () => {
  it('keeps the unsaved line inside the scroll region, with the rows', () => {
    /*
      Outside it, the line is pinned to an edge of the panel while a short transcript sits at the
      other, and the first sentence written appears to leap the gap between them. Inside, it follows
      the last row whether there are two of them or two hundred.
    */
    expect(feedJson).toContain('"pin":"end"');
    expect(feedJson).toContain('transcribe.transcriptLines');
    expect(feedJson.indexOf('transcribe.transcriptLines')).toBeLessThan(feedJson.indexOf('Not saved yet'));
  });

  it('offers a way back to either end of a transcript somebody has scrolled through', () => {
    // `pin` lets go of a reader who scrolls up and offers nothing to undo that; in a live transcript
    // the bottom keeps moving, so scrolling back to it by hand is a chase.
    expect(feedJson).toContain('"jump":"both"');
  });

  it('abbreviates the time on a row, which is the one thing on it with a shorter form', () => {
    /*
      A prop nothing sets is a prop that does nothing, and this one shipped that way once: the
      primitive gained `relativeStyle` and no call site named it, so every row went on reading
      "3 hours ago" in a panel narrow enough that the phrase was the reason the row wrapped.
    */
    expect(linesJson).toContain('"relativeStyle":"short"');
  });
});

describe('the recording indicator', () => {
  it('uses the danger fill rather than the foreground measured for reading', () => {
    /*
      `danger-text` is a derived foreground: its lightness is moved until it is legible against a
      card, which in a dark theme lifts it into a pale pink. Right for an error sentence somebody has
      to read; wrong for a recording indicator, which is not text and has to register as an alarm at
      a glance. The fill role holds a pinned lightness and full chroma in either polarity.
    */
    expect(panelJson).not.toContain('danger-text');
    expect(JSON.stringify(captureMeter)).not.toContain('danger-text');
    expect(panelJson).toContain("modules.transcribe.listening ? 'danger' : ''");
  });
});

describe('the extraction panel', () => {
  const json = JSON.stringify(extractionPanel);

  it('asks about the call on screen, in every one of the three answers', () => {
    /*
      The gap that made the workshop's own copy wrong in two directions at once. It asked these about
      the *live* call and drew the results of the addressed one, so the chips said what one call was
      looking for above a list of what a different call had found — and the Extract button was hidden
      by a guard about the wrong record even though the action behind it takes an id.

      Keyed rather than three accessors, because an expression cannot pass an argument to a store
      member. Same shape as `recordStore.displays[row.type]`.
    */
    for (const field of ['targets', 'canExtract']) {
      expect(json).toContain(`modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].${field}`);
    }

    // The chips are a `$part`, so the third answer is asked in the fragment rather than here.
    const chips = JSON.stringify(extractionTargets);
    expect(chips).toContain(`modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].canChoose`);
    expect(chips).toContain(`modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].targets`);
  });

  it('changes the list of the call it is showing, not the one this agent is in', () => {
    const chips = JSON.stringify(extractionTargets);

    expect(chips).toContain('"$action":"modules.transcribe.toggleExtractionTarget"');
    expect(chips).toContain(`{"$":"target.entity"},{"$":"${EXTRACTION_SUBJECT_EXPR}"}`);
  });

  it('falls back to the call’s own record rather than the transcript’s', () => {
    /*
      A different fallback from the transcript's, and the difference is the point. `collectionId` is
      null until somebody speaks, which is the honest answer for a transcript; extraction is asked
      earlier than that, because choosing what a meeting will look for — before the meeting — is
      exactly when somebody wants to.
    */
    expect(EXTRACTION_SUBJECT_EXPR).toContain('routeStore.params.call');
    expect(EXTRACTION_SUBJECT_EXPR).toContain('modules.transcribe.callId');
    expect(EXTRACTION_SUBJECT_EXPR).not.toContain('collectionId');
  });

  it('runs a pass over that call rather than over the one this agent is in', () => {
    expect(json).toContain('modules.transcribe.extractCollection');
    expect(json).not.toContain('"$action":"modules.transcribe.extract"');
  });

  it('keeps "as it happens" to the live call, where it is the only thing that means anything', () => {
    // A meeting somebody opened from a link is not happening. Everything else here follows the call
    // on screen; this one cannot.
    const live = '{"$":"routeStore.params.call ? false : true"}';
    expect(json.indexOf(live)).toBeLessThan(json.indexOf('As it happens'));
  });

  it('says the node has no model, rather than that nothing has been said', () => {
    /*
      `extractable` is `interpretation.available()` — a fact about the node, saying nothing about
      whether a call exists. The copy answered the other question ("Nothing to read yet. What a call
      produces appears here as it is found."), so somebody on a node with no model waited for a
      conversation that was never going to help.
    */
    expect(json).toContain('This node has no model configured');
    expect(json).not.toContain('Nothing to read yet');
  });

  it('shows what the passes wrote, rather than counting them and pointing elsewhere', () => {
    // It ended at "N records written. Open the graph to see them." — a count and an errand, while
    // the records were one query per target away from the surface already being looked at.
    expect(json).toContain('"anchorId":{"$":"' + EXTRACTION_SUBJECT_EXPR + '"}');
    expect(json).toContain('recordStore.displays[target].title');
  });

  it('scrolls the results and nothing above them', () => {
    // `panelShell` clips, so without this an open history plus a 240px code pane is cut off by the
    // dock box. The header, the chips and the activity stay put; the list moves.
    expect(json).toContain('"we-scroll-area"');
    expect(json.indexOf('"we-scroll-area"')).toBeGreaterThan(json.indexOf('transcribe.extractionTargets'));
  });

  it('leaves the panel’s own openness to the host', () => {
    // The dock's `edge` returns null while closed and the host gates on the space, so the
    // `$if datasetStore.currentDataset && extractionOpen` this carried was a second copy of both.
    expect(json).not.toContain('modules.transcribe.extractionOpen');
    expect(json).not.toContain('datasetStore.currentDataset');
  });
});

/**
 * The expressions the panel is built from, actually evaluated.
 *
 * Every other assertion in this file reads the serialised schema — does the token appear — and that
 * is the right test for an arrangement. It is the wrong test for a *shape*: `extractionFor` was a
 * `Proxy` first, every string assertion passed, and the panel rendered "No models are set up for AI
 * extraction here" against a space that had several. The expression resolved to `undefined`, and a
 * missing path is undefined by design, so nothing anywhere said a word.
 *
 * So the store's shape is checked through the evaluator that has to read it, against the expression
 * the panel actually carries.
 */
describe('the panel’s reads reach the store', () => {
  const CALL = 'we://a-call-from-last-month';

  /** The extraction half of a transcribe store, in the shape the module publishes it. */
  const storeBag = (targets: string[]) => ({
    modules: namespace((id) =>
      id === 'transcribe'
        ? namespace((member) =>
            member === 'callId'
              ? markReactive(() => 'we://the-live-call')
              : member === 'extractionFor'
                ? markReactive(() =>
                    namespace((collection: string) => ({
                      targets: targets.map((entity) => ({ entity, label: entity, selected: true })),
                      canChoose: true,
                      canExtract: collection === CALL,
                    })),
                  )
                : undefined,
          )
        : undefined,
    ),
    routeStore: namespace((member) => (member === 'params' ? markReactive(() => ({ call: CALL })) : undefined)),
  });

  // `markReactive` is the host's own — the tag is a unique symbol, so a hand-rolled stand-in with
  // `Symbol.for` matches nothing and every read below would come back undefined, which is the exact
  // failure this file exists to catch.

  const run = (source: string, roots: Record<string, unknown>) =>
    evaluateExpression(parseCached(source), {
      root: (name) => (name in roots ? { bound: true, value: roots[name] } : { bound: false, value: undefined }),
      call: (name, args) => (name === 'count' ? (Array.isArray(args[0]) ? args[0].length : 0) : undefined),
    });

  it('resolves the subject to the call in the address', () => {
    expect(run(EXTRACTION_SUBJECT_EXPR, storeBag(['TaskBlock']))).toBe(CALL);
  });

  it('finds that call’s targets, which is what the chips count', () => {
    const roots = storeBag(['TaskBlock', 'EventBlock']);
    const targets = `modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].targets`;

    expect(run(`count(${targets})`, roots)).toBe(2);
    expect(run(`${targets}.map(t, t.entity)`, roots)).toEqual(['TaskBlock', 'EventBlock']);
  });

  it('finds that call’s answer, not the live call’s', () => {
    const roots = storeBag(['TaskBlock']);
    const forSubject = `modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].canExtract`;
    const forLive = 'modules.transcribe.extractionFor[modules.transcribe.callId].canExtract';

    expect(run(forSubject, roots)).toBe(true);
    expect(run(forLive, roots)).toBe(false);
  });
});

describe('the history of what was read', () => {
  const json = JSON.stringify(extractionPanel);

  it('reads passes written down against the call on screen', () => {
    /*
      `interpretationStore` is a live subscription: it starts empty, fills as passes run, and is
      thrown away on every space change. So a call read an hour ago looked exactly like one never
      read at all, and a failed pass looked exactly like one that found nothing — which are the two
      things somebody reviewing a meeting most needs told apart.
    */
    expect(json).toContain('"entity":"ExtractionPass"');
    expect(json).toContain('"via":"extractionPasses"');
    expect(json).toContain(`"anchorId":{"$":"${EXTRACTION_SUBJECT_EXPR}"}`);
  });

  it('draws the outcome rather than a tick on everything', () => {
    // The template's own version drew a green check on every settled row because it never read the
    // outcome, so a pass that failed and one that wrote nine records looked identical.
    expect(json).toContain("pass.outcome == 'failed'");
    expect(json).toContain("pass.outcome == 'skipped'");
    expect(json).toContain('pass.error');
  });

  it('keeps the live feed to the live call, where its rows belong', () => {
    // The store's rows carry no call id, so on a past call they described the wrong conversation.
    expect(JSON.stringify(extractionActivity)).toContain('interpretationStore.hasActivity && !routeStore.params.call');
  });
});
