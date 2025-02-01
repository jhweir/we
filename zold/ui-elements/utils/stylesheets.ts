import { css, CSSResult, unsafeCSS } from 'lit';

export function generateStylesheet(property: string, value: string): CSSResult {
  return css`
    :host {
      ${unsafeCSS(property)}: ${unsafeCSS(value)};
    }
  `;
}

interface Property {
  name: string;
  value: string;
}

interface Variable {
  property: string;
  getValue: (value: string) => string;
}

export function generateStylesheets(
  properties: Property[],
  variables: Record<string, Variable>,
): CSSResult[] {
  // Change from CSSStyleSheet[] to CSSResult[]
  return properties.reduce((acc: CSSResult[], { name, value }: Property) => {
    if (!value || !variables[name]) return acc;
    const { property, getValue } = variables[name];
    return [...acc, generateStylesheet(property, getValue(value))];
  }, []);
}

export function generateVariable(variable: string, value: string | null, fallback = '0'): string {
  return value ? `var(--${variable}-${value})` : fallback;
}
