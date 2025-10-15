type TokenType = 'string' | 'object';

// Type guard & check for presence of schema tokens
export function hasToken<T extends string>(value: unknown, token: T, type: TokenType): value is Record<T, unknown> {
  const tokenExists = value != null && typeof value === 'object' && token in value;
  return tokenExists && typeof (value as Record<T, unknown>)[token] === type;
}

// Resolves relative paths used in router navigation (e.g. '.', './', '../')
export function resolveRelativePath(rawPath: string, baseDepth: number): string {
  // Get current path segments and start from the base depth
  const segs = window.location.pathname.split('/').filter(Boolean);
  let depth = Math.min(baseDepth, segs.length);

  // Navigate to the parent index for '' or '.'
  if (rawPath === '' || rawPath === '.') return `/${segs.slice(0, depth).join('/')}`;

  // Normalize './' and support parent navigation with '../'
  let path = rawPath;
  if (path.startsWith('./')) path = path.slice(2);
  while (path.startsWith('../') && depth > 0) {
    path = path.slice(3);
    depth--;
  }

  // Rebuild the final path and clean up any double slashes
  const base = '/' + segs.slice(0, depth).join('/');
  const finalPath = (base === '/' ? '' : base.replace(/\/+$/, '')) + '/' + path.replace(/^\/+/, '');
  return finalPath.replace(/\/{2,}/g, '/');
}
