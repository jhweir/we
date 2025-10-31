import { css, html, LitElement } from 'lit';
import { customElement, property, queryAssignedElements } from 'lit/decorators.js';
import sharedStyles from '../shared/styles';

const styles = css`
  :host {
    display: block;
    --we-tabs-gap: var(--we-space-400);
    --we-tabs-bg: transparent;
    --we-tabs-border: none;
  }
  .tabs {
    display: flex;
    gap: var(--we-tabs-gap);
    background: var(--we-tabs-bg);
    border-bottom: var(--we-tabs-border);
    align-items: flex-end;
  }
  .panels {
    margin-top: var(--we-space-400);
  }
  :host([fill]) .tabs ::slotted(we-tab) {
    flex: 1 1 0;
    min-width: 0;
  }
`;

@customElement('we-tabs')
export class Tabs extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String }) value: string = '';
  @property({ type: String }) gap?: string;
  @property({ type: Boolean, reflect: true }) fill = false;

  @queryAssignedElements({ slot: 'tab' }) _tabs!: HTMLElement[];
  @queryAssignedElements({ slot: 'panel' }) _panels!: HTMLElement[];

  updated() {
    if (this.gap) {
      this.style.setProperty('--we-tabs-gap', `var(--we-space-${this.gap})`);
    }
    // Set selected state on tabs
    this._tabs?.forEach((tab) => {
      (tab as any).selected = (tab as any).value === this.value;
    });
    // Show only the selected panel
    if (this._panels && this._tabs) {
      this._panels.forEach((panel, idx) => {
        const tab = this._tabs[idx];
        if (tab && (tab as any).value === this.value) {
          panel.style.display = '';
        } else {
          panel.style.display = 'none';
        }
      });
    }
  }

  private onTabSelect(e: CustomEvent) {
    this.value = e.detail.value;
    this.dispatchEvent(new CustomEvent('tab-change', { detail: { value: this.value } }));
  }

  render() {
    return html`
      <nav class="tabs" role="tablist">
        <slot name="tab" @tab-select=${this.onTabSelect}></slot>
      </nav>
      <div class="panels">
        <slot name="panel"></slot>
      </div>
    `;
  }
}

export default Tabs;
