// Re-export token types from @we/tokens
export type { SizeToken, SpaceToken } from '@we/tokens';

// Shared package specific types
const alignPosition = ['start', 'center', 'end'] as const;
const alignPositionAndSpacing = [...alignPosition, 'between', 'around'] as const;

export type AlignPosition = (typeof alignPosition)[number];
export type AlignPositionAndSpacing = (typeof alignPositionAndSpacing)[number];
