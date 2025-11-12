import type { RadiusToken, SpaceToken } from '@we/tokens';

export type ElementState = 'hover' | 'focus' | 'active' | 'disabled';
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexMainAxis = 'start' | 'center' | 'end' | 'between' | 'around' | 'even';
export type FlexCrossAxis = 'start' | 'center' | 'end' | 'stretch';

export interface DesignSystemProps {
  // Colors
  bg?: string;
  color?: string;

  // Layout
  width?: string;
  height?: string;
  direction?: FlexDirection;
  ax?: FlexMainAxis | FlexCrossAxis;
  ay?: FlexMainAxis | FlexCrossAxis;
  wrap?: boolean;
  gap?: SpaceToken;

  // Margin
  m?: SpaceToken;
  ml?: SpaceToken;
  mr?: SpaceToken;
  mt?: SpaceToken;
  mb?: SpaceToken;
  mx?: SpaceToken;
  my?: SpaceToken;

  // Padding
  p?: SpaceToken;
  pl?: SpaceToken;
  pr?: SpaceToken;
  pt?: SpaceToken;
  pb?: SpaceToken;
  px?: SpaceToken;
  py?: SpaceToken;

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

  // Dynamic styles for states
  hoverProps?: Partial<DesignSystemProps>;
  activeProps?: Partial<DesignSystemProps>;
  focusProps?: Partial<DesignSystemProps>;
  disabledProps?: Partial<DesignSystemProps>;
}

// TODO:

// allow raw px or % values for spacing and radius as well as tokens

// add more props:
// display?: 'flex' | 'block' | 'inline' | ...
// position?: 'relative' | 'absolute' | ...
// overflow?: 'hidden' | 'auto'
// cursor?: 'pointer' | 'default'
// textAlign?: 'left' | 'center'
// fontWeight?, fontSize?
// border?, shadow?
