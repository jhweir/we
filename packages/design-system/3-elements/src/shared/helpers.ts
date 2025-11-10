import type { DesignSystemProps } from '@we/types';
import {
  tokenVar,
  paddingKeys,
  marginKeys,
  radiusKeys,
  getMarginValues,
  getPaddingValues,
  getRadiusValues,
  mapFlexAxes,
} from '@we/design-system-utils';

type ElementState = 'hover' | 'active' | 'focus' | 'disabled';

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
  const { main, cross } = mapFlexAxes(props, props.direction ?? 'row');
  updateStyle(el, `${prefix}main-axis`, main);
  updateStyle(el, `${prefix}cross-axis`, cross);
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

// Generate design system styles for Lit components
export function hostStyles() {
  return `
    display: flex;
    transition: all 0.2s;

    width: var(--we-width);
    height: var(--we-height);
    margin: var(--we-margin);
  `;
}

export function hostStateStyles(state: ElementState) {
  const prefix = `--we-${state}-`;
  return `
      width: var(${prefix}width, var(--we-width));
      height: var(${prefix}height, var(--we-height));
      margin: var(${prefix}margin, var(--we-margin));
  `;
}

export function baseStyles() {
  return `
    display: flex;
    width: 100%;
    height: 100%;
    transition: all 0.2s;

    background: var(--we-bg);
    color: var(--we-color);
    flex-direction: var(--we-direction);
    justify-content: var(--we-main-axis);
    align-items: var(--we-cross-axis);
    flex-wrap: var(--we-wrap);
    gap: var(--we-gap);
    padding: var(--we-padding);
    border-radius: var(--we-radius);
  `;
}

export function baseStateStyles(state: ElementState) {
  const prefix = `--we-${state}-`;
  return `
    background: var(${prefix}bg, var(--we-bg));
    color: var(${prefix}color, var(--we-color));
    flex-direction: var(${prefix}direction, var(--we-direction));
    justify-content: var(${prefix}main-axis, var(--we-main-axis));
    align-items: var(${prefix}cross-axis, var(--we-cross-axis));
    flex-wrap: var(${prefix}wrap, var(--we-wrap));
    gap: var(${prefix}gap, var(--we-gap));
    padding: var(${prefix}padding, var(--we-padding));
    border-radius: var(${prefix}radius, var(--we-radius));
  `;
}

export function designSystemStyles(states: Array<ElementState> = ['hover']) {
  const hostStateCss = states
    .map((state) =>
      state === 'disabled'
        ? `:host([disabled]) {${hostStateStyles('disabled')}}`
        : `:host(:${state}) {${hostStateStyles(state)}}`,
    )
    .join('\n');

  const baseStateCss = states
    .map((state) =>
      state === 'disabled'
        ? `[part='base']:disabled,\n[part='base'][aria-disabled='true'] {${baseStateStyles('disabled')}}`
        : `[part='base']:${state}:not(:disabled),\n[part='base']:${state}:not([aria-disabled='true']) {${baseStateStyles(state)}}`,
    )
    .join('\n');

  return `
    :host {${hostStyles()}}
    ${hostStateCss}
    [part='base'] {${baseStyles()}}
    ${baseStateCss}
  `;
}
