import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import sharedStyles from '../shared/styles';

const styles = css`
  :host {
    --we-tab-bg: transparent;
    --we-tab-color: var(--we-color-ui-700);
    --we-tab-radius: var(--we-space-200) var(--we-space-200) 0 0;
    --we-tab-padding: var(--we-space-300) var(--we-space-500);
    --we-tab-font-weight: 400;
    --we-tab-hover-bg: var(--we-color-ui-100);
    --we-tab-hover-color: var(--we-color-primary-700);
    --we-tab-selected-bg: var(--we-color-primary-50);
    --we-tab-selected-color: var(--we-color-primary-600);
    --we-tab-selected-font-weight: 600;
    display: block;
    height: auto;
  }
  button {
    width: auto;
    height: auto;
    background: var(--we-tab-bg);
    color: var(--we-tab-color);
    border: none;
    outline: none;
    cursor: pointer;
    padding: var(--we-tab-padding);
    border-radius: var(--we-tab-radius);
    font: inherit;
    font-weight: var(--we-tab-font-weight);
    transition:
      background 0.2s,
      color 0.2s;
    position: relative;
  }
  button[selected] {
    background: var(--we-tab-selected-bg);
    color: var(--we-tab-selected-color);
    font-weight: var(--we-tab-selected-font-weight);
  }
  button:hover:not([selected]) {
    background: var(--we-tab-hover-bg);
    color: var(--we-tab-hover-color);
  }
  :host([fill]) {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
  }
  :host([fill]) button {
    width: 100%;
    height: 100%;
  }
`;

@customElement('we-tab')
export class Tab extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) value = '';
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) fill = false;
  @property({ type: Object }) selectedProps?: Record<string, string>;
  @property({ type: Object }) hoverProps?: Record<string, string>;
  @property({ type: String }) label?: string;
  @property({ type: Object }) onClick?: any;

  @state() private _hover = false;

  updated() {
    // Apply selected state props
    if (this.selected && this.selectedProps) {
      Object.entries(this.selectedProps).forEach(([key, value]) => {
        this.style.setProperty(`--we-tab-selected-${key}`, value);
      });
    }
    // Apply hover state props
    if (this._hover && this.hoverProps) {
      Object.entries(this.hoverProps).forEach(([key, value]) => {
        this.style.setProperty(`--we-tab-hover-${key}`, value);
      });
    }
  }

  private handleClick(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent('tab-select', { detail: { value: this.value }, bubbles: true, composed: true }));
    if (this.onClick) {
      // If onClick is a function, call it; if it's an action object, dispatch it as needed
      if (typeof this.onClick === 'function') {
        this.onClick(e);
      }
      // Optionally: handle schema action objects here if needed
    }
  }

  private handleMouseEnter() {
    this._hover = true;
    this.requestUpdate();
  }

  private handleMouseLeave() {
    this._hover = false;
    this.requestUpdate();
  }

  render() {
    return html`
      <button
        role="tab"
        ?selected=${this.selected}
        aria-selected=${this.selected}
        @click=${this.handleClick}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
      >
        ${this.label ? this.label : html`<slot></slot>`}
      </button>
    `;
  }
}

export default Tab;
