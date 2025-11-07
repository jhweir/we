export const paddingKeys = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'] as const;
export const marginKeys = ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'] as const;
export const radiusKeys = ['r', 'rr', 'rt', 'rb', 'rl', 'rtl', 'rtr', 'rbr', 'rbl'] as const;

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export function tokenVar(prefix: string, token?: string, fallback = '0') {
  // If no token, return fallback
  if (!token) return fallback;

  // Allow raw hex values for color tokens
  if (prefix === 'color' && isHexColor(token)) return token;

  // Otherwise return CSS variable
  return `var(--we-${prefix}-${token})`;
}
