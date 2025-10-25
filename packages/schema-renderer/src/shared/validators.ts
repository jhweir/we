import { z } from 'zod';

import { zSchemaNode, zTemplateSchema } from './zodSchemas';

export type ValidationError = { path: string; message: string };
export type ValidationResult = { valid: boolean; errors: ValidationError[] };

// Utility function to convert Zod errors to our `ValidationError` format
function zodErrorToValidationErrors(zodErrors: z.ZodError): ValidationError[] {
  return zodErrors.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// Validate a single SchemaNode using Zod
export function validateNode(node: unknown): ValidationResult {
  try {
    zSchemaNode.parse(node); // Zod runtime validation
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(JSON.stringify(z.treeifyError(error as z.ZodError), null, 2));
      return { valid: false, errors: zodErrorToValidationErrors(error) };
    }
    throw error; // Re-throw unexpected errors
  }
}

// Validate the entire TemplateSchema using Zod
export function validateSchema(schema: unknown): ValidationResult {
  try {
    zTemplateSchema.parse(schema); // Zod runtime validation
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: zodErrorToValidationErrors(error) };
    }
    throw error; // Re-throw unexpected errors
  }
}
