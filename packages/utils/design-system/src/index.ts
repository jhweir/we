import type { DesignSystemProps } from '@we/types';

const colorKeys = ['bg', 'color'] as const;
const layoutKeys = ['height', 'width', 'direction', 'ax', 'ay', 'wrap', 'gap'] as const;
const styleKeys = ['hover', 'active', 'styles'] as const;
export const paddingKeys = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'] as const;
export const marginKeys = ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'] as const;
export const radiusKeys = ['r', 'rr', 'rt', 'rb', 'rl', 'rtl', 'rtr', 'rbr', 'rbl'] as const;
export const designSystemKeys = [
  ...colorKeys,
  ...layoutKeys,
  ...paddingKeys,
  ...marginKeys,
  ...radiusKeys,
  ...styleKeys,
];

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function tokenVar(prefix: string, token?: string, fallback = '0') {
  // If no token, return fallback
  if (!token) return fallback;

  // Allow raw hex values for color tokens
  if (prefix === 'color' && isHexColor(token)) return token;

  // Otherwise return CSS variable
  return `var(--we-${prefix}-${token})`;
}

export function getMarginValues(props: DesignSystemProps) {
  return [
    tokenVar('space', props['mt'] || props['my'] || props['m']),
    tokenVar('space', props['mr'] || props['mx'] || props['m']),
    tokenVar('space', props['mb'] || props['my'] || props['m']),
    tokenVar('space', props['ml'] || props['mx'] || props['m']),
  ].join(' ');
}

export function getPaddingValues(props: DesignSystemProps) {
  return [
    tokenVar('space', props['pt'] || props['py'] || props['p']),
    tokenVar('space', props['pr'] || props['px'] || props['p']),
    tokenVar('space', props['pb'] || props['py'] || props['p']),
    tokenVar('space', props['pl'] || props['px'] || props['p']),
  ].join(' ');
}

export function getRadiusValues(props: DesignSystemProps) {
  return [
    tokenVar('radius', props['rtl'] || props['rt'] || props['rl'] || props['r']),
    tokenVar('radius', props['rtr'] || props['rt'] || props['rr'] || props['r']),
    tokenVar('radius', props['rbr'] || props['rb'] || props['rr'] || props['r']),
    tokenVar('radius', props['rbl'] || props['rb'] || props['rl'] || props['r']),
  ].join(' ');
}

// Helper to merge props with component specific defaults with the correct precedence
export function mergeProps(
  props: Record<string, unknown>,
  defaults: Record<string, unknown>,
  keys: readonly string[] = designSystemKeys,
): DesignSystemProps {
  // Select used props from the instance
  const usedProps = Object.fromEntries(keys.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]));

  // Spread used props over defaults
  const merged = { ...defaults, ...usedProps };

  // Handle precedence so used generic props (m, p, r etc.) override specific defaults (mx, pt, rtl etc.)
  // Margin
  if (props.m !== undefined) {
    if (props.mx === undefined) merged.mx = props.m;
    if (props.my === undefined) merged.my = props.m;
    if (props.mt === undefined) merged.mt = props.m;
    if (props.mr === undefined) merged.mr = props.m;
    if (props.mb === undefined) merged.mb = props.m;
    if (props.ml === undefined) merged.ml = props.m;
  }

  // Padding
  if (props.p !== undefined) {
    if (props.px === undefined) merged.px = props.p;
    if (props.py === undefined) merged.py = props.p;
    if (props.pt === undefined) merged.pt = props.p;
    if (props.pr === undefined) merged.pr = props.p;
    if (props.pb === undefined) merged.pb = props.p;
    if (props.pl === undefined) merged.pl = props.p;
  }

  // Radius
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
