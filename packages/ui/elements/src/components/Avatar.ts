import { toSvg } from 'jdenticon';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import sharedStyles, { NamedSize } from '../shared';

const styles = css`
  :host {
    display: contents;
    --we-avatar-size: var(--we-size-md);
    --we-avatar-box-shadow: none;
    --we-avatar-border: none;
    --we-avatar-color: var(--we-color-black);
    --we-avatar-bg: var(--we-color-ui-100);
  }
  :host([src]) {
    --we-avatar-bg: transparent;
  }
  :host([selected]) {
    --we-avatar-box-shadow: 0px 0px 0px 2px var(--we-color-primary-500);
  }
  :host([online]) [part='base']:before {
    position: absolute;
    right: 0;
    bottom: 0;
    content: '';
    display: block;
    width: 25%;
    height: 25%;
    border-radius: 50%;
    background: var(--we-color-primary-500);
  }
  :host([size='xxs']) {
    --we-avatar-size: var(--we-size-xxs);
  }
  :host([size='xs']) {
    --we-avatar-size: var(--we-size-xs);
  }
  :host([size='sm']) {
    --we-avatar-size: var(--we-size-sm);
  }
  :host([size='lg']) {
    --we-avatar-size: var(--we-size-lg);
  }
  :host([size='xl']) {
    --we-avatar-size: var(--we-size-xl);
  }
  :host([size='xxl']) {
    --we-avatar-size: var(--we-size-xxl);
  }
  [part='base'] {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: inherit;
    box-shadow: var(--we-avatar-box-shadow);
    color: var(--we-avatar-color);
    background: var(--we-avatar-bg);
    border: var(--we-avatar-border);
    padding: 0;
    width: var(--we-avatar-size);
    height: var(--we-avatar-size);
    border-radius: 50%;
  }

  svg {
    width: calc(var(--we-avatar-size) - 30%);
    height: calc(var(--we-avatar-size) - 30%);
  }

  [part='icon'] {
    --we-icon-size: calc(var(--we-avatar-size) * 0.6);
  }

  [part='img'] {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  [part='initials'] {
    font-weight: 600;
    text-transform: uppercase;
  }
`;

@customElement('we-avatar')
export default class Component extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) image = '';
  @property({ type: String, reflect: true }) hash = '';
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) online = false;
  @property({ type: String, reflect: true }) initials = '';
  @property({ type: String }) icon = '';
  @property({ type: String, reflect: true }) size: NamedSize = '';
  @property({ attribute: false }) onClick: undefined | (() => void) = undefined;

  private renderContent() {
    return this.image
      ? html`<img part="img" .src=${this.image} />`
      : this.hash
        ? unsafeSVG(toSvg(this.hash || '', 100))
        : this.initials
          ? html`<span part="initials">${this.initials}</span>`
          : html`<we-icon part="icon" name=${this.icon || 'user'}></we-icon>`;
  }

  render() {
    return this.onClick
      ? html` <button part="base" @click=${this.onClick}>${this.renderContent()}</button> `
      : html` <div part="base">${this.renderContent()}</div> `;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-avatar': {
        image?: string;
        hash?: string;
        initials?: string;
        icon?: string;
        selected?: boolean;
        online?: boolean;
        size?: NamedSize;
        style?: any;
        children?: any;
        onClick?: (event: MouseEvent) => void;
      };
    }
  }
}
