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
import { panelShell, sectionLabel } from '@we/schema-kit';
import { type SchemaNode } from '@we/schema-shared';
import { expr } from '@we/schema-shared';

import { extractionActivity } from './ExtractionStatus.schema';

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
export const SUBJECT_EXPR = 'routeStore.params.call ? routeStore.params.call : modules.transcribe.collectionId';
const SUBJECT = { $: SUBJECT_EXPR };

/**
 * Whether the call on screen is the one being recorded, as opposed to one being looked back at.
 *
 * Everything about *this agent's microphone* is gated on it — the meter, the coverage readout, the
 * status notes, the unsaved line and the record button. A bar moving beside last month's meeting
 * would be measuring the wrong thing and saying so confidently.
 *
 * Read from the address rather than derived from `SUBJECT`, because whole-token substitution cannot
 * rewrite an expression that merely mentions the subject: a `$part` pointed at another call is
 * expected to be on a route that names it, which is what `SUBJECT_EXPR` already assumes.
 */
const VIEWING_LIVE = { $: 'routeStore.params.call ? false : true' };

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
export const captureMeter: SchemaNode = {
  type: '$if',
  props: {
    condition: { $: 'modules.transcribe.enabled' },
    then: {
      type: 'Column',
      props: { gap: '150' },
      children: [
        {
          type: 'Row',
          props: { ax: 'between', ay: 'center' },
          children: [
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-muted' },
              children: ['Microphone'],
            },
            {
              // Says which side of the threshold we are on, for anyone who cannot read the bar.
              type: 'we-text',
              props: {
                variant: 'footnote',
                color: { $: "modules.transcribe.speaking ? 'success-text' : 'text-faint'" },
              },
              children: [{ $: "modules.transcribe.speaking ? 'hearing you' : 'quiet'" }],
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
                  width: { $: 'modules.transcribe.levelPercent' },
                  transition: 'width 80ms linear',
                  'max-width': '100%',
                },
              },
            },
            {
              // The onset threshold, read from the store so it cannot drift from the VAD's own value.
              type: 'Row',
              props: {
                position: 'absolute',
                top: '0px',
                height: '100%',
                width: '2px',
                bg: 'border-strong',
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
 * happening and somebody can still press record.
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
    condition: { $: 'count(modules.transcribe.callAgents)' },
    then: {
      type: 'Column',
      props: { gap: '150' },
      children: [
        {
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
        {
          /*
            What the gap means, in the words somebody would need to act on it.

            Only when there is a gap — the whole-coverage case is already fully said by the count, and
            a permanent second line explaining a number that is currently fine is the kind of chrome
            people stop reading before the day it matters.
          */
          type: '$if',
          props: {
            condition: { $: 'modules.transcribe.partialCoverage' },
            then: {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-faint' },
              children: ['Only what those microphones hear reaches this record.'],
            },
          },
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
      props: { gap: '150', ay: 'center', wrap: true },
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
              props: { title: { $: 'field.label' } },
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
 * processed-turn cursor — which is why the note under the Extract button says pressing it is how the
 * rest of the conversation gets swept.
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
      What this press will look for — the models, not a fixed sentence.

      It read "Find the tasks and events in what was said", which was true while those
      two classes were compiled into this module and is a lie in a space that defined
      its own. The chips below both say what will be looked for and let this agent
      narrow it; the sentence would have to be rewritten every time a community adopts
      a model, so it becomes a lead-in instead.
    */
    {
      type: '$if',
      props: {
        condition: { $: `count(${forSubject('targets').$})` },
        /*
          Which list this is, said out loud, because it is two lists.

          Outside a call there is no conversation to narrow, so what is shown is the space's own
          default — the one every call here starts from. Inside one it is that call's list. They look
          identical and a press on them means very different things, so the heading is the only thing
          that can tell them apart.
        */
        then: {
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-muted' },
          children: [
            {
              $: `${forSubject('canChoose').$} ? 'Look through what was said for:' : "This space's calls look for:"`,
            },
          ],
        },
        /*
          Not a failure, and phrased as the one thing a person can act on.

          Every other reason extraction is unavailable is about this node — no model
          configured, an executor that cannot interpret — and none of them can be fixed
          from here. This one can: it is a decision the community has not made yet, and
          the place to make it is the space's own models.
        */
        else: {
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
      the note under the button says so, since the answer for the rest of the
      conversation is the button itself.
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
 */
const extract: SchemaNode = {
  type: 'Column',
  props: { gap: '200', bg: 'surface-sunken', r: '300', p: '300' },
  children: [
    {
      type: 'Row',
      props: { ax: 'between', ay: 'center', gap: '300' },
      children: [
        {
          type: 'Column',
          props: { gap: '050' },
          children: [
            { type: 'we-text', props: { variant: 'footnote', fontWeight: '600' }, children: ['Extract'] },
            { type: '$part', props: { id: 'transcribe.extractionTargets' } },
          ],
        },
        {
          type: 'we-button',
          props: {
            size: 'sm',
            variant: 'secondary',
            // Disabled rather than hidden once the panel is showing the section: the reason is
            // "nothing has been said yet", which resolves on its own and is worth waiting for.
            disabled: { $: `!${forSubject('canExtract').$} || modules.transcribe.extractStatus == 'running'` },
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
          children: [{ $: "modules.transcribe.extractStatus == 'running' ? 'Reading…' : 'Extract'" }],
        },
      ],
    },
    /*
          The one thing about mid-call changes that is not guessable.

          A standing watch keeps a processed-turn cursor, so a model switched on part-way through is
          applied to what is said next and not to what was said before it. The one-shot pass carries
          no cursor — it hands the executor the whole transcript — so pressing Extract is the
          backfill, and the executor's dedup means what was already found returns as updates rather
          than as second copies.

          Shown only where it applies: a call nobody has changed the list for has nothing to backfill.
        */
    {
      type: '$if',
      props: {
        condition: { $: `count(${forSubject('targets').$})` },
        then: {
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-faint' },
          children: ['A model switched on mid-call applies from here — press Extract to sweep what was said before.'],
        },
      },
    },
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
export const transcriptLines: SchemaNode = {
  type: 'Column',
  props: { gap: '300' },
  children: [
    {
      type: '$if',
      props: {
        condition: { $: 'modules.transcribe.collectionId' },
        then: {
          type: '$each',
          props: {
            items: {
              $query: {
                entity: 'TextBlock',
                scope: {
                  anchor: 'CollectionBlock',
                  via: 'children',
                  anchorId: { $: 'modules.transcribe.collectionId' },
                },
                // Oldest first, because a transcript read backwards is not a transcript.
                order: { createdAt: 'asc' },
              },
            },
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
                  props: { bg: 'surface-sunken', r: '300', p: '300', gap: '100' },
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
                  },
                  children: [
                    {
                      type: 'Row',
                      props: { gap: '200', ay: 'center' },
                      children: [
                        {
                          type: 'we-avatar',
                          props: {
                            size: 'xxs',
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
                          props: { variant: 'footnote', color: 'text-muted', truncate: true },
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

                            `keyboard` and not a pencil — the pencil is the edit button two elements
                            along this same row, and one glyph cannot mean both "written rather than
                            spoken" and "change these words".
                          */
                          type: '$if',
                          props: {
                            condition: { $: "utterance.source == 'typed'" },
                            then: {
                              type: 'we-tooltip',
                              props: { title: 'Typed into the transcript, not spoken', placement: 'top' },
                              children: [
                                { type: 'we-icon', props: { name: 'keyboard', size: 'xs', color: 'text-faint' } },
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
                                  props: { variant: 'footnote', color: 'text-faint' },
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
                              type: 'we-button',
                              props: {
                                size: 'xs',
                                variant: 'bare',
                                color: 'text-faint',
                                title: 'Fix these words',
                                onClick: [
                                  // Seeded on the press rather than at mount, so a row reopened
                                  // after a cancel starts from the words as they now stand.
                                  { $setLocal: 'draft', value: { $: 'utterance.text' } },
                                  { $setLocal: 'mending', value: true },
                                ],
                              },
                              children: [{ type: 'we-icon', props: { size: 'xs', name: 'pencil-simple' } }],
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
                              type: 'we-textarea',
                              props: {
                                size: 'sm',
                                rows: 2,
                                value: { $: 'local.draft' },
                                onInput: { $setLocal: 'draft', value: { $: 'event.detail' } },
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
                                    variant: 'success',
                                    gap: '100',
                                    disabled: { $: '!trim(local.draft)' },
                                    onClick: {
                                      $action: 'modules.transcribe.editUtterance',
                                      args: [{ $: 'utterance.id' }, { $: 'local.draft' }, { $: 'utterance.source' }],
                                      // Closed on success only: a failed write leaves the words on
                                      // screen to try again with, rather than discarding them and
                                      // showing the line unchanged as though nothing was attempted.
                                      onSuccess: [{ $setLocal: 'mending', value: false }],
                                    },
                                  },
                                  children: [{ type: 'we-icon', props: { name: 'check' } }, 'Save'],
                                },
                                {
                                  type: 'we-button',
                                  props: {
                                    size: 'xs',
                                    variant: 'ghost',
                                    onClick: { $setLocal: 'mending', value: false },
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
    {
      type: '$if',
      props: {
        condition: { $: "modules.transcribe.status == 'starting'" },
        then: {
          type: 'Row',
          props: { gap: '200', ay: 'center' },
          children: [
            { type: 'we-spinner', props: { size: 'sm' } },
            { type: 'we-text', props: { variant: 'footnote', color: 'text-muted' }, children: ['Starting…'] },
          ],
        },
      },
    },
    {
      // The panel opened, nothing recorded yet, nothing wrong. Without this the box is empty and
      // reads as broken rather than as waiting.
      //
      // Gated on there being no *record*, not on a session buffer being empty. The buffer was
      // session-local, so re-opening the panel on a call that had already been transcribed
      // offered to start recording as though nothing had ever been said. A collection is created
      // on the first utterance, so its absence is exactly "nothing has been said here".
      type: '$if',
      props: {
        condition: { $: '!modules.transcribe.enabled && !modules.transcribe.collectionId' },
        then: {
          type: 'we-text',
          props: { variant: 'footnote', color: 'text-muted', italic: true },
          children: [
            {
              $: "modules.transcribe.available ? 'Press record to transcribe what is said into text blocks in this space.' : 'Join a call and press record to transcribe what is said.'",
            },
          ],
        },
      },
    },
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
    condition: { $: 'modules.transcribe.pending && !routeStore.params.call' },
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
 * Typing something into the transcript.
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
      $localState: { comment: { type: 'string', initial: '' } },
      children: [
        {
          type: 'we-textarea',
          props: {
            size: 'sm',
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
            placeholder: 'Add a note to the transcript…',
            value: { $: 'local.comment' },
            onInput: { $setLocal: 'comment', value: { $: 'event.detail' } },
            // Enter commits, and the primitive suppresses the newline that would otherwise follow —
            // a schema can read a key event but has nothing that calls `preventDefault`.
            'on:submit': {
              $action: 'modules.transcribe.addComment',
              args: [{ $: EXTRACTION_SUBJECT_EXPR }, { $: 'local.comment' }],
              onSuccess: [{ $setLocal: 'comment', value: '' }],
            },
          },
        },
        {
          type: 'we-button',
          props: {
            size: 'sm',
            variant: 'secondary',
            title: 'Add this to the transcript',
            disabled: { $: '!trim(local.comment)' },
            onClick: {
              $action: 'modules.transcribe.addComment',
              args: [{ $: EXTRACTION_SUBJECT_EXPR }, { $: 'local.comment' }],
              // Cleared on success only — a failed write keeps what was typed rather than
              // swallowing it and leaving an empty box as the only report.
              onSuccess: [{ $setLocal: 'comment', value: '' }],
            },
          },
          children: [{ type: 'we-icon', props: { name: 'paper-plane-tilt' } }],
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
    Whether this conversation is read as it happens, and it is a *call's* switch.

    The space has a standing answer and an administrator sets it; this is the people in the room
    deciding about the room. On the live call only: a meeting somebody opened from a link is not
    happening, so "as it happens" has nothing to be about, and the switch would be asking about a
    conversation that finished. Everything else here follows the call on screen; this one thing
    cannot.
  */
  aside: {
    type: '$if',
    props: {
      condition: VIEWING_LIVE,
      then: {
        type: 'we-switch',
        props: {
          size: 'sm',
          label: 'As it happens',
          checked: { $: 'modules.transcribe.autoExtract' },
          // The live call's answer, and the same record `autoExtract` reads.
          disabled: { $: '!modules.transcribe.extractionFor[modules.transcribe.callId].canChoose' },
          onChange: { $action: 'modules.transcribe.toggleAutoExtract' },
        },
      },
    },
  },
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
            extract,
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
                    else: {
                      type: 'Column',
                      props: { ax: 'center', ay: 'center', gap: '200', p: '500', width: '100%' },
                      children: [
                        { type: 'we-icon', props: { name: 'sparkle', size: 'lg', color: 'text-faint' } },
                        {
                          type: 'we-text',
                          props: { variant: 'footnote', color: 'text-faint', textAlign: 'center' },
                          children: ['Start a call. What the conversation produces appears here.'],
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
        else: {
          type: 'Column',
          props: { ax: 'center', ay: 'center', gap: '200', p: '500', width: '100%', flex: '1' },
          children: [
            { type: 'we-icon', props: { name: 'plugs', size: 'lg', color: 'text-faint' } },
            {
              type: 'we-text',
              props: { variant: 'footnote', color: 'text-faint', textAlign: 'center' },
              children: ['This node has no model configured, so nothing can be extracted from a call.'],
            },
          ],
        },
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
      title: { $: "routeStore.params.call ? 'Past call' : 'Transcript'" },
      aside: {
        type: 'Row',
        props: { gap: '200', ay: 'center' },
        children: [
          {
            type: '$if',
            props: {
              condition: { $: 'modules.transcribe.listening && !routeStore.params.call' },
              // `solid`: this is the news, not an annotation on it. Soft would paint the dark
              // tint and a pale label, which reads as a note about recording rather than as
              // the fact that it is happening.
              then: {
                type: 'we-badge',
                props: { variant: 'danger', appearance: 'solid', size: 'xs' },
                children: ['REC'],
              },
            },
          },
          {
            /*
              Recording is about the call you are *in*, so the control is only offered there.

              On a call being looked back at the honest offer is to pick it back up: `continueCall`
              starts a call on the record already on screen, `resume` points the recorder at it
              without waiting for a presence round trip, and the address stops naming it — the
              recorder has just adopted this record, so it is the live call now, and a parameter
              still pinning to it would say the opposite for the rest of the meeting.

              This is the one place this module names another. It is a `$if` on
              `modules.call.canCall`, which is absent — and so falsy — in a deployment without the
              call module, so the offer simply is not made rather than failing.
            */
            type: '$if',
            props: {
              condition: VIEWING_LIVE,
              then: {
                // The panel's own record control. The call bar is the natural place for it
                // during a call, but the panel has to be self-sufficient: it opens outside a
                // call too, and a template may place neither the bar nor the rail.
                type: 'we-button',
                props: {
                  variant: { $: "modules.transcribe.enabled ? 'secondary' : 'ghost'" },
                  size: 'sm',
                  disabled: { $: '!modules.transcribe.enabled && !modules.transcribe.available' },
                  onClick: { $action: 'modules.transcribe.toggle' },
                  title: { $: "modules.transcribe.enabled ? 'Stop transcribing' : 'Start transcribing'" },
                },
                children: [
                  {
                    type: 'we-icon',
                    props: {
                      name: 'record',
                      /*
                        Not `weight: 'fill'` while listening, and not `danger-text` — the two bugs
                        `CallControl.schema.ts` documents fixing on the call bar's own record
                        button, still here on the panel's.

                        Only the `regular` weight of any icon is bundled, so every other weight is
                        a CDN fetch; this one fired at the moment recording started, which on an
                        offline machine made the icon vanish as you pressed it. And `danger-text`
                        is a foreground measured for reading against a page — `danger-700`, which
                        inverts to a pale pink in a dark theme. A record dot is a mark, so it wants
                        the fill.
                      */
                      color: { $: "modules.transcribe.listening ? 'danger' : ''" },
                    },
                  },
                ],
              },
              else: {
                type: '$if',
                props: {
                  condition: { $: 'modules.call.canCall && !modules.call.active' },
                  then: {
                    type: 'we-button',
                    props: {
                      variant: 'ghost',
                      size: 'sm',
                      gap: '200',
                      title: 'Start a call on this record and carry on transcribing into it',
                      onClick: [
                        { $action: 'modules.call.continueCall', args: [{ $: 'routeStore.params.call' }] },
                        { $action: 'modules.transcribe.resume', args: [{ $: 'routeStore.params.call' }] },
                        { $action: 'routeStore.setParam', args: ['call', null] },
                      ],
                    },
                    children: [
                      { type: 'we-icon', props: { name: 'phone-call' } },
                      { type: 'we-text', props: { variant: 'footnote' }, children: ['Continue'] },
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
        */
        {
          type: '$if',
          props: {
            condition: VIEWING_LIVE,
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
