import type { RadiusToken, SpaceToken } from '@we/tokens';

// Shared package specific types
type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type AlignPositionTuple = readonly ['start', 'center', 'end'];
type AlignPositionAndSpacingTuple = [...AlignPositionTuple, 'between', 'around'];

export type AlignPosition = AlignPositionTuple[number];
export type AlignPositionAndSpacing = AlignPositionAndSpacingTuple[number];

export interface DesignSystemProps {
  // Colors
  bg?: string;
  color?: string;

  // Layout
  width?: string;
  height?: string;
  direction?: FlexDirection;
  ax?: AlignPositionAndSpacing; // Align X axis (←→)
  ay?: AlignPosition; // Align Y axis (↑↓)
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

  // Standard HTML props
  styles?: Record<string, string | number | undefined>;
}
