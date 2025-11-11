import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { DesignSystemProps } from '@we/types';
import { mergeProps, filterProps, designSystemKeys, stateKeys } from '@we/design-system-utils';

type Constructor<T = any> = new (...args: any[]) => T;

type MixedClass<T extends Constructor<LitElement>> = {
  new (...args: any[]): InstanceType<T> & {
    getInstanceProps(): Partial<DesignSystemProps>;
  };
} & T;

// Mixin to add design system properties and methods to a LitElement
export function DesignSystemElement<T extends Constructor<LitElement>>(Base: T): MixedClass<T> {
  // Separate primitive keys from state keys
  const primitiveKeys = designSystemKeys.filter((key) => !stateKeys.includes(key as (typeof stateKeys)[number]));

  // Define all non-string primitive types
  const primitiveTypes: Record<string, any> = { wrap: Boolean };

  // Apply all design system properties to the base class prototype
  primitiveKeys.forEach((key) => property({ type: primitiveTypes[key] || String, reflect: true })(Base.prototype, key));
  stateKeys.forEach((key) => property({ type: Object, attribute: false })(Base.prototype, key));

  // Define the mixed class
  class DesignSystemMixed extends Base {
    // Placeholder for default prop getter defined on the instance
    static getDefaultProps?(): Partial<DesignSystemProps>;

    public getInstanceProps() {
      const usedProps = filterProps(this as Record<string, unknown>, designSystemKeys);
      const defaultProps = (this.constructor as typeof DesignSystemMixed).getDefaultProps?.() ?? {};
      return mergeProps(usedProps, defaultProps) as Partial<DesignSystemProps>;
    }
  }

  return DesignSystemMixed as MixedClass<T>;
}
