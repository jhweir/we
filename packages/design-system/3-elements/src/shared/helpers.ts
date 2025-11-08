import type { DesignSystemProps } from '@we/types';
import {
  tokenVar,
  paddingKeys,
  marginKeys,
  radiusKeys,
  getMarginValues,
  getPaddingValues,
  getRadiusValues,
} from '@we/design-system-utils';

// Helper to update or remove a style property
function updateStyle(el: HTMLElement, prop: string, value?: string) {
  if (value !== undefined && value !== null && value !== '') el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
}

// Set design system CSS variables on an element
export function setDesignSystemVars(el: HTMLElement, props: DesignSystemProps, type?: string) {
  const prefix = `--we-${type ? `${type}-` : ''}`;

  // Colors
  updateStyle(el, `${prefix}bg`, props.bg ? tokenVar('color', props.bg, '') : undefined);
  updateStyle(el, `${prefix}color`, props.color ? tokenVar('color', props.color, '') : undefined);

  // Layout
  updateStyle(el, `${prefix}height`, props.height);
  updateStyle(el, `${prefix}width`, props.width);
  updateStyle(el, `${prefix}direction`, props.direction);
  updateStyle(el, `${prefix}ax`, props.ax);
  updateStyle(el, `${prefix}ay`, props.ay);
  updateStyle(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
  updateStyle(el, `${prefix}gap`, props.gap ? tokenVar('space', props.gap) : undefined);

  // Margin
  const hasMargin = marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  updateStyle(el, `${prefix}margin`, hasMargin ? getMarginValues(props) : undefined);

  // Padding
  const hasPadding = paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  updateStyle(el, `${prefix}padding`, hasPadding ? getPaddingValues(props) : undefined);

  // Radius
  const hasRadius = radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  updateStyle(el, `${prefix}radius`, hasRadius ? getRadiusValues(props) : undefined);
}

// Generate base CSS variables for design system props
export function baseCssVars() {
  return `
    background: var(--we-bg);
    color: var(--we-color);
    width: var(--we-width);
    height: var(--we-height);
    flex-direction: var(--we-direction);
    justify-content: var(--we-ax);
    align-items: var(--we-ay);
    flex-wrap: var(--we-wrap);
    gap: var(--we-gap);
    margin: var(--we-margin);
    padding: var(--we-padding);
    border-radius: var(--we-radius);
  `;
}

// Generate CSS variables for a specific state (hover, active etc.)
export function stateCssVars(state: 'hover' | 'active') {
  const prefix = `--we-${state}-`;
  return `
    background: var(${prefix}bg, var(--we-bg));
    color: var(${prefix}color, var(--we-color));
    width: var(${prefix}width, var(--we-width));
    height: var(${prefix}height, var(--we-height));
    flex-direction: var(${prefix}direction, var(--we-direction));
    justify-content: var(${prefix}ax, var(--we-ax));
    align-items: var(${prefix}ay, var(--we-ay));
    flex-wrap: var(${prefix}wrap, var(--we-wrap));
    gap: var(${prefix}gap, var(--we-gap));
    margin: var(${prefix}margin, var(--we-margin));
    padding: var(${prefix}padding, var(--we-padding));
    border-radius: var(${prefix}radius, var(--we-radius));
  `;
}
