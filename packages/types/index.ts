import type { RadiusToken, SpaceToken } from '@we/tokens';

// Shared package specific types
type AlignPositionTuple = readonly ['start', 'center', 'end'];
type AlignPositionAndSpacingTuple = [...AlignPositionTuple, 'between', 'around'];

export type AlignPosition = AlignPositionTuple[number];
export type AlignPositionAndSpacing = AlignPositionAndSpacingTuple[number];

export interface DesignSystemProps {
  // Flex
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

  // Hover
  hover?: Record<string, string | undefined>;

  // Standard HTML props
  styles?: Record<string, string | number | undefined>;
}
