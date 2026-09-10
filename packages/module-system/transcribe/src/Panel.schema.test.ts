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
  captureStatus,
  coverage,
  EXTRACTION_SUBJECT_EXPR,
  extractionPanel,
  extractionTargets,
  panel,
  pendingUtterance,
  SUBJECT_EXPR,
  transcriptFeed,
  transcriptLines,
} from './Panel.schema';
import { VIEWING_LIVE_EXPR } from './subject';

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

  it('says what the panel is, not which call it is about', () => {
    /*
      It used to say "Past call" when the address named one, which was the heading answering a
      question nothing else could: before the pill above it, the panel's own title was the only
      thing naming the conversation. The pill names it and says who was in it, so a title that
      changes as you move between calls is one that has to be re-read to learn nothing.
    */
    // `panelShell` paints its title into a `we-text`, so what is asserted is the heading it renders
    // rather than the prop handed to it — and that it is a plain string, not a branch.
    expect(panelJson).toContain('"children":["Transcript"]');
    expect(panelJson).not.toContain('Past call');
  });
});

describe('a transcript with nothing in it', () => {
  it('says so, rather than showing an empty panel', () => {
    expect(linesJson).toContain('Nothing has been said here yet.');
  });

  it('waits for the query to answer before asserting emptiness', () => {
    /*
      A list backed by a query is empty on its first frame, so an unqualified else claims "nothing
      here" about a transcript that is still arriving — which on a long one is the wrong sentence
      for as long as it takes to fetch.
    */
    expect(linesJson).toContain('local.utterancesLoaded');
  });

  it('gates on the flag alone, naming no subject a `$part` would have to rewrite', () => {
    /*
      THE regression, and one the assertion above cannot catch: it was
      `local.utterancesLoaded && modules.transcribe.collectionId`, which contains that string and
      still never showed the placeholder on the transcripts it was written for.

      Substitution is whole-token — `moduleParts` rewrites a `{ $ }` whose expression IS the
      subject, and leaves one that merely mentions it inside a longer sentence alone, deliberately,
      since half-rewriting somebody's sentence produces one nobody wrote. So a compound condition
      goes on reading the LIVE collection id, which is null on a past call: the panel gated itself
      shut exactly where an empty state was the whole point.

      Nothing is lost by dropping the term — `when` (asserted below) refuses the query without a
      subject, and a query never asked never reports itself loaded.
    */
    expect(linesJson).toContain('"condition":{"$":"local.utterancesLoaded"}');
    expect(linesJson).not.toContain('local.utterancesLoaded &&');
  });

  it('shows the placeholder where there is no record to wait for, not only where one answered empty', () => {
    /*
      The two situations a newcomer is most likely to be in — no call, and a call nobody has spoken
      in — left the panel blank. `when` refuses the query without a subject and a query never asked
      never reports itself loaded, so the one gate that existed was false in exactly those states.
      The bare subject token is the outer gate now, and it has to stay bare: substitution is
      whole-token, so a compound one would go on reading the live collection inside a panel about a
      past call.
    */
    const gate = linesJson.indexOf('"condition":{"$":"modules.transcribe.collectionId"}');
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(linesJson.indexOf('"condition":{"$":"local.utterancesLoaded"}'));
  });

  it('says what to do next, which is different in each of the six situations', () => {
    /*
      "Nothing has been said here yet" is true in five of them and useless on its own. The panel is
      the only thing that knows which, and the no-call case used to be an italic caption in
      `captureStatus` — above the feed rather than in it, so the same emptiness looked like two
      different things depending on whether an address named a call.
    */
    expect(linesJson).toContain('Continue the call to begin transcribing.');
    expect(linesJson).toContain('Join a call to transcribe what is said.');
    // Named for the button it points at: it reads "Transcribe" now, not "record".
    expect(linesJson).toContain('Press Transcribe to write down what is said.');
    expect(linesJson).not.toContain('Press record');
    // Gone from the status notes, which are about what this node *cannot* do.
    expect(JSON.stringify(captureStatus)).not.toContain('press record');
  });

  it('changes the sentence by remounting it, so continuing a call fades rather than snaps', () => {
    /*
      Kept as one node with a six-branch expression, the text swapped in place with no transition —
      the one moment in this panel that still read as a jump, since switching between calls already
      fades because the branch it lives in unmounts. Split on the live test, continuing does too.
    */
    const gate = linesJson.indexOf(`"condition":{"$":"${VIEWING_LIVE_EXPR}"}`);
    expect(gate).toBeGreaterThan(-1);
    expect(linesJson.slice(gate)).toContain('"enterTransition":{"type":"fade"');
  });

  it('fades out over less time than the microphone section takes to leave', () => {
    /*
      The ordering the whole thing rests on. The renderer keeps an outgoing branch mounted for the
      length of its exit, so a sentence fading here is on screen while the section above it is
      going — and that section vanishing pulled it up the panel mid-fade. Making this exit instant
      did not help: the opacity change lands a frame or two after the condition, so the sentence was
      still painted for the collapse.

      So the section holds its box for longer than this takes, and the order becomes: sentence
      finishes, height goes, new sentence arrives where it will stay. Asserted as the comparison
      rather than as two numbers, because it is the relationship that matters.
    */
    const exitOf = (json: string, from: number) => {
      const at = json.indexOf('"exitTransition":{"type":"fade","duration":', from);
      return at === -1 ? -1 : Number(json.slice(at).match(/"duration":(\d+)/)?.[1]);
    };
    const gate = linesJson.indexOf(`"condition":{"$":"${VIEWING_LIVE_EXPR}"}`);
    const placeholder = exitOf(linesJson, gate);
    const section = exitOf(JSON.stringify(captureMeter), 0);

    expect(placeholder).toBeGreaterThan(0);
    expect(section).toBeGreaterThan(placeholder);
  });

  it('fades the microphone section out rather than collapsing it, and does so at every level', () => {
    /*
      A fade holds the box while it goes transparent; a reveal would collapse the height, which is
      the thing being avoided. All three carry it — the section's own fade holds nothing if its
      children have already unmounted from inside it.
    */
    for (const part of [captureMeter, coverage]) {
      expect(JSON.stringify(part)).toContain('"exitTransition":{"type":"fade","duration":300}');
      expect(JSON.stringify(part)).not.toContain('"type":"reveal"');
    }
    // And the box around them, which has to outlast its contents or it cuts their fades short.
    const section = panelJson.indexOf(`(${VIEWING_LIVE_EXPR}) && (modules.transcribe.enabled`);
    expect(panelJson.slice(section)).toContain('"exitTransition":{"type":"fade","duration":300}');
  });

  it('promises a pick-up only where one is on offer', () => {
    /*
      Another call already running is the state where nothing — not this panel's button, not the
      rail — will continue the one on screen, because doing so would re-point every peer's
      transcript. A clause telling somebody to continue a meeting that nothing will continue is
      worse than no clause, so it is tested before the two that make the offer.
    */
    const refuses = linesJson.indexOf('!(modules.call.canCall && !modules.call.active)');
    expect(refuses).toBeGreaterThan(-1);
    expect(refuses).toBeLessThan(linesJson.indexOf('Continue the call to begin transcribing.'));
    // And the same verb the button uses, decided by the same expression.
    expect(linesJson).toContain('Join the call to begin transcribing.');
  });

  it('asks only about the call on screen, however slowly its id arrives', () => {
    /*
      The hazard the hoist introduced and `when` closes: an operand that has not resolved is pruned
      rather than sent, and pruning WIDENS — a scope that lost its anchor asks for every TextBlock
      in the space. The `$if` that used to wrap the query stood in for this by never rendering it.
    */
    expect(linesJson).toContain('"when":{"$":"modules.transcribe.collectionId"}');
  });
});

