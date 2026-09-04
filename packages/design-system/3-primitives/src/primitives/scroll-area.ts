import type { DesignSystemProps } from '@we/design-types';
import { type DSLayer, filterProps, getKeysForLayers, mergeProps } from '@we/design-utils';
import { scrollbarRules } from '@we/tokens';
import { css, html, nothing, type PropertyValues, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { DesignSystemElement } from '../shared/design-system-element';
import sharedStyles from '../shared/styles';

// overflow/minWidth/minHeight go through DEFAULT_PROPS, not raw CSS —
// DesignSystemElement's generated stylesheet re-declares them on [part='base'] after
// this component's own styles load, silently reverting any hardcoded value to
// CSS-initial. See CONVENTIONS.md § "When to use CSS instead".
const DEFAULT_PROPS: Partial<DesignSystemProps> = {
  display: 'block',
  overflow: 'auto',
  // Flex items default to min-size:auto (content-based) — without this, the host can
  // grow past its allotted flex space instead of clamping to it.
  minWidth: '0',
  minHeight: '0',
};

const styles = css`
  :host {
    /* Unlike other layout properties, :host's own overflow is NOT DS-managed (only
       [part='base']'s is — see CONVENTIONS.md), so it's safe and necessary to set
       directly here. Without it, oversized [part='base'] content spills out past the
       host instead of scrolling. */
    overflow: auto;
  }

  /*
    The shared ruleset, rather than this component's own copy of it.

    The copy was three kinds of wrong at once, and the component named for scrolling was the only
    place any of them showed. It hardcoded 6px instead of reading the scrollbar width token, so a
    theme changing that width moved every scroll region except this one. It restated the thumb
    colour and radius as literals rather than tokens. And — the reason none of that mattered — it
    also set scrollbar-color here and scrollbarWidth thin in DEFAULT_PROPS, either of which makes
    Chromium ignore every webkit scrollbar rule on the element and draw the platform's own bar
    instead. So all twenty lines below were dead code, and this rendered the OS scrollbar: a
    different colour from the rest of the app, a different shape, and on Linux the stepper arrows
    the GTK theme draws. The pocket panel is where that was noticed.

    scrollbarRules carries the button suppression too, which this copy also lacked — so fixing only
    the opt-out would have swapped the platform's arrows for Chromium's own.
  */
  ${unsafeCSS(scrollbarRules("[part='base']"))}

  /*
    The jump controls sit over the content rather than beside it, so turning them on cannot reflow
    what is being read. Positioning lives on a plain wrapper rather than on the button itself: a
    part other than :host or [part='base'] is not touched by the generated stylesheet (see
    CONVENTIONS.md), and a wrapper keeps this component's CSS out of we-button's own cascade
    entirely. The host is what they are positioned against — see getInstanceProps.
  */
  [part='jump-start'],
  [part='jump-end'] {
    position: absolute;
    right: var(--we-space-300);
    display: flex;
    z-index: 1;
  }

  [part='jump-start'] {
    top: var(--we-space-300);
  }

  [part='jump-end'] {
    bottom: var(--we-space-300);
  }
`;

/**
 * How close to the bottom still counts as "at the bottom", in pixels.
 *
 * Not zero, because it never is: fractional device pixels, a sub-pixel line height and a mid-flight
 * smooth scroll all leave `scrollTop` a hair short of the maximum, and an exact comparison would
 * read a reader who is plainly at the bottom as having scrolled away. Small enough that one line of
 * text is unambiguously "scrolled up".
 */
const AT_END_PX = 24;

/**
 * How far behind the end a follow may be and still be worth animating, in pixels.
 *
 * A smooth scroll earns its place by saying *which way* the content moved — a line arrived below,
 * rather than the view jumping to somewhere unrecognisable. It stops earning it once the journey is
 * longer than anybody would sit through: a backlog landing at once, a list re-subscribing, a call's
 * history arriving. Those are a change of place, not a movement, and a jump is the honest rendering.
 */
const SMOOTH_MAX_PX = 1200;

/**
 * Gestures that mean the reader has taken the scroller back.
 *
 * `keydown` is in the list for the same reason the others are — Page Down and End scroll — and
 * costs nothing when the key was a letter: the flag it clears is re-set by the next follow.
 */
const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
const USER_INPUT_OPTIONS = { capture: true, passive: true } as const;

/** Whether the reader has asked for less movement. Absent in a non-browser environment. */
function prefersReducedMotion(): boolean {
  const query = globalThis.matchMedia;
  return typeof query === 'function' && query('(prefers-reduced-motion: reduce)').matches;
}

@customElement('we-scroll-area')
export default class ScrollArea extends DesignSystemElement {
  static styles = [sharedStyles, styles];

  @property({ type: String }) maxHeight = '';
  @property({ type: String }) maxWidth = '';
  /**
   * Follow the end of the content as it grows — but only while the reader is already there.
   *
   * The behaviour every log-shaped list wants and none of them should implement twice: a transcript,
   * a chat, an activity feed. `'end'` turns it on; anything else leaves scrolling alone.
   *
   * The conditional half is the whole point. Pinning unconditionally yanks somebody out of what they
   * scrolled up to re-read, every time a new line lands — which in a live transcript is constantly,
   * and which is the one unforgivable bug in a log view. So the element remembers whether the reader
   * was at the end *before* the content changed, and only then follows.
   *
   * Following animates, so the eye can tell a line arriving below from the view jumping somewhere
   * else. The opening jump does not — there is nothing to have moved from — and neither does a
   * catch-up longer than `SMOOTH_MAX_PX`, nor one for a reader who has asked for reduced motion.
   *
   * It reports nothing. `jump` covers the affordance a reader needs — a way back to the end — but a
   * consumer wanting to say *how much* they missed ("3 new") needs an event, and can have one when
   * something actually renders that: an event nobody listens to is API kept working for nothing.
   */
  @property({ type: String }) pin: '' | 'end' = '';
  /**
   * Offer a button back to the start of the content, to the end of it, or both.
   *
   * The affordance a long scroll region needs and a schema cannot write for itself: a button that
   * knows where the scroller is has to be measured, and measuring is what a primitive is for. Each
   * one is shown only when it would go somewhere — no button at the end you are already at — so
   * `'both'` on a short list draws nothing at all.
   *
   * `'end'` also re-arms `pin`, which is the useful half in a live list: a reader who scrolled up
   * to re-read something presses it once and goes back to being carried along.
   */
  @property({ type: String }) jump: '' | 'start' | 'end' | 'both' = '';
  @property({ type: Object }) styles?: Record<string, string | number | undefined>;

  /** Whether each control would currently go anywhere. Reactive, so growth reveals them. */
  @state() private _showStart = false;
  @state() private _showEnd = false;

  static getDefaultProps() {
    return DEFAULT_PROPS;
  }

  /**
   * The host is the containing block for the jump controls, and only then.
   *
   * `position` is DS-covered on `:host`, so hardcoding it in `static styles` would be reverted the
   * moment an instance rendered — it has to come through the prop merge. It is added per instance
   * rather than in `DEFAULT_PROPS` because a stacking context is not free: an ordinary scroll area
   * has no reason to become one, and something absolutely positioned in slotted content would
   * quietly start resolving against it.
   */
  override getInstanceProps(): Partial<DesignSystemProps> {
    const ctor = this.constructor as typeof ScrollArea & { __dsLayers: readonly DSLayer[] };
    const activeKeys = getKeysForLayers([...ctor.__dsLayers]);
    const usedProps = filterProps(this as unknown as Record<string, unknown>, activeKeys);
    const defaults = this.jump ? { ...DEFAULT_PROPS, position: 'relative' as const } : DEFAULT_PROPS;
    return mergeProps(usedProps, defaults) as Partial<DesignSystemProps>;
  }

  /** The scroller. Assigned on first render; `null` before then and after disconnect. */
  #base: HTMLElement | null = null;
  /** Whether the reader was at the end when we last looked. Seeded true so a fresh list starts pinned. */
  #atEnd = true;
  /**
   * Where our own last instant scroll left the scroller, read back after the write so it holds the
   * value the browser actually clamped to. A scroll event reporting exactly this position is our
   * own and says nothing about the reader — see `#onScroll`.
   */
  #writtenTop = -1;
  /** A smooth follow we started is still animating; its frames are ours, not the reader's. */
  #following = false;
  /** The opening jump has happened, so later follows may animate. */
  #opened = false;
  /** A pending second follow, scheduled for after layout. */
  #frame = 0;
  #mutations?: MutationObserver;
  #resize?: ResizeObserver;

  /**
   * Two observers, because content grows for two different reasons and only one of them is a
   * mutation.
   *
   * Rows arriving is a childList change on the *light* DOM — this element's own children, which are
   * slotted rather than owned, so the observer goes on the host. The host being resized (a panel
   * dragged shorter) changes what "the end" means without changing the content at all.
   *
   * Neither catches an image loading inside a row that was already there, which reflows without
   * mutating. Rows of text do not have that problem, and a log is rows of text; it is worth knowing
   * rather than worth a third observer. The frame-later pass in `#followAfterLayout` does cover the
   * near case — content that grows between the mutation and the paint, which every custom element
   * rendering its own shadow content does — so what is left uncovered is a reflow arriving later
   * than that, and following it would mean yanking the view for something the reader has by then
   * been looking at.
   */
  connectedCallback(): void {
    super.connectedCallback();
    if (typeof MutationObserver !== 'undefined') {
      this.#mutations = new MutationObserver(() => this.#contentChanged());
      this.#mutations.observe(this, { childList: true, subtree: true, characterData: true });
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.#resize = new ResizeObserver(() => this.#contentChanged());
      this.#resize.observe(this);
    }
    // A reader touching the element takes the scroller back off us: whatever we had in flight stops
    // being ours, and the scroll it produces is judged as theirs.
    for (const type of USER_INPUT_EVENTS) this.addEventListener(type, this.#onUserInput, USER_INPUT_OPTIONS);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#mutations?.disconnect();
    this.#resize?.disconnect();
    for (const type of USER_INPUT_EVENTS) this.removeEventListener(type, this.#onUserInput, USER_INPUT_OPTIONS);
    if (this.#frame) cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#following = false;
    this.#mutations = undefined;
    this.#resize = undefined;
    this.#base = null;
  }

  firstUpdated(): void {
    this.#base = this.renderRoot.querySelector('[part="base"]');
    // A list that opens already scrolled to the bottom, rather than at the top of a backlog nobody
    // asked to re-read. Only when pinning is on: otherwise this would be a scroll nobody requested.
    if (this.pin === 'end') this.#toEnd({ smooth: false });
    this.#syncControls();
  }

  /**
   * `pin` is set as a DOM property, and a framework binding it inside an effect can do so *after*
   * Lit has rendered — in which case `firstUpdated` above ran while pinning was still off and the
   * opening jump never happened, leaving the list at the top of its backlog. `jump` arrives the
   * same way, and its controls cannot be measured before there is a scroller to measure.
   */
  updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('pin') && this.pin === 'end' && !this.#opened) this.#toEnd({ smooth: false });
    if (changed.has('pin') || changed.has('jump')) this.#syncControls();
  }

  /**
   * Decide, from where the scroller has just landed, whether the reader still wants the end.
   *
   * The subtlety is that not every scroll event is the reader. Content growing under a stationary
   * `scrollTop` moves the end away without anybody moving at all, and the event our own follow
   * queues is delivered in the frame's scroll steps — *after* the microtask that wrote it, and so
   * after anything rendered asynchronously in between has made the content taller than it was when
   * we measured. Reading either of those as "scrolled away" is what used to unpin a transcript
   * permanently the first time somebody said more than one line's worth: the latch went false and
   * nothing but a manual scroll back to the bottom could ever set it true again.
   *
   * So a scroll only counts as the reader's when it is neither a frame of our own animation nor a
   * landing at the exact position we last wrote.
   */
  #onScroll = (): void => {
    const base = this.#base;
    if (!base) return;

    const top = base.scrollTop;
    const distance = base.scrollHeight - top - base.clientHeight;

    if (this.#following) {
      // Ours until it arrives. A reader who interrupts it has already cleared the flag by touching
      // the element, so their scroll is judged below rather than swallowed here.
      if (distance <= AT_END_PX) this.#following = false;
      return;
    }

    // Landing at the end re-arms following, however the reader got there.
    if (distance <= AT_END_PX) {
      this.#atEnd = true;
      return;
    }

    if (top === this.#writtenTop) return;
    this.#atEnd = false;
  };

  /** Every scroll moves at least one control's answer, including the frames of our own follow. */
  #onScrolled = (): void => {
    this.#onScroll();
    this.#syncControls();
  };

  #toEnd(options: { smooth: boolean }): void {
    const base = this.#base;
    if (!base) return;

    this.#opened = true;
    this.#atEnd = true;

    const target = Math.max(0, base.scrollHeight - base.clientHeight);
    if (base.scrollTop >= target) {
      this.#writtenTop = base.scrollTop;
      return;
    }

    const smooth =
      options.smooth &&
      typeof base.scrollTo === 'function' &&
      target - base.scrollTop <= SMOOTH_MAX_PX &&
      !prefersReducedMotion();

    if (smooth) {
      // Re-targeting rather than queueing: a second smooth scroll on the same box abandons the
      // first and animates on from wherever it had got to, which is exactly what a destination
      // that keeps moving down wants.
      this.#following = true;
      base.scrollTo({ top: target, behavior: 'smooth' });
      return;
    }

    this.#following = false;
    base.scrollTop = target;
    this.#writtenTop = base.scrollTop;
  }

  /** Where the reader would land pressing "jump to the start". Never re-arms `pin`. */
  #toStart(): void {
    const base = this.#base;
    if (!base) return;

    this.#atEnd = false;
    this.#following = false;
    // Deliberately not recorded as ours: the reader asked for this, so the scroll it produces
    // should be judged as theirs like any other.
    this.#writtenTop = -1;

    if (typeof base.scrollTo === 'function' && !prefersReducedMotion() && base.scrollTop <= SMOOTH_MAX_PX) {
      base.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      base.scrollTop = 0;
    }
    this.#syncControls();
  }

  #contentChanged(): void {
    this.#follow();
    this.#syncControls();
  }

  #follow(): void {
    if (this.pin !== 'end' || !this.#atEnd) return;
    this.#toEnd({ smooth: this.#opened });
    this.#followAfterLayout();
  }

  /**
   * Whether each jump control would currently go anywhere.
   *
   * Measured rather than inferred, and re-measured whenever the content changes as well as
   * whenever the scroller moves — a list growing past the reader is exactly when "jump to the end"
   * becomes worth offering, and nobody has scrolled at that moment.
   */
  #syncControls(): void {
    const base = this.#base;
    if (!base || !this.jump) {
      this._showStart = false;
      this._showEnd = false;
      return;
    }

    const top = base.scrollTop;
    const end = base.scrollHeight - base.clientHeight;
    // Nothing worth jumping across: an ordinary short list should draw no chrome at all.
    const scrollable = end > AT_END_PX;
    const offers = (which: 'start' | 'end') => this.jump === which || this.jump === 'both';

    this._showStart = scrollable && offers('start') && top > AT_END_PX;
    this._showEnd = scrollable && offers('end') && end - top > AT_END_PX;
  }

  /**
   * A second pass, one frame later.
   *
   * Mutation records are delivered on a microtask — before the browser has laid anything out, and
   * before a custom element appended in the same turn has rendered its own shadow content. A row
   * measured then is a row of barely any height, so the follow lands short of a bottom that is
   * about to move down again. This is what leaves a multi-line utterance half under the edge of
   * the panel.
   */
  #followAfterLayout(): void {
    if (typeof requestAnimationFrame !== 'function' || this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      // The first honest measurement of the frame, so the controls are settled here too.
      this.#syncControls();
      if (this.pin !== 'end' || !this.#atEnd) return;
      this.#toEnd({ smooth: this.#opened });
    });
  }

  #onUserInput = (): void => {
    this.#following = false;
  };

  #onJumpStart = (): void => this.#toStart();

  #onJumpEnd = (): void => {
    this.#toEnd({ smooth: true });
    this.#syncControls();
  };

  render() {
    const dynamicStyles: Record<string, string> = {};
    if (this.maxHeight) dynamicStyles['max-height'] = this.maxHeight;
    if (this.maxWidth) dynamicStyles['max-width'] = this.maxWidth;

    return html`
      <div part="base" style=${styleMap({ ...dynamicStyles, ...this.styles })} @scroll=${this.#onScrolled}>
        <slot></slot>
      </div>
      ${
        this._showStart
          ? html`
              <div part="jump-start">
                <we-button
                  variant="secondary"
                  size="sm"
                  square
                  r="pill"
                  shadow="md"
                  label="Jump to the start"
                  @click=${this.#onJumpStart}
                >
                  <we-icon name="caret-double-up"></we-icon>
                </we-button>
              </div>
            `
          : nothing
      }
      ${
        this._showEnd
          ? html`
              <div part="jump-end">
                <we-button
                  variant="secondary"
                  size="sm"
                  square
                  r="pill"
                  shadow="md"
                  label="Jump to the end"
                  @click=${this.#onJumpEnd}
                >
                  <we-icon name="caret-double-down"></we-icon>
                </we-button>
              </div>
            `
          : nothing
      }
    `;
  }
}
