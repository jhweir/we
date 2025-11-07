import { css, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyles from '../shared/styles';
import { BaseElement } from '../shared/base-element';
import type { DesignSystemProps } from '@we/types';
import { baseCssVars, stateCssVars, mergeDesignSystemProps } from '../shared/helpers';

const defaults: Partial<DesignSystemProps> = {
  bg: 'primary-100',
  color: 'primary-800',
  r: 'md',
  px: '400',
  py: '200',
  ax: 'center',
  ay: 'center',
  gap: '300',
};

const cssStyles = css`
  :host {
    display: flex;
    white-space: nowrap;
  }

  button,
  a {
    all: unset;
    display: flex;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s,
      outline 0.2s,
      padding 0.2s;
    ${unsafeCSS(baseCssVars())}
  }

  button:disabled,
  a[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button:hover:not(:disabled),
  a:hover:not([aria-disabled='true']) {
    ${unsafeCSS(stateCssVars('hover'))}
  }
`;

@customElement('we-button')
export default class Button extends BaseElement implements DesignSystemProps {
  static styles = [sharedStyles, cssStyles];

  // Button-specific props
  @property({ type: String }) text?: string;
  @property({ type: String }) href?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ attribute: false }) onClick: (event: MouseEvent) => void = () => {};

  // Design system props
  @property({ type: String }) bg?: DesignSystemProps['bg'];
  @property({ type: String }) color?: DesignSystemProps['color'];
  @property({ type: String }) direction?: DesignSystemProps['direction'];
  @property({ type: String }) ax?: DesignSystemProps['ax'];
  @property({ type: String }) ay?: DesignSystemProps['ay'];
  @property({ type: Boolean }) wrap?: DesignSystemProps['wrap'];
  @property({ type: String }) gap?: DesignSystemProps['gap'];
  @property({ type: String }) m?: DesignSystemProps['m'];
  @property({ type: String }) ml?: DesignSystemProps['ml'];
  @property({ type: String }) mr?: DesignSystemProps['mr'];
  @property({ type: String }) mt?: DesignSystemProps['mt'];
  @property({ type: String }) mb?: DesignSystemProps['mb'];
  @property({ type: String }) mx?: DesignSystemProps['mx'];
  @property({ type: String }) my?: DesignSystemProps['my'];
  @property({ type: String }) p?: DesignSystemProps['p'];
  @property({ type: String }) pl?: DesignSystemProps['pl'];
  @property({ type: String }) pr?: DesignSystemProps['pr'];
  @property({ type: String }) pt?: DesignSystemProps['pt'];
  @property({ type: String }) pb?: DesignSystemProps['pb'];
  @property({ type: String }) px?: DesignSystemProps['px'];
  @property({ type: String }) py?: DesignSystemProps['py'];
  @property({ type: String }) r?: DesignSystemProps['r'];
  @property({ type: String }) rt?: DesignSystemProps['rt'];
  @property({ type: String }) rb?: DesignSystemProps['rb'];
  @property({ type: String }) rl?: DesignSystemProps['rl'];
  @property({ type: String }) rr?: DesignSystemProps['rr'];
  @property({ type: String }) rtl?: DesignSystemProps['rtl'];
  @property({ type: String }) rtr?: DesignSystemProps['rtr'];
  @property({ type: String }) rbr?: DesignSystemProps['rbr'];
  @property({ type: String }) rbl?: DesignSystemProps['rbl'];
  @property({ type: Object }) hover?: DesignSystemProps['hover'];
  @property({ type: Object }) active?: DesignSystemProps['active'];
  @property({ type: Object }) styles?: DesignSystemProps['styles'];

  getDesignSystemProps(): DesignSystemProps {
    return mergeDesignSystemProps(this, defaults);
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
      ${this.loading ? html`<we-spinner size="sm"></we-spinner>` : null}
      <slot name="start"></slot>
      ${this.text ? this.text : html`<slot></slot>`}
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
