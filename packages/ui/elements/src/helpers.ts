export function generateVariable(variable: string, value?: string, fallback = '0'): string {
  return value ? `var(--${variable}-${value})` : fallback;
}
