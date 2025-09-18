// Re-export token types from @we/tokens
export type { SizeToken, RadiusToken, SpaceToken } from '@we/tokens';

// Shared package specific types
type AlignPositionTuple = readonly ['start', 'center', 'end'];
type AlignPositionAndSpacingTuple = [...AlignPositionTuple, 'between', 'around'];

export type AlignPosition = AlignPositionTuple[number];
export type AlignPositionAndSpacing = AlignPositionAndSpacingTuple[number];
