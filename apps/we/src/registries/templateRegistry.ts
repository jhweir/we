import { defaultTemplateSchema, secondaryTemplateSchema, simpleTemplateSchema, testTemplateSchema } from '../schemas';

export const templateRegistry = {
  test: testTemplateSchema,
  default: defaultTemplateSchema,
  secondary: secondaryTemplateSchema,
  simple: simpleTemplateSchema,
};

export type TemplateKey = keyof typeof templateRegistry;

export function isValidTemplateKey(key: unknown): key is TemplateKey {
  return typeof key === 'string' && key in templateRegistry;
}
