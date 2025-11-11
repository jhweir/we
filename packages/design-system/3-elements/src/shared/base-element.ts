import { LitElement } from 'lit';
import { getDesignSystemCSS } from './helpers';
import type { DesignSystemProps } from '@we/types';
import { DesignSystemElement } from './ds-mixin';

// Base class for all design system elements
export abstract class BaseElement extends DesignSystemElement(LitElement) {
  protected _dsStyle?: HTMLStyleElement;

  private _updateDesignSystem() {
    if (!this._dsStyle) return;

    // Add the latest design system CSS to the style element
    this._dsStyle.textContent = getDesignSystemCSS(this, this.getInstanceProps());
  }

  firstUpdated() {
    // Create a style element to hold design system CSS variables and append it to the render root
    this._dsStyle = document.createElement('style');
    this.renderRoot.appendChild(this._dsStyle);

    // Initial update of design system CSS
    this._updateDesignSystem();
  }

  updated() {
    // Update design system CSS whenever the component updates
    this._updateDesignSystem();
  }
}
