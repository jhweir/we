import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../styles/shared';

const styles = css`
  :host {
    --we-button-bg: var(--we-color-white);
    --we-button-color: var(--we-color-primary-600);
    --we-button-radius: 4px;
    --we-button-padding: 0.5rem 1rem;
    --we-button-gap: 0.5rem;
    --we-button-width: auto;
    --we-button-height: auto;
    display: inline-block;
  }

  button,
  a {
    all: unset;
    width: var(--we-button-width);
    height: var(--we-button-height);
    background: var(--we-button-bg);
    color: var(--we-button-color);
    border-radius: var(--we-button-radius);
    padding: var(--we-button-padding);
    gap: var(--we-button-gap);
    display: inline-flex;
    align-items: center;
    justify-content: var(--we-button-ax, center);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      outline 0.2s;
  }

  button:disabled,
  a[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:hover:not(:disabled),
  a:hover:not([aria-disabled='true']) {
    background: var(--we-button-hover-bg, var(--we-button-bg));
    color: var(--we-button-hover-color, var(--we-button-color));
  }
`;

type HoverStyle = Record<string, string | undefined>;

// Helper to resolve token var or fallback to 0
function tokenVar(prefix: string, token?: string) {
  return token ? `var(--we-${prefix}-${token})` : '0';
}

// Helper to resolve color tokens for bg and color
function colorVar(token?: string) {
  return token ? `var(--we-color-${token})` : '';
}

@customElement('we-button')
export default class Button extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String }) href?: string = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;

  // Prop-driven API
  @property({ type: String }) p?: string;
  @property({ type: String }) px?: string;
  @property({ type: String }) py?: string;
  @property({ type: String }) pt?: string;
  @property({ type: String }) pb?: string;
  @property({ type: String }) pl?: string;
  @property({ type: String }) pr?: string;
  @property({ type: String }) gap?: string;
  @property({ type: String }) r?: string;
  @property({ type: String }) ax?: string;
  @property({ type: Object }) hover?: HoverStyle;
  @property({ type: String }) bg?: string;
  @property({ type: String }) color?: string;

  updated() {
    // Padding logic using the Column pattern
    const padding = [
      tokenVar('space', this.pt || this.py || this.p),
      tokenVar('space', this.pr || this.px || this.p),
      tokenVar('space', this.pb || this.py || this.p),
      tokenVar('space', this.pl || this.px || this.p),
    ].join(' ');
    this.style.setProperty('--we-button-padding', padding);

    // Gap
    if (this.gap) this.style.setProperty('--we-button-gap', `var(--we-space-${this.gap || '300'})`);

    // Border radius
    if (this.r) this.style.setProperty('--we-button-radius', this.r);

    // Alignment
    if (this.ax) this.style.setProperty('--we-button-ax', this.ax);

    // Background
    if (this.bg) this.style.setProperty('--we-button-bg', colorVar(this.bg));

    // Color
    if (this.color) this.style.setProperty('--we-button-color', colorVar(this.color));

    // Hover styles (dynamic)
    if (this.hover && typeof this.hover === 'object') {
      Object.entries(this.hover).forEach(([key, value]) => {
        if (value !== undefined) {
          // Resolve color tokens for bg and color
          if (key === 'bg' || key === 'color') {
            this.style.setProperty(`--we-button-hover-${key}`, colorVar(value));
          } else if (key === 'gap') {
            this.style.setProperty(`--we-button-hover-gap`, `var(--we-space-${value})`);
          } else {
            this.style.setProperty(`--we-button-hover-${key}`, value);
          }
        }
      });
    }

    // Sizing
    this.style.setProperty('--we-button-width', this.style.width || 'auto');
    this.style.setProperty('--we-button-height', this.style.height || 'auto');
  }

  private handleClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.dispatchEvent(new CustomEvent('button-click', { detail: event }));
  }

  renderContent() {
    return html`
      <slot name="start"></slot>
      <slot></slot>
      <slot name="end"></slot>
    `;
  }

  render() {
    if (this.href) {
      return html`
        <a
          href=${this.href}
          aria-disabled=${this.disabled || this.loading ? 'true' : 'false'}
          @click=${this.handleClick}
          part="base"
        >
          ${this.renderContent()}
        </a>
      `;
    }
    return html`
      <button ?disabled=${this.disabled || this.loading} @click=${this.handleClick} part="base">
        ${this.renderContent()}
      </button>
    `;
  }
}
