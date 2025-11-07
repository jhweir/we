import { createMemo, JSX, splitProps } from 'solid-js';

import type { AlignPosition, AlignPositionAndSpacing, RadiusToken, SpaceToken } from '../../../shared/types';

type RowPropsBase = {
  // Layout
  width?: string;
  height?: string;
  ax?: AlignPositionAndSpacing; // Align X axis (←→)
  ay?: AlignPosition; // Align Y axis (↑↓)
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

  // Standard HTML props
  styles?: JSX.CSSProperties;
  children?: JSX.Element;
};

export type RowProps = RowPropsBase & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style' | 'color'>;

function tokenVar(prefix: string, token?: string) {
  return token ? `var(--we-${prefix}-${token})` : '0';
}

export function Row(allProps: RowProps) {
  // prettier-ignore
  const [props, rest] = splitProps(allProps, [
    'width','height','ax','ay','wrap','reverse','gap', // Layout
    'p','pl','pr','pt','pb','px','py', // Padding
    'm','ml','mr','mt','mb','mx','my', // Margin
    'r','rt','rb','rl','rr','rtl','rtr','rbr','rbl', // Radius
    'bg','color', // Colors
    'styles','children', // Other
  ] as const);

  const reactiveStyles = createMemo(() => {
    // Layout
    const style: JSX.CSSProperties = {
      display: 'flex',
      'flex-direction': props.reverse ? 'row-reverse' : 'row',
      'flex-wrap': props.wrap ? 'wrap' : 'nowrap',
      ...props.styles,
    };

    // Width & Height
    if (props.width) style.width = props.width;
    if (props.height) style.height = props.height;

    // Main axis (X) via justify-content
    if (props.ax === 'center') style['justify-content'] = 'center';
    else if (props.ax === 'end') style['justify-content'] = 'flex-end';
    else if (props.ax === 'between') style['justify-content'] = 'space-between';
    else if (props.ax === 'around') style['justify-content'] = 'space-around';
    else style['justify-content'] = 'flex-start';

    // Cross axis (Y) via align-items
    if (props.ay === 'center') style['align-items'] = 'center';
    else if (props.ay === 'end') style['align-items'] = 'flex-end';
    else style['align-items'] = 'flex-start';

    // Gap
    if (props.gap) style.gap = tokenVar('space', props.gap);

    // Padding (T R B L)
    const padding = [
      tokenVar('space', props.pt || props.py || props.p),
      tokenVar('space', props.pr || props.px || props.p),
      tokenVar('space', props.pb || props.py || props.p),
      tokenVar('space', props.pl || props.px || props.p),
    ].join(' ');
    if (padding !== '0 0 0 0') style.padding = padding;

    // Margin (T R B L)
    const margin = [
      tokenVar('space', props.mt || props.my || props.m),
      tokenVar('space', props.mr || props.mx || props.m),
      tokenVar('space', props.mb || props.my || props.m),
      tokenVar('space', props.ml || props.mx || props.m),
    ].join(' ');
    if (margin !== '0 0 0 0') style.margin = margin;

    // Border radius (TL TR BR BL)
    const radius = [
      tokenVar('size', props.rtl || props.rt || props.rl || props.r),
      tokenVar('size', props.rtr || props.rt || props.rr || props.r),
      tokenVar('size', props.rbr || props.rb || props.rr || props.r),
      tokenVar('size', props.rbl || props.rb || props.rl || props.r),
    ].join(' ');
    if (radius !== '0 0 0 0') style['border-radius'] = radius;

    // Colors
    if (props.bg) style['background-color'] = `var(--we-color-${props.bg})`;
    if (props.color) style.color = `var(--we-color-${props.color})`;

    return style;
  });

  return (
    <div style={reactiveStyles()} {...rest}>
      {props.children}
    </div>
  );
}
