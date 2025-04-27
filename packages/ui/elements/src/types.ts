const namedSize = ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
const numberedSize = ['', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] as const;
const alignPosition = ['', 'center', 'end'] as const;
const alignPositionAndSpacing = [...alignPosition, 'between', 'around'] as const;

export type NamedSize = (typeof namedSize)[number];
export type NumberedSize = (typeof numberedSize)[number];
export type AlignPosition = (typeof alignPosition)[number];
export type AlignPositionAndSpacing = (typeof alignPositionAndSpacing)[number];

export type BadgeVariant = '' | 'primary' | 'success' | 'danger' | 'warning';
export type BadgeSize = '' | 'sm' | 'lg';
