import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import sharedStyles from '../styles/shared';

const styles = css`
  :host {
    --we-input-label-size: var(--we-font-size-500);
    --we-input-height: var(--we-size-md);
    --we-input-padding: var(--we-space-400);
  }
  :host([size='sm']) {
    --we-input-height: var(--we-size-sm);
  }
  :host([size='lg']) {
    --we-input-height: var(--we-size-lg);
  }
  :host([size='xl']) {
    --we-input-height: var(--we-size-xl);
    --we-input-padding: var(--we-space-500);
  }
  :host([full]) {
    display: block;
    width: 100%;
  }
  [part='base'] {
    display: block;
    position: relative;
  }
  [part='input-wrapper'] {
    display: flex;
    align-items: center;
    position: relative;
    height: var(--we-input-height);
    font-size: var(--we-font-size-400);
    color: var(--we-color-black);
    background: var(--we-color-white);
    border-radius: var(--we-border-radius);
    border: 1px solid var(--we-border-color);
    width: 100%;
    min-width: 200px;
    padding: 0px;
  }
  [part='input-wrapper']:hover {
    border: 1px solid var(--we-border-color-strong);
  }
  [part='input-wrapper']:focus-within {
    border: 1px solid var(--we-color-focus);
  }
  [part='input-field'] {
    border: 0;
    flex: 1;
    background: none;
    outline: 0;
    font-family: inherit;
    color: var(--we-color-black);
    font-size: inherit;
    height: 100%;
    width: 100%;
    padding: 0px var(--we-input-padding);
  }
  [part='input-field']::placeholder {
    color: var(--we-color-ui-400);
  }
  [part='help-text'],
  [part='error-text'] {
    left: 0;
    bottom: -20px;
    position: absolute;
    font-size: var(--we-font-size-300);
  }
  [part='error-text'] {
    color: var(--we-color-danger-500);
  }
  [part='start']::slotted(*) {
    padding-left: var(--we-space-400);
  }
  [part='end']::slotted(*) {
    padding-right: var(--we-space-400);
  }
`;

@customElement('we-input')
export default class Input extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, reflect: true }) max = '';
  @property({ type: String, reflect: true }) min = '';
  @property({ type: Number, reflect: true }) maxlength = Infinity;
  @property({ type: Number, reflect: true }) minlength = 0;
  @property({ type: String, reflect: true }) pattern = '';
  @property({ type: String, reflect: true }) label = '';
  @property({ type: String, reflect: true }) name = '';
  @property({ type: String, reflect: true }) size = '';
  @property({ type: String, reflect: true }) step = '';
  @property({ type: String, reflect: true }) placeholder = '';
  @property({ type: String, reflect: true }) errorText = '';
  @property({ type: String, reflect: true }) helpText = '';
  @property({ type: String, reflect: true }) autocomplete = '';
  @property({ type: Boolean, reflect: true }) autovalidate = false;
  @property({ type: Boolean, reflect: true }) autofocus = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) full = false;
  @property({ type: Boolean, reflect: true }) error = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: String, reflect: true }) type = 'text';

  select() {
    this.renderRoot.querySelector('input')?.select();
  }

  focus() {
    this.renderRoot.querySelector('input')?.focus();
  }

  validate() {
    this.error = !this.renderRoot.querySelector('input')?.checkValidity();
    if (this.error) this.errorText = this.errorText || this.renderRoot.querySelector('input')?.validationMessage || '';
    this.dispatchEvent(new CustomEvent('validate'));
    return this.error;
  }

  onInput(e: InputEvent) {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement)?.value;
    this.dispatchEvent(new CustomEvent('input', { detail: this.value, bubbles: true, composed: true }));
  }

  onChange(e: Event) {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement)?.value;
    this.dispatchEvent(new CustomEvent('change', e));
  }

  onFocus(e: FocusEvent) {
    e.stopPropagation();
    this.value = (e.target as HTMLInputElement)?.value;
    this.dispatchEvent(new CustomEvent('focus', e));
  }

  onBlur(e: FocusEvent) {
    e.stopPropagation();
    if (this.autovalidate) this.validate();
    this.dispatchEvent(new CustomEvent('blur', e));
  }

  render() {
    return html`
      <div part="base">
        ${this.label && html` <j-text tag="label" variant="label" part="label">${this.label} </j-text> `}
        <div part="input-wrapper">
          <slot part="start" name="start"></slot>
          <input
            part="input-field"
            .value=${this.value}
            .type=${this.type}
            .max=${this.max}
            .min=${this.min}
            .step=${this.step}
            .autocomplete=${this.autocomplete}
            maxlength=${this.maxlength}
            minlength=${this.minlength}
            pattern=${this.pattern}
            placeholder=${this.placeholder}
            ?autofocus=${this.autofocus}
            ?readonly=${this.readonly}
            ?required=${this.required}
            ?disabled=${this.disabled}
            @input=${this.onInput}
            @change=${this.onChange}
            @blur=${this.onBlur}
            @focus=${this.onFocus}
          />
          <slot part="end" name="end"></slot>
        </div>
        ${this.error
          ? this.errorText
            ? html`<div part="error-text">${this.errorText}</div>`
            : null
          : this.helpText
            ? html`<div part="help-text">${this.helpText}</div>`
            : null}
      </div>
    `;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-input': {
        value?: string;
        type?: string;
        max?: string;
        min?: string;
        maxlength?: number;
        minlength?: number;
        pattern?: string;
        label?: string;
        name?: string;
        size?: string;
        step?: string;
        placeholder?: string;
        errorText?: string;
        helpText?: string;
        autocomplete?: string;
        autovalidate?: boolean;
        autofocus?: boolean;
        disabled?: boolean;
        full?: boolean;
        error?: boolean;
        required?: boolean;
        readonly?: boolean;
        onInput?: (e: InputEvent) => void;
        onChange?: (e: Event) => void;
        onFocus?: (e: FocusEvent) => void;
        onBlur?: (e: FocusEvent) => void;
        validate?: () => boolean;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
