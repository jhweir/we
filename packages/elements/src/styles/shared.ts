import { css } from 'lit';

export default css`
  :host {
    box-sizing: border-box;
    font-family: var(--we-font-family);
  }

  :host *,
  :host *:before,
  :host *:after {
    box-sizing: inherit;
  }

  :host *:focus {
    outline: 0;
  }

  [hidden] {
    display: none !important;
  }

  ::-webkit-scrollbar {
    width: var(--we-scrollbar-width);
  }

  ::-webkit-scrollbar-track {
    background-image: var(--we-scrollbar-background-image);
    background: var(--we-scrollbar-background);
  }

  ::-webkit-scrollbar-corner {
    background: var(--we-scrollbar-corner-background);
  }

  ::-webkit-scrollbar-thumb {
    box-shadow: var(--we-scrollbar-thumb-box-shadow);
    border-radius: var(--we-scrollbar-thumb-border-radius);
    background-color: var(--we-scrollbar-thumb-background);
  }
`;

const namedSize = ['', 'xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
const numberedSize = ['', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000'] as const;
const alignPosition = ['', 'center', 'end'] as const;
const alignPositionAndSpacing = [...alignPosition, 'between', 'around'] as const;

export type NamedSize = (typeof namedSize)[number];
export type NumberedSize = (typeof numberedSize)[number];
export type AlignPosition = (typeof alignPosition)[number];
export type AlignPositionAndSpacing = (typeof alignPositionAndSpacing)[number];
