import { getMarginValues, getPaddingValues, getRadiusValues, mapFlexAxes, tokenVar } from '@we/design-system-utils';
import { DesignSystemProps } from '@we/design-system-types';
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
  // Base flex container styles
  const style: JSX.CSSProperties = {
    display: 'flex',
    'flex-direction': props.reverse ? `${direction}-reverse` : direction,
    'flex-wrap': props.wrap ? 'wrap' : 'nowrap',
    ...props.styles, // Allow custom overrides
  };

  // Colors
  if (props.bg) style['background-color'] = tokenVar('color', props.bg);
  if (props.color) style.color = tokenVar('color', props.color);

  // Layout
  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  const { main, cross } = mapFlexAxes(props, props.reverse ? `${direction}-reverse` : direction);
  style['justify-content'] = main;
  style['align-items'] = cross;
  if (props.gap) style.gap = tokenVar('space', props.gap);

  // Margin
  const margin = getMarginValues(props);
  if (margin !== '0 0 0 0') style.margin = margin;

  // Padding
  const padding = getPaddingValues(props);
  if (padding !== '0 0 0 0') style.padding = padding;

  // Radius
  const radius = getRadiusValues(props);
  if (radius !== '0 0 0 0') style['border-radius'] = radius;

  return style;
}
