import { createPopper } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import sharedStyles from '../styles/shared';
import { Placement, TooltipStrategy } from '../types';

const styles = css`
  :host {
    position: relative;
    display: inline-block;
  }
  [part='trigger'] {
    display: inline-block;
  }
  [part='tooltip'] {
    display: none;
    position: absolute;
    z-index: 999;
    white-space: nowrap;
    font-size: var(--we-font-size-400, 14px);
    font-weight: 500;
    padding: var(--we-space-300, 8px) var(--we-space-300, 8px);
    background: #222;
    color: white;
    border-radius: var(--we-border-radius, 4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
  }
  :host([open]) [part='tooltip'] {
    display: block;
    pointer-events: auto;
  }
  [part='arrow'],
  [part='arrow']::before {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
  }
  [part='arrow'] {
    visibility: hidden;
  }
  [part='arrow']::before {
    visibility: visible;
    content: '';
    transform: rotate(45deg);
  }
  [part='tooltip'][data-popper-placement^='top'] > [part='arrow'] {
    bottom: -4px;
  }
  [part='tooltip'][data-popper-placement^='bottom'] > [part='arrow'] {
    top: -4px;
  }
  [part='tooltip'][data-popper-placement^='left'] > [part='arrow'] {
    right: -4px;
  }
  [part='tooltip'][data-popper-placement^='right'] > [part='arrow'] {
    left: -4px;
  }
`;

@customElement('we-tooltip')
export default class Tooltip extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, reflect: true }) title = '';
  @property({ type: String, reflect: true }) placement: Placement = 'top';
  @property({ type: String, reflect: true }) strategy: TooltipStrategy = 'absolute';

  @state() private popperInstance: ReturnType<typeof createPopper> | null = null;

  get tooltipEl() {
    return this.renderRoot.querySelector("[part='tooltip']") as HTMLElement | null;
  }

  get triggerEl() {
    return this.renderRoot.querySelector("[part='trigger']") as HTMLElement | null;
  }

  firstUpdated() {
    this.createPopperInstance();
    this.addEventListener('mouseenter', this.show);
    this.addEventListener('mouseleave', this.hide);
    this.addEventListener('focusin', this.show);
    this.addEventListener('focusout', this.hide);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyPopperInstance();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open) {
        this.createPopperInstance();
        this.popperInstance?.setOptions({ placement: this.placement });
        this.popperInstance?.update();
      } else {
        this.destroyPopperInstance();
      }
      this.dispatchEvent(new CustomEvent('toggle', { bubbles: true }));
    }
    if (changed.has('placement') && this.popperInstance) {
      this.popperInstance.setOptions({ placement: this.placement });
      this.popperInstance.update();
    }
  }

  private createPopperInstance() {
    if (this.triggerEl && this.tooltipEl && !this.popperInstance) {
      this.popperInstance = createPopper(this.triggerEl, this.tooltipEl, {
        placement: this.placement,
        strategy: this.strategy,
        modifiers: [
          { name: 'offset', options: { offset: [0, 10] } },
          { name: 'arrow', options: { element: this.tooltipEl.querySelector('[part="arrow"]') } },
        ],
      });
    }
  }

  private destroyPopperInstance() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
  }

  private show = () => {
    this.open = true;
  };
  private hide = () => {
    this.open = false;
  };

  render() {
    return html`
      <span part="trigger"><slot></slot></span>
      <span part="tooltip" data-popper-placement=${this.placement}>
        ${this.title}
        <span part="arrow" data-popper-arrow></span>
      </span>
    `;
  }
}
