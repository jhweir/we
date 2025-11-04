import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyles from '../shared/styles';
import { BaseElement } from '../shared/base-element';
import type { DesignSystemProps } from '@we/types';

const cssStyles = css`
  :host {
    display: inline-block;
  }

  button,
  a {
    all: unset;
    background: var(--we-bg, var(--we-color-white));
    color: var(--we-color, var(--we-color-primary-600));
    border-radius: var(--we-radius, 4px);
    padding: var(--we-padding, 0.5rem 1rem);
    gap: var(--we-gap, 0.5rem);
    display: inline-flex;
    align-items: center;
    justify-content: var(--we-ax, center);
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      outline 0.2s,
      padding 0.2s;
  }

  button:disabled,
  a[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:hover:not(:disabled),
  a:hover:not([aria-disabled='true']) {
    background: var(--we-hover-bg, var(--we-bg));
    color: var(--we-hover-color, var(--we-color));
    gap: var(--we-hover-gap, var(--we-gap, 0.5rem));
    justify-content: var(--we-hover-ax, var(--we-ax, center));
    align-items: var(--we-hover-ay, var(--we-ay, center));
    flex-wrap: var(--we-hover-wrap, var(--we-wrap, nowrap));
    flex-direction: var(--we-hover-direction, var(--we-direction, row));
    padding: var(--we-hover-padding, var(--we-padding, 0.5rem 1rem));
    margin: var(--we-hover-margin, var(--we-margin));
    border-radius: var(--we-hover-radius, var(--we-radius));
  }
`;

@customElement('we-button')
export default class Button extends BaseElement implements DesignSystemProps {
  static styles = [sharedStyles, cssStyles];

  // Button-specific props
  @property({ type: String }) href?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Object }) styles?: Record<string, any>;
  @property({ attribute: false }) onClick: (event: MouseEvent) => void = () => {};

  // Design system props (all from DesignSystemProps)
  @property({ type: String }) ax?: DesignSystemProps['ax'];
  @property({ type: String }) ay?: DesignSystemProps['ay'];
  @property({ type: Boolean }) wrap?: DesignSystemProps['wrap'];
  @property({ type: Boolean }) reverse?: DesignSystemProps['reverse'];
  @property({ type: String }) gap?: DesignSystemProps['gap'];

  @property({ type: String }) p?: DesignSystemProps['p'];
  @property({ type: String }) pl?: DesignSystemProps['pl'];
  @property({ type: String }) pr?: DesignSystemProps['pr'];
  @property({ type: String }) pt?: DesignSystemProps['pt'];
  @property({ type: String }) pb?: DesignSystemProps['pb'];
  @property({ type: String }) px?: DesignSystemProps['px'];
  @property({ type: String }) py?: DesignSystemProps['py'];

  @property({ type: String }) m?: DesignSystemProps['m'];
  @property({ type: String }) ml?: DesignSystemProps['ml'];
  @property({ type: String }) mr?: DesignSystemProps['mr'];
  @property({ type: String }) mt?: DesignSystemProps['mt'];
  @property({ type: String }) mb?: DesignSystemProps['mb'];
  @property({ type: String }) mx?: DesignSystemProps['mx'];
  @property({ type: String }) my?: DesignSystemProps['my'];

  @property({ type: String }) r?: DesignSystemProps['r'];
  @property({ type: String }) rt?: DesignSystemProps['rt'];
  @property({ type: String }) rb?: DesignSystemProps['rb'];
  @property({ type: String }) rl?: DesignSystemProps['rl'];
  @property({ type: String }) rr?: DesignSystemProps['rr'];
  @property({ type: String }) rtl?: DesignSystemProps['rtl'];
  @property({ type: String }) rtr?: DesignSystemProps['rtr'];
  @property({ type: String }) rbr?: DesignSystemProps['rbr'];
  @property({ type: String }) rbl?: DesignSystemProps['rbl'];

  @property({ type: String }) bg?: DesignSystemProps['bg'];
  @property({ type: String }) color?: DesignSystemProps['color'];
  @property({ type: Object }) hover?: DesignSystemProps['hover'];

  private handleClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.dispatchEvent(new CustomEvent('button-click', { detail: event }));
  }

  renderContent() {
    return html`
      ${this.loading ? html`<we-spinner size="sm"></we-spinner>` : null}
      <slot name="start"></slot>
      <slot></slot>
      <slot name="end"></slot>
    `;
  }

  render() {
    const inlineStyles = this.styles || {};
    if (this.href) {
      return html`
        <a
          href=${this.href}
          aria-disabled=${this.disabled || this.loading ? 'true' : 'false'}
          @click=${this.handleClick}
          part="base"
          style=${styleMap(inlineStyles)}
        >
          ${this.renderContent()}
        </a>
      `;
    }
    return html`
      <button
        ?disabled=${this.disabled || this.loading}
        @click=${this.handleClick}
        part="base"
        style=${styleMap(inlineStyles)}
      >
        ${this.renderContent()}
      </button>
    `;
  }
}
