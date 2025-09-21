/**
 * BORDER TOKEN DEFINITIONS
 * This file defines border tokens that serve as the source of truth for the design system.
 */

import { color } from './color.js';

// Literal union types for border tokens
export type BorderRadiusToken = 'base' | 'sm' | 'md' | 'lg';
export type BorderColorToken = 'base' | 'strong';

/**
 * Border width specification.
 * Defines the standard border width used throughout the system.
 */
export const borderWidth = '1px';

/**
 * Border radius values for different sizes.
 * These define the roundness of corners for UI elements.
 */
export const borderRadius = {
  base: '8px',
  sm: '4px',
  md: '8px',
  lg: '16px',
} satisfies Record<BorderRadiusToken, string>;

/**
 * Border color definitions.
 * These colors reference UI color tokens and are used for borders in different contexts.
 * The integration with the color system ensures borders adapt to theme changes.
 */
export const borderColor = {
  base: color.ui['100'], // Light border - subtle boundaries
  strong: color.ui['200'], // Strong border - more visible boundaries
} satisfies Record<BorderColorToken, string>;

/**
 * Complete border token object that combines all border categories.
 * This is the main export for consumers who need full border tokens.
 */
export const border = {
  width: borderWidth,
  radius: borderRadius,
  color: borderColor,
};
