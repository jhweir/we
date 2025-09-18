import { JSX, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { AlignPosition, AlignPositionAndSpacing, RadiusToken, SpaceToken } from '../../../shared/types';

type ColumnPropsBase = {
  // Flex basics
  ax?: AlignPosition;
  ay?: AlignPositionAndSpacing;
  wrap?: boolean;
  reverse?: boolean;
  gap?: SpaceToken;

  // Padding
  p?: SpaceToken;
  pl?: SpaceToken;
  pr?: SpaceToken;
  pt?: SpaceToken;
  pb?: SpaceToken;
  px?: SpaceToken;
  py?: SpaceToken;

  // Margin
  m?: SpaceToken;
  ml?: SpaceToken;
  mr?: SpaceToken;
  mt?: SpaceToken;
  mb?: SpaceToken;
  mx?: SpaceToken;
  my?: SpaceToken;

  // Radius
  r?: RadiusToken;
  rt?: RadiusToken;
  rb?: RadiusToken;
  rl?: RadiusToken;
  rr?: RadiusToken;
  rtl?: RadiusToken;
  rtr?: RadiusToken;
  rbr?: RadiusToken;
  rbl?: RadiusToken;

  // Colors
  bg?: string;
  color?: string;

  // Allow overriding the rendered element and passing other HTML props
  as?: keyof JSX.IntrinsicElements;

  style?: JSX.CSSProperties;
  children?: JSX.Element;
};

export type ColumnProps = ColumnPropsBase & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style' | 'color'>;

function tokenVar(prefix: string, token?: string) {
  return token ? `var(--we-${prefix}-${token})` : '0';
}

export function Column(allProps: ColumnProps) {
  // prettier-ignore
  const [props, rest] = splitProps(allProps, [
    'ax','ay','wrap','reverse','gap', // Flex basics
    'p','pl','pr','pt','pb','px','py', // Padding
    'm','ml','mr','mt','mb','mx','my', // Margin
    'r','rt','rb','rl','rr','rtl','rtr','rbr','rbl', // Radius
    'bg','color', // Colors
    'as','style','children', // Other
  ] as const);

  // Flex basics
  const style: JSX.CSSProperties = {
    display: 'flex',
    'flex-direction': props.reverse ? 'column-reverse' : 'column',
    'flex-wrap': props.wrap ? 'wrap' : 'nowrap',
    ...props.style,
  };

  // Align cross-axis (items)
  if (props.ax === 'center') style['align-items'] = 'center';
  else if (props.ax === 'end') style['align-items'] = 'flex-end';
  else if (props.ax === 'start' || props.ax === '') style['align-items'] = 'flex-start';

  // Align main-axis (content)
  if (props.ay === 'center') style['justify-content'] = 'center';
  else if (props.ay === 'end') style['justify-content'] = 'flex-end';
  else if (props.ay === 'between') style['justify-content'] = 'space-between';
  else if (props.ay === 'around') style['justify-content'] = 'space-around';
  else if (props.ay === 'start' || props.ay === '') style['justify-content'] = 'flex-start';

  // Gap
  if (props.gap) style.gap = tokenVar('space', props.gap);

  // Padding
  const padding = [
    tokenVar('space', props.pt || props.py || props.p),
    tokenVar('space', props.pr || props.px || props.p),
    tokenVar('space', props.pb || props.py || props.p),
    tokenVar('space', props.pl || props.px || props.p),
  ]
    .join(' ')
    .trim();
  if (padding !== '0 0 0 0') style.padding = padding;

  // Margin
  const margin = [
    tokenVar('space', props.mt || props.my || props.m),
    tokenVar('space', props.mr || props.mx || props.m),
    tokenVar('space', props.mb || props.my || props.m),
    tokenVar('space', props.ml || props.mx || props.m),
  ]
    .join(' ')
    .trim();
  if (margin !== '0 0 0 0') style.margin = margin;

  // Border radius (TL TR BR BL)
  const radius = [
    tokenVar('radius', props.rtl || props.rt || props.rl || props.r),
    tokenVar('radius', props.rtr || props.rt || props.rr || props.r),
    tokenVar('radius', props.rbr || props.rb || props.rr || props.r),
    tokenVar('radius', props.rbl || props.rb || props.rl || props.r),
  ]
    .join(' ')
    .trim();
  if (radius !== '0 0 0 0') style['border-radius'] = radius;

  // Colors
  if (props.bg) style['background-color'] = `var(--we-color-${props.bg})`;
  if (props.color) style.color = `var(--we-color-${props.color})`;

  return (
    <Dynamic component={props.as || 'div'} style={style} {...rest}>
      {props.children}
    </Dynamic>
  );
}
