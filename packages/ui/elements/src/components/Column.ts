import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles, { AlignPosition, AlignPositionAndSpacing, NamedSize, NumberedSize } from '../styles/shared';

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
  :host([ax='center']) {
    align-items: center;
  }
  :host([ax='end']) {
    align-items: flex-end;
  }
  :host([ay='center']) {
    justify-content: center;
  }
  :host([ay='end']) {
    justify-content: flex-end;
  }
  :host([ay='between']) {
    justify-content: space-between;
  }
  :host([ay='around']) {
    justify-content: space-around;
  }
  :host([wrap]) {
    --j-flex-wrap: wrap;
  }
  :host([reverse]) {
    --j-flex-direction: column-reverse;
  }
`;

// export interface ColumnProps {
//   ax?: AlignPosition;
//   ay?: AlignPositionAndSpacing;
//   wrap?: boolean;
//   reverse?: boolean;
//   gap?: NumberedSize;
//   p?: NumberedSize;
//   pl?: NumberedSize;
//   pr?: NumberedSize;
//   pt?: NumberedSize;
//   pb?: NumberedSize;
//   px?: NumberedSize;
//   py?: NumberedSize;
//   m?: NumberedSize;
//   ml?: NumberedSize;
//   mr?: NumberedSize;
//   mt?: NumberedSize;
//   mb?: NumberedSize;
//   mx?: NumberedSize;
//   my?: NumberedSize;
//   r?: NamedSize;
//   rt?: NamedSize;
//   rb?: NamedSize;
//   rl?: NamedSize;
//   rr?: NamedSize;
//   rtl?: NamedSize;
//   rtr?: NamedSize;
//   rbr?: NamedSize;
//   rbl?: NamedSize;
//   bg?: string;
//   color?: string;
// }

@customElement('we-column')
export default class Column extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) ax: AlignPosition = '';
  @property({ type: String, reflect: true }) ay: AlignPositionAndSpacing = '';
  @property({ type: Boolean, reflect: true }) wrap = false;
  @property({ type: Boolean, reflect: true }) reverse = false;
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
  @property({ type: String, reflect: true }) r: NamedSize = '';
  @property({ type: String, reflect: true }) rt: NamedSize = '';
  @property({ type: String, reflect: true }) rb: NamedSize = '';
  @property({ type: String, reflect: true }) rl: NamedSize = '';
  @property({ type: String, reflect: true }) rr: NamedSize = '';
  @property({ type: String, reflect: true }) rtl: NamedSize = '';
  @property({ type: String, reflect: true }) rtr: NamedSize = '';
  @property({ type: String, reflect: true }) rbr: NamedSize = '';
  @property({ type: String, reflect: true }) rbl: NamedSize = '';
  @property({ type: String, reflect: true }) bg = '';
  @property({ type: String, reflect: true }) color = '';

  updated(props: Map<string, any>) {
    super.updated(props);

    // Update CSS variables based on properties
    if (props.has('gap')) this.style.setProperty('--gap', `var(--we-space-${this.gap})`);
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
    if (['r', 'rt', 'rb', 'rl', 'rr', 'rtl', 'rtr', 'rbr', 'rbl'].some((prop) => props.has(prop))) {
      this.style.setProperty(
        '--border-radius',
        [
          generateVariable('we-size', this.rtl || this.rt || this.rl || this.r),
          generateVariable('we-size', this.rtr || this.rt || this.rr || this.r),
          generateVariable('we-size', this.rbr || this.rb || this.rr || this.r),
          generateVariable('we-size', this.rbl || this.rb || this.rl || this.r),
        ].join(' '),
      );
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

export type ColumnProps = {
  [K in keyof Column as K extends
    | 'ax'
    | 'ay'
    | 'wrap'
    | 'reverse'
    | 'gap'
    | 'p'
    | 'pl'
    | 'pr'
    | 'pt'
    | 'pb'
    | 'px'
    | 'py'
    | 'm'
    | 'ml'
    | 'mr'
    | 'mt'
    | 'mb'
    | 'mx'
    | 'my'
    | 'r'
    | 'rt'
    | 'rb'
    | 'rl'
    | 'rr'
    | 'rtl'
    | 'rtr'
    | 'rbr'
    | 'rbl'
    | 'bg'
    | 'color'
    ? K
    : never]?: Column[K];
};

export function generateColumnStyles(props: ColumnProps): Record<string, string> {
  const style: Record<string, string> = {
    display: 'flex',
    flexDirection: props.reverse ? 'column-reverse' : 'column',
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
  };

  // Alignment
  if (props.ax === 'center') style.alignItems = 'center';
  else if (props.ax === 'end') style.alignItems = 'flex-end';
  else style.alignItems = 'flex-start';

  if (props.ay === 'center') style.justifyContent = 'center';
  else if (props.ay === 'end') style.justifyContent = 'flex-end';
  else if (props.ay === 'between') style.justifyContent = 'space-between';
  else if (props.ay === 'around') style.justifyContent = 'space-around';
  else style.justifyContent = 'flex-start';

  // Spacing
  if (props.gap) style.gap = `var(--we-space-${props.gap})`;

  // Padding
  const padding = [
    generateVariable('we-space', props.pt || props.py || props.p),
    generateVariable('we-space', props.pr || props.px || props.p),
    generateVariable('we-space', props.pb || props.py || props.p),
    generateVariable('we-space', props.pl || props.px || props.p),
  ]
    .join(' ')
    .trim();

  if (padding) style.padding = padding;

  // Margin
  const margin = [
    generateVariable('we-space', props.mt || props.my || props.m),
    generateVariable('we-space', props.mr || props.mx || props.m),
    generateVariable('we-space', props.mb || props.my || props.m),
    generateVariable('we-space', props.ml || props.mx || props.m),
  ]
    .join(' ')
    .trim();

  if (margin) style.margin = margin;

  // Border radius
  const borderRadius = [
    generateVariable('we-size', props.rtl || props.rt || props.rl || props.r),
    generateVariable('we-size', props.rtr || props.rt || props.rr || props.r),
    generateVariable('we-size', props.rbr || props.rb || props.rr || props.r),
    generateVariable('we-size', props.rbl || props.rb || props.rl || props.r),
  ]
    .join(' ')
    .trim();

  if (borderRadius) style.borderRadius = borderRadius;

  // Colors
  if (props.bg) style.backgroundColor = `var(--we-color-${props.bg})`;
  if (props.color) style.color = `var(--we-color-${props.color})`;

  return style;
}
