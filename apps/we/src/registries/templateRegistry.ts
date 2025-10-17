import { defaultTemplateSchema, secondaryTemplateSchema } from '../schemas';

export const templateRegistry = {
  default: defaultTemplateSchema,
  secondary: secondaryTemplateSchema,
};

export type TemplateKey = keyof typeof templateRegistry;

export function isValidTemplateKey(key: unknown): key is TemplateKey {
  return typeof key === 'string' && key in templateRegistry;
}
