// import { LitElement } from 'lit';
// import type { DesignSystemProps } from '@we/types';
// import { setDesignSystemVars } from './helpers';

// // Base class with design system integration for all components to extend
// export class BaseElement extends LitElement {
//   // Placeholder to be overridden in subclasses
//   getDesignSystemProps(): DesignSystemProps {
//     return this as unknown as DesignSystemProps;
//   }

//   updated() {
//     const props = this.getDesignSystemProps() as DesignSystemProps;
//     setDesignSystemVars(this, props);

//     // Hover styles
//     const hoverProps = props.hoverProps as DesignSystemProps;
//     if (hoverProps && typeof hoverProps === 'object') setDesignSystemVars(this, hoverProps, 'hover');

//     // Focus styles
//     const focusProps = props.focusProps as DesignSystemProps;
//     if (focusProps && typeof focusProps === 'object') setDesignSystemVars(this, focusProps, 'focus');

//     // Active styles
//     const activeProps = props.activeProps as DesignSystemProps;
//     if (activeProps && typeof activeProps === 'object') setDesignSystemVars(this, activeProps, 'active');

//     // Disabled styles
//     const disabledProps = props.disabledProps as DesignSystemProps;
//     if (disabledProps && typeof disabledProps === 'object') setDesignSystemVars(this, disabledProps, 'disabled');
//   }
// }

import { LitElement } from 'lit';
import { getDesignSystemCSS } from './helpers';
import type { DesignSystemProps } from '@we/types';
import { mergeProps, designSystemKeys } from '@we/design-system-utils';

export abstract class BaseElement extends LitElement {
  // Allow string-based property access for design system keys
  [key: string]: unknown;

  protected _dsStyle?: HTMLStyleElement;

  // Sub‑classes implement their own defaults
  protected abstract getDefaultProps(): Partial<DesignSystemProps>;

  protected getInstanceProps(): Partial<DesignSystemProps> {
    return Object.fromEntries(designSystemKeys.filter((key) => this[key] !== undefined).map((key) => [key, this[key]]));
  }

  // Final merged props (defaults + instance)
  protected getDesignSystemProps(): DesignSystemProps {
    return mergeProps(this.getInstanceProps() as any, this.getDefaultProps()) as DesignSystemProps;
  }

  firstUpdated() {
    // Create and attach the style element for design system CSS
    this._dsStyle = document.createElement('style');
    this.renderRoot.appendChild(this._dsStyle);
    this._updateDesignSystem();
  }

  updated() {
    this._updateDesignSystem();
  }

  private _updateDesignSystem() {
    if (!this._dsStyle) return;
    const css = getDesignSystemCSS(this, this.getInstanceProps(), this.getDefaultProps());
    this._dsStyle.textContent = css;
  }
}
