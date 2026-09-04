/**
 * `we-scroll-area`'s tail pinning — and, mostly, when it refuses to.
 *
 * The decision under test is one boolean: was the reader at the end when the content changed. Every
 * bug this feature can have is that boolean being wrong, so the tests drive it directly — scroll the
 * element, add a row, assert whether the view moved — rather than through a real browser.
 *
 * jsdom reports every scroll metric as zero and never lays anything out, so `scrollHeight` and
 * `clientHeight` are stubbed per test. That is honest here: the arithmetic is one subtraction, and
 * what matters is which branch it selects.
 */
import './scroll-area';

import { describe, expect, it } from 'vitest';

interface ScrollAreaEl extends HTMLElement {
  pin: '' | 'end';
  updateComplete: Promise<unknown>;
}

/** jsdom delivers MutationObserver records on a microtask; two turns is comfortably enough. */
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

/**
 * A mounted scroll area whose scroller reports a settable content height.
 *
 * `scrollHeight` and `clientHeight` are defined as configurable getters because jsdom's own are
 * zero and read-only-ish; `scrollTop` stays a plain property so the element can write it and the
 * test can read back what it wrote. `scrollHeight` reads through a variable rather than being
 * fixed, because the bug this file exists to pin down is content growing between one measurement
 * and the next.
 */
async function mount(options: { pin?: 'end'; scrollHeight?: number; clientHeight?: number }) {
  const el = document.createElement('we-scroll-area') as ScrollAreaEl;
  if (options.pin) el.pin = options.pin;
  document.body.appendChild(el);
  await el.updateComplete;

  let scrollHeight = options.scrollHeight ?? 1000;
  const clientHeight = options.clientHeight ?? 200;

  const base = el.shadowRoot!.querySelector('[part="base"]') as HTMLElement;
  Object.defineProperty(base, 'scrollHeight', { get: () => scrollHeight, configurable: true });
  Object.defineProperty(base, 'clientHeight', { value: clientHeight, configurable: true });
  base.scrollTop = 0;

  /** Put the reader at a scroll offset and let the element notice. */
  const scrollTo = (top: number) => {
    base.scrollTop = top;
    base.dispatchEvent(new Event('scroll'));
  };

  /** Add a row to the light DOM, which is what the mutation observer is watching. */
  const addRow = async () => {
    el.appendChild(document.createElement('div'));
    await settle();
  };

  /** The row that just landed turns out to be taller than it was when it was measured. */
  const grow = (by: number) => {
    scrollHeight += by;
  };

  /** The scroll event the browser queues for a write we made, delivered after the frame's layout. */
  const deliverOurScroll = () => base.dispatchEvent(new Event('scroll'));

  return { el, base, scrollTo, addRow, grow, deliverOurScroll, end: () => scrollHeight - clientHeight };
}

describe('we-scroll-area pin="end"', () => {
  it('follows the end when the reader is already there', async () => {
    const { base, scrollTo, addRow } = await mount({ pin: 'end' });

    // 1000 - 800 - 200 = 0, so squarely at the end.
    scrollTo(800);
    await addRow();

    expect(base.scrollTop).toBe(800);
  });

  it('holds position when the reader has scrolled up', async () => {
    const { base, scrollTo, addRow } = await mount({ pin: 'end' });

    scrollTo(100);
    await addRow();

    // The whole point: somebody re-reading is not yanked to the bottom by an arriving line.
    expect(base.scrollTop).toBe(100);
  });

  it('counts a few pixels short of the bottom as the bottom', async () => {
    const { base, scrollTo, addRow } = await mount({ pin: 'end' });

    // 1000 - 790 - 200 = 10, inside AT_END_PX. Fractional pixels and sub-pixel line heights land
    // here constantly, and an exact comparison would read this as "scrolled away".
    scrollTo(790);
    await addRow();

    expect(base.scrollTop).toBe(800);
  });

  it('re-arms once the reader returns to the end', async () => {
    const { base, scrollTo, addRow } = await mount({ pin: 'end' });

    scrollTo(100);
    await addRow();
    expect(base.scrollTop).toBe(100);

    scrollTo(800);
    await addRow();
    expect(base.scrollTop).toBe(800);
  });

  it('does nothing at all without the prop', async () => {
    const { base, scrollTo, addRow } = await mount({});

    scrollTo(800);
    await addRow();

    // Not opted in, so an ordinary scroll area must keep behaving like one.
    expect(base.scrollTop).toBe(800);
  });

  it('keeps following after a row turns out to be several lines tall', async () => {
    const { base, scrollTo, addRow, grow, deliverOurScroll, end } = await mount({ pin: 'end' });

    scrollTo(800);

    // A row lands and is followed. It then renders its own content — a Lit element's shadow render
    // is a microtask later — and turns out to be four lines rather than one, so the end moves down
    // again after we measured it.
    await addRow();
    expect(base.scrollTop).toBe(800);
    grow(240);

    // Only now does the browser deliver the scroll event our write queued. It reports a position
    // 240px short of an end that has moved since, which is the reading that used to latch the
    // element out of following for good.
    deliverOurScroll();

    await addRow();
    expect(base.scrollTop).toBe(end());
  });

  it('still lets go when the reader scrolls away after that', async () => {
    const { base, scrollTo, addRow, grow, deliverOurScroll } = await mount({ pin: 'end' });

    scrollTo(800);
    await addRow();
    grow(240);
    deliverOurScroll();

    // The guard is "this is the position we wrote", not "ignore everything" — a reader moving
    // anywhere else is still a reader moving.
    scrollTo(300);
    await addRow();
    expect(base.scrollTop).toBe(300);
  });

  it('scrolls to the end the prop asks for, even when the prop is set late', async () => {
    const { el, base } = await mount({});

    // A framework binding `pin` inside an effect can set it after Lit has rendered, so the opening
    // jump has to survive arriving a beat after first paint.
    el.pin = 'end';
    await el.updateComplete;

    expect(base.scrollTop).toBe(800);
  });
});
