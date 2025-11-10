import { css, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyles from '../shared/styles';
import { BaseElement } from '../shared/base-element';
import type { DesignSystemProps } from '@we/types';
import { designSystemStyles } from '../shared/helpers';
import { mergeProps } from '@we/design-system-utils';

const DEFAULT_PROPS: Partial<DesignSystemProps> = { rt: 'md', py: '200', px: '300' };

const CSS_STYLES = css`
  :host {
    white-space: nowrap;
  }

  [part='base'] {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
  }

  ${unsafeCSS(designSystemStyles(['hover', 'active', 'focus', 'disabled']))}
`;

@customElement('we-tab')
export class Tab extends BaseElement implements DesignSystemProps {
  static styles = [sharedStyles, CSS_STYLES];

  // Tab specific props
  @property({ type: String, reflect: true }) key = '';
  @property({ type: Boolean, reflect: true }) active = false;
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
  @property({ type: Object, attribute: false }) hoverProps?: DesignSystemProps['hoverProps'];
  @property({ type: Object, attribute: false }) activeProps?: DesignSystemProps['activeProps'];
  @property({ type: Object, attribute: false }) focusProps?: DesignSystemProps['focusProps'];
  @property({ type: Object, attribute: false }) disabledProps?: DesignSystemProps['disabledProps'];

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
        part="base"
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
