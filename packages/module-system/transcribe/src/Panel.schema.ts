/**
 * The transcription panel — live feedback while transcribing, and nothing when not.
 *
 * Keyed on `open`, not on whether we are recording. Those were one flag to begin with, which meant
 * the transcript disappeared the instant you stopped recording — exactly when you want to read it —
 * and left no way to check what had been captured without starting again.
 *
 * So: the call bar's button records, this panel shows, and either can be true without the other.
 * Recording does open the panel once, because starting something invisible and saying nothing about
 * it is how a feature comes to look broken.
 *
 * In its own `.schema.ts` file so `pnpm --filter @we/schema-shared validate` checks it. The validator
 * walks files by that name, and module fragments declared inline in an `index.ts` were invisible to
 * it — which is how a module could ship a typo'd prop that only appears as a component silently not
 * rendering. The other three modules still declare their fragments inline; this is the shape they
 * should move to.
 */
import { emptyState, panelShell, sectionLabel } from '@we/schema-kit';
import { type SchemaNode } from '@we/schema-shared';
import { expr } from '@we/schema-shared';

import { extractionActivity } from './ExtractionStatus.schema';
import { SUBJECT_EXPR as SHARED_SUBJECT_EXPR, VIEWING_LIVE_EXPR } from './subject';

/**
 * Which call this panel is about — the one named in the address, or the one being recorded.
 *
 * A transcript surface has always had two possible subjects and only ever admitted to one. The
 * workshop template noticed first and answered it by supplying a whole panel body of its own, which
 * bought route-awareness at the price of a second copy of the header, the feed and the gating — and
 * the copy promptly drifted: it never gained `coverage` or `captureStatus`, and the first fix to
 * land on the scroll area landed on one of the two.
 *
 * It is not template knowledge. "Show the call the address names, else the live one" is what any
 * transcript panel should do, so it lives here and every interface gets it by placing the panel.
 *
 * `collectionId` rather than the call module's record id: the collection is created on the first
 * utterance, so its absence is exactly "nothing has been said here", which is the question
 * `captureStatus` is already answering. A call with a record and no words is not a transcript.
 */
export const SUBJECT_EXPR = SHARED_SUBJECT_EXPR;
const SUBJECT = { $: SUBJECT_EXPR };

/**
 * Whether the call on screen is the one being recorded, as opposed to one being looked back at.
 *
 * Everything about *this agent's microphone* is gated on it — the meter, the coverage readout, the
 * status notes, the unsaved line and the record button. A bar moving beside last month's meeting
 * would be measuring the wrong thing and saying so confidently.
 *
 * ## Naming a call is not the same as reading one back
 *
 * This used to be "the address names a call", and the two coincided for as long as the only way to
 * pick a call up was a button that cleared the parameter as it went. The module rail can now
 * continue the call on screen, which leaves the address naming it — so the panel called a meeting
 * in progress a past one, and hid the level meter, the coverage readout, the unsaved line and the
 * REC badge for the rest of it.
 *
 * The honest question is whether the call named is the one being recorded, and this module can
 * answer it without naming another: `callId` is what it is about, falling back to the live call's
 * own record, so it is set from the moment a call is joined rather than from the first thing said.
 *
 * Read from the address rather than derived from `SUBJECT`, because whole-token substitution cannot
 * rewrite an expression that merely mentions the subject: a `$part` pointed at another call is
 * expected to be on a route that names it, which is what `SUBJECT_EXPR` already assumes.
 */
const VIEWING_LIVE = { $: VIEWING_LIVE_EXPR };

/**
 * Whether this agent could pick the call on screen up.
 *
 * Two terms, and each is a different kind of refusal. `canCall` is absent — and so falsy — in a
 * deployment without the call module, which is what lets this module name another one at all: the
 * offer is simply not made rather than resolving to an action nothing implements.
 *
 * `!active` is the safety gate, and it is the call store's own rule rather than a preference.
 * Continuing a past call while another is running tears the live one down and re-points every peer's
 * transcript at the old record, since peers adopt an announced record over their own. The rail
 * refuses for the same reason, in the same words, at `goToCall`.
 */
const CAN_PICK_UP = 'modules.call.canCall && !modules.call.active';

/**
 * Whether somebody is in the call on screen right now.
 *
 * The difference between joining a conversation and restarting one, and the only thing separating
 * two presses that are otherwise identical: `continueCall` derives the call's id from its record, so
 * arriving at one somebody is already in *is* joining them. What changes is the word for it, and a
 * button offering to "continue" a meeting three people are sitting in is describing the wrong act.
 *
 * Read off the call module's own roster of what is running here rather than from presence directly,
 * which this module has no view of beyond its own entry.
 */
const CALL_ON_SCREEN_LIVE = 'modules.call.liveCalls.exists(c, c.recordId == routeStore.params.call)';

/**
 * Which call the *extraction* surface is about.
 *
 * The same shape as `SUBJECT_EXPR`, and a different fallback for a reason worth writing down.
 * `collectionId` is what the transcriber is writing into and is null until somebody speaks, which is
 * the honest answer for a transcript — no collection, nothing said. Extraction is asked earlier than
 * that: choosing what a meeting will look for, before the meeting, is exactly when somebody wants
 * to, and the call's own record exists from its first second. `callId` is that record.
 */
export const EXTRACTION_SUBJECT_EXPR = 'routeStore.params.call ? routeStore.params.call : modules.transcribe.callId';
const EXTRACTION_SUBJECT = { $: EXTRACTION_SUBJECT_EXPR };

/**
 * What is staged on the call this panel is showing, waiting on somebody.
 *
 * Keyed on the subject rather than read as "the live call's", which is what it used to be. Two
 * things were wrong with that and only one was visible: a panel opened on a *past* call listed
 * whatever the live one had staged, and — the reported symptom — reopening any call after a restart
 * listed nothing at all, because the flat list was only ever filled by a pass settling or by the
 * transcriber adopting a record, and neither happens on a fresh boot. Reading a key fetches it.
 */
const PROPOSALS = `modules.transcribe.proposalsFor[${EXTRACTION_SUBJECT_EXPR}]`;

/** The entity names this call may have extracted, ticked or not — what the results list groups by. */
const EXTRACTION_TARGET_ENTITIES = `modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].targets.map(t, t.entity)`;

/** What the store says can be extracted from that call — see `extractionFor` on the store. */
const forSubject = (field: 'targets' | 'canChoose' | 'canExtract') => ({
  $: `modules.transcribe.extractionFor[${EXTRACTION_SUBJECT_EXPR}].${field}`,
});

/**
 * A message shown for exactly one status.
 *
 * Every reason this module can produce nothing gets its own line, because from the user's side they
 * are indistinguishable — an empty panel means "nobody is speaking", "no model is installed" and
 * "this backend cannot transcribe" equally well, and only one of those is worth acting on.
 */
function note(status: string, icon: string, text: string, action?: SchemaNode): SchemaNode {
  return {
    type: '$if',
    props: {
      condition: expr`modules.transcribe.status == ${status}`,
      then: {
        type: 'Column',
        props: { gap: '200', ay: 'start' },
        children: [
          {
            type: 'Row',
            props: { gap: '200', ay: 'start' },
            children: [
              { type: 'we-icon', props: { name: icon, color: 'text-faint' } },
              { type: 'we-text', props: { variant: 'footnote', color: 'text-muted' }, children: [text] },
            ],
          },
          ...(action ? [action] : []),
        ],
      },
    },
  };
}

/**
 * The microphone level, with the line speech has to cross drawn on it.
 *
 * The threshold marker is the point. A bare level bar answers "is audio arriving", which was never
 * really in doubt; what a user actually needs when nothing is being transcribed is "am I loud
 * enough", and that is only answerable against the number the VAD compares to. Both come from the
 * same measurement in the worklet, so the bar and the decision cannot disagree.
 *
 * Both widths arrive from the store as CSS percentages — the scale factor is a property of how loud
 * speech is, and belongs next to the numbers rather than in a template.
 *
 * ## Why this is named
 *
 * Named as a part because a template that supplies its own transcript panel otherwise loses the
 * answer to "is it hearing me". That is the one question a transcript cannot answer for itself: an
 * utterance takes seconds to buffer, transcribe and write, so a panel showing only saved lines is
 * indistinguishable from a broken microphone for the whole of that delay.
 *
 * The workshop template used to be that consumer, and its copy of the panel never placed this — so
 * the interface built around recording a meeting said *less* about a failing microphone than the
 * default one did. It places the whole panel now, which is the better answer to a shared piece; the
 * part stays for the interface that genuinely wants a different arrangement.
 *
 * No `subject`. Unlike the feed, this is about the microphone *this agent* is running right now,
 * which is a property of the session and not of any call record — pointing it at another call
 * would be pointing a live meter at something that is not being measured.
 */
/**
 * How everything about the microphone arrives and leaves: a fade, and deliberately never a reveal.
 *
 * A fade changes only opacity, so the element holds its box throughout — which is the whole point in
 * both directions. Reveal animates the height instead, and the height is the thing that must not
 * move while anything else is on screen changing.
 *
 * ## Leaving
 *
 * Leaving a call takes the meter, the coverage readout and the section around them away at once, and
 * the placeholder underneath is mid-fade at that moment: the renderer keeps an outgoing branch
 * mounted for the length of its exit, so the sentence was still painted when the space above it
 * vanished, and slid up the panel while transparent. This is longer than the placeholder's own exit,
 * so the order is the sentence finishing, then the height going, with nothing visible left to move.
 *
 * ## Arriving
 *
 * The same string, for symmetry and for a real reason. Without an explicit `enterTransition` the
 * renderer sets opacity straight to 1 in the effect, with no painted start value to interpolate
 * from — so whether anything actually faded depended on whether this box had been shown before,
 * which is not a difference anybody chose. Declared, it always fades.
 *
 * Nothing about the reflow changes either way: the box claims its space the moment it renders,
 * transparent or not, so what this decides is only whether the contents appear or resolve.
 *
 * All three levels carry it. The section's own fade holds nothing if the meter and the readout have
 * already unmounted from inside it, and those two answer to different facts — the readout to a
 * microphone existing, the meter to recording — so each has to hold its own height.
 */
const MIC_FADE = { type: 'fade', duration: 300 };

export const captureMeter: SchemaNode = {
  type: '$if',
  props: {
    /*
      A microphone to speak into, whether or not it is being listened to.

      This asked `enabled`, so pressing stop mid-call took the whole meter out and everything below
      it jumped up the panel — worst where there is most to lose, a long transcript, since the rows
      move under the eye that is reading them. Holding the box and reporting that it is off costs the
      same space and moves nothing.

      Which makes it the same question the section around it asks, and that is deliberate: the meter
      is the section's whole reason to exist, so a state where one is up and the other is not would
      be a gap where a readout should be. Kept as a condition rather than dropped, because this is a
      part an interface can place on its own, and placed outside a call it should render nothing.
    */
    condition: { $: 'modules.transcribe.enabled || modules.transcribe.available' },
    enterTransition: MIC_FADE,
    exitTransition: MIC_FADE,
    then: {
      type: 'Column',
      props: { gap: '100' },
      children: [
        {
          type: 'Row',
          props: { ax: 'between', ay: 'center' },
          children: [
            {
              type: 'Row',
              props: { ay: 'center', gap: '200' },
              children: [
                {
                  /*
                    The glyph carries the off state, and it is present in both so the row cannot
                    change height between them.

                    That is the whole point of this arrangement: an icon that appears only when
                    switched off would put the height back at the mercy of whether a 16px glyph fits
                    inside a footnote's line box, which is the thing being avoided. Swapping the mark
                    leaves the geometry identical by construction.
                  */
                  type: 'we-icon',
                  props: {
                    size: 'sm',
                    name: { $: "modules.transcribe.enabled ? 'microphone' : 'microphone-slash'" },
                    color: { $: "modules.transcribe.enabled ? 'text-muted' : 'text-faint'" },
                  },
                },
                {
                  type: 'we-text',
                  props: {
                    variant: 'footnote',
                    color: { $: "modules.transcribe.enabled ? 'text-muted' : 'text-faint'" },
                  },
                  children: ['Microphone'],
                },
              ],
            },
            {
              /*
                Says which side of the threshold we are on, for anyone who cannot read the bar — and
                says "off" where there is no threshold to be on a side of.

                Three words, and no fourth for the moment the audio graph is opening. That moment had
                a row of its own once — a spinner and "Starting…" under the meter, which moved
                everything below it as it came and went — and then, briefly, this label, which was
                cheaper but still a word nobody could read changing to another. "quiet" is already
                true while a stream is coming up: the bar is at zero because nothing has been heard
                yet, which is the same thing it means a second later. A meter that says one stable
                thing is worth more than one that narrates its own setup.
              */
              type: 'we-text',
              props: {
                variant: 'footnote',
                color: { $: "modules.transcribe.speaking ? 'success-text' : 'text-faint'" },
              },
              children: [
                {
                  $: "!modules.transcribe.enabled ? 'off' : " + "modules.transcribe.speaking ? 'hearing you' : 'quiet'",
                },
              ],
            },
          ],
        },
        {
          type: 'Row',
          props: {
            position: 'relative',
            height: '8px',
            width: '100%',
            bg: 'surface-sunken',
            r: 'pill',
            overflow: 'hidden',
          },
          children: [
            {
              type: 'Row',
              props: {
                height: '100%',
                r: 'pill',
                // The `success` FILL, not `success-500`: a scale position is one theme's idea of a
                // green and cannot follow a theme that pins the role. It also hid from `role-audit`,
                // which until now only read colours written as plain strings and not ones inside an
                // expression.
                bg: { $: "modules.transcribe.speaking ? 'success' : 'surface-active'" },
                // `styles` rather than `width`, because the value is computed per frame and a DS prop
                // takes a token. This is the escape hatch working as intended.
                styles: {
                  /*
                    Empty while switched off, rather than frozen at whatever was last heard.

                    `levelPercent` is a live reading, and the audio graph is torn down on stop — so
                    the last value before it went is a number about a moment that has passed, and
                    leaving it painted is a bar reporting sound nobody is listening to. Zero is what
                    an idle meter shows.
                  */
                  width: { $: "modules.transcribe.enabled ? modules.transcribe.levelPercent : '0%'" },
                  transition: 'width 80ms linear',
                  'max-width': '100%',
                },
              },
            },
            {
              /*
                The onset threshold, read from the store so it cannot drift from the VAD's own value.

                Faint while switched off. It marks the point a sound has to cross to be heard, and
                nothing is being heard — a mark at full strength on an empty trough reads as a
                measurement rather than as the furniture of one.
              */
              type: 'Row',
              props: {
                position: 'absolute',
                top: '0px',
                height: '100%',
                width: '2px',
                bg: { $: "modules.transcribe.enabled ? 'border-strong' : 'border'" },
                styles: { left: { $: 'modules.transcribe.thresholdPercent' } },
              },
            },
          ],
        },
      ],
    },
  },
};

