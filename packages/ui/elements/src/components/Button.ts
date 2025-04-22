import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../shared';
import './Spinner';

const styles = css`
  :host {
    --we-button-opacity: 1;
    --we-button-text-decoration: none;
    --we-button-depth: none;
    --we-button-display: inline-flex;
    --we-button-width: initial;
    /* --we-button-padding: 0 var(--we-space-400); */
    --we-button-bg: var(--we-color-white);
    --we-button-border: 1px solid var(--we-color-primary-600);
    --we-button-color: var(--we-color-primary-600);
    /* --we-button-height: var(--we-size-md); */
    --we-button-border-radius: var(--we-border-radius);
    /* --we-button-font-size: var(--we-font-size-500); */
  }

  [part='base'] {
    opacity: var(--we-button-opacity);
    text-decoration: var(--we-button-text-decoration);
    transition: box-shadow var(--we-transition-300) ease;
    cursor: pointer;
    border: 0;
    gap: var(--we-space-400);
    align-items: center;
    justify-content: center;
    box-shadow: var(--we-button-depth);
    display: var(--we-button-display);
    width: var(--we-button-width);
    padding: var(--we-button-padding);
    height: var(--we-button-height);
    border-radius: var(--we-button-border-radius);
    background: var(--we-button-bg);
    color: var(--we-button-color);
    fill: var(--we-button-color);
    font-size: var(--we-button-font-size);
    font-family: inherit;
    font-weight: 600;
    border: var(--we-button-border);
    position: relative;
    white-space: nowrap;
  }

  :host([disabled]) [part='base'] {
    --we-button-opacity: 0.5;
    cursor: default;
  }

  we-spinner {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  :host([loading]) we-spinner {
    display: block;
    --we-spinner-size: calc(var(--we-button-height) / 2);
    --we-spinner-color: var(--we-button-color);
  }

  :host([loading]) [part='base'] slot {
    visibility: hidden;
    opacity: 0;
  }

  :host([variant='primary']) {
    --we-button-bg: var(--we-color-primary-600);
    --we-button-color: var(--we-color-white);
    --we-button-border: 1px solid transparent;
  }

  :host([variant='primary']:hover) {
    --we-button-bg: var(--we-color-primary-700);
    cursor: pointer;
  }

  :host([variant='link']) {
    --we-button-color: var(--we-color-primary-700);
    --we-button-bg: transparent;
    --we-button-border: 1px solid transparent;
  }

  :host([variant='link']:hover) {
    --we-button-bg: transparent;
    --we-button-text-decoration: underline;
    --we-button-color: var(--we-color-primary-600);
  }

  :host([variant='subtle']) {
    --we-button-bg: rgb(0 0 0 / 10%);
    --we-button-color: var(--we-color-ui-800);
    --we-button-border: 1px solid transparent;
  }

  :host([variant='subtle']:hover) {
    --we-button-color: var(--we-color-black);
    --we-button-bg: rgb(0 0 0 / 15%);
  }

  :host([variant='ghost']) {
    --we-button-opacity: 0.5;
    --we-button-bg: transparent;
    --we-button-color: currentColor;
    --we-button-border: 1px solid transparent;
  }

  :host([variant='ghost']:hover) {
    --we-button-opacity: 1;
  }

  :host([variant='danger']) {
    --we-button-bg: var(--we-color-danger-200);
    --we-button-color: currentColor;
    --we-button-border: 1px solid transparent;
  }

  :host([variant='danger']:hover) {
    --we-button-opacity: 1;
  }

  :host([size='xs']) {
    --we-button-font-size: var(--we-font-size-400);
    --we-button-padding: 0 var(--we-space-200);
    --we-button-height: var(--we-size-xs);
  }

  :host([size='sm']) {
    --we-button-font-size: var(--we-font-size-400);
    --we-button-padding: 0 var(--we-space-300);
    --we-button-height: var(--we-size-sm);
  }

  :host([size='md']) {
    --we-button-font-size: var(--we-font-size-500);
    --we-button-padding: 0 var(--we-space-400);
    --we-button-height: var(--we-size-md);
  }

  :host([size='lg']) {
    --we-button-font-size: var(--we-font-size-500);
    --we-button-height: var(--we-size-lg);
    --we-button-padding: 0 var(--we-space-600);
  }

  :host([size='xl']) {
    --we-button-font-size: var(--we-font-size-600);
    --we-button-height: var(--we-size-xl);
    --we-button-padding: 0 var(--we-space-600);
  }

  :host([full]) {
    --we-button-display: flex;
    --we-button-width: 100%;
  }

  :host([square]) {
    --we-button-padding: 0;
    --we-button-width: var(--we-button-height);
  }

  :host([circle]) {
    --we-button-width: var(--we-button-height);
    --we-button-border-radius: 50%;
  }
`;

type Variant = 'default' | 'primary' | 'link' | 'subtle' | 'transparent' | 'ghost';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@customElement('we-button')
export default class Button extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) variant?: Variant = 'default';
  @property({ type: String, reflect: true }) size?: Size = 'md';
  @property({ type: String, reflect: true }) href?: string = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean, reflect: true }) square = false;
  @property({ type: Boolean, reflect: true }) full = false;
  @property({ type: Boolean, reflect: true }) circle = false;

  onClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  render() {
    return this.href
      ? html`
          <a .href=${this.href} @click=${this.onClick} target="_blank" part="base">
            <we-spinner></we-spinner>
            <slot name="start"></slot>
            <slot></slot>
            <slot name="end"></slot>
          </a>
        `
      : html`
          <button ?disabled=${this.disabled || this.loading} @click=${this.onClick} part="base">
            <we-spinner></we-spinner>
            <slot name="start"></slot>
            <slot></slot>
            <slot name="end"></slot>
          </button>
        `;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-button': {
        variant?: Variant;
        size?: Size;
        href?: string;
        disabled?: boolean;
        loading?: boolean;
        square?: boolean;
        full?: boolean;
        circle?: boolean;
        slot?: string;
        class?: string;
        style?: any;
        children?: any;
        onClick?: (event: MouseEvent) => void;
      };
    }
  }
}
