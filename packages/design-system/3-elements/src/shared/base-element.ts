import { LitElement } from 'lit';
import type { DesignSystemProps } from '@we/types';

const paddingKeys = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'] as const;
const marginKeys = ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'] as const;
const radiusKeys = ['r', 'rr', 'rt', 'rb', 'rl', 'rtl', 'rtr', 'rbr', 'rbl'] as const;

export function tokenVar(prefix: string, token?: string, fallback = '0') {
  return token ? `var(--we-${prefix}-${token})` : fallback;
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function tokenVarOrHex(prefix: string, token?: string, fallback = '0') {
  if (token && isHexColor(token)) return token;
  return token ? `var(--we-${prefix}-${token})` : fallback;
}

function setDesignSystemVars(el: HTMLElement, props: DesignSystemProps, type?: string) {
  const prefix = `--we-${type ? `${type}-` : ''}`;
  // Colors
  if (props.bg) el.style.setProperty(`${prefix}bg`, tokenVarOrHex('color', props.bg, ''));
  if (props.color) el.style.setProperty(`${prefix}color`, tokenVarOrHex('color', props.color, ''));

  // Flex
  if (props.gap) el.style.setProperty(`${prefix}gap`, tokenVar('space', props.gap));
  if (props.ax) el.style.setProperty(`${prefix}ax`, props.ax);
  if (props.ay) el.style.setProperty(`${prefix}ay`, props.ay);
  if (typeof props.wrap !== 'undefined') el.style.setProperty(`${prefix}wrap`, props.wrap ? 'wrap' : 'nowrap');
  if (typeof props.reverse !== 'undefined')
    el.style.setProperty(`${prefix}direction`, props.reverse ? 'row-reverse' : 'row');

  // Padding
  const hasPadding = paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null);
  if (!hasPadding) el.style.removeProperty(`${prefix}padding`);
  else {
    const padding = [
      tokenVar('space', props.pt || props.py || props.p),
      tokenVar('space', props.pr || props.px || props.p),
      tokenVar('space', props.pb || props.py || props.p),
      tokenVar('space', props.pl || props.px || props.p),
    ].join(' ');
    el.style.setProperty(`${prefix}padding`, padding);
  }

  // Margin
  if (marginKeys.some((k) => k in props)) {
    const margin = [
      tokenVar('space', props.mt || props.my || props.m),
      tokenVar('space', props.mr || props.mx || props.m),
      tokenVar('space', props.mb || props.my || props.m),
      tokenVar('space', props.ml || props.mx || props.m),
    ].join(' ');
    el.style.setProperty(`${prefix}margin`, margin);
  }

  // Radius (TL TR BR BL)
  if (radiusKeys.some((k) => k in props)) {
    const radius = [
      tokenVar('radius', props.rtl || props.rt || props.rl || props.r),
      tokenVar('radius', props.rtr || props.rt || props.rr || props.r),
      tokenVar('radius', props.rbr || props.rb || props.rr || props.r),
      tokenVar('radius', props.rbl || props.rb || props.rl || props.r),
    ].join(' ');
    el.style.setProperty(`${prefix}radius`, radius);
  }
}

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
  }
}
