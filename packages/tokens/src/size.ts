/**
 * SIZE TOKEN DEFINITIONS
 * This file defines size tokens that serve as the source of truth for the design system.
 */

// Literal union type for named sizes
export type SizeToken = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * Named size scale.
 * Defines standardized sizes for components and layouts using T-shirt style naming.
 * These values are used for consistent component sizing throughout the system.
 */
export const size = {
  xxs: '1.25rem', // ~20px - Extra extra small
  xs: '1.75rem', // ~28px - Extra small
  sm: '2.25rem', // ~36px - Small
  md: '2.625rem', // ~42px - Medium (default)
  lg: '3.25rem', // ~52px - Large
  xl: '3.8rem', // ~61px - Extra large
  xxl: '5rem', // ~80px - Extra extra large
} satisfies Record<SizeToken, string>;
