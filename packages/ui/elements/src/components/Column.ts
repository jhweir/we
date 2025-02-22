import { adoptStyles, css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles from '../shared';

const styles = css`
  :host {
    --j-flex-direction: column;
    --j-flex-wrap: nowrap;
    --we-flex-gap: none;
    --we-flex-padding: 0px;
    --we-flex-margin: 0px;
    --we-flex-border-radius: none;
    --we-flex-bg-color: none;
    --we-flex-color: inherit;

    display: flex;
    flex-direction: var(--j-flex-direction);
    flex-wrap: var(--j-flex-wrap);
    gap: var(--we-flex-gap);
    padding: var(--we-flex-padding);
    margin: var(--we-flex-margin);
    border-radius: var(--we-flex-border-radius);
    background-color: var(--we-flex-bg-color);
    color: var(--we-flex-color);
  }
  :host([alignX='center']) {
    justify-content: center;
  }
  :host([alignX='end']) {
    justify-content: flex-end;
  }
  :host([alignY='center']) {
    align-items: center;
  }
  :host([alignY='end']) {
    align-items: flex-end;
  }
  :host([alignX='between']) {
    justify-content: space-between;
  }
  :host([alignX='around']) {
    justify-content: space-around;
  }
  :host([wrap]) {
    --j-flex-wrap: wrap;
  }
  :host([reverse]) {
    --j-flex-direction: column-reverse;
  }
`;

type AlignX = '' | 'center' | 'end' | 'between' | 'around';
type AlignY = '' | 'center' | 'end';
type Space = '' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
type Size = '' | 'sm' | 'md' | 'lg';

@customElement('we-column')
export default class Column extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) alignX: AlignX = '';
  @property({ type: String, reflect: true }) alignY: AlignY = '';
  @property({ type: Boolean, reflect: true }) wrap = false;
  @property({ type: Boolean, reflect: true }) reverse = false;
  @property({ type: String, reflect: true }) radius: Size = '';
  @property({ type: String, reflect: true }) gap: Space = '';
  // padding
  @property({ type: String, reflect: true }) p: Space = '';
  @property({ type: String, reflect: true }) pl: Space = '';
  @property({ type: String, reflect: true }) pr: Space = '';
  @property({ type: String, reflect: true }) pt: Space = '';
  @property({ type: String, reflect: true }) pb: Space = '';
  @property({ type: String, reflect: true }) px: Space = '';
  @property({ type: String, reflect: true }) py: Space = '';
  // margin
  @property({ type: String, reflect: true }) m: Space = '';
  @property({ type: String, reflect: true }) ml: Space = '';
  @property({ type: String, reflect: true }) mr: Space = '';
  @property({ type: String, reflect: true }) mt: Space = '';
  @property({ type: String, reflect: true }) mb: Space = '';
  @property({ type: String, reflect: true }) mx: Space = '';
  @property({ type: String, reflect: true }) my: Space = '';

  @property({ type: String, reflect: true }) bg = '';
  @property({ type: String, reflect: true }) color = '';

  @property({ type: String, reflect: true }) class: string = '';
  @property({ type: Object, reflect: true }) style: any;

  private styleSheet: CSSStyleSheet | null = null;
  updated() {
    if (!this.styleSheet) this.styleSheet = new CSSStyleSheet();
    const dynamicStyles = `
      :host {
        --we-flex-gap: var(--we-space-${this.gap});
        --we-flex-border-radius: var(--we-border-radius-${this.radius});
        --we-flex-bg-color: var(--we-color-${this.bg});
        --we-flex-color: var(--we-color-${this.color});
        --we-flex-padding: 
          ${generateVariable('we-space', this.pt || this.py || this.p)}
          ${generateVariable('we-space', this.pr || this.px || this.p)}
          ${generateVariable('we-space', this.pb || this.py || this.p)}
          ${generateVariable('we-space', this.pl || this.px || this.p)};
        --we-flex-margin: 
          ${generateVariable('we-space', this.mt || this.my || this.m)}
          ${generateVariable('we-space', this.mr || this.mx || this.m)}
          ${generateVariable('we-space', this.mb || this.my || this.m)}
          ${generateVariable('we-space', this.ml || this.mx || this.m)}
      }
    `;
    this.styleSheet.replaceSync(dynamicStyles);
    if (this.shadowRoot) adoptStyles(this.shadowRoot, [styles, sharedStyles, this.styleSheet]);
  }

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-column': {
        alignX?: AlignX;
        alignY?: AlignY;
        gap?: Space;
        wrap?: boolean;
        reverse?: boolean;
        bg?: string;
        color?: string;
        radius?: Size;
        p?: Space;
        pl?: Space;
        pr?: Space;
        pt?: Space;
        pb?: Space;
        px?: Space;
        py?: Space;
        m?: Space;
        ml?: Space;
        mr?: Space;
        mt?: Space;
        mb?: Space;
        mx?: Space;
        my?: Space;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
