import type { RadiusToken, SpaceToken } from '@we/tokens';

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexMainAxis = 'start' | 'center' | 'end' | 'between' | 'around';
export type FlexCrossAxis = 'start' | 'center' | 'end';

export interface DesignSystemProps {
  // Colors
  bg?: string;
  color?: string;

  // Layout
  width?: string;
  height?: string;
  direction?: FlexDirection;
  ax?: FlexMainAxis;
  ay?: FlexMainAxis;
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
  hover?: Record<string, string | undefined>;
  active?: Record<string, string | undefined>;
}
