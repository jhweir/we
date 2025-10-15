import type { JSX } from 'solid-js';

import type {
  ComponentRegistry as SharedComponentRegistry,
  RendererOutput as SharedRendererOutput,
  RenderSchemaProps as SharedRenderSchemaProps,
  RouteSchema as SharedRouteSchema,
  SchemaNode as SharedSchemaNode,
  TemplateSchema as SharedTemplateSchema,
} from '../../shared/types';

export type ComponentRegistry = SharedComponentRegistry<JSX.Element>;
export type SchemaNode = SharedSchemaNode<JSX.Element>;
export type TemplateSchema = SharedTemplateSchema<JSX.Element>;
export type RouteSchema = SharedRouteSchema<JSX.Element>;
export type RenderSchemaProps = SharedRenderSchemaProps<JSX.Element>;
export type RendererOutput = SharedRendererOutput<JSX.Element>;
