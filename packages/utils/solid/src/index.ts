import { getMarginValues, getPaddingValues, getRadiusValues, tokenVar } from '@we/design-system-utils';
import { DesignSystemProps } from '@we/types';
import type { Accessor } from 'solid-js';
import { JSX } from 'solid-js';

export type MaybeAccessor<T> = T | Accessor<T>;

export function toValue<T>(v: MaybeAccessor<T>): T {
  return typeof v === 'function' ? (v as Accessor<T>)() : v;
}

export type LayoutProps = Omit<DesignSystemProps, 'direction'> & {
  reverse?: boolean;
  styles?: JSX.CSSProperties;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'>;

export function buildLayoutStyles(props: LayoutProps, direction: 'row' | 'column'): JSX.CSSProperties {
  const style: JSX.CSSProperties = {
    display: 'flex',
    'flex-direction': props.reverse ? `${direction}-reverse` : direction,
    'flex-wrap': props.wrap ? 'wrap' : 'nowrap',
    ...props.styles,
  };

  // Axis mapping
  const main = direction === 'row' ? props.ax : props.ay;
  const cross = direction === 'row' ? props.ay : props.ax;

  // Main axis alignment
  if (main === 'center') style['justify-content'] = 'center';
  else if (main === 'end') style['justify-content'] = 'flex-end';
  else if (main === 'between') style['justify-content'] = 'space-between';
  else if (main === 'around') style['justify-content'] = 'space-around';

  // Cross axis alignment
  if (cross === 'center') style['align-items'] = 'center';
  else if (cross === 'end') style['align-items'] = 'flex-end';

  // Other styles
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  if (props.gap) style.gap = tokenVar('space', props.gap);
  if (props.bg) style['background-color'] = `var(--we-color-${props.bg})`;
  if (props.color) style.color = `var(--we-color-${props.color})`;
  const margin = getMarginValues(props);
  if (margin !== '0 0 0 0') style.margin = margin;
  const padding = getPaddingValues(props);
  if (padding !== '0 0 0 0') style.padding = padding;
  const radius = getRadiusValues(props);
  if (radius !== '0 0 0 0') style['border-radius'] = radius;

  return style;
}
