import { css, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyles from '../shared/styles';
import { BaseElement } from '../shared/base-element';
import type { DesignSystemProps } from '@we/types';
import { baseCssVars, stateCssVars } from '../shared/helpers';
import { mergeProps } from '@we/design-system-utils';

const DEFAULT_PROPS: Partial<DesignSystemProps> = { rt: 'md', py: '200', px: '300' };

const CSS_STYLES = css`
  :host {
    display: flex;
    white-space: nowrap;
    height: 100%;
  }
  button {
    all: unset;
    display: flex;
    cursor: pointer;

    ${unsafeCSS(baseCssVars())}
  }
  button[active] {
    background: var(--we-bg-active, var(--we-color-primary-50));
    color: var(--we-color-active, var(--we-color-primary-600));
    font-weight: var(--we-font-weight-active, 600);
  }
  button:hover:not([active]) {
    ${unsafeCSS(stateCssVars('hover'))}
  }
`;

// background: var(--we-bg-hover, var(--we-color-ui-100));
// color: var(--we-color-hover, var(--we-color-primary-700));

@customElement('we-tab')
export class Tab extends BaseElement implements DesignSystemProps {
  static styles = [sharedStyles, CSS_STYLES];

  // Tab specific props
  @property({ type: String, reflect: true }) key = '';
  @property({ type: String }) label?: string;
  @property({ type: Object }) onClick?: any;
  @property({ type: Object }) styles?: Record<string, string | number | undefined>;

  // Design system props
  @property({ type: String }) bg?: DesignSystemProps['bg'];
  @property({ type: String }) color?: DesignSystemProps['color'];
  @property({ type: String }) width?: DesignSystemProps['width'];
  @property({ type: String }) height?: DesignSystemProps['height'];
  @property({ type: String }) direction?: DesignSystemProps['direction'];
  @property({ type: String }) ax?: DesignSystemProps['ax'];
  @property({ type: String }) ay?: DesignSystemProps['ay'];
  @property({ type: Boolean }) wrap?: DesignSystemProps['wrap'];
  @property({ type: String }) gap?: DesignSystemProps['gap'];
  @property({ type: String }) m?: DesignSystemProps['m'];
  @property({ type: String }) ml?: DesignSystemProps['ml'];
  @property({ type: String }) mr?: DesignSystemProps['mr'];
  @property({ type: String }) mt?: DesignSystemProps['mt'];
  @property({ type: String }) mb?: DesignSystemProps['mb'];
  @property({ type: String }) mx?: DesignSystemProps['mx'];
  @property({ type: String }) my?: DesignSystemProps['my'];
  @property({ type: String }) p?: DesignSystemProps['p'];
  @property({ type: String }) pl?: DesignSystemProps['pl'];
  @property({ type: String }) pr?: DesignSystemProps['pr'];
  @property({ type: String }) pt?: DesignSystemProps['pt'];
  @property({ type: String }) pb?: DesignSystemProps['pb'];
  @property({ type: String }) px?: DesignSystemProps['px'];
  @property({ type: String }) py?: DesignSystemProps['py'];
  @property({ type: String }) r?: DesignSystemProps['r'];
  @property({ type: String }) rt?: DesignSystemProps['rt'];
  @property({ type: String }) rb?: DesignSystemProps['rb'];
  @property({ type: String }) rl?: DesignSystemProps['rl'];
  @property({ type: String }) rr?: DesignSystemProps['rr'];
  @property({ type: String }) rtl?: DesignSystemProps['rtl'];
  @property({ type: String }) rtr?: DesignSystemProps['rtr'];
  @property({ type: String }) rbr?: DesignSystemProps['rbr'];
  @property({ type: String }) rbl?: DesignSystemProps['rbl'];
  @property({ type: Object }) hover?: DesignSystemProps['hover'];
  @property({ type: Object }) active?: DesignSystemProps['active'];

  getDesignSystemProps(): DesignSystemProps {
    return mergeProps(this as Record<string, unknown>, DEFAULT_PROPS);
  }

  private handleClick(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent('tab-select', { detail: { value: this.key }, bubbles: true, composed: true }));
    if (this.onClick) {
      if (typeof this.onClick === 'function') this.onClick(e);
      // Handle schema action objects here if needed { $action: 'routeStore.navigate', args: ['/'] }
    }
  }

  render() {
    const inlineStyles = this.styles || {};
    return html`
      <button
        role="tab"
        ?active=${this.active}
        aria-selected=${this.active}
        @click=${this.handleClick}
        style=${styleMap(inlineStyles)}
      >
        ${this.label ? this.label : html`<slot></slot>`}
      </button>
    `;
  }
}

export default Tab;
