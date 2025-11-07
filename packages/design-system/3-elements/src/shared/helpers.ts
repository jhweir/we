import type { DesignSystemProps } from '@we/types';
import { paddingKeys, marginKeys, radiusKeys, tokenVar, designSystemKeys } from './tokens';

// Helper to update or remove a style property
function updateStyle(el: HTMLElement, prop: string, value?: string) {
  if (value !== undefined && value !== null && value !== '') el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
}

export function getInlineStyles(instance: Record<string, any>): Record<string, any> {
  const baseStyles = instance.styles || {};
  const hoverStyles = instance.hover?.styles || {};
  const activeStyles = instance.active?.styles || {};

  let inlineStyles = baseStyles;
  if (instance.isActive) inlineStyles = { ...baseStyles, ...activeStyles };
  else if (instance.isHovered) inlineStyles = { ...baseStyles, ...hoverStyles };
  return inlineStyles;
}

// Helper to merge design system props with component specific defaults
export function mergeDesignSystemProps(
  props: Record<string, any>,
  defaults: Partial<DesignSystemProps>,
): DesignSystemProps {
  // Select used design system props from the instance
  const picked: Partial<DesignSystemProps> = Object.fromEntries(
    designSystemKeys.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]),
  );

  // Merge defaults with picked props
  const merged = { ...defaults, ...picked };

  // Handle precedence so generic props override specific defaults
  // Margin shorthand precedence
  if (props.m !== undefined) {
    if (props.mx === undefined) merged.mx = props.m;
    if (props.my === undefined) merged.my = props.m;
    if (props.mt === undefined) merged.mt = props.m;
    if (props.mr === undefined) merged.mr = props.m;
    if (props.mb === undefined) merged.mb = props.m;
    if (props.ml === undefined) merged.ml = props.m;
  }

  // Padding shorthand precedence
  if (props.p !== undefined) {
    if (props.px === undefined) merged.px = props.p;
    if (props.py === undefined) merged.py = props.p;
    if (props.pt === undefined) merged.pt = props.p;
    if (props.pr === undefined) merged.pr = props.p;
    if (props.pb === undefined) merged.pb = props.p;
    if (props.pl === undefined) merged.pl = props.p;
  }

  // Radius shorthand precedence
  if (props.r !== undefined) {
    if (props.rtl === undefined) merged.rtl = props.r;
    if (props.rtr === undefined) merged.rtr = props.r;
    if (props.rbr === undefined) merged.rbr = props.r;
    if (props.rbl === undefined) merged.rbl = props.r;
    if (props.rt === undefined) merged.rt = props.r;
    if (props.rb === undefined) merged.rb = props.r;
    if (props.rl === undefined) merged.rl = props.r;
    if (props.rr === undefined) merged.rr = props.r;
  }

  return merged;
}

// Set design system CSS variables on an element
export function setDesignSystemVars(el: HTMLElement, props: DesignSystemProps, type?: string) {
  const prefix = `--we-${type ? `${type}-` : ''}`;

  // Colors
  updateStyle(el, `${prefix}bg`, props.bg ? tokenVar('color', props.bg, '') : undefined);
  updateStyle(el, `${prefix}color`, props.color ? tokenVar('color', props.color, '') : undefined);

  // Flex
  updateStyle(el, `${prefix}direction`, props.direction);
  updateStyle(el, `${prefix}ax`, props.ax);
  updateStyle(el, `${prefix}ay`, props.ay);
  updateStyle(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
  updateStyle(el, `${prefix}gap`, props.gap ? tokenVar('space', props.gap) : undefined);

  // Margin
  updateStyle(
    el,
    `${prefix}margin`,
    marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('space', props.mt || props.my || props.m),
          tokenVar('space', props.mr || props.mx || props.m),
          tokenVar('space', props.mb || props.my || props.m),
          tokenVar('space', props.ml || props.mx || props.m),
        ].join(' ')
      : undefined,
  );

  // Padding
  updateStyle(
    el,
    `${prefix}padding`,
    paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('space', props.pt || props.py || props.p),
          tokenVar('space', props.pr || props.px || props.p),
          tokenVar('space', props.pb || props.py || props.p),
          tokenVar('space', props.pl || props.px || props.p),
        ].join(' ')
      : undefined,
  );

  // Radius
  updateStyle(
    el,
    `${prefix}radius`,
    radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('radius', props.rtl || props.rt || props.rl || props.r),
          tokenVar('radius', props.rtr || props.rt || props.rr || props.r),
          tokenVar('radius', props.rbr || props.rb || props.rr || props.r),
          tokenVar('radius', props.rbl || props.rb || props.rl || props.r),
        ].join(' ')
      : undefined,
  );
}

// Generate base CSS variables for design system props
export function baseCssVars() {
  return `
    background: var(--we-bg);
    color: var(--we-color);
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
