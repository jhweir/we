import type { RadiusToken, SpaceToken } from '@we/tokens';

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
  hoverProps?: Record<string, string | undefined>;
  activeProps?: Record<string, string | undefined>;
  focusProps?: Record<string, string | undefined>;
  disabledProps?: Record<string, string | undefined>;
}
