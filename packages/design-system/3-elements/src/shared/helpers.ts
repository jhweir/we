// import type { DesignSystemProps } from '@we/types';
// import {
//   tokenVar,
//   paddingKeys,
//   marginKeys,
//   radiusKeys,
//   getMarginValues,
//   getPaddingValues,
//   getRadiusValues,
//   mapFlexAxes,
// } from '@we/design-system-utils';

// type ElementState = 'hover' | 'focus' | 'active' | 'disabled';

// // Helper to update or remove a style property
// function updateStyle(el: HTMLElement, prop: string, value?: string) {
//   if (value !== undefined && value !== null && value !== '') el.style.setProperty(prop, value);
//   else el.style.removeProperty(prop);
// }

// // Set design system CSS variables on an element
// export function setDesignSystemVars(el: HTMLElement, props: DesignSystemProps, type?: string) {
//   const prefix = `--we-${type ? `${type}-` : ''}`;

//   // Colors
//   updateStyle(el, `${prefix}bg`, props.bg ? tokenVar('color', props.bg, '') : undefined);
//   updateStyle(el, `${prefix}color`, props.color ? tokenVar('color', props.color, '') : undefined);

//   // Layout
//   updateStyle(el, `${prefix}height`, props.height);
//   updateStyle(el, `${prefix}width`, props.width);
//   updateStyle(el, `${prefix}direction`, props.direction);
//   const { main, cross } = mapFlexAxes(props, props.direction ?? 'row');
//   updateStyle(el, `${prefix}main-axis`, main);
//   updateStyle(el, `${prefix}cross-axis`, cross);
//   updateStyle(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
//   updateStyle(el, `${prefix}gap`, props.gap ? tokenVar('space', props.gap) : undefined);

//   // Margin
//   const hasMargin = marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
//   updateStyle(el, `${prefix}margin`, hasMargin ? getMarginValues(props) : undefined);

//   // Padding
//   const hasPadding = paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
//   updateStyle(el, `${prefix}padding`, hasPadding ? getPaddingValues(props) : undefined);

//   // Radius
//   const hasRadius = radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
//   updateStyle(el, `${prefix}radius`, hasRadius ? getRadiusValues(props) : undefined);
// }

// // Generate design system styles for Lit components
// export function hostStyles() {
//   return `
//     display: flex;
//     transition: all 0.2s;

//     width: var(--we-width);
//     height: var(--we-height);
//     margin: var(--we-margin);
//   `;
// }

// export function hostStateStyles(state: ElementState) {
//   const prefix = `--we-${state}-`;
//   return `
//       width: var(${prefix}width, var(--we-width));
//       height: var(${prefix}height, var(--we-height));
//       margin: var(${prefix}margin, var(--we-margin));
//   `;
// }

// export function baseStyles() {
//   return `
//     display: flex;
//     width: 100%;
//     height: 100%;
//     transition: all 0.2s;

//     background: var(--we-bg);
//     color: var(--we-color);
//     flex-direction: var(--we-direction);
//     justify-content: var(--we-main-axis);
//     align-items: var(--we-cross-axis);
//     flex-wrap: var(--we-wrap);
//     gap: var(--we-gap);
//     padding: var(--we-padding);
//     border-radius: var(--we-radius);
//   `;
// }

// export function baseStateStyles(state: ElementState) {
//   const prefix = `--we-${state}-`;
//   return `
//     background: var(${prefix}bg, var(--we-bg));
//     color: var(${prefix}color, var(--we-color));
//     flex-direction: var(${prefix}direction, var(--we-direction));
//     justify-content: var(${prefix}main-axis, var(--we-main-axis));
//     align-items: var(${prefix}cross-axis, var(--we-cross-axis));
//     flex-wrap: var(${prefix}wrap, var(--we-wrap));
//     gap: var(${prefix}gap, var(--we-gap));
//     padding: var(${prefix}padding, var(--we-padding));
//     border-radius: var(${prefix}radius, var(--we-radius));
//   `;
// }

// export function designSystemStyles(states: Array<ElementState> = ['hover']) {
//   const hostStateCss = states
//     .map((state) =>
//       state === 'disabled'
//         ? `:host([disabled]) {${hostStateStyles('disabled')}}`
//         : `:host(:${state}) {${hostStateStyles(state)}}`,
//     )
//     .join('\n');

//   const baseStateCss = states
//     .map((state) =>
//       state === 'disabled'
//         ? `[part='base']:disabled,\n[part='base'][aria-disabled='true'] {${baseStateStyles('disabled')}}`
//         : `[part='base']:${state}:not(:disabled),\n[part='base']:${state}:not([aria-disabled='true']) {${baseStateStyles(state)}}`,
//     )
//     .join('\n');

//   return `
//     :host {${hostStyles()}}
//     ${hostStateCss}
//     [part='base'] {${baseStyles()}}
//     ${baseStateCss}
//   `;
// }

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
  mergeProps,
} from '@we/design-system-utils';

