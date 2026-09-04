import type { DesignSystemProps } from '@we/design-types';
import { scrollbarRules } from '@we/tokens';
import { css, html, type PropertyValues, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
   * It reports nothing. A consumer wanting to offer "N new" while the reader is scrolled up needs an
   * event, and can have one when something actually renders that affordance — an event nobody
   * listens to is API that has to be kept working for nothing.
   */
  @property({ type: String }) pin: '' | 'end' = '';
  @property({ type: Object }) styles?: Record<string, string | number | undefined>;

  static getDefaultProps() {
    return DEFAULT_PROPS;
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
      this.#mutations = new MutationObserver(() => this.#follow());
      this.#mutations.observe(this, { childList: true, subtree: true, characterData: true });
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.#resize = new ResizeObserver(() => this.#follow());
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
  }

  /**
   * `pin` is set as a DOM property, and a framework binding it inside an effect can do so *after*
   * Lit has rendered — in which case `firstUpdated` above ran while pinning was still off and the
   * opening jump never happened, leaving the list at the top of its backlog.
   */
  updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('pin') && this.pin === 'end' && !this.#opened) this.#toEnd({ smooth: false });
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

  #follow(): void {
    if (this.pin !== 'end' || !this.#atEnd) return;
    this.#toEnd({ smooth: this.#opened });
    this.#followAfterLayout();
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
      if (this.pin !== 'end' || !this.#atEnd) return;
      this.#toEnd({ smooth: this.#opened });
    });
  }

  #onUserInput = (): void => {
    this.#following = false;
  };

  render() {
    const dynamicStyles: Record<string, string> = {};
    if (this.maxHeight) dynamicStyles['max-height'] = this.maxHeight;
    if (this.maxWidth) dynamicStyles['max-width'] = this.maxWidth;

    return html`
      <div part="base" style=${styleMap({ ...dynamicStyles, ...this.styles })} @scroll=${this.#onScroll}>
        <slot></slot>
      </div>
    `;
  }
}
