import { css, html, unsafeCSS } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import sharedStyles from '../shared/styles';
import { BaseElement } from '../shared/base-element';
import type { DesignSystemProps } from '@we/types';
import { baseCssVars, stateCssVars } from '../shared/helpers';
import { mergeProps } from '@we/design-system-utils';

const DEFAULT_PROPS: Partial<DesignSystemProps> = {};

const CSS_STYLES = css`
  :host {
    display: flex;
  }
  .tabs {
    display: flex;
    ${unsafeCSS(baseCssVars())}
  }
  .tabs:hover {
    ${unsafeCSS(stateCssVars('hover'))}
  }
`;

@customElement('we-tabs')
export class Tabs extends BaseElement implements DesignSystemProps {
  static styles = [sharedStyles, CSS_STYLES];

  // Tabs specific props
  @property({ type: String }) activeKey: string = '';
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

  @queryAssignedElements({ slot: 'tab' }) _tabs!: HTMLElement[];

  getDesignSystemProps(): DesignSystemProps {
    return mergeProps(this as Record<string, unknown>, DEFAULT_PROPS);
  }

  updated() {
    // Set selected state on tabs
    this._tabs?.forEach((tab) => {
      (tab as any).selected = (tab as any).active === this.activeKey;
    });
  }

  private onTabSelect(e: CustomEvent) {
    this.activeKey = e.detail.value;
    this.dispatchEvent(new CustomEvent('tab-change', { detail: { value: this.activeKey } }));
  }

  render() {
    const inlineStyles = this.styles || {};
    return html`
      <nav class="tabs" role="tablist" style=${styleMap(inlineStyles)}>
        <slot name="tab" @tab-select=${this.onTabSelect}></slot>
      </nav>
    `;
  }
}

export default Tabs;
