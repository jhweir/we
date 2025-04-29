import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../styles/shared';
import { ModalSize } from '../types';

const styles = css`
  :host {
    --we-modal-backdrop-bg-color: rgba(0, 0, 0, 0.1);
    --we-modal-backdrop-transition: all var(--we-transition-300) cubic-bezier(0.785, 0.135, 0.15, 0.86);
    --we-modal-transition: all var(--we-transition-400) cubic-bezier(0.785, 0.135, 0.15, 0.86);
    --we-modal-box-shadow: none;
    --we-modal-width: clamp(600px, 50vw, 800px);
    --we-modal-width-mobile: 95vw;
    --we-modal-height: auto;
    --we-modal-padding: var(--we-space-400);
    --we-modal-border: 1px solid transparent;
    --we-modal-translateY: 100%;
    --we-modal-translateX: 0px;
    --we-modal-justify: center;
    --we-modal-align: flex-end;
    --we-modal-max-height: 90vh;
  }

  :host([size='xs']) {
    --we-modal-width-mobile: 95vw;
    --we-modal-width: clamp(350px, 30vw, 500px);
  }

  :host([size='sm']) {
    --we-modal-width-mobile: 95vw;
    --we-modal-width: clamp(350px, 40vw, 600px);
  }

  :host([size='lg']) {
    --we-modal-width-mobile: 95vw;
    --we-modal-width: clamp(350px, 50vw, 1000px);
  }

  :host([size='xl']) {
    --we-modal-width-mobile: 95vw;
    --we-modal-width: clamp(350px, 60vw, 1200px);
  }

  :host([size='fullscreen']) {
    --we-modal-width-mobile: 100vw;
    --we-modal-width: 100vw;
    --we-modal-height: 100vh;
    --we-modal-max-height: 100vh;
  }

  :host {
    width: 100vw;
    height: 100vh;
    z-index: 999999;
    position: fixed;
    left: 0;
    top: 0;
    display: flex;
    align-items: var(--we-modal-align);
    justify-content: var(--we-modal-justify);
    padding-bottom: var(--we-space-400);
  }

  [part='modal'] {
    transition: all var(--we-transition-300) ease;
    transform: scale(0.95);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 999;
    border-radius: var(--we-border-radius);
    width: var(--we-modal-width-mobile);
    height: var(--we-modal-height);
    max-height: var(--we-modal-max-height);
    background: var(--we-color-white);
    border: 1px solid var(--we-border-color);
  }

  @media screen and (min-width: 1000px) {
    :host {
      --we-modal-align: center;
    }
    [part='modal'] {
      width: var(--we-modal-width);
    }
  }

  [part='content'] {
    flex: 1;
    overflow-y: auto;
  }

  [part='close-button'] {
    cursor: pointer;
    padding: 0;
    background: none;
    border: 0;
    width: 15px;
    height: 15px;
    color: var(--we-color-black);
    fill: currentColor;
    position: absolute;
    right: var(--we-space-600);
    top: var(--we-space-600);
  }

  [part='close-icon'] {
    width: 15px;
    height: 15px;
  }

  [part='backdrop'] {
    opacity: 1;
    transition: opacity var(--we-transition-300) cubic-bezier(0.785, 0.135, 0.15, 0.86);
    overflow: visible;
    z-index: 400;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
  }
`;

@customElement('we-modal')
export default class Modal extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) size: ModalSize = '';
  @property({ attribute: false }) close: () => void = () => {};

  render() {
    return html`
      <div part="base">
        <div part="backdrop" @click=${this.close}></div>
        <div part="modal">
          <button @click=${this.close} part="close-button">
            <svg part="close-icon" viewBox="0 0 329.26933 329" xmlns="http://www.w3.org/2000/svg">
              <path
                d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0"
              />
            </svg>
          </button>
          <slot name="header" part="header"></slot>
          <div part="content"><slot></slot></div>
          <slot name="footer" part="footer"></slot>
        </div>
      </div>
    `;
  }
}
