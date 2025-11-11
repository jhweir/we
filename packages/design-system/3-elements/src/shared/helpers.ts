import type { DesignSystemProps, ElementState } from '@we/types';
import {
  tokenVar,
  paddingKeys,
  marginKeys,
  radiusKeys,
  getMarginValues,
  getPaddingValues,
  getRadiusValues,
  mapFlexAxes,
  designSystemKeys,
  stateKeys,
} from '@we/design-system-utils';

const ELEMENT_STATES: ElementState[] = ['hover', 'focus', 'active', 'disabled'];
const HOST_PROP_KEYS = ['width', 'height', ...marginKeys] as Array<keyof DesignSystemProps>;
const BASE_PROP_KEYS = designSystemKeys.filter(
  (key) =>
    !HOST_PROP_KEYS.includes(key as (typeof HOST_PROP_KEYS)[number]) &&
    !stateKeys.includes(key as (typeof stateKeys)[number]) &&
    key !== 'styles',
) as Array<keyof DesignSystemProps>;

function setProperty(el: HTMLElement, name: string, value?: string) {
  if (value !== undefined && value !== null && value !== '') el.style.setProperty(name, value);
  else el.style.removeProperty(name);
}

function updateCustomVars(el: HTMLElement, props: Partial<DesignSystemProps>, state?: ElementState) {
  const prefix = state ? `--we-${state}-` : '--we-';

  // Host variables (layout in parent)
  const hasMargin = marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  setProperty(el, `${prefix}width`, props.width);
  setProperty(el, `${prefix}height`, props.height);
  setProperty(el, `${prefix}margin`, hasMargin ? getMarginValues(props) : undefined);

  // Base variables (inner appearance)
  const { main, cross } = mapFlexAxes(props, props.direction ?? 'row');
  const hasPadding = paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  const hasRadius = radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  setProperty(el, `${prefix}bg`, props.bg ? tokenVar('color', props.bg, '') : undefined);
  setProperty(el, `${prefix}color`, props.color ? tokenVar('color', props.color, '') : undefined);
  setProperty(el, `${prefix}direction`, props.direction);
  setProperty(el, `${prefix}main-axis`, main);
  setProperty(el, `${prefix}cross-axis`, cross);
  setProperty(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
  setProperty(el, `${prefix}gap`, props.gap ? tokenVar('space', props.gap) : undefined);
  setProperty(el, `${prefix}padding`, hasPadding ? getPaddingValues(props) : undefined);
  setProperty(el, `${prefix}radius`, hasRadius ? getRadiusValues(props) : undefined);
}

function updateAllCustomVars(el: HTMLElement, props: DesignSystemProps) {
  // Core variables
  updateCustomVars(el, props);

  // State variables
  ELEMENT_STATES.forEach((state) => {
    const stateProps = props[`${state}Props`];
    if (stateProps && typeof stateProps === 'object') updateCustomVars(el, stateProps, state);
  });
}

const hostStyles = `
  display: flex;
  transition: all .2s;

  width: var(--we-width);
  height: var(--we-height);
  margin: var(--we-margin);
`.trim();

const baseStyles = `
  display: flex;
  width: 100%;
  height: 100%;
  transition: all .2s;

  background: var(--we-bg);
  color: var(--we-color);
  flex-direction: var(--we-direction);
  justify-content: var(--we-main-axis);
  align-items: var(--we-cross-axis);
  flex-wrap: var(--we-wrap);
  gap: var(--we-gap);
  padding: var(--we-padding);
  border-radius: var(--we-radius);
`.trim();

function hostStateStyles(state: ElementState) {
  const prefix = `--we-${state}-`;
  return `
    width: var(${prefix}width, var(--we-width));
    height: var(${prefix}height, var(--we-height));
    margin: var(${prefix}margin, var(--we-margin));
  `.trim();
}

function baseStateStyles(state: ElementState) {
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
  `.trim();
}

function hasPropOverride(
  keys: (keyof DesignSystemProps)[],
  stateProps: Partial<DesignSystemProps>,
  props: Partial<DesignSystemProps>,
) {
  return keys.some((k) => stateProps[k] !== null && stateProps[k] !== props[k]);
}

export function getDesignSystemCSS(el: HTMLElement, props: Partial<DesignSystemProps>): string {
  // Update custom variables
  updateAllCustomVars(el, props);

  // Now set ready attribute so we can ensure the design system CSS is applied after static CSS defined in the elements file
  const ready = 'data-we-static-css-ready';
  el.setAttribute(ready, '');

  // Build core styles
  const styles: string[] = [];
  styles.push(`:host([${ready}]) { ${hostStyles} }`);
  styles.push(`:host([${ready}]) [part='base'] { ${baseStyles} }`);

  // Build state styles
  for (const state of ELEMENT_STATES) {
    const stateProps = props[`${state}Props`];
    // Skip if no state props defined
    if (!stateProps || typeof stateProps !== 'object' || !Object.keys(stateProps).length) continue;

    // Check for state prop overrides & skip if no relevant changes
    const hasHostChange = hasPropOverride(HOST_PROP_KEYS, stateProps, props);
    const hasBaseChange = hasPropOverride(BASE_PROP_KEYS, stateProps, props);
    if (!hasHostChange && !hasBaseChange) continue;

    if (hasHostChange) {
      // Build host state styles
      const hostStateSelector = state === 'disabled' ? `:host([${ready}][disabled])` : `:host([${ready}]:${state})`;
      styles.push(`${hostStateSelector} { ${hostStateStyles(state)} }`);
    }

    if (hasBaseChange) {
      // Build base state styles
      const baseStateSelector =
        state === 'disabled'
          ? `:host([${ready}]) [part='base']:disabled, :host([${ready}]) [part='base'][aria-disabled='true']`
          : `:host([${ready}]) [part='base']:${state}:not(:disabled):not([aria-disabled='true'])`;
      styles.push(`${baseStateSelector} { ${baseStateStyles(state)} }`);
    }
  }

  return styles.join('\n');
}
