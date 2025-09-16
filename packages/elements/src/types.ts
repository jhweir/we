export type { SizeToken, SpaceToken } from '@we/tokens';

// const namedSize = ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
// const numberedSize = ['', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] as const;
const alignPosition = ['', 'center', 'end'] as const;
const alignPositionAndSpacing = [...alignPosition, 'between', 'around'] as const;
const allowedTextTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small', 'b', 'i', 'span', 'label', 'div'] as const;

// export type NamedSize = (typeof namedSize)[number];
// export type NumberedSize = (typeof numberedSize)[number];
export type AlignPosition = (typeof alignPosition)[number];
export type AlignPositionAndSpacing = (typeof alignPositionAndSpacing)[number];
export type TextTag = (typeof allowedTextTags)[number];

export type BadgeVariant = '' | 'primary' | 'success' | 'danger' | 'warning';
export type BadgeSize = '' | 'sm' | 'lg';
export type ButtonVariant = 'default' | 'primary' | 'link' | 'subtle' | 'transparent' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconSize = '' | 'xs' | 'sm' | 'lg' | 'xl';
export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
export type ModalSize = '' | 'xs' | 'sm' | 'lg' | 'xl' | 'fullscreen';
export type SpinnerSize = '' | 'sm' | 'lg';
export type PopoverEvent = 'contextmenu' | 'mouseover' | 'click';
export type TextVariant =
  | ''
  | 'heading'
  | 'heading-sm'
  | 'heading-lg'
  | 'subheading'
  | 'ingress'
  | 'body'
  | 'label'
  | 'footnote';
export type PopoverPlacement =
  | 'auto'
  | 'auto-start'
  | 'auto-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end';
