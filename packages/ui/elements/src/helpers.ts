export function generateVariable(variable: string, value: string, fallback = '0') {
  return value ? `var(--${variable}-${value})` : fallback;
}
