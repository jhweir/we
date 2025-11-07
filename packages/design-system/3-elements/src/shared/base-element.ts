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
    const hoverProps = props.hover as DesignSystemProps;
    if (hoverProps && typeof hoverProps === 'object') setDesignSystemVars(this, hoverProps, 'hover');

    // Active styles
    const activeProps = props.active as DesignSystemProps;
    if (activeProps && typeof activeProps === 'object') setDesignSystemVars(this, activeProps, 'active');
  }
}
