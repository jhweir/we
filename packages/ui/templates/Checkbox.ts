import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../shared";

const styles = css`
  :host {
    --j-checkbox-size: var(--j-size-md);
  }
  :host([size="sm"]) {
    --j-checkbox-size: var(--j-size-sm);
  }
  :host([size="lg"]) {
    --j-checkbox-size: var(--j-size-lg);
  }
  :host([disabled]) [part="base"] {
    opacity: 0.5;
    cursor: default;
  }
  input {
    position: absolute;
    clip: rect(1px 1px 1px 1px);
    clip: rect(1px, 1px, 1px, 1px);
    vertical-align: middle;
  }
  [part="base"] {
    cursor: pointer;
    display: flex;
    height: var(--j-checkbox-size);
    align-items: center;
    gap: var(--j-space-400);
  }
  :host(:not([disabled]):not([checked])) [part="base"]:hover [part="indicator"] {
    border-color: var(--j-color-ui-300);
  }
  [part="indicator"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--j-color-ui-200);
    width: calc(var(--j-checkbox-size) * 0.6);
    height: calc(var(--j-checkbox-size) * 0.6);
    border-radius: var(--j-border-radius);
    color: var(--j-color-white);
  }
  [part="checkmark"] {
    display: none;
  }
  :host([checked]) [part="checkmark"] {
    display: contents;
  }
  :host([checked]) [part="indicator"] {
    border-color: var(--j-color-primary-500);
    background: var(--j-color-primary-500);
  }
`;

@customElement("j-checkbox")
export default class Component extends LitElement {
  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: Boolean, reflect: true })
  full = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, reflect: true })
  size = "";

  @property({ type: String })
  value = "";

  constructor() {
    super();
    this._handleChange = this._handleChange.bind(this);
  }

  static get styles() {
    return [styles, sharedStyles];
  }

  _handleChange(e: Event) {
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(new CustomEvent("change", { detail: { checked: this.checked } }));
  }

  render() {
    return html`
      <label part="base">
        <input
          ?disabled=${this.disabled}
          @change=${this._handleChange}
          ?checked=${this.checked}
          value=${this.value}
          type="checkbox"
        />
        <span aria-hidden="true" part="indicator">
          <slot part="checkmark" name="checkmark">
            <j-icon name="check"></j-icon>
          </slot>
        </span>
        <span part="label"><slot></slot></span>
      </label>
    `;
  }
}
