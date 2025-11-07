import { LitElement } from 'lit';
import type { DesignSystemProps } from '@we/types';
import { setDesignSystemVars } from './helpers';

// Base class with shared logic, no field declarations, no implements
export class BaseElement extends LitElement {
  updated() {
    const props = this as DesignSystemProps;
    setDesignSystemVars(this, props);

    // Hover styles
    if (props.hover && typeof props.hover === 'object') {
      const hoverProps = props.hover as DesignSystemProps;
      setDesignSystemVars(this, hoverProps, 'hover');
    }

    // Active styles
    if (props.active && typeof props.active === 'object') {
      const activeProps = props.active as DesignSystemProps;
      setDesignSystemVars(this, activeProps, 'active');
    }
  }
}
