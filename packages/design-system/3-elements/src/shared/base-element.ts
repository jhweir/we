import { LitElement } from 'lit';
import type { DesignSystemProps } from '@we/types';
import { setDesignSystemVars } from './helpers';

// Base class with design system integration for all components to extend
export class BaseElement extends LitElement {
  // Placeholder to be overridden in subclasses
  getDesignSystemProps(): DesignSystemProps {
    return this as unknown as DesignSystemProps;
  }

  updated() {
    const props = this.getDesignSystemProps() as DesignSystemProps;
    setDesignSystemVars(this, props);

    // Hover styles
    const hoverProps = props.hoverProps as DesignSystemProps;
    if (hoverProps && typeof hoverProps === 'object') setDesignSystemVars(this, hoverProps, 'hover');

    // Active styles
    const activeProps = props.activeProps as DesignSystemProps;
    if (activeProps && typeof activeProps === 'object') setDesignSystemVars(this, activeProps, 'active');

    // Focus styles
    const focusProps = props.focusProps as DesignSystemProps;
    if (focusProps && typeof focusProps === 'object') setDesignSystemVars(this, focusProps, 'focus');

    // Disabled styles
    const disabledProps = props.disabledProps as DesignSystemProps;
    if (disabledProps && typeof disabledProps === 'object') setDesignSystemVars(this, disabledProps, 'disabled');
  }
}
