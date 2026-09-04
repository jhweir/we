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
import { describe, expect, it } from 'vitest';

import { transcribeModule } from './index';
import { captureMeter, panel, pendingUtterance, SUBJECT_EXPR, transcriptFeed } from './Panel.schema';

const panelJson = JSON.stringify(panel);
const feedJson = JSON.stringify(transcriptFeed);

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