/**
 * How much of this call is actually being written down.
 *
 * The one number a transcript most needs to admit, and until now it was computed and shown nowhere.
 * Transcription is per microphone: every agent records their own and appends to one shared record,
 * so a call where two of five people are transcribing produces a transcript **of two people** that
 * reads exactly like a transcript of the call. Nothing downstream can tell the difference — the
 * extraction pass proposes tasks and events from one side of a conversation as readily as from all
 * of it — and neither can whoever opens the record next week.
 *
 * Here rather than only on the finished record because here it is still actionable. The calls list
 * pairs the faces with an utterance count for the same reason, but it says so afterwards, when the
 * only remaining response is to distrust what you are reading. This says it while the meeting is
 * happening and somebody can still press Transcribe.
 *
 * Modelled on the meter above it — a label, and the state on the right — so the panel reads as one
 * set of readouts rather than a meter and then a warning. It states the count either way and only
 * changes *colour* when there is a gap: a number that appears when something is wrong is a number
 * nobody learns to read, and "4 of 4" is worth seeing precisely because it means the record is whole.
 *
 * Absent outside a call, where `callAgents` is empty. There is no coverage question about a
 * transcript with no other participants, and "1 of 1" would be noise on every solo recording.
 *
 * Named as a part so an interface that arranges this module's pieces itself can place it. Whether
 * to show it is a design decision an interface is entitled to make; being unable to make it is not.
 * No `subject`: coverage is about the call being recorded right now, which is the only call anyone
 * can still act on.
 */
export const coverage: SchemaNode = {
  type: '$if',
  props: {
    /*
      Somebody to count, **and** a microphone to count them against.

      Joining a call is a second in which every part of this is true and wrong: you are in the call,
      your own microphone is not up yet, so it read "0 of 1 transcribing" in warning orange with the
      line below about only those microphones reaching the record. Both resolved before anybody
      could read them, and the line arriving and then leaving moved everything under it twice.

      A delayed fade was tried first and made it worse. `$animate` keeps its child mounted and a
      fade only touches opacity, so the readout reserved its full height while invisible: the panel
      opened a hole, sat on it, and then filled it in. Nothing about *when it is drawn* can fix a
      readout that should not be there at all.

      `available` is the honest test, because it separates the two states that look alike. No audio
      means the session is still coming up, and there is nothing to report yet. Audio with no
      recording is a decision — somebody pressed stop, or auto-join is off — and that is exactly
      when a coverage gap is worth stating. So this is dark through the join and lit the moment the
      microphone exists, which is the same moment the meter above it appears.

      ## The count, and nothing under it

      There was a second line while the count was short: "Only what those microphones hear reaches
      this record." It was wrong as well as wordy. This panel has a composer, and a typed line is in
      the record without any microphone hearing it — so the sentence overstated the gap it was
      warning about, in a panel that offers the very thing it forgot.

      The count already carries the warning. It turns from `success-text` to `warning-text` when
      somebody is not being transcribed, which is the whole signal; a sentence appearing underneath
      to explain a number is the kind of chrome people stop reading before the day it matters. That
      argument was already in the note it replaced, one level up.
    */
    condition: { $: 'count(modules.transcribe.callAgents) && modules.transcribe.available' },
    // Holds its height in both directions — see `MIC_FADE`. Its own `available` empties before the
    // section's condition does, so without this the box above the transcript loses this much of its
    // height early, while the placeholder below is still fading.
    enterTransition: MIC_FADE,
    exitTransition: MIC_FADE,
    then: {
      type: 'Row',
      props: { ax: 'between', ay: 'center', gap: '300' },
      children: [
        { type: 'we-text', props: { variant: 'footnote', color: 'text-muted' }, children: ['Coverage'] },
        {
          type: 'we-text',
          props: {
            variant: 'footnote',
            color: { $: "modules.transcribe.partialCoverage ? 'warning-text' : 'success-text'" },
          },
          children: [
            {
              $: '`${count(modules.transcribe.transcribers)} of ${count(modules.transcribe.callAgents)} transcribing`',
            },
          ],
        },
      ],
    },
  },
};

/** What the card knows about the model it is a suggestion of — see `recordStore.displays`. */
const DISPLAY = 'recordStore.displays[proposal.entity]';

/** The value of whichever property plays a role on this model, or empty when none does. */
const roleValue = (role: 'title' | 'summary') => ({
  $: `find(proposal.fields, { name: ${DISPLAY}.${role} }).value`,
});

/** What was proposed for the field this row is about, as text. */
const FIELD_VALUE = 'find(proposal.fields, { name: field.name }).value';

/**
 * The glyph that stands in for a field's caption, or empty when nothing sensible does.
 *
 * Derived from what the model declares rather than from a table of field names this panel happens to
 * know. A relation takes the **target model's own icon**, which is the general form of the answer: a
 * place shows a pin because `LocationBlock` says its icon is a pin, and a community's own model shows
 * whatever icon that community chose, with nothing written here for either.
 *
 * Empty is a real answer — a plain string field has no honest glyph, and the row keeps its caption.
 * Guessing one from the property name would be right for the handful we thought of and quietly wrong
 * for everything a community defines.
 */
const FIELD_ICON =
  `field.kind == 'relation' ? recordStore.displays[field.target].icon ` +
  `: field.kind == 'datetime' ? 'clock' ` +
  `: field.kind == 'date' ? 'calendar' ` +
  `: field.kind == 'url' ? 'link' ` +
  `: field.kind == 'number' ? 'hash' : ''`;

/**
 * A state's colour, from its *position* in the model's own list rather than from its spelling.
 *
 * The last value of a closed vocabulary is the settled one — `done`, `published`, `resolved` — and
 * the first is the not-started one, because that is how anybody writes such a list. Reading the
 * position means a community shape with states nobody here has heard of still gets a sensible ramp,
 * where a lookup table of English words would give every one of them the same neutral grey.
 */
const STATE_VARIANT = `${FIELD_VALUE} == last(field.options) ? 'success' : ${FIELD_VALUE} == first(field.options) ? 'neutral' : 'primary'`;

/**
 * A moment, with the time shown only when there is one.
 *
 * An all-day event is stored as `T00:00`, so a midnight time is the signal that no time was said —
 * and printing "00:00" under a trip to Bristol is both noise and a small lie. Read off the value
 * rather than off a sibling `allDay` field, because a generic renderer cannot know that one property
 * governs another; the declaration says nothing about the pair, and the midnight test needs nothing
 * from it. An event genuinely at midnight loses its time, which is rare and costs a reader nothing.
 */
const timestamp = (withTime: boolean): SchemaNode => ({
  type: 'we-timestamp',
  props: {
    value: { $: FIELD_VALUE },
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
    fontSize: '100',
  },
});

/**
 * One field of the model, as the card shows it.
 *
 * Driven by the **declaration** rather than by what the pass happened to propose. That is the whole
 * difference between this and what it replaced: reading the proposal's own keys put `occurrence` — a
 * dedup key whose docblock says it is "not a display value" — on every event card, in the order the
 * value map happened to be built.
 *
 * `detail` role only. The title and the summary are drawn large above, and a field repeated under
 * its own heading reads as a mistake.
 */
