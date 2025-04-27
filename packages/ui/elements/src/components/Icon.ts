import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { generateVariable } from '../helpers';
import sharedStyles from '../styles/shared';

const styles = css`
  :host {
    --icon-color: currentColor;
    --icon-size: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    width: var(--icon-size);
    height: var(--icon-size);
    fill: var(--icon-color);
  }

  :host([size='xs']) {
    --icon-size: 16px;
  }
  :host([size='sm']) {
    --icon-size: 18px;
  }
  :host([size='lg']) {
    --icon-size: 32px;
  }
  :host([size='xl']) {
    --icon-size: 48px;
  }
`;

type Size = '' | 'xs' | 'sm' | 'lg' | 'xl';
type Weight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

// todo: allow users to pass in their own icon set

@customElement('we-icon')
export default class Icon extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) name = '';
  @property({ type: String, reflect: true }) size: Size = '';
  @property({ type: String, reflect: true }) color = '';
  @property({ type: String, reflect: true }) weight: Weight = 'regular';

  @state() private svg: string | null = null;
  @state() private error: boolean = false;

  private async loadIcon() {
    if (!this.name) return;

    const baseUrl = 'https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets';
    const fileName = this.weight === 'regular' ? this.name : `${this.name}-${this.weight}`;
    const url = `${baseUrl}/${this.weight}/${fileName}.svg`;

    try {
      // const module = await import(`@phosphor-icons/core/${this.weight}/${this.name}-${this.weight}.svg`);
      // this.svg = module.default;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch icon "${this.name}"`);
      this.svg = await response.text();
    } catch (e) {
      console.warn(`Failed to load icon "${this.name}":`, e);
      this.error = true;
    }
  }

  updated(props: Map<string, any>) {
    super.updated(props);
    if (props.has('name') || props.has('weight')) this.loadIcon();
    if (props.has('color'))
      this.style.setProperty('--icon-color', generateVariable('we-color', this.color, 'currentColor'));
  }

  render() {
    if (this.error) return html`<span role="img" aria-label="icon error"></span>`;
    if (!this.svg) return html`<span role="img" aria-label="icon loading"></span>`;
    return html`${unsafeHTML(this.svg)}`;
  }
}

// Type definitions for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-icon': {
        name?: string;
        size?: Size;
        weight?: Weight;
        color?: string;
        slot?: string;
        style?: { [key: string]: string };
      };
    }
  }
}

// Export types for TypeScript users
export type { Size, Weight };

// import { css, html, LitElement } from 'lit';
// import { customElement, property, state } from 'lit/decorators.js';
// import { generateVariable } from '../helpers';
// import sharedStyles from '../shared';

// const styles = css`
//   :host {
//     --icon-color: currentColor;
//     --icon-size: 24px;
//     display: inline-flex;
//     align-items: center;
//     justify-content: center;
//   }
//   :host i {
//     color: var(--icon-color);
//     fill: var(--icon-color);
//     display: block;
//     font-size: var(--icon-size);
//   }
//   :host([size='xs']) i {
//     --icon-size: 16px;
//   }
//   :host([size='sm']) i {
//     --icon-size: 18px;
//   }
//   :host([size='lg']) i {
//     --icon-size: 32px;
//   }
//   :host([size='xl']) i {
//     --icon-size: 48px;
//   }
// `;

// type Size = '' | 'xs' | 'sm' | 'lg' | 'xl';

// @customElement('we-icon')
// export default class Icon extends LitElement {
//   static styles = [sharedStyles, styles];

//   @property({ type: String, reflect: true }) name = '';
//   @property({ type: String, reflect: true }) size: Size = '';
//   @property({ type: String, reflect: true }) color = '';

//   @state() svg = '';

//   constructor() {
//     super();
//     this.attachShadow({ mode: 'open' });
//     this.shadowRoot!.innerHTML = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">`;
//   }

//   updated(props: Map<string, any>) {
//     super.updated(props);
//     if (props.has('color')) {
//       this.style.setProperty('--icon-color', generateVariable('we-color', this.color, 'currentColor'));
//     }
//   }

//   render() {
//     return html`<i class="bi-${this.name}" role="img" aria-label="${this.name}"></i>`;
//   }
// }

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       'we-icon': {
//         name?: string;
//         size?: Size;
//         color?: string;
//         slot?: string;
//         style?: any;
//       };
//     }
//   }
// }
