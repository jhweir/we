import { z } from 'zod';

import type { RouteSchema, SchemaNode, SchemaProp, TemplateMeta, TemplateSchema } from './types';

const lazySchemaProp = z.lazy(() => zSchemaProp);
const lazySchemaNode = z.lazy(() => zSchemaNode);
const lazyRouteSchema = z.lazy(() => zRouteSchema);

function schemaNodeShape() {
  return {
    type: z.string().optional(),
    props: z.record(z.string(), lazySchemaProp).optional(),
    slots: z.record(z.string(), lazySchemaNode).optional(),
    routes: z.array(lazyRouteSchema).optional(),
    children: z.array(z.union([lazySchemaNode, z.string()])).optional(),
  };
}

export const zSchemaProp: z.ZodType<SchemaProp> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.string(), z.unknown()),
  z.array(lazySchemaProp),
  z.undefined(),
]);

export const zTemplateMeta: z.ZodType<TemplateMeta> = z
  .object({
    name: z.string(),
    description: z.string(),
    icon: z.string(),
  })
  .strict();

export const zSchemaNode: z.ZodType<SchemaNode> = z.object(schemaNodeShape()).strict();

export const zTemplateSchema: z.ZodType<TemplateSchema> = z
  .object({ ...schemaNodeShape(), meta: zTemplateMeta })
  .strict();

export const zRouteSchema: z.ZodType<RouteSchema> = z
  .object({
    ...schemaNodeShape(),
    path: z.string(),
    routes: z.array(lazyRouteSchema).optional(),
  })
  .strict();
