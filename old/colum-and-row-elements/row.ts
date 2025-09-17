import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles, { AlignPosition, AlignPositionAndSpacing } from '../styles/shared';
import { SizeToken, SpaceToken } from '../types';

const styles = css`
  :host {
    --direction: row;
    --wrap: nowrap;
    --gap: none;
    --padding: 0px;
    --margin: 0px;
    --border-radius: none;
    --bg-color: none;
    --color: inherit;
    display: flex;
    flex-direction: var(--direction);
    flex-wrap: var(--wrap);
    gap: var(--gap);
    padding: var(--padding);
    margin: var(--margin);
    border-radius: var(--border-radius);
    background-color: var(--bg-color);
    color: var(--color);
  }
  :host([ax='center']) {
    justify-content: center;
  }
  :host([ax='end']) {
    justify-content: flex-end;
  }
  :host([ax='between']) {
    justify-content: space-between;
  }
  :host([ax='around']) {
    justify-content: space-around;
  }
  :host([ay='center']) {
    align-items: center;
  }
  :host([ay='end']) {
    align-items: flex-end;
  }
  :host([wrap]) {
    --wrap: wrap;
  }
  :host([reverse]) {
    --direction: row-reverse;
  }
`;

@customElement('we-row')
export default class Row extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) ax: AlignPositionAndSpacing = '';
  @property({ type: String, reflect: true }) ay: AlignPosition = '';
  @property({ type: Boolean, reflect: true }) wrap = false;
  @property({ type: Boolean, reflect: true }) reverse = false;
  @property({ type: String, reflect: true }) radius?: SizeToken;
  @property({ type: String, reflect: true }) gap?: SpaceToken;
  @property({ type: String, reflect: true }) p?: SpaceToken;
  @property({ type: String, reflect: true }) pl?: SpaceToken;
  @property({ type: String, reflect: true }) pr?: SpaceToken;
  @property({ type: String, reflect: true }) pt?: SpaceToken;
  @property({ type: String, reflect: true }) pb?: SpaceToken;
  @property({ type: String, reflect: true }) px?: SpaceToken;
  @property({ type: String, reflect: true }) py?: SpaceToken;
  @property({ type: String, reflect: true }) m?: SpaceToken;
  @property({ type: String, reflect: true }) ml?: SpaceToken;
  @property({ type: String, reflect: true }) mr?: SpaceToken;
  @property({ type: String, reflect: true }) mt?: SpaceToken;
  @property({ type: String, reflect: true }) mb?: SpaceToken;
  @property({ type: String, reflect: true }) mx?: SpaceToken;
  @property({ type: String, reflect: true }) my?: SpaceToken;
  @property({ type: String, reflect: true }) bg = '';
  @property({ type: String, reflect: true }) color = '';

  updated(props: Map<string, any>) {
    super.updated(props);

    // handle dynamic props
    if (props.has('gap')) this.style.setProperty('--gap', `var(--we-space-${this.gap})`);
    if (props.has('radius')) this.style.setProperty('--border-radius', `var(--we-border-radius-${this.radius})`);
    if (props.has('bg')) this.style.setProperty('--bg-color', `var(--we-color-${this.bg})`);
    if (props.has('color')) this.style.setProperty('--color', `var(--we-color-${this.color})`);
    if (['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'].some((prop) => props.has(prop))) {
      this.style.setProperty(
        '--padding',
        [
          generateVariable('we-space', this.pt || this.py || this.p),
          generateVariable('we-space', this.pr || this.px || this.p),
          generateVariable('we-space', this.pb || this.py || this.p),
          generateVariable('we-space', this.pl || this.px || this.p),
        ].join(' '),
      );
    }
    if (['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'].some((prop) => props.has(prop))) {
      this.style.setProperty(
        '--margin',
        [
          generateVariable('we-space', this.mt || this.my || this.m),
          generateVariable('we-space', this.mr || this.mx || this.m),
          generateVariable('we-space', this.mb || this.my || this.m),
          generateVariable('we-space', this.ml || this.mx || this.m),
        ].join(' '),
      );
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}