describe('what belongs to the live microphone only', () => {
  it('keeps the meter, the coverage readout and the status notes off a call being read back', () => {
    // All three are about the microphone this agent is running now, which says nothing about a
    // meeting somebody opened from a link. A bar moving beside it would measure the wrong thing.
    const live = '{"$":"!routeStore.params.call || routeStore.params.call == modules.transcribe.callId"}';
    const meter = panelJson.indexOf('"Microphone"');
    const coverage = panelJson.indexOf('"Coverage"');
    // Any of the status notes will do as the marker; this is the first of them.
    const status = panelJson.indexOf('Nothing to listen to');

    // All three inside one gate rather than three of their own: they answer one question between
    // them, and that question is not asked at all of a meeting somebody is reading back.
    const gate = panelJson.lastIndexOf(live, meter);
    expect(gate).toBeGreaterThan(-1);
    expect(coverage).toBeGreaterThan(meter);
    expect(status).toBeGreaterThan(coverage);
    expect(panelJson.lastIndexOf(live, status)).toBe(gate);
  });

  it('draws no box for the microphone section while it has nothing to put in it', () => {
    /*
      A `Column` with nothing in it is still a flex item, so an empty one costs its parent a whole
      gap. All three of its children are dark for the second between joining a call and the
      microphone coming up, so continuing pushed the transcript down by twelve pixels of nothing,
      and then down again as the meter arrived.

      Both terms answer in the frame a call is torn down in, which is the point — see below.
    */
    expect(panelJson).toContain(
      `(${VIEWING_LIVE_EXPR}) && (modules.transcribe.enabled || modules.transcribe.available)`,
    );
  });

  it('gates that box on signals, not on a status written a round trip late', () => {
    /*
      It was `available || status != 'idle'`. `status` is set at the tail of `stop`, after a flush
      that writes buffered text to the backend — so leaving a call split across two repaints: audio
      went, coverage left, recording stopped, the meter left, and the box stayed up holding an empty
      gap until the flush resolved, then collapsed under a placeholder that had already settled.

      `enabled` and `available` are plain signals, so the section leaves with everything else.
    */
    const gate = panelJson.indexOf(`(${VIEWING_LIVE_EXPR}) && (modules.transcribe.enabled`);

    expect(gate).toBeGreaterThan(-1);
    expect(panelJson).not.toContain("modules.transcribe.status != 'idle'");
  });

  it('waits for a microphone before reporting coverage, so a gap that closes itself is never drawn', () => {
    /*
      Joining is a second in which all of this is true and wrong: you are in the call and your own
      microphone is not up, so it read "0 of 1 transcribing" in warning orange with the line under
      it about only those microphones reaching the record. Both resolved before anybody could read
      them, and the line arriving and then leaving moved everything below it twice.

      `available` separates the two states that look alike: no audio is a session still coming up
      and nothing to report; audio with no recording is somebody's decision, which is exactly when
      a gap is worth stating. A delayed fade was tried first and was worse — `$animate` keeps its
      child mounted and a fade only touches opacity, so the readout held its full height while
      invisible and the panel opened a hole before filling it in.
    */
    const readout = JSON.stringify(coverage);

    expect(readout).toContain('count(modules.transcribe.callAgents) && modules.transcribe.available');
    expect(readout).not.toContain('$animate');
  });

  it('states the gap in the count alone, with no sentence under it', () => {
    /*
      There was a second line while the count was short: "Only what those microphones hear reaches
      this record." Wrong as well as wordy — this panel has a composer, and a typed line is in the
      record without any microphone hearing it, so the sentence overstated the gap in a panel that
      offers the very thing it forgot.

      The colour is the warning. It turns from success to warning when somebody is not being
      transcribed, and a sentence explaining a number is the kind of chrome people stop reading
      before the day it matters.
    */
    const readout = JSON.stringify(coverage);

    expect(readout).not.toContain('microphones hear');
    expect(readout).toContain("modules.transcribe.partialCoverage ? 'warning-text' : 'success-text'");
  });

  it('keeps the meter up while switched off, and says so rather than going', () => {
    /*
      It was gated on `enabled`, so pressing stop mid-call took the whole meter out and everything
      below it jumped up the panel — worst where there is most to lose, since a long transcript's
      rows move under the eye reading them. It holds the box and reports the state instead.

      The glyph is in both states rather than appearing when off, which is what makes the row's
      height identical by construction rather than dependent on a 16px mark fitting a footnote's
      line box.
    */
    const meter = JSON.stringify(captureMeter);

    expect(meter).toContain('modules.transcribe.enabled || modules.transcribe.available');
    expect(meter).toContain("modules.transcribe.enabled ? 'microphone' : 'microphone-slash'");
    expect(meter).toContain("!modules.transcribe.enabled ? 'off'");
  });

  it('empties the bar when it is not listening, rather than freezing the last reading', () => {
    /*
      `levelPercent` is live and the audio graph is torn down on stop, so the last value before it
      went describes a moment that has passed. Left painted, the bar reports sound nobody is
      listening to.
    */
    expect(JSON.stringify(captureMeter)).toContain(
      "modules.transcribe.enabled ? modules.transcribe.levelPercent : '0%'",
    );
  });

  it('never animates the height of the microphone section, in either direction', () => {
    /*
      The invariant the whole arrangement rests on. A fade changes only opacity, so the box is held
      throughout; a `reveal` animates the height, which is the thing that must not move while
      anything else on screen is mid-transition. The meter carried one for a day, to soften pushing
      the readout down — and the two wait on the same fact now, so there was nothing to push.
    */
    const section = panelJson.indexOf(`(${VIEWING_LIVE_EXPR}) && (modules.transcribe.enabled`);

    for (const json of [JSON.stringify(captureMeter), JSON.stringify(coverage), panelJson.slice(section)]) {
      expect(json).toContain('"enterTransition":{"type":"fade","duration":300}');
      expect(json).not.toContain('"type":"reveal"');
    }
  });

  it('says nothing about starting up, in the meter or beside it', () => {
    /*
      A spinner and "Starting…" appeared under the meter for the few hundred milliseconds an audio
      graph takes to open, then vanished — a whole line arriving and leaving under a meter that had
      just arrived itself. Folding it into the meter's own label cost no layout but still changed a
      word nobody could read into another one.

      "quiet" is already true while a stream comes up: the bar is at zero because nothing has been
      heard, which is what it means a second later too. One stable word beats a narrated setup.
    */
    const meter = JSON.stringify(captureMeter);

    expect(meter).toContain("modules.transcribe.speaking ? 'hearing you' : 'quiet'");
    expect(meter).not.toContain('starting');
    expect(JSON.stringify(captureStatus)).not.toContain('we-spinner');
  });

  it('gates the unsaved line itself, rather than leaving that to whoever places it', () => {
    /*
      The buffer is this agent's own microphone. A fragment that has to be wrapped in the right
      condition by its consumer is a fragment that will be placed without one — the workshop wrapped
      it by hand, and nothing would have said so if it had been forgotten.
    */
    expect(JSON.stringify(pendingUtterance)).toContain(
      'modules.transcribe.pending && (!routeStore.params.call || routeStore.params.call == modules.transcribe.callId)',
    );
  });

  it('leaves the record button out where it could not work, rather than showing a dead one', () => {
    /*
      It was a `disabled`, true in exactly one situation: outside a call, where there is no audio.
      So the control sat greyed out in the header of every panel opened outside a call — the state a
      newcomer opens it in — beside a placeholder already explaining that a call is what is missing.

      `enabled ||` is what keeps the way *out* of recording: a stream dropping mid-call must not
      take the stop button with it and leave this agent recording with nothing on screen to say so.
    */
    expect(panelJson).toContain('modules.transcribe.enabled || modules.transcribe.available');
    expect(panelJson).not.toContain('!modules.transcribe.enabled && !modules.transcribe.available');
  });

  it('offers recording on the live call and a way back into a past one, never both', () => {
    /*
      The header's one control follows which call is on screen. A past call's is the only offer it
      has: an empty transcript can say "continue this" in its placeholder, but one with rows shows
      rows, so without this the calls somebody most wants to resume were the ones nothing offered to.
    */
    expect(panelJson).toContain('modules.transcribe.toggle');
    expect(panelJson).toContain('modules.call.continueCall');
    // The three-action chain it replaced. Adoption happens on its own, and the live test compares
    // the address to what is recorded rather than asking whether an address exists.
    expect(panelJson).not.toContain('modules.transcribe.resume');
    expect(panelJson).not.toContain('{"$action":"routeStore.setParam","args":["call",null]}');
  });

  it('keeps the pick-up out of the live view, where there may be no call to pick up', () => {
    /*
      The record button's audio check was folded into the same condition, which reads correctly and
      is wrong: the `else` then means two things at once — a call being read back, *and* a live view
      with no microphone. So the panel offered to continue a call with no call on screen, and the
      press did nothing, since the record it names is the empty address.

      Asserted as the condition that actually guards the offer rather than as a string in the tree,
      because the failure was a true condition in the wrong place.
    */
    const guards: (string | undefined)[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      const fields = node as Record<string, unknown>;
      const props = fields.props as Record<string, unknown> | undefined;
      if (fields.type === '$if' && props?.else && JSON.stringify(props.else).includes('modules.call.continueCall')) {
        guards.push((props.condition as { $?: string } | undefined)?.$);
      }
      Object.values(fields).forEach(walk);
    };
    walk(panel);

    expect(guards).toEqual([VIEWING_LIVE_EXPR]);
  });

  it('refuses to offer a pick-up that would tear down a call in progress', () => {
    // The call store's own rule: continuing while another call runs re-points every peer's
    // transcript at the old record. The rail refuses for the same reason, so this cannot differ.
    expect(panelJson).toContain('modules.call.canCall && !modules.call.active');
  });

  it('says join rather than continue where somebody is already in the call', () => {
    // The press is identical either way — `continueCall` derives the call from its record, so
    // arriving at one somebody is in *is* joining them. The word is the only thing that differs.
    expect(panelJson).toContain('modules.call.liveCalls.exists(c, c.recordId == routeStore.params.call)');
    expect(panelJson).toContain("? 'Join' : 'Continue'");
  });
});