function setVar(el: HTMLElement, name: string, value: unknown, mapper?: (v: any) => string | undefined) {
  if (value === undefined || value === null || value === '') {
    el.style.removeProperty(name);
    return;
  }
  const final = mapper ? mapper(value) : value;
  if (final != null) el.style.setProperty(name, final as string);
}

type HostPropKey = 'width' | 'height' | 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml';

const HOST_PROP_KEYS: HostPropKey[] = ['width', 'height', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'];

const isHostProp = (k: string): k is HostPropKey => HOST_PROP_KEYS.includes(k as HostPropKey);

function writeVars(el: HTMLElement, props: Partial<DesignSystemProps>, state?: ElementState) {
  const prefix = state ? `--we-${state}-` : '--we-';

  // === Host-only vars (layout in parent) ===
  setVar(el, `${prefix}width`, props.width);
  setVar(el, `${prefix}height`, props.height);
  const hasMargin = marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  console.log('hasMargin', hasMargin, props);
  setVar(el, `${prefix}margin`, hasMargin ? getMarginValues(props) : undefined);

  // === Base-only vars (inner appearance) ===
  setVar(el, `${prefix}bg`, props.bg, (v) => tokenVar('color', v));
  setVar(el, `${prefix}color`, props.color, (v) => tokenVar('color', v));
  setVar(el, `${prefix}direction`, props.direction);
  const { main, cross } = mapFlexAxes(props, props.direction ?? 'row');
  setVar(el, `${prefix}main-axis`, main);
  setVar(el, `${prefix}cross-axis`, cross);
  setVar(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
  setVar(el, `${prefix}gap`, props.gap, (v) => tokenVar('space', v));

  const hasPadding = paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  setVar(el, `${prefix}padding`, hasPadding ? getPaddingValues(props) : undefined);

  const hasRadius = radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  setVar(el, `${prefix}radius`, hasRadius ? getRadiusValues(props) : undefined);
}

function writeAllVars(el: HTMLElement, props: DesignSystemProps) {
  writeVars(el, props); // base

  (['hover', 'focus', 'active', 'disabled'] as const).forEach((state) => {
    const stateProps = props[`${state}Props`];
    if (stateProps && typeof stateProps === 'object') {
      writeVars(el, stateProps, state);
    }
  });
}

const hostBaseCSS = `
  display: flex;
  transition: all .2s;
  width: var(--we-width);
  height: var(--we-height);
  margin: var(--we-margin);
`.trim();

const basePartCSS = `
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

function hostStateCSS(state: ElementState) {
  const p = `--we-${state}-`;
  return `
    width: var(${p}width, var(--we-width));
    height: var(${p}height, var(--we-height));
    margin: var(${p}margin, var(--we-margin));
  `.trim();
}

function baseStateCSS(state: ElementState) {
  const p = `--we-${state}-`;
  return `
    background: var(${p}bg, var(--we-bg));
    color: var(${p}color, var(--we-color));
    flex-direction: var(${p}direction, var(--we-direction));
    justify-content: var(${p}main-axis, var(--we-main-axis));
    align-items: var(${p}cross-axis, var(--we-cross-axis));
    flex-wrap: var(${p}wrap, var(--we-wrap));
    gap: var(${p}gap, var(--we-gap));
    padding: var(${p}padding, var(--we-padding));
    border-radius: var(${p}radius, var(--we-radius));
  `.trim();
}

export function getDesignSystemCSS(
  el: HTMLElement,
  rawProps: Partial<DesignSystemProps>,
  defaults: Partial<DesignSystemProps>,
): string {
  const props = mergeProps(rawProps as any, defaults) as DesignSystemProps;
  writeAllVars(el, props);

  el.setAttribute('data-we', ''); // ← required

  const rules: string[] = [];

  rules.push(`:host([data-we]) { ${hostBaseCSS} }`);
  rules.push(`:host([data-we]) [part='base'] { ${basePartCSS} }`);

  // Build state styles
  const order: ElementState[] = ['hover', 'focus', 'active', 'disabled'];
  for (const st of order) {
    const stateProps = props[`${st}Props` as keyof DesignSystemProps] as any;
    if (!stateProps || typeof stateProps !== 'object' || !Object.keys(stateProps).length) continue;

    const hasHostChange = HOST_PROP_KEYS.some((k) => stateProps[k] != null);
    const hasBaseChange = Object.keys(stateProps).some((k) => !isHostProp(k) && k !== 'styles' && !k.endsWith('Props'));

    if (!hasHostChange && !hasBaseChange) continue;

    // HOST STATE: use data-we
    if (hasHostChange) {
      const hostSel = st === 'disabled' ? `:host([data-we][disabled])` : `:host([data-we]:${st})`;
      rules.push(`${hostSel} { ${hostStateCSS(st)} }`);
    }

    // BASE STATE: use data-we
    if (hasBaseChange) {
      const baseSel =
        st === 'disabled'
          ? `:host([data-we]) [part='base']:disabled, :host([data-we]) [part='base'][aria-disabled='true']`
          : `:host([data-we]) [part='base']:${st}:not(:disabled):not([aria-disabled='true'])`;
      rules.push(`${baseSel} { ${baseStateCSS(st)} }`);
    }
  }

  return rules.join('\n');
}
