import { defaultTemplateSchema, secondaryTemplateSchema, testTemplateSchema } from '../schemas';

export const templateRegistry = {
  default: defaultTemplateSchema,
  secondary: secondaryTemplateSchema,
  test: testTemplateSchema,
};

export type TemplateId = keyof typeof templateRegistry;

export function isValidTemplateId(key: unknown): key is TemplateId {
  return typeof key === 'string' && key in templateRegistry;
}