/**
 * Whether the call on screen is the one being recorded.
 *
 * The reported bug: continuing a call from the module rail leaves the address naming it, where the
 * panel's own continue button cleared the parameter as it went. While this asked "does the address
 * name a call", those two paths disagreed — the rail's left a meeting in progress reading as a past
 * one, with no meter, no coverage, no unsaved line and no REC badge for the rest of it.
 */
describe('which call is live', () => {
  it('asks whether the call named is the one being recorded, not whether one is named', () => {
    // `callId` rather than `collectionId`: the collection appears on the first utterance, so the
    // panel would call a joined-but-silent call a past one until somebody spoke.
    expect(VIEWING_LIVE_EXPR).toContain('modules.transcribe.callId');
    expect(VIEWING_LIVE_EXPR).toContain('!routeStore.params.call');
    // The test it used to make, which is true of a live call the address happens to name.
    expect(VIEWING_LIVE_EXPR).not.toContain('? false : true');
  });

  it('is the one question, asked once', () => {
    /*
      Five surfaces gated on it and four of them had spelled it out for themselves, so the fix had
      to land in five places or in none. They read the shared expression now.
    */
    for (const json of [panelJson, JSON.stringify(pendingUtterance), JSON.stringify(extractionActivity)]) {
      expect(json).not.toContain("!routeStore.params.call'");
    }
    expect(panelJson).toContain(VIEWING_LIVE_EXPR);
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

  it('times a row by the clock once the call is over, and relatively while it is not', () => {
    /*
      Every row of a transcript came out of one conversation, so relative time says the same thing on
      all of them — "6 days ago", two hundred times, carrying nothing and taking the width that made
      the row wrap. The clock says where in the meeting the line was, which is the question.

      Pinned as one node rather than two: `relative` short-circuits inside the primitive, so a branch
      here would unmount and rebuild every row the moment a call ended.
    */
    expect(linesJson).toContain(
      '"relative":{"$":"!routeStore.params.call || routeStore.params.call == modules.transcribe.callId"}',
    );
    expect(linesJson).toContain('"timeStyle":"short"');
  });

  it('mends a line at the size it is read at, in a box that starts one row tall', () => {
    /*
      `size` presets carry type as well as padding, so a compact control also shrank the words —
      mending a line made it visibly smaller than the line beside it. And two fixed rows is half a
      box of empty space under an utterance that is usually one line long.
    */
    expect(linesJson).toContain('"fontSize":"300"');
    expect(linesJson).toContain('"autoGrow":true');
    expect(linesJson).not.toContain('"rows":2');
  });

  it('leaves plain speech unmarked, and marks the two kinds of line that are not', () => {
    /*
      A transcript is speech almost all the way down. Marking it would put furniture on every row to
      restate the panel's own title, and a mark that appears everywhere is one people stop reading —
      so `spoken` is the silent default and the marks exist for where the reader's assumption would
      be wrong.
    */
    expect(linesJson).toContain("utterance.source == 'typed'");
    expect(linesJson).toContain("utterance.source == 'corrected'");
    // No sparkle: machine-heard is the assumption in a transcript, so it would not be news.
    expect(linesJson).not.toContain('sparkle');
  });

  it('names who gives up space on the meta row, so the marks are never crushed', () => {
    /*
      A flex item's automatic minimum size is its content, so an unsaid contract takes the deficit
      out of whatever can shrink. Typography defaults to `overflow-wrap: anywhere`, which drops a
      word's min-content width to one glyph — so "(edited)" could shrink to nothing and broke
      mid-word onto two lines in a narrow panel.

      The name is the only thing on the row with a sensible narrower form, and `truncate` needs
      `minWidth: 0` to happen at all.
    */
    // `0 1 auto`: shrink without growing. A grow factor would take every spare pixel and push the
    // clock, the marks and the pencil to the far edge, which is right-aligning a row nobody asked
    // to be right-aligned.
    expect(linesJson).toContain('"truncate":true,"flex":"0 1 auto","minWidth":"0"');
    expect(linesJson).toContain('"whiteSpace":"nowrap"');
    /*
      And nothing on the marks. `we-tooltip` is `display: contents`, so the badge and the text are
      themselves the flex items and their own refusal to shrink is what counts — `we-badge` already
      declares it in the primitive. A `flexShrink` out here would be the workaround from when the
      wrapper took a box, which is the thing that stopped being true.
    */
    expect(linesJson).not.toContain('"flexShrink"');
  });

  it('lets go of the pointer on the way out of the editor, so the pencil does not flash', () => {
    /*
      Leaving the editor makes the row shorter — a field and two buttons become one line — so it
      reflows out from under a pointer that was on Cancel. Without this the read view mounts with
      `pointerOnRow` still true, the pencil fades in over 200ms, and the pointer is by then outside
      the shrunken row so it fades straight back out.

      Both exits, since the row reflows the same way whichever one is taken.
    */
    // Matched on the handler each belongs to, not by counting: a bare count is also satisfied by the
    // row's own mouseleave, which writes the same token and would have let this pass with the fix
    // removed from one of the two exits.
    const both = '[{"$setLocal":"mending","value":false},{"$setLocal":"pointerOnRow","value":false}]';
    expect(linesJson).toContain(`"onClick":${both}`);
    expect(linesJson).toContain(`"onSuccess":${both}`);
  });

  it('gives the typed mark a ground, so it does not read as part of the clock', () => {
    /*
      In `en-US` the time ends "AM" or "PM", and a bare "Aa" in the same faint grey right after it is
      one word to the eye. Moving the mark to the other side of the row was tried first and did not
      help — what separates them is a *ground*, not a gap, so the mark stops being loose text on the
      row and becomes a thing sitting on it.

      The badge's own neutral fill is `control-surface` for exactly this: a step away from the row's
      `surface-sunken` in either polarity. See BADGE_APPEARANCE_DEFAULTS, where this row is the case
      that argued it.
    */
    expect(linesJson).toContain('{"type":"we-badge","props":{"size":"xs","variant":"neutral"}');
    /*
      A keyboard rather than the letterform it used to be. Everything on this row is text, so what
      the mark is about is how the line *arrived* — and the panel's own record button now spends
      `text-aa` on transcription, as the call bar always did. One surface cannot give that glyph two
      meanings a few rows apart.
    */
    expect(linesJson).toContain('keyboard');
    expect(linesJson).not.toContain('text-aa');
  });

  it('says a corrected line was edited in words, not behind a hover', () => {
    /*
      This is a claim about whether the line is still a verbatim quote. A tooltip is invisible on a
      touchscreen and to anybody not poking at rows, which is the wrong property for a trust signal —
      so the words carry it and the tooltip only adds when.
    */
    expect(linesJson).toContain('(edited)');
    expect(linesJson).toContain('"value":{"$":"utterance.updatedAt"}');
  });

  it('abbreviates the relative form, which is the one thing on the row with a shorter form', () => {
    /*
      A prop nothing sets is a prop that does nothing, and this one shipped that way once: the
      primitive gained `relativeStyle` and no call site named it, so every row went on reading
      "3 hours ago" in a panel narrow enough that the phrase was the reason the row wrapped.

      `narrow` rather than Intl's `short`, which in English does not abbreviate "days" at all — so it
      leaves the widest string untouched — and spells the rest with full stops.
    */
    expect(linesJson).toContain('"relativeStyle":"narrow"');
    expect(linesJson).not.toContain('"relativeStyle":"short"');
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
  });

  it('carries all three recording states in the button, so nothing else has to', () => {
    /*
      There was a solid red REC chip beside this. Between them they made one point twice, and the
      split was forced: the button had two variants, so it could not look different while actually
      capturing and the chip was added to cover the third state. The call bar's copy has carried all
      three for a while — off quiet, armed `secondary`, capturing `danger`, on the reasoning that a
      state which arrives on its own must be legible without being looked for.
    */
    expect(panelJson).toContain(
      "modules.transcribe.listening ? 'danger' : modules.transcribe.enabled ? 'secondary' : 'ghost'",
    );
    expect(panelJson).not.toContain('"children":["REC"]');
  });

  it('says what it is in a word, and lets the button own the colour', () => {
    /*
      Icon-only, this asked a newcomer to know that a mark means transcription — and the panel had
      answered that once already with a REC chip that has since gone. The header has room, which the
      Continue button beside it proves, so the word carries the state and the tooltip carries the
      act. No `label` prop with them: the accessible name is the visible word rather than a second
      string that has to be kept containing it.

      The icon's own red is gone. Red is the button's now, so a colour here would be red on red,
      which is the second of the two bugs the call bar's note says were fixed there and left standing
      on this copy.
    */
    expect(panelJson).toContain("modules.transcribe.enabled ? 'Transcribing' : 'Transcribe'");
    expect(panelJson).toContain('{"type":"we-icon","props":{"name":"record"}}');
    expect(panelJson).not.toContain("modules.transcribe.listening ? 'danger' : ''");
    expect(panelJson).not.toContain("'Stop transcribing' : 'Start transcribing'\"},\"variant\"");
  });

  it('waits for the microphone, so the word on it never turns over in front of you', () => {
    /*
      This asked `callId` for a day, so that it appeared the instant a call was joined rather than a
      second later with the meter. The cost was a label that changed itself: recording starts only
      once there is a stream, so the button read "Transcribe" and then became "Transcribing".

      There is no third option. The state genuinely changes in that second, so a label reporting the
      state must change with it, and one reporting it early is guessing — auto-join can still be
      refused by `recordCalls`, and a device that never opens would leave "Transcribing" standing
      over nothing recorded with no diagnostic on screen. Waiting is the version with neither a
      changing word nor a false one.
    */
    expect(panelJson).toContain('modules.transcribe.enabled || modules.transcribe.available');
    expect(panelJson).not.toContain('modules.transcribe.enabled || modules.transcribe.callId');
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
    const live = '{"$":"!routeStore.params.call || routeStore.params.call == modules.transcribe.callId"}';
    expect(json.indexOf(live)).toBeLessThan(json.indexOf('Auto extract: on'));
  });

  it('says what the two header controls do, and for whom', () => {
    /*
      The auto control was a `we-switch` whose `label` is only an aria-label — an unlabelled toggle
      beside a button reading "Extract", with nothing on screen to say which did what. Both name
      themselves now, and the auto one says it is everybody's, since the record button one panel
      over looks the same and is only this agent's microphone.
    */
    expect(json).not.toContain('"we-switch"');
    expect(json).toContain('Auto extract: on');
    expect(json).toContain('Auto extract: off');
    expect(json).toContain('for everyone in it');
    expect(json).toContain('Extract now');
    // Accent, not red: red is the transcript's word for a live microphone.
    expect(json).toContain(`modules.transcribe.autoExtract ? 'primary' : 'ghost'`);
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

  it('explains itself behind the glyph, not in the body', () => {
    /*
      The box above the chips held three lines of prose — a bold "Extract" under a panel already
      called Extraction, a lead-in above the chips, a footnote under the button — every one of them
      true, read once, and thereafter furniture in a docked panel with no room to spare. What they
      said is in the header's help now, which is read on demand.
    */
    expect(json).not.toContain('Look through what was said for');
    expect(json).not.toContain('press Extract to sweep');
    expect(json).not.toContain('"children":["Extract"]');
    expect(json).toContain('"label":"How this works"');
    expect(json).toContain('before a model was switched on');
    // The button keeps a phrase of its own: how it differs from the automatic pass is what somebody
    // hovering it is asking.
    expect(json).toContain('Reads the whole conversation so far');
  });

  it('keeps the controls off the chips ground, and names what the chips are', () => {
    /*
      The two controls spent a while as the top row of the sunken box holding the chips, and a
      filled button on the same ground as a row of outlined ones reads as one set of toggles —
      the confusion that had Extract looking like a fourth chip when it lived in the row itself.

      Out of the box, the chips are a row of unexplained words under a heading that only says
      "Extraction", so three words name them. Not `sectionLabel`, which is this panel's uppercase
      treatment for a whole region: a scroll area of proposals is a section, a control row is not.
    */
    const controls = json.indexOf('Auto extract: on');
    const label = json.indexOf('Things to extract:');
    const chips = json.indexOf('transcribe.extractionTargets');

    expect(controls).toBeLessThan(label);
    expect(label).toBeLessThan(chips);
    // The ground belongs to the chips alone now — the controls are above it, not inside it.
    expect(json.indexOf('"bg":"surface-sunken"')).toBeGreaterThan(controls);
    expect(json).not.toContain('THINGS TO EXTRACT');
  });

  it('shows nothing to press outside a call, rather than a well of disabled controls', () => {
    /*
      It was an auto switch that could not be pressed, an Extract that could not run, and a chip row
      showing the space's default list greyed out — each correctly disabled and none of them
      actionable, which is a panel explaining what it *would* offer rather than what it does.

      The same gate everything else here already carries: proposals, the history and the results
      below all ask for a call first.
    */
    const well = json.indexOf('"bg":"surface-sunken"');
    expect(well).toBeGreaterThan(-1);
    expect(json.lastIndexOf(`"condition":{"$":"${EXTRACTION_SUBJECT_EXPR}"}`, well)).toBeGreaterThan(-1);
  });

  it('uses the same placeholder as the transcript panel, in the same words', () => {
    /*
      Both were hand-written columns with `footnote` text, a step smaller than the shared fragment
      draws — two panels side by side in one dock saying the same kind of thing in two sizes. The
      fragment also brings the delayed fade, which stops a placeholder asserting emptiness on the
      frame before a query answers.
    */
    expect(json).toContain('Join a call to start extracting things.');
    expect(json).not.toContain('Start a call.');
    // `emptyState`'s own shape: the larger padding, no `variant` on the sentence, and the delay.
    expect(json).toContain('"p":"600"');
    expect(json).toContain('"delay":400');
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

  /**
   * The empty transcript's sentence, evaluated rather than matched.
   *
   * Six branches deciding one line, and their *order* is what makes them exclusive — a string
   * search can see every sentence is present and say nothing about which one a reader would get.
   * These are the six situations, written as the store would answer them.
   */
  describe('what an empty transcript says', () => {
    /**
     * The two sentences, dug out of the tree rather than restated.
     *
     * Two because they are two branches of a `$if` on whether the call on screen is the one being
     * recorded — which is what makes continuing a call fade one out and the other in, rather than
     * swapping the text in place. `messageFor` below does what the renderer does: answers that
     * condition against the situation, then reads the branch it selects.
     */
    const messages = (() => {
      const found: string[] = [];
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        const fields = node as Record<string, unknown>;
        const first = Array.isArray(fields.children) ? (fields.children[0] as { $?: string } | undefined) : undefined;
        // Both branches carry this sentence, and nothing else in the tree does — which is what
        // makes it the marker rather than a word like "transcribe" that the rows use too.
        if (fields.type === 'we-text' && first?.$?.includes('Nothing has been said here yet')) found.push(first.$);
        Object.values(fields).forEach(walk);
      };
      walk(transcriptLines);
      // Deduped: the placeholder is referenced from both arms of the gate above it — one waits for
      // the query to answer, the other has no record to wait for — so every sentence is found twice.
      return [...new Set(found)];
    })();

    /** A transcribe store and a call store, answering the six things this sentence asks them. */
    const situation = (over: {
      address?: string;
      recording?: string;
      enabled?: boolean;
      /** Whether this agent's microphone is up. False through the second after joining a call. */
      micUp?: boolean;
      inACall?: boolean;
      liveRecords?: string[];
      callModule?: boolean;
    }) => ({
      modules: namespace((id) =>
        id === 'transcribe'
          ? namespace((member) =>
              member === 'callId'
                ? markReactive(() => over.recording ?? '')
                : member === 'enabled'
                  ? markReactive(() => over.enabled === true)
                  : member === 'available'
                    ? markReactive(() => over.micUp === true)
                    : undefined,
            )
          : id === 'call' && over.callModule !== false
            ? namespace((member) =>
                member === 'canCall'
                  ? markReactive(() => true)
                  : member === 'active'
                    ? markReactive(() => over.inACall === true)
                    : member === 'liveCalls'
                      ? markReactive(() => (over.liveRecords ?? []).map((recordId) => ({ recordId })))
                      : undefined,
              )
            : undefined,
      ),
      routeStore: namespace((member) =>
        member === 'params' ? markReactive(() => ({ call: over.address ?? '' })) : undefined,
      ),
    });

    /** What a reader would see: the branch the live test selects, evaluated in that situation. */
    const messageFor = (roots: Record<string, unknown>) => {
      const live = run(VIEWING_LIVE_EXPR, roots);
      const [forLive, forPast] = messages;

      expect(messages).toHaveLength(2);
      return run(live ? forLive : forPast, roots);
    };

    it('offers the way in where there is no call at all', () => {
      // Joining is the only step named, because it is usually the only one: `recordCalls` defaults
      // on, so transcription starts with the call. "Press record" belongs to the one state it is
      // true in, which is the next case down.
      expect(messageFor(situation({}))).toBe('Join a call to transcribe what is said.');
    });

    it('offers the record button where this agent is in a call and not using it', () => {
      expect(messageFor(situation({ recording: 'rec-live', micUp: true }))).toBe(
        'Nothing has been said here yet. Press Transcribe to write down what is said.',
      );
    });

    it('says nothing about pressing record while the microphone is still coming up', () => {
      /*
        The second between joining a call and the audio graph opening. Recording starts on its own
        there, so the advice is wrong — and it was on screen just long enough to change the sentence
        twice on the way to the one it keeps. Landing on that sentence early is what makes the join
        one transition instead of three.
      */
      expect(messageFor(situation({ address: 'rec-old', recording: 'rec-old' }))).toBe(
        'Nothing has been said here yet.',
      );
    });

    it('says only that it is waiting once recording is on', () => {
      expect(messageFor(situation({ recording: 'rec-live', micUp: true, enabled: true }))).toBe(
        'Nothing has been said here yet.',
      );
    });

    it('offers to pick up a call nobody is in', () => {
      expect(messageFor(situation({ address: 'rec-old' }))).toBe(
        'Nothing has been said here yet. Continue the call to begin transcribing.',
      );
    });

    it('offers to join one somebody is in, which is a different act with the same press', () => {
      expect(messageFor(situation({ address: 'rec-old', liveRecords: ['rec-old'] }))).toBe(
        'Nothing has been said here yet. Join the call to begin transcribing.',
      );
    });

    it('promises nothing while another call is running, because nothing would honour it', () => {
      // Continuing then would re-point every peer's transcript at the old record, so the panel's
      // button is gone and the rail refuses too. A clause nothing will act on is worse than none.
      expect(messageFor(situation({ address: 'rec-old', recording: 'rec-other', inACall: true }))).toBe(
        'Nothing has been said here yet.',
      );
    });

    it('does not offer to join a call while it is fading out of one', () => {
      /*
        A branch being faded out is still live. Leaving a continued call empties `callId` while the
        address still names the record, so the live branch re-rendered on its way out and offered to
        join a call — the opposite of what the incoming branch was about to say — for the length of
        the exit.

        Evaluated against the live branch directly rather than through `messageFor`, because the
        situation is one where that branch has already lost: this is what it says while it leaves.
      */
      const [forLive] = messages;

      expect(run(forLive, situation({ address: 'rec-old' }))).toBe('Nothing has been said here yet.');
      // And the sentence is still reachable where it is true: no address, and nothing recording.
      expect(run(forLive, situation({}))).toBe('Join a call to transcribe what is said.');
    });

    it('promises nothing in a deployment with no call module', () => {
      // `modules.call` resolves to nothing rather than failing, which is the whole reason this
      // module may name another one at all.
      expect(messageFor(situation({ address: 'rec-old', callModule: false }))).toBe('Nothing has been said here yet.');
    });
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
    expect(JSON.stringify(extractionActivity)).toContain(
      'interpretationStore.hasActivity && (!routeStore.params.call || routeStore.params.call == modules.transcribe.callId)',
    );
  });
});