const proposalDetail: SchemaNode = {
  type: '$each',
  props: {
    items: { $: `${DISPLAY}.fields.filter(f, f.role == 'detail' && find(proposal.fields, { name: f.name }).value)` },
    as: 'field',
  },
  children: [
    {
      type: 'Row',
      props: { gap: '100', ay: 'center', wrap: true },
      children: [
        {
          /*
            The glyph, or the caption — never both, and never neither.

            A tooltip carries the caption wherever the glyph replaces it, so the field stays
            identifiable to somebody who cannot guess a pin and to a screen reader, which would
            otherwise read a value with nothing saying what it is.
          */
          type: '$if',
          props: {
            condition: { $: FIELD_ICON },
            then: {
              type: 'we-tooltip',
              props: { content: { $: 'field.label' } },
              children: [{ type: 'we-icon', props: { size: 'xs', name: { $: FIELD_ICON }, color: 'text-faint' } }],
            },
            else: {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: [{ $: 'field.label' }],
            },
          },
        },
        {
          /*
            How the value is drawn, by kind — a badge for a closed vocabulary, a formatted moment for
            a date, the related record's own name for a relation, and the text for everything else.

            None of this names a model. A community shape with its own states gets the badge, its own
            dates get the formatting, and its own relations resolve through the same lookup.
          */
          type: '$if',
          props: {
            condition: { $: 'count(field.options)' },
            then: {
              type: 'we-badge',
              props: { size: 'xs', variant: { $: STATE_VARIANT } },
              children: [{ $: FIELD_VALUE }],
            },
            else: {
              type: '$if',
              props: {
                condition: { $: "field.kind == 'date' || field.kind == 'datetime'" },
                then: {
                  type: '$if',
                  props: {
                    condition: { $: `endsWith(${FIELD_VALUE}, 'T00:00')` },
                    then: timestamp(false),
                    else: timestamp(true),
                  },
                },
                else: {
                  type: '$if',
                  props: {
                    condition: { $: "field.kind == 'relation'" },
                    /*
                      A relation's value is the target's id, which is not worth showing anybody. The
                      record it names is fetched and drawn by whichever property that model calls its
                      title — the same `displays` lookup the card itself is built from, one level in.
                    */
                    then: {
                      type: '$single',
                      props: {
                        item: {
                          $query: {
                            entity: { $: 'field.target' },
                            where: { id: { $: FIELD_VALUE } },
                            limit: 1,
                          },
                        },
                        as: 'related',
                      },
                      children: [
                        {
                          type: 'we-text',
                          props: { variant: 'footnote', truncate: true },
                          children: [{ $: 'related[recordStore.displays[field.target].title]' }],
                        },
                      ],
                    },
                    else: {
                      type: 'we-text',
                      props: { variant: 'footnote', truncate: true },
                      children: [{ $: FIELD_VALUE }],
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  ],
};

/**
 * The model's own fields, as controls over the store's draft.
 *
 * Declaration-driven for the same reason the read view is, and with one deliberate narrowing: a
 * relation is left out. Editing one means picking a different record, which is a picker over
 * instances rather than a value in a text box — and the store's draft holds strings. Better absent
 * than present and unable to write what somebody chose.
 */
const proposalEditor: SchemaNode = {
  type: '$each',
  props: {
    items: { $: `${DISPLAY}.fields.filter(f, f.kind != 'relation' && find(proposal.fields, { name: f.name }).value)` },
    as: 'field',
  },
  children: [
    {
      type: 'we-form-field',
      props: { size: 'xs', label: { $: 'field.label' } },
      children: [
        {
          /*
            A picker where the model closes the set, a box where it does not.

            Same question the badge above asks, answered on the way in: a text input over `status`
            invites "pending" into a field whose model only knows three words, and the record then
            renders an unrecognised tag everywhere it appears.
          */
          type: '$if',
          props: {
            condition: { $: 'count(field.options)' },
            then: {
              type: 'we-select',
              props: {
                size: 'xs',
                value: { $: 'modules.transcribe.proposalDraft[field.name]' },
                options: { $: 'field.options.map(o, { label: o, value: o })' },
                onChange: {
                  $action: 'modules.transcribe.setProposalField',
                  args: [{ $: 'field.name' }, { $: 'event.detail' }],
                },
              },
            },
            else: {
              type: 'we-input',
              props: {
                size: 'xs',
                value: { $: 'modules.transcribe.proposalDraft[field.name]' },
                onInput: {
                  $action: 'modules.transcribe.setProposalField',
                  args: [{ $: 'field.name' }, { $: 'event.detail' }],
                },
              },
            },
          },
        },
      ],
    },
  ],
};

/**
 * Suggestions the backend staged instead of writing, and the controls that resolve them.
 *
 * Only appears when there are any, which is *not* always: a value is staged rather than written only
 * where a human already owns one, so a pass that only *creates* records leaves this empty. That is
 * the right default — a permanently empty "0 pending" box teaches people to stop looking at the
 * place their attention is eventually needed.
 *
 * ## Why it scrolls, and why that is not a `maxHeight`
 *
 * It used to be a plain column beside the panel's one scroll area, and a long call filled the panel
 * with it: a `Column` cannot shrink below its content unless it is told it may, so flexbox took the
 * whole deficit out of the results list underneath — which collapsed to nothing while the review
 * list ran off the bottom. `minHeight: '0'` is what makes this section shrinkable at all; the scroll
 * area inside it is then what the shrinking does. A pixel cap would have been a guess about a panel
 * whose height is the reader's to choose.
 *
 * ## A grid, because a card is not a paragraph
 *
 * `minChildWidth` rather than a column: widening the panel used to stretch each card to the full
 * width, which for four fields of a task is a strip of text with a button at the end of it. The
 * cards reflow into two and three abreast as the lane grows, and back to one in a narrow dock, with
 * no breakpoint to get wrong.
 *
 * ## Still `we-alert`
 *
 * The look is unchanged and deliberately so — `appearance: 'accent'` is a plain surface with a thick
 * status edge, which is what stops a run of these reading as a stack of brown rectangles in a dark
 * theme. It also keeps the warning glyph, which is what makes the state readable to somebody who
 * cannot tell the colours apart. What changed is only what is *inside* it.
 *
 * ## Editing, which this used to refuse
 *
 * The old note here said editing a suggestion is authoring and belongs to whatever normally edits
 * that record. That was true when the only thing staged was a single field of a record somebody
 * already owned. It stopped being true when a pass began proposing whole records: the reviewer is
 * then looking at the only surface that will ever show it *as a suggestion*, and sending them
 * somewhere else to fix a wrong title means keeping something known to be wrong, or discarding a
 * record that was mostly right.
 */
const proposals: SchemaNode = {
  /*
    Nothing at all outside a call, and the gate is a node rather than a clause.

    Unscoped, this listed everything staged anywhere in the space — every conversation the community
    has ever had, in one undifferentiated list, with no way to tell which suggestion came from where
    and no way to act on one from a panel that is about no call in particular. Reviewing across calls
    may be worth building one day; it is a surface of its own, with its own grouping and its own
    sense of where a decision lands, and it is not this one wearing no scope.

    Nested rather than `EXTRACTION_SUBJECT && count(…)`, because the inner condition *reads* the
    list, and a read is what fetches it. One expression would have asked the backend the very
    question this gate exists to stop being asked.
  */
  type: '$if',
  props: {
    condition: EXTRACTION_SUBJECT,
    then: {
      type: '$if',
      props: {
        condition: { $: `count(${PROPOSALS})` },
        then: {
          type: 'Column',
          // `flex: '0 1 auto'` with `minHeight: '0'`: take the room the cards want, give it back when
          // the panel is short. Without the minimum this section cannot shrink and the results list
          // below it pays for every suggestion.
          props: { gap: '200', flex: '0 1 auto', minHeight: '0' },
          children: [
            sectionLabel({
              label: 'Awaiting your call',
              aside: {
                type: 'we-badge',
                props: { size: 'xs', variant: 'warning' },
                children: [{ $: `count(${PROPOSALS})` }],
              },
            }),
            {
              type: 'we-scroll-area',
              props: { flex: '1', minHeight: '0' },
              children: [
                {
                  type: 'Grid',
                  props: { minChildWidth: '240px', gap: '200', width: '100%' },
                  children: [
                    {
                      type: '$each',
                      props: { items: { $: PROPOSALS }, as: 'proposal' },
                      children: [
                        {
                          type: 'we-alert',
                          props: {
                            variant: 'warning',
                            appearance: 'accent',
                            r: '300',
                            px: '300',
                            py: '300',
                            gap: '300',
                          },
                          children: [
                            {
                              type: 'Column',
                              props: { gap: '200', width: '100%' },
                              children: [
                                /*
                              What kind of thing is being offered, in the model's own words and icon.

                              Absent where the backend could not classify the base — an executor
                              predating `subjectClassesOf` answers that way for everything — and the
                              card falls back to the flat summary below rather than to a blank box.
                            */
                                {
                                  type: '$if',
                                  props: {
                                    condition: { $: `${DISPLAY}.label` },
                                    then: {
                                      type: 'Row',
                                      props: { gap: '100', ay: 'center' },
                                      children: [
                                        {
                                          type: '$if',
                                          props: {
                                            condition: { $: `${DISPLAY}.icon` },
                                            then: {
                                              type: 'we-icon',
                                              props: {
                                                size: 'xs',
                                                name: { $: `${DISPLAY}.icon` },
                                                color: 'text-muted',
                                              },
                                            },
                                          },
                                        },
                                        {
                                          type: 'we-text',
                                          props: {
                                            variant: 'footnote',
                                            color: 'text-muted',
                                            uppercase: true,
                                            truncate: true,
                                          },
                                          children: [{ $: `${DISPLAY}.label` }],
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  // Editing, or reading. The controls replace the card's body rather than
                                  // sitting under it, so the thing being changed is the thing on screen.
                                  type: '$if',
                                  props: {
                                    condition: { $: 'modules.transcribe.editingProposal == proposal.id' },
                                    then: { type: 'Column', props: { gap: '200' }, children: [proposalEditor] },
                                    else: {
                                      type: 'Column',
                                      props: { gap: '100' },
                                      children: [
                                        /*
                                      The model's title property, drawn as one — the whole reason this
                                      stopped being a run-on line of `field: value` pairs.

                                      Falls back to the flat summary where there is no model to ask,
                                      which is the one case a card cannot do better than the old one.
                                    */
                                        {
                                          type: '$if',
                                          props: {
                                            condition: { $: `${DISPLAY}.title` },
                                            then: {
                                              type: 'we-text',
                                              props: { variant: 'footnote', fontWeight: '600' },
                                              children: [roleValue('title')],
                                            },
                                            else: {
                                              type: 'we-text',
                                              props: { variant: 'footnote' },
                                              children: [{ $: 'proposal.summary' }],
                                            },
                                          },
                                        },
                                        {
                                          type: '$if',
                                          props: {
                                            condition: { $: `${DISPLAY}.summary && ${roleValue('summary').$}` },
                                            then: {
                                              type: 'we-text',
                                              props: { variant: 'footnote', color: 'text-muted' },
                                              children: [roleValue('summary')],
                                            },
                                          },
                                        },
                                        {
                                          type: '$if',
                                          props: { condition: { $: `${DISPLAY}.label` }, then: proposalDetail },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  type: 'Row',
                                  props: { gap: '200', ay: 'center', wrap: true },
                                  children: [
                                    /*
                                      A yes and a no, coloured and marked as such — and the same
                                      gestures the board offers on the card itself, so the two
                                      surfaces answering one decision do not look like two decisions.

                                      `success` and `danger` rather than `secondary` and `ghost`: the
                                      question is binary, and a pair where only one half is coloured
                                      reads as one action and one way out of it. The icons are the
                                      board's own `check` and `x`, and they are not decoration — a
                                      green/red pair is the classic thing to fail on, so the glyph is
                                      what carries the meaning for anyone who cannot separate them.
                                    */
                                    {
                                      type: 'we-button',
                                      props: {
                                        size: 'xs',
                                        variant: 'success',
                                        gap: '100',
                                        onClick: {
                                          $action: 'modules.transcribe.acceptProposal',
                                          args: [{ $: 'proposal.id' }],
                                        },
                                      },
                                      children: [{ type: 'we-icon', props: { name: 'check' } }, 'Keep'],
                                    },
                                    {
                                      type: 'we-button',
                                      props: {
                                        size: 'xs',
                                        variant: 'danger',
                                        gap: '100',
                                        onClick: {
                                          $action: 'modules.transcribe.rejectProposal',
                                          args: [{ $: 'proposal.id' }],
                                        },
                                      },
                                      children: [{ type: 'we-icon', props: { name: 'x' } }, 'Discard'],
                                    },
                                    {
                                      /*
                                    Offered only where an edit could actually be written back: the
                                    host has to lend a record-update surface and the backend has to
                                    have said which model this is. Without either, Keep would take
                                    the typing and silently drop it.
                                  */
                                      type: '$if',
                                      props: {
                                        condition: {
                                          $: 'modules.transcribe.canEditProposals && proposal.entity',
                                        },
                                        then: {
                                          type: '$if',
                                          props: {
                                            condition: { $: 'modules.transcribe.editingProposal == proposal.id' },
                                            then: {
                                              type: 'we-button',
                                              props: {
                                                size: 'xs',
                                                variant: 'ghost',
                                                gap: '100',
                                                onClick: { $action: 'modules.transcribe.cancelProposalEdit' },
                                              },
                                              children: [{ type: 'we-icon', props: { name: 'x' } }, 'Cancel'],
                                            },
                                            else: {
                                              type: 'we-button',
                                              props: {
                                                size: 'xs',
                                                variant: 'ghost',
                                                gap: '100',
                                                onClick: {
                                                  $action: 'modules.transcribe.editProposal',
                                                  args: [{ $: 'proposal.id' }],
                                                },
                                              },
                                              // Neutral on purpose: editing is neither answer to the
                                              // question, and a third coloured button would make the
                                              // yes/no pair a three-way choice.
                                              children: [{ type: 'we-icon', props: { name: 'pencil-simple' } }, 'Edit'],
                                            },
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  },
};

/**
 * What a pass will look for, and the switch for each — the models, not a fixed sentence.
 *
 * It read "Find the tasks and events in what was said", which was true while those two classes were
 * compiled into this module and is a lie in a space that defined its own. These chips both say what
 * will be looked for and let a call narrow it, so the sentence becomes a lead-in rather than
 * something to rewrite every time a community adopts a model.
 *
 * ## One list, not two
 *
 * `extractionTargets` is already the union: every model this space may extract, each flagged with
 * whether this call is looking for it. So "what is on" and "what could be added" are one row of
 * chips rather than a list of pills and a search behind a button — which would be two surfaces that
 * have to agree, over a set that is a handful of entries.
 *
 * ## The state is said in colour, not in opacity
 *
 * An off chip is muted; it is not faded. Reduced opacity is what a *disabled* control looks like,
 * and these are the opposite of disabled — an unselected chip is the one thing on the row you are
 * most likely to want to press. The same confusion had the card's own action buttons fading with
 * the card they sat on.
 *
 * ## What a press actually changes
 *
 * A **group** decision recorded beside the call, not a private preference: the standing watch is one
 * registration the whole neighbourhood shares, so per-agent lists would have peers overwriting each
 * other's in a loop. It does not touch the space's own default, which is a community setting with
 * its own screen. And it applies to what is said from *here on*, because a watch keeps a
 * processed-turn cursor — which is why the panel's help says pressing Extract is how the rest of
 * the conversation gets swept, and the button's own tooltip says it reads the whole thing.
 *
 * ## No lead-in
 *
 * This opened with a sentence — "Look through what was said for:" in a call, "This space's calls
 * look for:" outside one — telling apart two lists that look identical. It was the third line of
 * prose in a box whose job is two controls, and the distinction it drew is already drawn: outside a
 * call the chips are disabled and a link to the space's default appears under them. What a chip
 * *is* went into the panel's help, which is read once and then costs nothing.
 *
 * ## Why this is named
 *
 * An interface that supplies its own extraction panel otherwise has no way to say what is being
 * extracted or to change it — the workshop template had exactly that gap. Registered so placing it
 * is naming it. No `subject`: what a call extracts is a fact about the call being recorded.
 */
export const extractionTargets: SchemaNode = {
  type: 'Column',
  props: { gap: '200' },
  children: [
    /*
      Not a failure, and phrased as the one thing a person can act on.

      Every other reason extraction is unavailable is about this node — no model
      configured, an executor that cannot interpret — and none of them can be fixed
      from here. This one can: it is a decision the community has not made yet, and
      the place to make it is the space's own models.

      The only sentence left above the chips, and only where there are no chips to show.
    */
    {
      type: '$if',
      props: {
        condition: { $: `!count(${forSubject('targets').$})` },
        then: {
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-muted' },
          children: ['No models are set up for AI extraction here. A space chooses its own in its settings.'],
        },
      },
    },
    /*
      Why the chips below cannot be pressed, when they cannot.

      A choice is recorded against the call's own record, so outside a call there is nothing to
      record it on — and a host with no way to store one cannot either. Both used to be a guard in
      the store that returned without a word, so the chips took the click and did nothing, which
      reads as broken rather than as unavailable. They are disabled now, and this says which.
    */
    /*
      Why the chips cannot be pressed, in the one case where they cannot.

      A member who may not change the space's defaults, and who is not in a call, has neither list to
      write to. That was a guard in the store returning without a word, so the chips took the click
      and did nothing — which reads as broken rather than as somebody else's decision.
    */
    /*
      Where the list on screen comes from, when it is not a call's.

      Outside a call the chips are the space's default and cannot be pressed, which without a word is
      the state that reads as broken. Two sentences: what this is, and where it is changed — and the
      second is a control rather than an instruction, because "in the space's settings" is a place
      somebody then has to find.

      The tab is named, so the panel opens where the setting actually is instead of on About.
    */
    {
      type: '$if',
      props: {
        condition: { $: `count(${forSubject('targets').$}) && !${forSubject('canChoose').$}` },
        then: {
          type: 'Row',
          props: { gap: '200', ay: 'center', wrap: true },
          children: [
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-faint', italic: true },
              children: ['Join a call to narrow it for that conversation.'],
            },
            {
              type: 'we-button',
              props: {
                size: 'xs',
                variant: 'bare',
                textDecoration: 'underline',
                color: 'accent-text',
                onClick: { $action: 'shellStore.openSpaceSettings', args: ['features'] },
              },
              children: ['Change the default'],
            },
          ],
        },
      },
    },
    /*
      One chip per model, ticked when this call is looking for it.

      A group decision rather than a private one, and it has to be: the same list drives
      the standing watch, whose registration is one row every peer shares. Two members
      holding different lists would each remove-then-add over the other's in a loop.

      Changing it applies from here on, because a watch keeps a processed-turn cursor —
      the panel's help says so, since the answer for the rest of the conversation is the
      button itself.
    */
    {
      type: 'Row',
      props: { gap: '100', wrap: true },
      children: [
        {
          type: '$each',
          props: { items: forSubject('targets'), as: 'target' },
          children: [
            {
              type: 'we-button',
              props: {
                size: 'xs',
                gap: '100',
                /*
                  On is filled, off is an outline — the state is in the *weight* of the chip.

                  Deliberately not opacity. A faded control is what a disabled one looks like, and an
                  unselected chip is the opposite of disabled: it is the thing on this row somebody
                  is most likely to want to press. The same confusion had a card's action buttons
                  fading along with the card they were anchored to.
                */
                variant: { $: "target.selected ? 'secondary' : 'outline'" },
                // Only where neither list is this agent's to change. Refused visibly rather than in
                // the store, where it was refused in silence.
                // Outside a call there is no conversation to narrow, so these state the space's
                // default rather than offering a change to it. The link below leads to the change.
                disabled: { $: `!${forSubject('canChoose').$}` },
                /*
                  One meaning: this call's list, and only this call's.

                  It briefly did two — the call's in a call, the space's default outside one, on the
                  reasoning that editing what you are looking at is what a chip is for. That is one
                  control with two blast radii, told apart by a heading: narrowing this afternoon's
                  meeting and changing what every future call in the community starts from, behind
                  the same press. In a personal space, where every member administers, the heavier of
                  the two was also the default. A link to where the default lives is the honest
                  version, and it is two clicks rather than one.
                */
                onClick: {
                  $action: 'modules.transcribe.toggleExtractionTarget',
                  args: [{ $: 'target.entity' }, EXTRACTION_SUBJECT],
                },
              },
              children: [
                /*
                  The model's own icon, joined from its declaration.

                  Not carried on the target itself, and it should not be: the port answers with an
                  entity name and whether it is on, which is what extraction knows. How a model is
                  *shown* is the record layer's, and `recordStore.displays` is where every other
                  surface reads it — so a space that gives its own model an icon gets it here for
                  nothing, and a model with none renders no glyph rather than a placeholder.
                */
                {
                  type: '$if',
                  props: {
                    condition: { $: 'recordStore.displays[target.entity].icon' },
                    then: {
                      type: 'we-icon',
                      props: { name: { $: 'recordStore.displays[target.entity].icon' } },
                    },
                  },
                },
                { type: 'we-text', props: { variant: 'footnote' }, children: [{ $: 'target.label' }] },
              ],
            },
          ],
        },
        /*
          The way to add a kind of thing, at the end of the row of kinds.

          What a call can extract is whatever this space has models for, and until now the panel
          could only ever say so — the chips were a closed list with no visible route to a longer
          one, and the only mention of where that list comes from was a link that appeared solely
          where the chips could not be pressed. So the answer to "why is the thing I want not here"
          was two screens away and nothing pointed at it.

          Inside the same wrapping row rather than beside it, so it reflows with the chips and sits
          after the last one at any width. Square and outlined: it is one more thing in a row of
          outlined things, and the one that is not a toggle.

          It opens the space's vocabulary rather than doing anything itself. Adding a model is a
          decision about the community, with its own screen and its own wizard, and a panel about
          one call is the wrong place to make it — but exactly the right place to be reminded it can
          be made.
        */
        {
          type: 'we-tooltip',
          props: { content: "Add a kind of thing to extract, in this space's vocabulary" },
          children: [
            {
              type: 'we-button',
              props: {
                size: 'xs',
                variant: 'outline',
                square: true,
                label: "Add a kind of thing to extract, in this space's vocabulary",
                onClick: { $action: 'shellStore.openSpaceSettings', args: ['vocabulary'] },
              },
              children: [{ type: 'we-icon', props: { name: 'plus' } }],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * What has been read on this call, written down rather than remembered.
 *
 * The counterpart of `extractionActivity`, which is a live subscription: it starts empty, fills from
 * the backend as passes run, and is thrown away on every space change. Excellent for watching
 * something happen and useless the moment you reload — a call read an hour ago looked exactly like
 * one never read at all, and a pass that *failed* looked exactly like one that found nothing.
 *
 * So the durable half is a query, over the `ExtractionPass` records the host writes beside every
 * pass, scoped to the call on screen like everything else in this panel. Which also settles the
 * question the live feed could not answer: these rows belong to *this* call, because containment is
 * what they hang off.
 *
 * Collapsed behind a count, the way the live readout collapses its settled passes — a call read
 * every few minutes for an hour is sixty rows nobody wants open.
 */
const extractionHistory: SchemaNode = {
  type: 'Column',
  props: { gap: '200', width: '100%' },
  $localState: { historyOpen: { type: 'boolean', initial: false } },
  $queries: {
    passes: {
      entity: 'ExtractionPass',
      scope: { anchor: 'CollectionBlock', via: 'extractionPasses', anchorId: EXTRACTION_SUBJECT },
      order: { createdAt: 'desc' },
      limit: 50,
    },
  },
  children: [
    {
      type: '$if',
      props: {
        condition: { $: 'count(local.passes)' },
        then: {
          type: 'Column',
          props: { gap: '200', width: '100%' },
          children: [
            {
              type: 'we-button',
              props: { variant: 'bare', width: '100%', onClick: { $toggleLocal: 'historyOpen' } },
              children: [
                {
                  type: 'Row',
                  props: { ay: 'center', gap: '200', width: '100%' },
                  children: [
                    { type: 'we-icon', props: { size: 'sm', name: 'sparkle', color: 'text-faint' } },
                    {
                      type: 'we-text',
                      props: { variant: 'footnote', color: 'text-muted', flex: '1', textAlign: 'left' },
                      children: [
                        {
                          $: "`${count(local.passes)} ${plural(count(local.passes), 'reading', 'readings')} of this call`",
                        },
                      ],
                    },
                    {
                      type: 'we-icon',
                      props: {
                        size: 'xs',
                        color: 'text-muted',
                        name: { $: "local.historyOpen ? 'caret-up' : 'caret-down'" },
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: '$if',
              props: {
                condition: { $: 'local.historyOpen' },
                enterTransition: { type: 'reveal', duration: 200 },
                exitTransition: { type: 'reveal', duration: 160 },
                then: {
                  type: 'Column',
                  props: { gap: '200', width: '100%' },
                  children: [
                    {
                      type: '$each',
                      props: { items: { $: 'local.passes' }, as: 'pass' },
                      children: [
                        {
                          type: 'Row',
                          props: { gap: '200', ay: 'center', width: '100%' },
                          children: [
                            /*
                              The outcome as a mark, not as a tick on everything.

                              The template's own version of this list drew a green check on every
                              settled row because it never read the outcome — so a pass that failed
                              and one that wrote nine records looked identical, which is the whole
                              reason a failure is worth storing.
                            */
                            {
                              type: 'we-icon',
                              props: {
                                size: 'sm',
                                name: {
                                  $: "pass.outcome == 'failed' ? 'warning' : pass.outcome == 'skipped' ? 'minus-circle' : 'check-circle'",
                                },
                                color: {
                                  $: "pass.outcome == 'failed' ? 'danger-text' : pass.outcome == 'done' ? 'success-text' : 'text-muted'",
                                },
                              },
                            },
                            {
                              type: '$agent',
                              props: { did: { $: 'pass.author' }, as: 'runner' },
                              children: [
                                {
                                  type: 'we-avatar',
                                  props: { size: 'xs', image: { $: 'runner.avatar' }, hash: { $: 'runner.did' } },
                                },
                              ],
                            },
                            {
                              type: 'we-text',
                              props: { variant: 'footnote', flex: '1', truncate: true },
                              children: [
                                {
                                  $: "pass.outcome == 'failed' ? pass.error : pass.outcome == 'skipped' ? 'Nothing was being looked for' : `${pass.recordCount ? pass.recordCount : 'No'} ${plural(pass.recordCount, 'record', 'records')}`",
                                },
                              ],
                            },
                            {
                              type: 'we-timestamp',
                              props: {
                                value: { $: 'pass.createdAt' },
                                relative: true,
                                /*
                                  Relative here and not on a transcript row, because these *are* the
                                  feed of unrelated items relative time is for: passes run minutes or
                                  days apart and "how recent is this one" is the whole question.

                                  Abbreviated for the transcript row's reason — it sits at the end of
                                  a line already holding an outcome that can be a whole error message.
                                */
                                relativeStyle: 'narrow',
                                fontSize: '200',
                                color: 'text-faint',
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ],
};

/**
 * What the passes wrote, for the call on screen.
 *
 * One live subscription per target, rather than one query over everything: a record has a type and
 * `$query` takes one entity name, so a list of mixed kinds is a list of queries. `entity` as an
 * expression is what lets this show a model the community defined this morning — the cost is that
 * the validator cannot check a name it only sees at runtime, and a name that has not resolved yet
 * reads as "not ready" rather than as an error, which is the right way round while a route settles.
 *
 * The *call's* list of targets, not the space's — those differ the moment somebody narrows a call.
 * Every entity in it, whether or not it is still ticked: a model switched off half way through a
 * meeting must not take what it already found off the list.
 *
 * Drawn from `recordStore.displays`, so a shape a community adopted has an icon and a title here
 * without anything being written for it, and a model with neither renders as a plain row rather
 * than as a gap.
 */
const extractedRows: SchemaNode = {
  type: '$each',
  props: { items: { $: `${EXTRACTION_TARGET_ENTITIES}` }, as: 'target' },
  children: [
    {
      type: 'Column',
      props: { gap: '200' },
      /*
        How many of this kind to fetch, and it grows.

        A `limit` is a *fetch* bound, not a display one, so removing it and capping in the scroll
        region would pay for every record to show a few — and the scrollbar would then promise rows
        nobody had asked for. Raising it on a press is the schema's own paging idiom.

        Per kind, because that is the only place the answer is readable. `$localState` on a node
        inside `$each` is created per row, so each group counts its own — which is what lets the
        button below know whether *this* kind has more, by asking whether the last fetch came back
        full. One shared counter could not: `local.found` belongs to the group, so a control outside
        every group has nothing to test and can only ever offer itself unconditionally, which is
        what it did.

        Still no total. Each kind is its own subscription and a schema cannot sum a list of queries
        whose length it does not know, so "24 of 47" is unavailable however much a reader wants it.
      */
      $localState: { shown: { type: 'number', initial: 24 } },
      $queries: {
        found: {
          entity: { $: 'target' },
          scope: { anchor: 'CollectionBlock', via: 'children', anchorId: EXTRACTION_SUBJECT },
          order: { createdAt: 'desc' },
          limit: { $: 'local.shown' },
        },
      },
      children: [
        {
          /*
            What the passes *wrote*, which is not the same as what they produced.

            A staged `create` is a fully written record — the engine writes real values whenever no
            human owns them and keeps the overlay only as provenance — so it answers this query like
            any other, and every suggestion appeared twice: once above as a decision, and again here
            among the settled results, indistinguishable from something already agreed to.

            Filtered rather than excluded by the query, because "is this still awaiting a decision"
            is not a property of the record and there is nothing in the graph to ask it about. The
            list of pending ids is right here, and it is a handful.
          */
          type: '$each',
          props: {
            items: { $: 'local.found.filter(r, !(r.id in modules.transcribe.pendingIds))' },
            as: 'item',
          },
          children: [
            {
              type: 'Row',
              props: { gap: '200', ay: 'center', bg: 'surface-sunken', r: '300', px: '300', py: '200' },
              children: [
                {
                  type: '$if',
                  props: {
                    condition: { $: 'recordStore.displays[target].icon' },
                    then: {
                      type: 'we-icon',
                      props: { name: { $: 'recordStore.displays[target].icon' }, color: 'accent-text' },
                    },
                  },
                },
                {
                  type: 'we-text',
                  props: { variant: 'footnote', flex: '1', truncate: true },
                  children: [{ $: 'item[recordStore.displays[target].title]' }],
                },
              ],
            },
          ],
        },
      ],
    },
    /*
          Offered only where the last fetch came back full.

          A page short of the limit is the end of that kind, so a button there would show nothing and
          teach people it does nothing. Full is not proof there is more — a kind with exactly 24
          records offers one press that reveals none — but that is the one case a query can be wrong
          about without over-fetching, and it is far better than the button being wrong every time,
          which is what an unconditional one was.
        */
    {
      type: '$if',
      props: {
        condition: { $: 'count(local.found) >= local.shown' },
        then: {
          type: 'we-button',
          props: {
            variant: 'ghost',
            size: 'sm',
            width: '100%',
            onClick: { $setLocal: 'shown', value: { $: 'local.shown + 24' } },
          },
          children: [
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: [{ $: '`More ${lower(recordStore.displays[target].label)}`' }],
            },
          ],
        },
      },
    },
  ],
};

/*
  The two ways a pass starts: the switch for the automatic one, and the button for a one-shot.

  Whether this conversation is read as it happens is a *call's* switch.

  The space has a standing answer and an administrator sets it; this is the people in the room
  deciding about the room. On the live call only: a meeting somebody opened from a link is not
  happening, so "as it happens" has nothing to be about, and the switch would be asking about a
  conversation that finished. Everything else here follows the call on screen; this one thing
  cannot.

  ## A button that says its state, not a switch

  It was a `we-switch` whose `label` is an aria-label, so on screen it was an unlabelled toggle
  beside an "Extract" button, and nobody could say which of the two did what. A button carries
  its own words. `primary` when on rather than `danger`: red is this interface's word for "your
  microphone is live", a personal state that is its own off switch, and auto extraction is a
  standing decision the whole call shares. Two red buttons in one panel would say one thing about
  two different things.

  ## Not in the header, and not in the well either

  Both sat in the header's aside for a day. Two labelled buttons beside a title and a glyph is more
  than a `sm` dock is wide, and the title gave way first.

  They then spent a while as the top row of the sunken box holding the chips, which was worse in a
  quieter way: a filled button and a row of outlined ones on one ground read as a single set of
  toggles, which is the confusion that had Extract looking like a fourth chip back when it lived at
  the end of the chip row itself. They are their own row above that box now — plainly the controls,
  with the box plainly the thing they operate on.
*/
const extractionControls: SchemaNode = {
  type: 'Row',
  props: { ay: 'center', gap: '200', wrap: true },
  children: [
    {
      type: '$if',
      props: {
        condition: VIEWING_LIVE,
        then: {
          type: 'we-tooltip',
          props: {
            placement: 'bottom',
            /*
                Whose decision it is, said where the press is — the record button beside the
                transcript is this agent's microphone, and this looks the same and is everybody's.
                Outside a call there is no record to write the decision against, and the button
                explains that rather than greying out in silence, which is what the switch did.
              */
            content: {
              $:
                "!modules.transcribe.extractionFor[modules.transcribe.callId].canChoose ? 'Join a call to decide for it' : " +
                "modules.transcribe.autoExtract ? 'Stop extracting as the call goes, for everyone in it' : " +
                "'Extract as the call goes, for everyone in it'",
            },
          },
          children: [
            {
              type: 'we-button',
              props: {
                size: 'sm',
                gap: '100',
                variant: { $: "modules.transcribe.autoExtract ? 'primary' : 'ghost'" },
                // The live call's answer, and the same record `autoExtract` reads.
                disabled: { $: '!modules.transcribe.extractionFor[modules.transcribe.callId].canChoose' },
                onClick: { $action: 'modules.transcribe.toggleAutoExtract' },
              },
              children: [
                { type: 'we-icon', props: { name: 'lightning' } },
                { $: "modules.transcribe.autoExtract ? 'Auto extract: on' : 'Auto extract: off'" },
              ],
            },
          ],
        },
      },
    },
    /*
        The one-shot pass, beside the switch for the automatic one.

        It sat at the end of the chip row, an outlined button beside outlined chips, and read as one
        more thing to toggle. Up here the two ways of starting a pass are next to each other, and the
        well below is only what a pass looks for and what the last one did. Not inside the `$if`:
        the switch is about the live call, but a pass can be run over any call on screen.

        `secondary` in every state. It dropped to `ghost` while the automatic pass was on, on the
        reasoning that a press is then the backfill rather than the usual way a pass starts — but
        this is the only control in the panel that *does* anything on a press, and a button that
        fades because a setting elsewhere is on reads as unavailable rather than as unnecessary.
        The state it reports is the pass it started, which the status lines under it already say.
      */
    {
      type: 'we-tooltip',
      /*
          The one thing about mid-call changes that is not guessable, in the place it is asked.

          A standing watch keeps a processed-turn cursor, so a model switched on part-way through is
          applied to what is said next and not to what was said before it. The one-shot pass carries
          no cursor — it hands the executor the whole transcript — so pressing Extract is the
          backfill, and the executor's dedup means what was already found returns as updates rather
          than as second copies. A phrase here, and the longer form in the panel's help.
        */
      props: {
        placement: 'bottom',
        /*
          Why it cannot be pressed, and it has to be the *actual* reason.

          `canExtract` folds three of them into one boolean — a space with no models, a call with
          nothing ticked, and a conversation nobody has spoken in — so a tooltip reading it alone can
          only guess, and it guessed "Nothing has been said yet". Somebody who had just unticked the
          last chip was told the call was silent, which is both wrong and unfixable by anything they
          would then try.

          Asked apart, in the order they rule each other out. The fourth reason `canExtract` carries,
          a node with no model at all, cannot reach here: the panel's own `$if` has already replaced
          everything with a sentence about it.
        */
        content: {
          $:
            `!count(${forSubject('targets').$}) ? 'No models are set up here' : ` +
            `!${forSubject('targets').$}.exists(t, t.selected) ? 'Nothing is selected to extract' : ` +
            "!count(local.spoken) ? 'Nothing has been said yet' : " +
            "'Reads the whole conversation so far'",
        },
      },
      children: [
        {
          type: 'we-button',
          props: {
            size: 'sm',
            variant: 'secondary',
            gap: '100',
            // Disabled rather than hidden once the panel is showing the section: the reason is
            // "nothing has been said yet", which resolves on its own and is worth waiting for.
            // `count(local.spoken)` is the honest half — see the query on `extract`. `canExtract`
            // stays for what it still answers alone: a model on this node, and something ticked.
            disabled: {
              $:
                `!count(local.spoken) || !${forSubject('canExtract').$} || ` +
                "modules.transcribe.extractStatus == 'running'",
            },
            /*
                The call on screen, not "the call I am in".

                `extractCollection` takes the record, which is what makes this work on one somebody
                opened from a link; `extract` can only ever mean the live one. The guard above asks
                about the same record, which it did not when a template owned this — the button was
                hidden by a `canExtract` about the live call while the action behind it would have
                worked on the one being shown.
              */
            onClick: { $action: 'modules.transcribe.extractCollection', args: [EXTRACTION_SUBJECT] },
          },
          children: [
            { type: 'we-icon', props: { name: 'sparkle' } },
            { $: "modules.transcribe.extractStatus == 'running' ? 'Reading…' : 'Extract now'" },
          ],
        },
      ],
    },
  ],
};

/**
 * Turning what was heard into tasks and events.
 *
 * One press, one pass, and a count afterwards. An LLM call takes seconds, and the gap between press
 * and result is exactly where a feature stops looking like it is working — so `running` says so, and
 * `done` keeps its number until the next press rather than reverting to a blank button. The count
 * used to end with "Open the graph to see them", which was an errand rather than an answer; the
 * records are listed under this now.
 *
 * Carries no `extractable` gate of its own. It had one — a fact about the *node*, not about any
 * call — and the panel above now branches on the same value, so the inner copy only ever asked the
 * question twice. That nesting is also what used to hide a running pass and a decision waiting on
 * somebody from a node that could not start one, which is precisely the node whose passes came from
 * a peer.
 *
 * ## The chips, and what the last press did
 *
 * The box opened with "Extract" in bold, in a panel titled "Extraction"; a lead-in above the chips;
 * a footnote under the button about what a mid-call change does and does not cover; and the button
 * itself, at the end of the chip row, where an outlined button beside outlined chips read as one
 * more chip. The prose went two places — the panel's help glyph, read on demand, and the button's
 * own tooltip — and the button went beside the switch that decides the automatic pass, so the two
 * ways of starting one sit together.
 *
 * What is left is three bands in the order somebody uses them: the controls, then what the last
 * press did, then what a press looks for — three words and a row of chips on a ground of their own.
 */
const extract: SchemaNode = {
  type: 'Column',
  props: { gap: '300' },
  /*
    Has anybody actually said anything into this record.

    The store cannot answer it. `canExtract` asks `hasTranscript`, which infers words from *adoption*
    — the live call's record counts as empty until this agent's transcriber takes it up — and that
    inference stopped being true the moment continuing a call adopted its record straight away.
    Continue a conversation nobody spoke in and Extract went live over nothing. The store cannot do
    better alone either: peers write into the shared record without telling it, so "is there anything
    in here" is a question for the graph rather than for this session.

    One row is the whole answer, so `limit: 1` — this is a count against zero and never a list. Named
    `spoken` rather than `utterances` because the transcript's own part already has a query by that
    name; they never share a scope, and two `local.utterances` in one module is a trap for whoever
    moves one of them.

    `when` for the reason every scoped query here carries it: an unresolved anchor is *pruned* rather
    than sent, and pruning widens, so without it a subject that has not arrived asks for every
    TextBlock in the space.
  */
  $queries: {
    spoken: {
      entity: 'TextBlock',
      scope: { anchor: 'CollectionBlock', via: 'children', anchorId: EXTRACTION_SUBJECT },
      limit: 1,
      when: EXTRACTION_SUBJECT,
    },
  },
  children: [
    /*
      What starts a pass, then what the last one did, then what a pass looks for.

      The two controls used to sit *inside* the sunken box with the chips, which put a filled button
      and a row of outlined ones on one ground and made the whole thing read as a single set of
      toggles — the same confusion that had Extract looking like a fourth chip when it lived at the
      end of that row. Out of the box they are plainly the controls, and the box is plainly what they
      operate on.

      The status lines follow the buttons rather than the chips, because they report what a press
      did: a spinner while it runs, a count when it lands, the reason a standing pass is not running,
      and the alert when one failed.
    */
    extractionControls,
    {
      type: '$if',
      props: {
        condition: { $: "modules.transcribe.extractStatus == 'running'" },
        then: {
          type: 'Row',
          props: { gap: '200', ay: 'center' },
          children: [
            { type: 'we-spinner', props: { size: 'sm' } },
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: ['Reading the transcript…'],
            },
          ],
        },
      },
    },
    /*
          Why nothing is being extracted on its own.

          Reported here rather than nowhere, which is where it went before: the standing watch is
          registered without anyone asking, so a failure had nothing on screen waiting on it and
          read as a call in which nobody said anything worth extracting.

          Phrased as a statement about the automatic pass, immediately above a button that still
          works — because that is the actual situation, and "extraction is broken" would be wrong.
        */
    {
      type: '$if',
      props: {
        condition: { $: 'modules.transcribe.watchProblem' },
        then: {
          type: 'Row',
          props: { gap: '200', ay: 'center' },
          children: [
            { type: 'we-icon', props: { name: 'info', color: 'text-faint' } },
            {
              /*
                    The reason, not a guess at it.

                    This was one fixed sentence — "not running on this node" — while `watchProblem`
                    held the actual cause, composed for exactly this. So a space that had simply
                    switched automatic extraction off was told its node could not do it: untrue, and
                    unactionable, and the setting is two clicks away.

                    The store owns the wording because it is the only thing that knows which of four
                    cases happened; this adds the clause that is true in all of them.
                  */
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: [{ $: '`${modules.transcribe.watchProblem} Press Extract instead.`' }],
            },
          ],
        },
      },
    },
    {
      type: '$if',
      props: {
        condition: { $: "modules.transcribe.extractStatus == 'done'" },
        then: {
          type: 'Row',
          props: { gap: '200', ay: 'center' },
          children: [
            { type: 'we-icon', props: { name: 'check', color: 'success-text' } },
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: [
                // Zero is a real and common answer — a conversation with no commitments in it —
                // and saying so is the difference between "it worked, there was nothing" and
                // "it silently failed".
                { $: "modules.transcribe.extractCount ? modules.transcribe.extractCount : 'No'" },
                ' records written.',
              ],
            },
          ],
        },
      },
    },
    {
      type: '$if',
      props: {
        condition: { $: "modules.transcribe.extractStatus == 'error'" },
        then: {
          type: 'we-alert',
          props: { variant: 'warning' },
          children: [{ $: 'modules.transcribe.extractError' }],
        },
      },
    },
    {
      type: 'Column',
      props: { gap: '200' },
      children: [
        {
          /*
            Three words naming the row under them, and no more than that.

            A lead-in lived here once and was removed: it was a whole sentence with two forms, one
            for a call and one for the space's default, and it read as prose in a box whose job is
            two controls. What was wrong with it was the length and the branching, not the idea —
            with the controls moved out, the chips are a row of unexplained words under a heading
            that says "Extraction", and something has to say what pressing one changes.

            Deliberately not `sectionLabel`, which is the uppercase treatment this panel gives a
            whole region — a scroll area of proposals is a section, a control row is not, and two
            capitalised labels of different weights would be the drift that fragment exists to stop.
          */
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-muted' },
          children: ['Things to extract:'],
        },
        {
          type: 'Column',
          props: { bg: 'surface-sunken', r: '300', p: '200' },
          children: [{ type: '$part', props: { id: 'transcribe.extractionTargets' } }],
        },
      ],
    },
  ],
};

/**
 * The transcript itself — the utterances, read from the record rather than from this session.
 *
 * It used to render a session-local buffer of the last twenty blocks *this* agent wrote, on the
 * reasoning that a panel for watching a transcript being made is a different thing from one for
 * reading it. People who used it disagreed on every count: they wanted everyone's utterances, and
 * they wanted them still there after the call restarted.
 *
 * All three complaints were one cause. The shared record already holds every agent's lines, each
 * carrying its author and the moment it was said, and it already outlives the session —
 * `spaceStore.exportCallTranscript` has been reading exactly this to write a text file with real
 * names in it. The panel was the only thing not looking at it.
 *
 * Drilled down from the collection rather than hydrated with `include`, because
 * `CollectionBlock.children` is an untyped to-many: the ids arrive but cannot render themselves.
 * The same query the calls list already uses for a finished meeting. See
 * `docs/architecture/transcripts.md`.
 *
 * ## The rows, without the box they scroll in
 *
 * This is the utterances alone. `transcriptFeed` below is these plus the unsaved line, inside a
 * scroll area that follows the tail — the arrangement almost everything wants, and the one the
 * panel places.
 *
 * They are separate because *where the unsaved line goes* is a decision only the placer can make.
 * It belongs immediately after the last saved row, inside the same scroll region — anywhere else
 * and it is separated from the words it is about to become by however much empty panel there
 * happens to be. But an interface showing a **past** call has to leave it out: the buffer is this
 * agent's live microphone, and appending it to last month's transcript would be showing one
 * meeting's words under another meeting's heading. Owning the scroll area is what lets such an
 * interface put the line in the right place *and* omit it on the wrong call, which is exactly what
 * the workshop template does.
 */
/**
 * What the feed shows when it holds nothing — one placeholder, six situations.
 *
 * There were two of these and they did not look alike. A call with no words in it got this
 * treatment: an icon and a centred line. No call at all got an italic sentence in `captureStatus`,
 * which renders *above* the feed rather than in it — so the same emptiness was a tidy placeholder
 * or a stray caption under the meter depending on whether an address happened to name a call. One
 * shape now, in the one place the reader is looking.
 *
 * ## Split on the same line the rest of the panel is split on
 *
 * "Nothing has been said here yet" is true in five of the six and useless on its own: what a person
 * does next is different in each, and the panel is the only thing that knows which. The six sort
 * cleanly into the two the whole panel already sorts by — a call being read back, and the live one —
 * so they are two branches of three rather than one chain of six.
 *
 * That split is structural rather than tidiness. A `$if` **remounts** when its condition flips, so
 * continuing a call fades the old sentence out and the new one in, the way switching between calls
 * already does. Kept as one node the text swapped in place, mid-sentence, with no transition — the
 * one moment in this panel that still read as a jump. Nothing about the branches themselves changed.
 *
 * Reading a call back:
 *
 * - **Nothing can pick it up.** Another call is already running, or there is no call module. Say
 *   only what is true: a clause telling somebody to continue a meeting, with nothing on screen or in
 *   the rail willing to do it, is worse than no clause.
 * - **Somebody is in it.** Then the act is joining them, not restarting it, and the button beside
 *   this says the same word.
 * - **Nobody is in it.** The offer is to pick it up.
 *
 * The live view:
 *
 * - **No call at all.** Nothing to record and nothing to read: the whole sentence is the way in.
 *   Joining is the only step it names, because it is usually the only one — `recordCalls` defaults
 *   on, so transcription starts with the call and nobody presses anything.
 * - **In a call, with a microphone, not recording.** The one state where a button on this panel
 *   changes the answer. `available` is what keeps it out of the second between joining a call and
 *   the microphone coming up: recording is about to start on its own there, so telling somebody to
 *   press Transcribe is both wrong and unreadable — it was on screen just long enough to change the
 *   sentence twice. The same test coverage uses, for the same reason.
 * - **In a call, recording.** Nothing to add — the panel is waiting for somebody to speak, and
 *   saying so twice would be furniture.
 *
 * ## Neither sentence mentions the subject
 *
 * Whole-token substitution rewrites `{ $: 'modules.transcribe.collectionId' }` where a `$part`
 * points this at another call, and leaves an expression that merely *mentions* it alone — so a
 * sentence built around the subject would go on describing the live call inside a panel about a past
 * one. `VIEWING_LIVE_EXPR` reads the address for that reason, and `callId` is a fact about this
 * agent's own session either way.
 */
const noUtterances: SchemaNode = {
  type: '$if',
  props: {
    condition: VIEWING_LIVE,
    /*
      Fades out in place, then fades back in.

      `emptyState` holds its own placeholder back for a moment before fading it in, which is what
      makes switching calls read as a settle rather than a flicker. Mounting through this gets the
      same treatment on the transitions that had none.

      **In place** is the load-bearing half, and it is not this node's doing. The renderer keeps an
      outgoing branch mounted for the length of its exit, so a sentence fading here is on screen
      while the microphone section above it is going — and that section vanishing pulled it up the
      panel mid-fade. Making the exit instant did not fix it either: the opacity change lands a frame
      or two after the condition, so the sentence was still painted for the collapse.

      What fixes it is above: the section fades and keeps its box for longer than this takes. So the
      order is the sentence finishing, then the height going, then the new sentence arriving where it
      will stay — and this exit is deliberately the **shorter** of the two.
    */
    enterTransition: { type: 'fade', duration: 200 },
    exitTransition: { type: 'fade', duration: 150 },
    then: emptyState({
      icon: 'chat-dots',
      label: 'transcript',
      /*
        "No call at all" is both halves, not just the one this branch could take for granted.

        Inside the live view an address naming a call means it is the call being recorded, so
        `!callId` alone reads as "no call" and is right — until the moment somebody leaves. A branch
        being faded out is still live: `callId` empties, this re-renders, and the panel offered to
        join a call for the length of the exit before the past-call branch took over saying the
        opposite. Naming both halves makes the sentence true on its own terms rather than on its
        neighbour's, which is what a node that outlives its own condition needs.
      */
      message: {
        $:
          `!routeStore.params.call && !modules.transcribe.callId ? 'Join a call to transcribe what is said.' : ` +
          `!modules.transcribe.enabled && modules.transcribe.available ? 'Nothing has been said here yet. Press Transcribe to write down what is said.' : ` +
          `'Nothing has been said here yet.'`,
      },
    }),
    else: emptyState({
      icon: 'chat-dots',
      label: 'transcript',
      message: {
        $:
          `!(${CAN_PICK_UP}) ? 'Nothing has been said here yet.' : ` +
          `${CALL_ON_SCREEN_LIVE} ? 'Nothing has been said here yet. Join the call to begin transcribing.' : ` +
          `'Nothing has been said here yet. Continue the call to begin transcribing.'`,
      },
    }),
  },
};

export const transcriptLines: SchemaNode = {
  type: 'Column',
  // The gap is the only thing separating one utterance from the next now that a row carries no
  // fill or padding of its own, so it does that job alone and is a step wider than it was.
  props: { gap: '400' },
  /*
    Hoisted so the count is readable from outside the loop — a `$query` on the `$each` answers only
    the `$each`, and "are there none" is a question about the list rather than about a row.

    `when` is not optional here, and its absence is the hazard rather than an omission: an operand
    that has not resolved is *pruned* rather than sent, and pruning **widens**. Without it, a subject
    that has not arrived would drop the scope and ask for every TextBlock in the space — a
    transcript of the whole community, shown with confidence, for a frame or forever. The `$if` on
    the same expression used to stand in for this by never rendering the query at all.
  */
  $queries: {
    utterances: {
      entity: 'TextBlock',
      scope: {
        anchor: 'CollectionBlock',
        via: 'children',
        anchorId: { $: 'modules.transcribe.collectionId' },
      },
      // Oldest first, because a transcript read backwards is not a transcript.
      order: { createdAt: 'asc' },
      when: { $: 'modules.transcribe.collectionId' },
    },
  },
  children: [
    {
      type: '$if',
      props: {
        condition: { $: 'count(local.utterances)' },
        then: {
          type: '$each',
          props: {
            items: { $: 'local.utterances' },
            as: 'utterance',
          },
          children: [
            /*
                  Attribution needs no diarization: each agent transcribes only their own
                  microphone, so the block's author *is* the speaker. `$agent` turns that DID
                  into a profile and demand-fetches it, so a peer gets a real name and face
                  rather than a generated blob — and it reaches anyone, not only this space's
                  members.
                */
            {
              type: '$agent',
              props: { did: { $: 'utterance.author' }, as: 'speaker' },
              children: [
                {
                  type: 'Column',
                  props: {
                    /*
                      No fill, no padding — the gap between rows is what separates them.

                      A card each gave every utterance a box, and a transcript is a hundred of them:
                      the padding pushed the words apart far more than telling one line from the
                      next needs, and the whole feed read as a stack of tiles rather than as a
                      conversation. The gap does that job on its own.

                      It also stops the panel fighting whatever is behind it. A docked panel can be
                      floating over the content on a translucent ground, and a column of opaque
                      sunken rectangles cancels that out — the glass shows through the gaps and
                      nowhere else.
                    */
                    gap: '100',
                    /*
                      The row knows whether the pointer is on it, so its pencil can keep out of the
                      way until it is wanted.

                      Held here rather than by the button, which is the whole point: an affordance
                      that only appears once you are already on it cannot be found. `hoverProps` on
                      the button answers for the button, and there is no way to say "when my parent
                      is hovered" in props, so the parent says it instead — the same shape the
                      break-out grip uses in `PanelLane`, written with a local rather than a signal.
                    */
                    onMouseEnter: { $setLocal: 'pointerOnRow', value: true },
                    onMouseLeave: { $setLocal: 'pointerOnRow', value: false },
                  },
                  /*
                    Per row, which is what makes this a local rather than store state.

                    `$localState` on a node inside `$each` is created per row, so each line owns
                    whether it is being mended and the words being typed into it — no id to compare
                    against, and no way for two rows to disagree. The proposal editor needed a store
                    draft because *which fields exist* comes from the model; here the field is
                    `text` and nothing else, which is exactly the case locals are for.
                  */
                  $localState: {
                    mending: { type: 'boolean', initial: false },
                    draft: { type: 'string', initial: '' },
                    pointerOnRow: { type: 'boolean', initial: false },
                  },
                  children: [
                    {
                      /*
                        Somebody has to give up the space, and it is the name.

                        A row that overflows is a row where nobody said who yields: a flex item's
                        automatic minimum size is its content, so the deficit comes out of whichever
                        sibling *can* shrink. Here that was the marks — and worse than usual,
                        because the design system defaults typography to `overflow-wrap: anywhere`,
                        which reduces a word's min-content width to a single glyph. "(edited)" could
                        therefore shrink to nearly nothing and broke mid-word onto two lines.

                        The name is the one thing on the row with a sensible narrower form, and it
                        already asks to be truncated — which needs `minWidth: 0` to happen at all,
                        since without it the item is never asked to be narrower than its text.
                      */
                      type: 'Row',
                      props: { gap: '200', ay: 'center' },
                      children: [
                        {
                          type: 'we-avatar',
                          props: {
                            // `xs`, not `xxs`. A transcript is a list of people talking, so who is
                            // speaking is the second thing on the row after the words — at the
                            // smallest size on the scale a face is a coloured dot and the run of
                            // them stops being scannable.
                            size: 'xs',
                            image: { $: 'speaker.avatar' },
                            // Always alongside `image`, never instead of it: a stable
                            // generated avatar keeps somebody whose profile has not
                            // arrived visually distinct from everybody else whose
                            // profile has not arrived.
                            hash: { $: 'utterance.author' },
                          },
                        },
                        {
                          type: 'we-text',
                          // `label` rather than `footnote` — one step up the scale, and the weight
                          // that comes with it is wanted here: a name is what the eye lands on when
                          // skimming a transcript for who said something.
                          props: {
                            variant: 'label',
                            color: 'text-muted',
                            truncate: true,
                            /*
                              Shrink, but never grow — `0 1 auto`, not `1 1 auto`.

                              A grow factor made the name take every spare pixel on the row, which
                              pushed the clock, the marks and the pencil to the far edge. Nothing
                              here wants to be right-aligned; the name only ever needed permission
                              to *give up* space, which is the shrink half. `minWidth: 0` is what
                              lets it, since a flex item is otherwise never asked to be narrower
                              than its own text.
                            */
                            flex: '0 1 auto',
                            minWidth: '0',
                          },
                          children: [{ $: 'speaker.name' }],
                        },
                        {
                          /*
                            How long ago while it is still happening; what time it was once it is not.

                            Relative time answers "how fresh is this?", which is a question about a
                            feed of unrelated items. A transcript is not one: every row came out of
                            the same conversation, so on a call recorded last Tuesday all two hundred
                            of them read "6 days ago" — the same string on every line, carrying no
                            information and taking the width that made the row wrap. What a reader
                            wants from a line of a finished meeting is where in it the line was, and
                            that is the clock.

                            On the live call relative earns its place: the tail is minutes old, the
                            numbers differ row to row, and they move on their own.

                            `narrow` for the live side because a transcript stamp is a *coordinate* —
                            something skimmed past to find a moment, not read — and a coordinate wants
                            to be terse at any width. That is a fact about the row rather than about
                            the panel, so it is not conditional on how much room there is.

                            One node rather than an `$if` on the two: `relative` short-circuits inside
                            the primitive, so `timeStyle` simply goes unread while it is true. A
                            branch here would unmount and rebuild the row every time a call ended.

                            ## Last on the row, after the marks

                            It used to sit before them, and in `en-US` that put "Aa" hard against
                            "PM" — two letterforms beside two letterforms in the same faint grey,
                            reading as one word. Moving the marks up to the name fixes it by
                            separation rather than by decoration, which is what makes it hold: an
                            `en-GB` reader sees "14:32" and never had the collision, so an
                            icon-level or colour-level fix would have been treating one locale's
                            symptom. The mark is about the line and the time is about the moment;
                            they were only ever neighbours by accident.
                          */
                          type: 'we-timestamp',
                          props: {
                            value: { $: 'utterance.createdAt' },
                            relative: VIEWING_LIVE,
                            relativeStyle: 'narrow',
                            timeStyle: 'short',
                            fontSize: '100',
                            color: 'text-faint',
                          },
                        },
                        /*
                          What this line is, where it is not simply what somebody said.

                          Only ever shown for the two that are not plain speech, and `spoken` stays
                          silent. That is the whole economy of the thing: a transcript is speech
                          almost all the way down, so marking it would put furniture on every row to
                          restate the panel's own title, and a mark that appears everywhere is one
                          people stop reading. The reader's default assumption is already right; the
                          mark exists for where it would not be.

                          Which is also why neither of these is a sparkle. Machine-heard is the
                          assumption here, so "this came from a model" is not news — that icon earns
                          its place on an extraction card, where a record stands for something
                          inferred and the reader would otherwise have no way to tell.
                        */
                        {
                          /*
                            Typed: an icon, because it is a provenance nicety rather than a warning.

                            `text-aa` rather than `keyboard`, which was the first guess and the
                            wrong one: a keyboard is a grid of small keys, and at 12px they merge
                            into a grey smudge that reads as "some icon". Two letterforms survive
                            the size and say "text" on sight.

                            And not a pencil, which is the edit button two elements along this same
                            row — one glyph cannot mean both "written rather than spoken" and
                            "change these words". `translate` means language and `key-return` means
                            submit; both are the wrong claim rather than an unclear one.
                          */
                          type: '$if',
                          props: {
                            condition: { $: "utterance.source == 'typed'" },
                            then: {
                              type: 'we-tooltip',
                              // No `flexShrink` here: the tooltip generates no box, so the badge
                              // inside it is the flex item and its own refusal to shrink is what
                              // counts. That is the whole point of the wrapper being boxless.
                              props: { content: 'Typed, not spoken', placement: 'top' },
                              children: [
                                {
                                  /*
                                    A chip, not a bare icon — because bare it read as part of the
                                    clock beside it.

                                    In `en-US` the time ends "AM" or "PM", and two letterforms in
                                    the same faint grey immediately after two more letterforms are
                                    one word to the eye. Moving the mark to the other side of the row
                                    was tried first and did not help: what separates them is a
                                    *ground*, not a gap, so the mark stops being loose text on the
                                    row and becomes a thing sitting on it.

                                    `control-surface` is a step away from both `surface` and
                                    `surface-sunken` in either polarity, which is the whole reason
                                    the neutral badge is painted with it — see
                                    BADGE_APPEARANCE_DEFAULTS, where this same transcript row is the
                                    case that argued it. The row carried a sunken fill when that was
                                    written and carries none now, and the choice survives the change
                                    precisely because it was made against both grounds.
                                  */
                                  type: 'we-badge',
                                  props: { size: 'xs', variant: 'neutral' },
                                  /*
                                    A keyboard, because this marks *how the line arrived* rather than
                                    that it is text — everything on this row is text.

                                    It was `text-aa`, which is the glyph the record button in this
                                    panel's own header now uses for transcription, as the call bar
                                    always did. One surface cannot spend the same letterform on "this
                                    module makes text" at the top and "somebody typed this" a few
                                    rows down, so the more literal mark takes this one. It also stays
                                    clear of "(edited)", which is the other provenance signal on
                                    these rows.

                                    Sized between the badge's own xxs (12px) and xs (16px). The
                                    badge's height is fixed per size, so a larger glyph fills it
                                    rather than stretching it.
                                  */
                                  children: [{ type: 'we-icon', props: { name: 'keyboard', size: '14px' } }],
                                },
                              ],
                            },
                          },
                        },
                        {
                          /*
                            Corrected: words, not an icon behind a hover.

                            This one is a claim about whether the line is still a verbatim quote, and
                            `editUtterance`'s own note is the reason it cannot be hover-only — a
                            mended line reading as something somebody said is a claim nobody checked.
                            A tooltip is invisible on a touchscreen and to anyone not poking at rows,
                            which is exactly the wrong property for a trust signal.

                            "(edited)" rather than a badge or an asterisk: it is lighter than the
                            badge it replaces, needs no legend, and is the convention every reader
                            already holds from chat. An asterisk needs learning, and a star reads as
                            a rating.

                            The tooltip is then the upgrade rather than the message — it says *when*,
                            which is worth having and worth nothing if it is the only channel.
                          */
                          type: '$if',
                          props: {
                            condition: { $: "utterance.source == 'corrected'" },
                            then: {
                              type: 'we-tooltip',
                              props: { placement: 'top' },
                              children: [
                                {
                                  type: 'we-text',
                                  // `nowrap` because this is one atomic phrase with no narrower
                                  // form, and the `anywhere` default would otherwise let it break
                                  // between any two letters rather than not at all.
                                  props: { variant: 'footnote', color: 'text-faint', whiteSpace: 'nowrap' },
                                  children: ['(edited)'],
                                },
                                {
                                  /*
                                    A formatted time, which is why this is slotted content rather
                                    than the `title` string: a schema has no way to format a date,
                                    and `updatedAt` arrives as epoch milliseconds. `we-timestamp`
                                    already knows how, so the tooltip holds one.

                                    `updatedAt` comes back on every fetch beside `author` and
                                    `createdAt` — no field to declare. What it cannot say is *who*:
                                    `author` stays the original speaker, and anybody may mend a line.
                                  */
                                  type: 'Row',
                                  props: { gap: '100', ay: 'center' },
                                  slot: 'content',
                                  children: [
                                    { type: 'we-text', props: { variant: 'footnote' }, children: ['Edited'] },
                                    {
                                      type: 'we-timestamp',
                                      props: {
                                        value: { $: 'utterance.updatedAt' },
                                        relative: VIEWING_LIVE,
                                        relativeStyle: 'narrow',
                                        timeStyle: 'short',
                                        fontSize: '100',
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                        /*
                          The correction affordance, on the row it corrects.

                          Offered on every line rather than only your own: a recogniser mishears
                          names and jargon, and whoever notices is usually not the speaker. See
                          `editUtterance` for what that costs and what is recorded about it.
                        */
                        {
                          type: '$if',
                          props: {
                            condition: { $: '!local.mending' },
                            then: {
                              type: 'we-tooltip',
                              props: { content: 'Edit text' },
                              children: [
                                {
                                  type: 'we-button',
                                  props: {
                                    label: 'Edit text',
                                    size: 'xs',
                                    variant: 'bare',
                                    color: 'text-faint',
                                    /*
                                      Out of the way until the row is pointed at — and back the
                                      moment it is focused.

                                      A pencil on all two hundred rows is furniture on the ordinary
                                      case, which is reading. Faded rather than unmounted, so the
                                      row does not change width as the pointer crosses it, and so
                                      the button keeps its place in the tab order.

                                      `focusProps` is the half that stops this being a mouse-only
                                      affordance: it fires on `:focus-visible`, so tabbing to the
                                      pencil brings it back into view even though nothing is
                                      hovering it. Without that pair, a keyboard user would be
                                      moving focus onto something invisible.
                                    */
                                    opacity: { $: 'local.pointerOnRow ? 1 : 0' },
                                    focusProps: { opacity: 1 },
                                    transition: 'opacity 200 ease-in-out',
                                    onClick: [
                                      // Seeded on the press rather than at mount, so a row reopened
                                      // after a cancel starts from the words as they now stand.
                                      { $setLocal: 'draft', value: { $: 'utterance.text' } },
                                      { $setLocal: 'mending', value: true },
                                    ],
                                  },
                                  children: [{ type: 'we-icon', props: { size: 'xs', name: 'pencil-simple' } }],
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                    {
                      // Reading, or mending. The field replaces the words rather than sitting under
                      // them, so what is being changed is the thing on screen.
                      type: '$if',
                      props: {
                        condition: { $: 'local.mending' },
                        then: {
                          type: 'Column',
                          props: { gap: '200' },
                          children: [
                            {
                              /*
                                One row, growing — and reading at the size of the words it replaces.

                                Two rows was half a box of empty space under a line that is usually
                                one line long. `autoGrow` starts it at the height of the text it is
                                standing in for and takes the room only when there is something to
                                put in it, which is the same behaviour the composer at the foot of
                                the panel has.

                                `fontSize` is pinned because `size: 'sm'` carries one: the size
                                presets set padding *and* type, so a compact control also shrank the
                                words — mending a line made it visibly smaller than the line beside
                                it, and switching to `md` would have fixed the type by making the box
                                bigger. The two are separable, so they are separated here.
                              */
                              type: 'we-textarea',
                              props: {
                                size: 'sm',
                                fontSize: '300',
                                rows: 1,
                                autoGrow: true,
                                maxRows: 6,
                                submitOnEnter: true,
                                value: { $: 'local.draft' },
                                onInput: { $setLocal: 'draft', value: { $: 'event.detail' } },
                                'on:submit': {
                                  $action: 'modules.transcribe.editUtterance',
                                  args: [{ $: 'utterance.id' }, { $: 'local.draft' }, { $: 'utterance.source' }],
                                  onSuccess: [{ $setLocal: 'mending', value: false }],
                                },
                              },
                            },
                            {
                              type: 'Row',
                              props: { gap: '200', ay: 'center' },
                              children: [
                                {
                                  type: 'we-button',
                                  props: {
                                    size: 'xs',
                                    /*
                                      Primary, not success. Green is the palette for an *outcome* —
                                      it says something went well — and this button is a plain
                                      submit that has not done anything yet. The Keep/Discard pair on
                                      a proposal card is the case that earns success and danger,
                                      because there the colour IS the decision being offered.
                                    */
                                    variant: 'primary',
                                    disabled: { $: '!trim(local.draft)' },
                                    onClick: {
                                      $action: 'modules.transcribe.editUtterance',
                                      args: [{ $: 'utterance.id' }, { $: 'local.draft' }, { $: 'utterance.source' }],
                                      // Closed on success only: a failed write leaves the words on
                                      // screen to try again with, rather than discarding them and
                                      // showing the line unchanged as though nothing was attempted.
                                      // `pointerOnRow` for the reason Cancel sets it — the row
                                      // reflows out from under the pointer either way out.
                                      onSuccess: [
                                        { $setLocal: 'mending', value: false },
                                        { $setLocal: 'pointerOnRow', value: false },
                                      ],
                                    },
                                  },
                                  children: ['Save'],
                                },
                                {
                                  type: 'we-button',
                                  props: {
                                    size: 'xs',
                                    // Secondary rather than ghost: ghost has no edge until it is
                                    // hovered, so beside a filled Save it read as a word somebody
                                    // had left next to a button rather than the other half of a
                                    // pair.
                                    variant: 'secondary',
                                    /*
                                      Both, and the second is what stops the pencil flashing.

                                      Leaving the editor makes the row shorter — a field and two
                                      buttons become one line of text — so it reflows out from under
                                      a pointer that was on the Cancel button. The read view mounts
                                      with `pointerOnRow` still true, so the pencil fades in, and the
                                      pointer is then outside the shrunken row, so it fades straight
                                      back out. Two hundred milliseconds each way, which is exactly
                                      long enough to read as a glitch.

                                      Saying the pointer has left is a small lie when it has not,
                                      and it corrects itself on the next mouse move — where the
                                      flash corrects itself by being wrong twice.
                                    */
                                    onClick: [
                                      { $setLocal: 'mending', value: false },
                                      { $setLocal: 'pointerOnRow', value: false },
                                    ],
                                  },
                                  children: ['Cancel'],
                                },
                              ],
                            },
                          ],
                        },
                        else: { type: 'we-text', props: { color: 'text' }, children: [{ $: 'utterance.text' }] },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        /*
          Nothing to show, and why — see `noUtterances` for the sentence.

          Two gates rather than one, because "is there a transcript record" and "has it answered"
          become true at different moments and only the second is worth waiting for.

          **A record on screen** is gated on the query having *answered*, not merely on the count: a
          list backed by a query is empty on its first frame, so an unqualified else asserts
          "nothing here" about a transcript that is still arriving — which on a long one is the
          wrong sentence for as long as it takes to fetch.

          **No record** is synchronous and needs no such wait, and this is where the missing state
          was: `when` refuses the query without a subject, and a query never asked never reports
          itself loaded, so gating on `utterancesLoaded` alone left the panel blank in the two
          situations a newcomer is most likely to be in — no call, and a call nobody has spoken in.

          The outer condition is the bare subject token and has to stay bare. Substitution is
          whole-token, so it is rewritten wherever a `$part` points this at another call, where an
          expression merely *mentioning* it would be left alone — which is exactly how the inner
          gate came to read the live collection inside a panel about a past one.

          "yet" is right even on a call that finished. A past transcript is not closed: the composer
          writes into whichever one is on screen, so a meeting nobody spoke in is still somewhere a
          note can be left.
        */
        else: {
          type: '$if',
          props: {
            condition: { $: 'modules.transcribe.collectionId' },
            then: {
              type: '$if',
              props: { condition: { $: 'local.utterancesLoaded' }, then: noUtterances },
            },
            else: noUtterances,
          },
        },
      },
    },
  ],
};

/**
 * Why nothing is happening, when nothing is.
 *
 * Every reason this module can produce no text, in one place: still starting, nothing to listen to,
 * a backend with no speech-to-text, no model installed — and the error alert when it failed outright.
 * From the reader's side an empty panel means all of those equally well, and only some of them are
 * worth acting on, so each one says which it is and the fixable one carries the button that fixes it.
 *
 * ## Why this is named
 *
 * It is the difference between "this isn't working" and "this can't work here, and here is why".
 * An interface arranging the module's pieces itself gets the transcript, the meter and the unsaved
 * line — all of which look normal-and-idle on a node with no transcription model at all — so
 * without this the one state that needs a person to do something is the one state with nothing on
 * screen. Placing it is a choice; not having it available was not.
 *
 * One part rather than five, because they are one sentence answered five ways and no interface has
 * a reason to take the missing-model case and refuse the no-audio one. The `Column` is the panel's
 * own gap made explicit, so this reads identically whether placed here or somewhere else.
 *
 * No `subject`: these are facts about this agent's session and this node, not about a call record.
 */
export const captureStatus: SchemaNode = {
  type: 'Column',
  props: { gap: '400' },
  children: [
    /*
      Starting up is no longer a row of its own.

      A spinner and the word "Starting…" appeared here for the few hundred milliseconds an audio
      graph takes to open, and then vanished — a whole line arriving and leaving under a meter that
      had just arrived itself, which moved everything below it twice for something nobody had time
      to read. It says the same thing in the meter's own right-hand label now, where it costs no
      layout: the bar is up, and it has nothing to measure yet.
    */
    /*
      "Nothing is wrong, nothing has happened yet" is no longer said here.

      It was an italic line meaning one of two things — press record, or join a call and then press
      record — and it sat above the feed while the feed said nothing at all, so the same emptiness
      was a caption under the meter in one situation and a centred placeholder in another. The feed
      answers both now, in the place the reader is already looking: see `noUtterances`.

      What is left below is this part's actual subject, which is every reason the module *cannot*
      produce text. Those are not states a transcript can report by being empty — a node with no
      speech-to-text looks exactly like a conversation nobody has started.
    */
    note('no-audio', 'microphone-slash', 'Nothing to listen to. Start or join a call and this will follow it.'),
    note('no-backend', 'plugs', 'This backend cannot transcribe — no speech-to-text is reachable from here.'),
    note(
      'no-model',
      'warning',
      'No transcription model is installed. Add one and transcription will start on its own.',
      {
        // Offered only where the section exists. AI administration is node-scoped, so a guest on
        // somebody else's executor — which includes every web session against a remote host —
        // has no AI settings to open, and a button that opens Settings to nothing is worse than
        // no button. The `else` says who can fix it instead.
        type: '$if',
        props: {
          condition: { $: 'runtimeStore.canManageAi' },
          then: {
            type: 'we-button',
            props: {
              size: 'sm',
              variant: 'secondary',
              // The point of naming the reason is that it can be acted on, so the panel goes
              // there rather than describing where to look.
              onClick: { $action: 'shellStore.openShellView', args: ['settings', '/ai'] },
            },
            children: ['Open AI settings'],
          },
          else: {
            type: 'we-text',
            props: { variant: 'footnote', color: 'text-faint' },
            children: ['Models are configured on the node this app is connected to.'],
          },
        },
      },
    ),
    {
      type: '$if',
      props: {
        condition: { $: "modules.transcribe.status == 'error'" },
        then: {
          type: 'we-alert',
          props: { variant: 'warning' },
          children: [{ $: 'modules.transcribe.error' }],
        },
      },
    },
  ],
};

/**
 * What has been heard but not written down yet.
 *
 * The other half of "is this working", and the half the feed structurally cannot show. An utterance
 * is only a record once the speaker has stopped, the audio has gone to the model and the block has
 * been written — several seconds during which a panel showing saved lines alone looks exactly like
 * a panel that has stopped listening. This is that gap, said out loud.
 *
 * `accent-muted` rather than the feed's `surface-sunken`, and labelled: it is deliberately not one
 * of the transcript's rows. What it holds is provisional — the model has not seen it, so the words
 * can change before they land — and a block that looked like the others would be quietly asserting
 * otherwise.
 *
 * ## Why this is named
 *
 * Same reason as `captureMeter`, and it is the more useful of the two: a template placing the feed
 * gets the saved lines and, without this, a several-second silence after every sentence. Placed
 * *below* the feed rather than above it — the feed pins to its own end, so the two together read as
 * one column that keeps filling downward, and the unsaved line sits where the saved one is about to
 * appear.
 *
 * No `subject`, for `captureMeter`'s reason: this is this agent's own buffer, not a property of any
 * call record.
 */
export const pendingUtterance: SchemaNode = {
  type: '$if',
  props: {
    /*
      Gated on the live call as well as on there being words, and it gates *itself*.

      The buffer is this agent's own microphone, so it has nothing to do with a call somebody opened
      from a link — and a fragment that has to be wrapped in the right condition by whoever places it
      is a fragment that will be placed without one. The workshop wrapped it by hand; nothing made
      that obligatory, and nothing would have said so if it had been forgotten.
    */
    condition: { $: `modules.transcribe.pending && (${VIEWING_LIVE_EXPR})` },
    then: {
      type: 'Column',
      props: { bg: 'accent-muted', r: '300', p: '300', gap: '200' },
      children: [
        {
          type: 'Row',
          props: { ax: 'between', ay: 'center' },
          children: [
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted', uppercase: true },
              children: ['Not saved yet'],
            },
            {
              // The buffer flushes on its own; this is for somebody who has stopped talking and
              // wants the line in the record now rather than at the end of the window.
              type: 'we-button',
              props: { variant: 'ghost', size: 'xs', onClick: { $action: 'modules.transcribe.flushNow' } },
              children: ['Save now'],
            },
          ],
        },
        { type: 'we-text', children: [{ $: 'modules.transcribe.pending' }] },
      ],
    },
  },
};

/**
 * Typing a message into the transcript.
 *
 * ## Why this belongs in the timeline rather than beside it
 *
 * Somebody typing during a meeting is contributing to the record of it — a name the recogniser will
 * not catch, a decision nobody said aloud, a correction to their own point. Kept in a separate list
 * that would be a second document to read alongside the first; the whole value is that it lands at
 * the moment it was written, among what was being said then. So it is a `TextBlock` in the same
 * collection, and `source` is what stops it passing as speech — see the field's own note.
 *
 * ## Why it is the panel's chrome and not part of the feed
 *
 * It used to sit *inside* the scroll region, after the unsaved line, so that it appeared where the
 * next thing to arrive would and moved down with it. That reads well on a full transcript and badly
 * on every other one: with two lines said, the box sits under the second of them halfway up an
 * otherwise empty panel, and it moves every time anybody speaks. A place to write is a fixture of
 * the surface rather than the last row of the document — so it is pinned below the feed, always at
 * the foot of the panel, and the words scroll behind it.
 *
 * Named as a part, for `captureMeter`'s reason: an interface arranging the module's pieces itself
 * would otherwise have the transcript and no way to write into it.
 */
export const transcriptComposer: SchemaNode = {
  type: '$if',
  /*
    Wherever a transcript is on screen, not only while one is being recorded.

    This was gated on the live call, on the reasoning that adding to a finished meeting's timeline
    would date a remark to a conversation it was not made in. That is exactly the claim `source`
    exists to stop it making: a typed line says it was typed and carries its own `createdAt`, so
    nothing about it pretends to have been said at the time. And the case is a real one — watching a
    call back is when somebody notices what is worth writing down, where during it they are busy
    talking.
  */
  props: {
    condition: EXTRACTION_SUBJECT,
    then: {
      type: 'Row',
      props: { gap: '200', ay: 'end', width: '100%' },
      $localState: { message: { type: 'string', initial: '' } },
      children: [
        {
          type: 'we-textarea',
          props: {
            /*
              No `size`, which is `md` — the height every other field in WE stands at.

              It was `sm`, and 32px is the compact size: right for a control tucked into a dense row
              of something else, wrong for the one thing on the panel a person is meant to type
              into. The `fontSize` that used to be pinned here goes with it, because md's own preset
              already reads at 300 — that override existed only to undo `sm`'s smaller type, which
              is the trap the size presets set by carrying both.
            */
            rows: 1,
            flex: '1',
            minWidth: '0',
            /*
              One line to start, growing as somebody writes, capped before it eats the transcript.

              `autoGrow` is also what makes this line up with the button: at rest it takes the same
              control height `we-input` does, rather than whatever `rows` × line-height happens to
              come to. See the prop's own note.
            */
            autoGrow: true,
            maxRows: 6,
            submitOnEnter: true,
            // Short: a placeholder is read at a glance and the panel it sits in is already headed
            // "Transcript", so naming the destination was the box explaining where it was.
            placeholder: 'Type a message…',
            value: { $: 'local.message' },
            onInput: { $setLocal: 'message', value: { $: 'event.detail' } },
            // Enter commits, and the primitive suppresses the newline that would otherwise follow —
            // a schema can read a key event but has nothing that calls `preventDefault`.
            'on:submit': {
              $action: 'modules.transcribe.addMessage',
              args: [{ $: EXTRACTION_SUBJECT_EXPR }, { $: 'local.message' }],
              onSuccess: [{ $setLocal: 'message', value: '' }],
            },
          },
        },
        {
          type: 'we-tooltip',
          props: { content: 'Add this to the transcript' },
          children: [
            {
              type: 'we-button',
              props: {
                label: 'Add this to the transcript',
                // No `size` either: the pair has to agree, and md is what the field is now.
                // `square` sizes the width from that same height, so an icon-only button is a
                // square rather than a rounded rectangle with an icon adrift in it.
                square: true,
                variant: 'secondary',
                disabled: { $: '!trim(local.message)' },
                onClick: {
                  $action: 'modules.transcribe.addMessage',
                  args: [{ $: EXTRACTION_SUBJECT_EXPR }, { $: 'local.message' }],
                  // Cleared on success only — a failed write keeps what was typed rather than
                  // swallowing it and leaving an empty box as the only report.
                  onSuccess: [{ $setLocal: 'message', value: '' }],
                },
              },
              children: [{ type: 'we-icon', props: { name: 'paper-plane-tilt' } }],
            },
          ],
        },
      ],
    },
  },
};

/**
 * The transcript as almost everything wants it: the saved lines and the one being said, scrolling
 * together and following the tail.
 *
 * ## Why the unsaved line is *inside* the scroll area
 *
 * It used to sit outside it, above the feed in this panel and below it in the workshop's, and both
 * were wrong in the same way. The scroll region takes the panel's spare height, so on a transcript
 * with two lines in it the saved words are at one end of a mostly-empty box and the unsaved line is
 * pinned at the other — and the first sentence to be written appears to leap the gap. Put in the
 * flow with the rows, it sits immediately after the last one whether there are two of them or two
 * hundred, and `pin: 'end'` follows it down. The words never move.
 *
 * ## Composed from the part rather than repeating it
 *
 * `$part` inside a part, which the resolver expands recursively — and the subject substitution
 * reaches the inner marker, because it is a whole-token rewrite over this node before the nesting
 * is resolved. So pointing this feed at another call points its rows at that call too, and there is
 * one query in the codebase rather than two that have to agree.
 */
export const transcriptFeed: SchemaNode = {
  type: 'we-scroll-area',
  // Follows the tail while somebody is at the tail, and holds still while they read further
  // up. A live transcript is the case this exists for — and the case that most needs a way back
  // down again, since holding still is otherwise a decision nothing offers to undo.
  props: { pin: 'end', jump: 'both', flex: '1', minHeight: '0' },
  children: [
    {
      type: 'Column',
      props: { gap: '300' },
      children: [
        {
          type: '$part',
          props: { id: 'transcribe.transcriptLines', subject: SUBJECT },
        },
        pendingUtterance,
      ],
    },
  ],
};

/**
 * Extraction, as a surface of its own.
 *
 * It used to be the lower half of the transcript panel, and the two were one panel because they are
 * one module. They are not one *thing*: a transcript follows this agent's microphone and is read
 * while somebody talks, and extraction follows a pass that may be a peer's, takes minutes, spends
 * tokens and is read afterwards. Bundled, the column was a transcript, a meter, a coverage line,
 * four status notes, an extract control, a chip row and a proposal list — two surfaces wearing one
 * coat, and the reason nobody could find the half they wanted.
 *
 * Opening itself when a pass starts is what makes this safe to separate, and it is the rule
 * recording already follows: starting something invisible and saying nothing about it is how a
 * feature comes to look broken. A pass any member starts opens this for everyone who has the module,
 * which is what the one-line signal in the call bar used to be for.
 */
export const extractionPanel: SchemaNode = panelShell({
  title: 'Extraction',
  /*
    How the whole thing works, once, behind a glyph.

    This is where the body's three lines of explanation went — see `extract`. The four facts a
    newcomer cannot guess, in the order they meet them: that a model writes records, that the chips
    choose which and from when, that Extract is the backfill, and that what arrives is a suggestion.
  */
  help:
    'A model reads the transcript and writes what it finds as records. Auto extract reads the call ' +
    'as it goes, for everyone in it; the chips choose what it looks for, from now on. Extract now ' +
    'reads the whole conversation so far, including anything said before a model was switched on. ' +
    'What it finds appears below as suggestions to accept or dismiss.',
  children: [
    {
      type: '$if',
      /*
        Can this node interpret at all — which is a different question from whether there is anything
        to interpret, and the copy here used to answer the wrong one.

        It said "Nothing to read yet. What a call produces appears here as it is found.", which
        describes an absent conversation. `extractable` is `interpretation.available()`: it says
        nothing about whether a call exists, only whether this node has a model. A person reading the
        old sentence waited for a conversation that was never going to help.

        Nothing below it is offered, because nothing below it can be fixed from here.
      */
      props: {
        condition: { $: 'modules.transcribe.extractable' },
        then: {
          type: 'Column',
          props: { width: '100%', flex: '1', minHeight: '0', gap: '300' },
          children: [
            /*
              The controls, the chips and whatever the last pass did — only where there is a call.

              Outside one this was a well of dead furniture: an auto switch that could not be
              pressed, an Extract that could not run, and a chip row showing the space's default
              list greyed out. Every one of them was correctly disabled and none of them could be
              acted on, which is a panel explaining what it *would* offer rather than what it does.

              The same gate everything else here already carries — proposals, the history and the
              results below all ask for a call first — so the panel now says one thing outside a
              call and shows its controls the moment there is a conversation to point them at.

              What goes with it is the "Change the default" link, which only ever appeared where the
              chips could not be pressed. The space's own models are two clicks away in settings,
              which is where that link went.
            */
            { type: '$if', props: { condition: EXTRACTION_SUBJECT, then: extract } },
            proposals,
            /*
              What the passes did, in full.

              This used to be the whole of the call bar's readout, and it moved the call's furniture
              every time somebody opened a row — see `extractionActivity`. It belongs here: this
              panel is already the surface about extraction, opening something in it costs the call
              nothing, and there is room for a prompt pane without a floating strip growing to 520px
              over the controls somebody is reaching for.

              A one-line signal stays in the call chrome so the four people in five who did not start
              a pass can still see one is running without opening anything.

              A sibling of `extract` rather than a child of it, which is where it and `proposals`
              both were. Nested, they inherited `extractable` — a fact about the *node* — so a
              running pass and a decision waiting on somebody were both invisible on a node that
              could not start one, which is precisely the node whose passes came from a peer.
            */
            extractionActivity,
            /*
              Nothing to ask about until there is a call to ask about.

              A drill-down whose `anchorId` is empty is not an empty query, it is a malformed one —
              the backend refused it as invalid SPARQL and the panel opened on a toast. Outside a
              call there is no record to hang passes off, so there is nothing to read.
            */
            { type: '$if', props: { condition: EXTRACTION_SUBJECT, then: extractionHistory } },
            /*
              What the passes actually wrote, for the call on screen.

              The panel used to end at "N records written. Open the graph to see them." — a count
              and an errand. The records are one query per target away and this is the surface somebody
              is already looking at while they arrive, so it shows them. The workshop template built
              this for itself, which is how it came to have the better half of an extraction panel
              and the worse half of everything else.

              Its own scroll region, and the only one: the header, the chips and the activity above
              stay put while this grows, which is what makes a long history readable inside a docked
              panel that clips.
            */
            {
              type: 'we-scroll-area',
              props: { flex: '1', minHeight: '0' },
              children: [
                {
                  type: '$if',
                  props: {
                    condition: EXTRACTION_SUBJECT,
                    then: extractedRows,
                    /*
                      The shared placeholder, so this panel and the transcript's read as one pair.

                      It was a hand-written column with `footnote` text, which is a step smaller
                      than `emptyState` draws — two panels side by side in the same dock, saying
                      the same kind of thing in two sizes. Going through the fragment also brings
                      its delayed fade, which is what stops a placeholder asserting emptiness on
                      the frame before a query answers.

                      "Join a call" rather than "Start a call": joining is the act either way, and
                      it is the word the transcript's own placeholder uses one panel over.
                    */
                    else: emptyState({
                      icon: 'sparkle',
                      label: 'extraction',
                      message: 'Join a call to start extracting things.',
                    }),
                  },
                },
              ],
            },
          ],
        },
        // The same fragment, for the same reason — see the placeholder above.
        else: emptyState({
          icon: 'plugs',
          label: 'extraction',
          message: 'This node has no model configured, so nothing can be extracted from a call.',
        }),
      },
    },
  ],
});

/*
  Fills the box the host gave it, and names itself the way every panel does.

  It used to position itself — `fixed`, `right: 48px`, a hardcoded copy of the module rail's width —
  which meant it overlaid the space rather than making room in it, sat on top of the editor's
  controls, and stayed put when a docked call panel took the edge out from under it. All three are
  the host's job; see `docks` in `index.ts`. The box is `panelShell`'s now, as is the header: this
  drew a `heading-sm` where the panels beside it drew a quiet capitalised label, which is the kind
  of difference nobody chooses and everybody notices.
*/
export const panel: SchemaNode = {
  type: '$if',
  props: {
    condition: { $: 'datasetStore.currentDataset && modules.transcribe.open' },
    then: panelShell({
      // Says which call this is about, because the panel can be about either.
      /*
        One word, whichever call this is about.

        It said "Past call" when the address named one, which was the panel answering a question
        nothing else could: before the pill above it, the only way to know which conversation you
        were reading was the panel's own heading. The pill names the call and says who was in it, so
        the heading went back to describing what the panel *is* — and a title that changes as you
        move between calls is a heading that has to be re-read to learn nothing.
      */
      title: 'Transcript',
      /*
        The same glyph the extraction panel carries, with the three facts about a transcript that
        nothing on screen says: whose machine hears whom, why every line has a name, and that a
        finished call reads back into the same surface. See `docs/architecture/transcripts.md`.
      */
      help:
        "What is said on the call is written down here, by whoever says it: each person's " +
        'microphone is transcribed on their own machine and the lines join into one shared record. ' +
        'Press Transcribe to add your own voice to it. A finished call is read back here, and can ' +
        'be picked up again.',
      /*
        One control, not a control and a badge saying the same thing.

        There was a solid red REC chip beside the button here, and between them they made one point
        twice: the chip appeared while capturing, and the button's icon turned red at the same
        moment. That split happened because this button only ever had two variants, so it had no way
        to look different while actually capturing and the chip was added to cover the third state.

        The call bar's copy of this button already carries all three — off, armed, capturing — in the
        button itself, and its note says why: a state that arrives on its own has to be legible
        without being looked for, and the loudest thing in the row should be the way out of the thing
        nobody switched on. Taking that rule here is what makes the chip redundant rather than
        merely duplicated.

        Nothing loses a signal. The chip showed only while capturing, and capturing means armed, so
        the button is on screen wherever the chip was.
      */
      aside: {
        type: 'Row',
        props: { gap: '200', ay: 'center' },
        children: [
          {
            /*
              Recording is about the call you are *in*, so the control is only offered there. A call
              being looked back at gets the way back into it instead — see the `else`.
            */
            type: '$if',
            props: {
              /*
                One question, and the audio one is asked *inside* it rather than beside it.

                These were one condition — live, and there is something to record — which reads
                correctly and is wrong, because the `else` then means two things at once: a call
                being read back, *and* a live view with no microphone. So the panel offered to
                continue a call with no call on screen, and the press did nothing, since the record
                it names is the empty address.

                Nested, each branch keeps one meaning: the live view offers recording or nothing,
                and only a call being looked back at reaches the offer to pick it up.
              */
              condition: VIEWING_LIVE,
              then: {
                /*
                  Absent where it could not work, rather than present and dead.

                  This was a `disabled` on the button, true in exactly one situation: outside a
                  call, where there is no audio to record. So the control sat greyed out in the
                  header of every panel opened outside a call — the state a newcomer opens it in —
                  saying nothing about why, next to a placeholder already explaining that a call is
                  what is missing.

                  ## And it waits for the microphone, having tried not to

                  This asked `callId` for a day, so that it appeared the instant a call was joined
                  rather than a second later with the level meter. The cost was a label that turned
                  over in front of you: recording only starts once there is a stream to record, so
                  the button read "Transcribe" and then became "Transcribing" on its own.

                  There is no third option. The state genuinely changes in that second, so a label
                  that reports the state must change with it, and one that reports it early is
                  guessing — auto-join can still be refused by `recordCalls`, and a device that never
                  opens would leave the word "Transcribing" standing over nothing recorded, with no
                  diagnostic on screen, which is a far worse failure than waiting.

                  So it arrives with the meter and the coverage readout, already saying the settled
                  thing. That is one arrival for the whole panel rather than a control that appears
                  early to change its mind.

                  `enabled ||` stays, so the way *out* of recording never vanishes: a stream that
                  drops mid-call would otherwise take the stop button with it and leave this agent
                  recording with nothing on screen to say so.
                */
                type: '$if',
                props: {
                  condition: { $: 'modules.transcribe.enabled || modules.transcribe.available' },
                  then: {
                    type: 'we-tooltip',
                    props: {
                      content: { $: "modules.transcribe.enabled ? 'Stop transcribing' : 'Start transcribing'" },
                    },
                    children: [
                      {
                        // The panel's own record control. The call bar is the natural place for it
                        // during a call, but the panel has to be self-sufficient: it opens outside a
                        // call too, and a template may place neither the bar nor the rail.
                        type: 'we-button',
                        props: {
                          /*
                            Three states, the call bar's own — and the third is why the REC chip
                            beside this is gone.

                            Off is `ghost`. Armed but not yet producing, the seconds while a model
                            loads, is `secondary`. Actually capturing is `danger`, and that is the
                            change recording-by-default requires: a state somebody chose can afford
                            to be quiet, while one that arrives on its own has to be legible without
                            being looked for. It is also the off switch, so the loudest thing here is
                            the way out of the thing nobody switched on.
                          */
                          variant: {
                            $: "modules.transcribe.listening ? 'danger' : modules.transcribe.enabled ? 'secondary' : 'ghost'",
                          },
                          size: 'sm',
                          gap: '200',
                          onClick: { $action: 'modules.transcribe.toggle' },
                        },
                        /*
                          A glyph and a word, the shape the Continue button beside it already has.

                          Icon-only, this asked a newcomer to know that a mark means transcription,
                          and the panel had answered that once already with a REC chip that has since
                          gone. The header has room — Continue proves it — so the button says what it
                          is instead.

                          The word carries the state and the tooltip carries the act, which is the
                          division a toggle wants: "Transcribing" is what is happening, and hovering
                          or focusing says pressing stops it. No `label` prop with them, so the
                          accessible name is the visible word rather than a second string that has to
                          be kept containing it.
                        */
                        children: [
                          {
                            /*
                              The record dot, and it can be one here because the word beside it says
                              which kind of recording.

                              The call bar spends a letterform on this instead, and its note gives
                              the reason: in a row of icon-only squares next to a microphone mute, a
                              dot reads as a second, redder mute. That is a fact about *that* row.
                              Here the button is labelled, so the universal capturing mark is the
                              clearer of the two and cannot be mistaken for anything.

                              No colour of its own. Red is the button's, so one here would be red on
                              red — the second of the two bugs the bar's note says were fixed there
                              and left standing on this copy.
                            */
                            type: 'we-icon',
                            props: { name: 'record' },
                          },
                          {
                            type: 'we-text',
                            props: { variant: 'footnote' },
                            children: [{ $: "modules.transcribe.enabled ? 'Transcribing' : 'Transcribe'" }],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              /*
                The way back into a call being read back.

                This was here, then gone, and the reason it is back is not the one it left over.
                It went because the rail continues the call on screen and a second copy of that
                action is duplication — true, and it leaves nothing on screen saying so. The
                placeholder in an empty transcript could say it; a call that *has* a transcript
                shows rows instead, so the offer had no way to appear at all on exactly the calls
                somebody is most likely to want to resume.

                Much smaller than the one that left. It chained three actions — continue, tell the
                recorder to adopt the record, clear the address — and the last two are obsolete: a
                continued record is adopted on its own, and `VIEWING_LIVE` compares the address to
                what is being recorded rather than asking whether an address exists. One action, on
                one record.

                `secondary` rather than the `ghost` it was, because being found is the whole point:
                a ghost button in a corner is the least discoverable thing in the panel, and this is
                the only offer a past call has.
              */
              else: {
                type: '$if',
                props: {
                  condition: { $: CAN_PICK_UP },
                  then: {
                    type: 'we-tooltip',
                    props: {
                      content: {
                        $:
                          `${CALL_ON_SCREEN_LIVE} ? 'Join this call and transcribe into it' : ` +
                          "'Start a call on this record and carry on transcribing into it'",
                      },
                    },
                    children: [
                      {
                        type: 'we-button',
                        props: {
                          variant: 'secondary',
                          size: 'sm',
                          gap: '200',
                          onClick: { $action: 'modules.call.continueCall', args: [{ $: 'routeStore.params.call' }] },
                        },
                        children: [
                          { type: 'we-icon', props: { name: 'phone-call' } },
                          {
                            type: 'we-text',
                            props: { variant: 'footnote' },
                            // Joining a conversation somebody is in is not restarting one that
                            // ended, and the press is identical either way — so the word is the
                            // only thing that can tell them apart. See `CALL_ON_SCREEN_LIVE`.
                            children: [{ $: `${CALL_ON_SCREEN_LIVE} ? 'Join' : 'Continue'` }],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
      children: [
        /*
          Everything about this agent's own microphone, and so only about the live call.

          One `$if` around the three of them rather than three conditions: they answer one question
          between them — is it hearing me, is it hearing everyone else, and why is nothing happening
          — and that question is not asked at all of a meeting somebody is reading back.

          ## And only while one of them has an answer

          A `Column` with nothing in it is still a flex item, so an empty one costs its parent a
          whole `gap` — twelve pixels of nothing between the header and the transcript. All three
          children are dark for the second between joining a call and the microphone coming up, so
          continuing a call pushed everything below this down by a gap, and then down again as the
          meter arrived. The box was invisible and the movement was not.

          The second term is the question the three of them share: is this agent recording, or is
          there a microphone to record. Every note below is reachable under one of those — a backend
          that cannot transcribe and a missing model are both learned by *trying*, which needs audio,
          and "nothing to listen to" is a stream vanishing from under a recording that is still on.

          ## Why it is not `status`

          It was `available || status != 'idle'`, which reads better and leaves the panel jumping
          around after a call ends. `status` is set at the *tail* of `stop`, after a flush that
          writes buffered text to the backend — so it lands a network round trip late, while
          `enabled` and `available` are signals that answer in the same frame the call is torn down
          in.

          That split the teardown across two repaints: the audio went, coverage left, recording
          stopped, the meter left — and this box stayed up holding an empty gap until the flush
          resolved, then collapsed under a placeholder that had already settled. Both terms here are
          synchronous, so the whole section leaves in one frame with everything else.

          Fading it out instead would have hidden the symptom by holding the gap on purpose for the
          length of the fade. Nothing needs to animate once it all leaves together.
        */
        {
          type: '$if',
          props: {
            condition: {
              $: `(${VIEWING_LIVE_EXPR}) && (modules.transcribe.enabled || modules.transcribe.available)`,
            },
            // The section arrives and leaves the way its contents do, and must outlast them on the
            // way out: unmounting on time would cut their fades short and drop the height anyway.
            // See `MIC_FADE`.
            enterTransition: MIC_FADE,
            exitTransition: MIC_FADE,
            then: {
              type: 'Column',
              props: { gap: '300' },
              children: [
                // ── Is it hearing me? ────────────────────────────────────────
                captureMeter,

                // ── Is it hearing everyone else? ─────────────────────────────
                coverage,

                // ── Why nothing is happening, when nothing is ────────────────
                captureStatus,
              ],
            },
          },
        },

        // ── What has been heard, and what is still being said ────────────────
        // One node, not two: the unsaved line lives inside the feed's scroll region, immediately
        // after the last saved row. See `transcriptFeed`.
        transcriptFeed,

        // ── And a place to write into it ─────────────────────────────────────
        // Outside the scroll area, so it holds the foot of the panel instead of following the last
        // thing anybody said. See `transcriptComposer`.
        transcriptComposer,
      ],
    }),
  },
};
