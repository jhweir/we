/**
 * `we-textarea`'s `rows`.
 *
 * It was passed to the inner element all along and then overridden in CSS: a hard `min-height` of
 * 80px is about three lines, so any value below the default rendered at three rows and read as the
 * prop being ignored.
 */
import { describe, expect, it } from 'vitest';

import Textarea from './textarea';

describe('rows', () => {
  it('reaches the element that renders them', async () => {
    const el = document.createElement('we-textarea') as HTMLElement & {
      rows: number;
      updateComplete: Promise<unknown>;
    };
    el.rows = 1;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('textarea')?.getAttribute('rows')).toBe('1');
  });

  it('is floored at one control height, not at three rows', () => {
    const sheet = (Textarea.styles as unknown as { cssText: string }[]).map((s) => s.cssText).join('\n');
    const rule = /\[part='textarea'\]\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? '';
    expect(rule).toContain('min-height: var(--we-textarea-control-height');
    expect(rule).not.toContain('min-height: 80px');
  });

  it('takes that floor from its own size rather than always from md', () => {
    /*
      The floor was `--we-component-height-md` at every size, so a small textarea stood a few pixels
      taller than the small input and button beside it — and no call site could fix it, because the
      number came from a different size than the row was built at. Each size names its own, through
      the same expression `we-input` uses.
    */
    const sheet = (Textarea.styles as unknown as { cssText: string }[]).map((s) => s.cssText).join('\n');

    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
      const block = new RegExp(`:host\\(\\[size='${size}'\\]\\)\\s*\\{([^}]*)\\}`).exec(sheet)?.[1] ?? '';
      expect(block, `size ${size}`).toContain(`--we-textarea-control-height: calc(var(--we-component-height-${size})`);
      // The theme's control-height offset travels with it, or a themed row drifts apart again.
      expect(block, `size ${size}`).toContain('--we-theme-control-height-offset');
    }
  });
});

/**
 * Enter as a commit, and why the primitive holds it.
 *
 * A schema can read the event and has nothing that calls `preventDefault`, so the same rule written
 * in a template would send the message *and* leave a stray newline in the box. Only code can hold
 * this — which is the same reason `field` stayed a fragment rather than becoming an operator.
 */
describe('submitOnEnter', () => {
  async function box(props: Partial<{ submitOnEnter: boolean; value: string }> = {}) {
    const el = document.createElement('we-textarea') as HTMLElement & {
      updateComplete: Promise<unknown>;
      submitOnEnter: boolean;
      value: string;
    };
    Object.assign(el, props);
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  }

  const press = (el: HTMLElement, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true, ...init });
    el.shadowRoot?.querySelector('textarea')?.dispatchEvent(event);
    return event;
  };

  it('emits what was typed, and suppresses the newline that would follow', async () => {
    const el = await box({ submitOnEnter: true, value: 'a note' });
    let sent = '';
    el.addEventListener('submit', (e) => (sent = (e as CustomEvent).detail));

    const event = press(el, {});

    expect(sent).toBe('a note');
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves Shift+Enter alone, which is the new line', async () => {
    const el = await box({ submitOnEnter: true, value: 'a note' });
    let sent = false;
    el.addEventListener('submit', () => (sent = true));

    const event = press(el, { shiftKey: true });

    expect(sent).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does not commit an empty box, so no consumer has to remember to check', async () => {
    const el = await box({ submitOnEnter: true, value: '   ' });
    let sent = false;
    el.addEventListener('submit', () => (sent = true));

    press(el, {});

    expect(sent).toBe(false);
  });

  it('leaves a keystroke alone while an input method is composing', async () => {
    /*
      Enter confirms a candidate word mid-composition in Japanese, Chinese and Korean input. Sending
      on it would make the box unusable in those languages — invisible until somebody who needs it
      tries.
    */
    const el = await box({ submitOnEnter: true, value: 'a note' });
    let sent = false;
    el.addEventListener('submit', () => (sent = true));

    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });
    Object.defineProperty(event, 'isComposing', { value: true });
    el.shadowRoot?.querySelector('textarea')?.dispatchEvent(event);

    expect(sent).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('does nothing at all unless asked, so the general path is untouched', async () => {
    // Off by default: a consumer wanting other keys binds onKeyDown and this never fires.
    const el = await box({ value: 'a note' });
    let sent = false;
    el.addEventListener('submit', () => (sent = true));

    const event = press(el, {});

    expect(sent).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });
});
