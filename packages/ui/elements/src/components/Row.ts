import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles, { AlignPosition, AlignPositionAndSpacing, NamedSize, NumberedSize } from '../styles/shared';

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

  @property({ type: String, reflect: true }) alignX: AlignPositionAndSpacing = '';
  @property({ type: String, reflect: true }) alignY: AlignPosition = '';
  @property({ type: Boolean, reflect: true }) wrap = false;
  @property({ type: Boolean, reflect: true }) reverse = false;
  @property({ type: String, reflect: true }) radius: NamedSize = '';
  @property({ type: String, reflect: true }) gap: NumberedSize = '';
  @property({ type: String, reflect: true }) p: NumberedSize = '';
  @property({ type: String, reflect: true }) pl: NumberedSize = '';
  @property({ type: String, reflect: true }) pr: NumberedSize = '';
  @property({ type: String, reflect: true }) pt: NumberedSize = '';
  @property({ type: String, reflect: true }) pb: NumberedSize = '';
  @property({ type: String, reflect: true }) px: NumberedSize = '';
  @property({ type: String, reflect: true }) py: NumberedSize = '';
  @property({ type: String, reflect: true }) m: NumberedSize = '';
  @property({ type: String, reflect: true }) ml: NumberedSize = '';
  @property({ type: String, reflect: true }) mr: NumberedSize = '';
  @property({ type: String, reflect: true }) mt: NumberedSize = '';
  @property({ type: String, reflect: true }) mb: NumberedSize = '';
  @property({ type: String, reflect: true }) mx: NumberedSize = '';
  @property({ type: String, reflect: true }) my: NumberedSize = '';
  @property({ type: String, reflect: true }) bg = '';
  @property({ type: String, reflect: true }) color = '';
  @property({ type: String, reflect: true }) class: string = '';

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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-row': {
        alignX?: AlignPositionAndSpacing;
        alignY?: AlignPosition;
        gap?: NumberedSize;
        wrap?: boolean;
        reverse?: boolean;
        radius?: NamedSize;
        p?: NumberedSize;
        pl?: NumberedSize;
        pr?: NumberedSize;
        pt?: NumberedSize;
        pb?: NumberedSize;
        px?: NumberedSize;
        py?: NumberedSize;
        m?: NumberedSize;
        ml?: NumberedSize;
        mr?: NumberedSize;
        mt?: NumberedSize;
        mb?: NumberedSize;
        mx?: NumberedSize;
        my?: NumberedSize;
        bg?: string;
        color?: string;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
