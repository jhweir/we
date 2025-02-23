import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { generateVariable } from '../helpers';
import sharedStyles from '../shared';

const styles = css`
  :host {
    --we-icon-color: currentColor;
    --we-icon-size: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :host i {
    color: var(--we-icon-color);
    fill: var(--we-icon-color);
    display: block;
    font-size: var(--we-icon-size);
  }
  :host([size='xs']) i {
    --we-icon-size: 16px;
  }
  :host([size='sm']) i {
    --we-icon-size: 18px;
  }
  :host([size='lg']) i {
    --we-icon-size: 32px;
  }
  :host([size='xl']) i {
    --we-icon-size: 48px;
  }
`;

type Size = '' | 'xs' | 'sm' | 'lg' | 'xl';

@customElement('we-icon')
export default class Icon extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String, reflect: true }) size: Size = '';
  @property({ type: String, reflect: true }) color = '';

  @state() svg = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">`;
  }

  updated(props: Map<string, any>) {
    super.updated(props);
    if (props.has('color')) {
      this.style.setProperty('--we-icon-color', generateVariable('we-color', this.color, 'currentColor'));
    }
  }

  render() {
    return html`<i class="bi-${this.name}" role="img" aria-label="${this.name}"></i>`;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-icon': {
        name?: string;
        size?: Size;
        color?: string;
        slot?: string;
        style?: any;
      };
    }
  }
}
