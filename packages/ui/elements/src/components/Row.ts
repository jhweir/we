import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../shared';

const styles = css`
  :host {
    display: flex;
  }
  :host([alignX='center']) {
    justify-content: center;
  }
  :host([alignX='end']) {
    justify-content: flex-end;
  }
  :host([alignX='between']) {
    justify-content: space-between;
  }
  :host([alignX='around']) {
    justify-content: space-around;
  }
  :host([alignY='center']) {
    align-items: center;
  }
  :host([alignY='end']) {
    align-items: flex-end;
  }
`;

type AlignX = '' | 'center' | 'end' | 'between' | 'around';
type AlignY = '' | 'center' | 'end';

@customElement('we-row')
export default class Row extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) alignX: AlignX = '';
  @property({ type: String, reflect: true }) alignY: AlignY = '';
  @property({ type: String, reflect: true }) class: string = '';
  @property({ type: Object, reflect: true }) style: any;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-row': {
        alignX?: AlignX;
        alignY?: AlignY;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
