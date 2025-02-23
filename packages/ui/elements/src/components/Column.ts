import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles from '../shared';

const styles = css`
  :host {
    --direction: column;
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
    align-items: center;
  }
  :host([alignX='end']) {
    align-items: flex-end;
  }
  :host([alignY='center']) {
    justify-content: center;
  }
  :host([alignY='end']) {
    justify-content: flex-end;
  }
  :host([alignY='between']) {
    justify-content: space-between;
  }
  :host([alignY='around']) {
    justify-content: space-around;
  }
  :host([wrap]) {
    --j-flex-wrap: wrap;
  }
  :host([reverse]) {
    --j-flex-direction: column-reverse;
  }
`;

type AlignX = '' | 'center' | 'end';
type AlignY = '' | 'center' | 'end' | 'between' | 'around';
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
  @property({ type: String, reflect: true }) p: Space = '';
  @property({ type: String, reflect: true }) pl: Space = '';
  @property({ type: String, reflect: true }) pr: Space = '';
  @property({ type: String, reflect: true }) pt: Space = '';
  @property({ type: String, reflect: true }) pb: Space = '';
  @property({ type: String, reflect: true }) px: Space = '';
  @property({ type: String, reflect: true }) py: Space = '';
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

  // private styleSheet: CSSStyleSheet | null = null;
  // updated() {
  //   if (!this.styleSheet) this.styleSheet = new CSSStyleSheet();
  //   const dynamicStyles = `
  //     :host {
  //       --we-flex-gap: var(--we-space-${this.gap});
  //       --we-flex-border-radius: var(--we-border-radius-${this.radius});
  //       --we-flex-bg-color: var(--we-color-${this.bg});
  //       --we-flex-color: var(--we-color-${this.color});
  //       --we-flex-padding:
  //         ${generateVariable('we-space', this.pt || this.py || this.p)}
  //         ${generateVariable('we-space', this.pr || this.px || this.p)}
  //         ${generateVariable('we-space', this.pb || this.py || this.p)}
  //         ${generateVariable('we-space', this.pl || this.px || this.p)};
  //       --we-flex-margin:
  //         ${generateVariable('we-space', this.mt || this.my || this.m)}
  //         ${generateVariable('we-space', this.mr || this.mx || this.m)}
  //         ${generateVariable('we-space', this.mb || this.my || this.m)}
  //         ${generateVariable('we-space', this.ml || this.mx || this.m)}
  //     }
  //   `;
  //   this.styleSheet.replaceSync(dynamicStyles);
  //   if (this.shadowRoot) adoptStyles(this.shadowRoot, [styles, sharedStyles, this.styleSheet]);
  // }

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
      'we-column': {
        alignX?: AlignX;
        alignY?: AlignY;
        gap?: Space;
        wrap?: boolean;
        reverse?: boolean;
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
        bg?: string;
        color?: string;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
