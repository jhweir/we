import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../shared';

const styles = css`
  :host {
    display: contents;
    --we-spinner-size: var(--we-size-md);
    --we-spinner-stroke: 2px;
    --we-spinner-color: var(--we-color-primary-500);
  }

  :host([size='xxs']) {
    --we-spinner-size: var(--we-size-xxs);
    --we-spinner-stroke: 1px;
    --we-spinner-color: var(--we-color-primary-500);
  }

  :host([size='xs']) {
    --we-spinner-size: var(--we-size-xs);
    --we-spinner-stroke: 2px;
    --we-spinner-color: var(--we-color-primary-500);
  }

  :host([size='sm']) {
    --we-spinner-size: var(--we-size-sm);
    --we-spinner-stroke: 2px;
    --we-spinner-color: var(--we-color-primary-500);
  }

  :host([size='lg']) {
    --we-spinner-size: var(--we-size-lg);
    --we-spinner-stroke: 4px;
    --we-spinner-color: var(--we-color-primary-500);
  }

  .lds-ring {
    display: inline-block;
    position: relative;
    width: var(--we-spinner-size);
    height: var(--we-spinner-size);
  }

  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: var(--we-spinner-size);
    height: var(--we-spinner-size);
    margin: var(--we-spinner-stroke);
    border: var(--we-spinner-stroke) solid var(--we-spinner-color);
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: var(--we-spinner-color) transparent transparent transparent;
  }

  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }

  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }

  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

@customElement('we-spinner')
export default class Component extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) size: '' | 'sm' | 'lg' = '';

  render() {
    return html`<div class="lds-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>`;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-spinner': { size?: '' | 'sm' | 'lg' };
    }
  }
}
