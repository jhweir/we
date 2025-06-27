const namedSize = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
const numberedSize = ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] as const;
const alignPosition = ['center', 'end'] as const;
const alignSpacing = ['between', 'around'] as const;
const alignPositionAndSpacing = [...alignPosition, ...alignSpacing] as const;

export type NamedSize = (typeof namedSize)[number];
export type NumberedSize = (typeof numberedSize)[number];
export type AlignPosition = (typeof alignPosition)[number];
export type AlignPositionAndSpacing = (typeof alignPositionAndSpacing)[number];

// TODO: Include component specific types here?

export { alignPosition, alignPositionAndSpacing, namedSize, numberedSize };
