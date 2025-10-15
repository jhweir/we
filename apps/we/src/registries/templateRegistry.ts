import { defaultTemplateSchema } from '../schemas/DefaultTemplate.schema';

export const templateRegistry = {
  default: defaultTemplateSchema,
};

export type TemplateKey = keyof typeof templateRegistry;

export function isValidTemplateKey(key: unknown): key is TemplateKey {
  return typeof key === 'string' && key in templateRegistry;
}
