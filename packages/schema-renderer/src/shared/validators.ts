import { isObject } from './predicates';
import type { RouteSchema, SchemaNode, TemplateMeta, TemplateSchema } from './types';

export type ValidationError = { path: string; message: string };
export type ValidationResult = { valid: boolean; errors: ValidationError[] };

function report(errors: ValidationError[], path: string, message: string) {
  errors.push({ path, message });
}

function validateMeta(errors: ValidationError[], meta: TemplateMeta, path: string) {
  if (!isObject(meta)) {
    report(errors, `${path}.meta`, 'meta must be an object');
    return;
  }
  if ('name' in meta && typeof meta.name !== 'string')
    report(errors, `${path}.meta.name`, 'meta.name must be a string');
  if ('description' in meta && typeof meta.description !== 'string')
    report(errors, `${path}.meta.description`, 'meta.description must be a string');
  if ('icon' in meta && typeof meta.icon !== 'string')
    report(errors, `${path}.meta.icon`, 'meta.icon must be a string');
}

function validateProps(errors: ValidationError[], props: unknown, path: string) {
  if (!isObject(props)) {
    report(errors, path, 'props must be an object');
    return;
  }
  const p = props as Record<string, unknown>;
  if ('children' in p) {
    const c = p.children;
    if (!(typeof c === 'string' || typeof c === 'number' || isObject(c) || Array.isArray(c))) {
      report(errors, `${path}.children`, 'props.children must be a string, number, object or array');
    }
  }
}

function validateChildren(errors: ValidationError[], children: unknown, path: string) {
  if (!Array.isArray(children)) {
    report(errors, path, 'children must be an array');
    return;
  }
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    const childPath = `${path}[${i}]`;
    if (isObject(c)) validateNode(errors, c, childPath);
    else if (typeof c !== 'string' && typeof c !== 'number') {
      report(errors, childPath, 'child must be string, number or a schema node object');
    }
  }
}

function validateSlots(errors: ValidationError[], slots: unknown, path: string) {
  if (!isObject(slots)) {
    report(errors, path, 'slots must be an object mapping slotName -> node');
    return;
  }
  for (const key of Object.keys(slots ?? {})) {
    const s = (slots as Record<string, unknown>)[key];
    validateNode(errors, s, `${path}.${key}`);
  }
}

function validateRoutes(errors: ValidationError[], routes: unknown, path: string) {
  if (!Array.isArray(routes)) {
    report(errors, path, 'routes must be an array');
    return;
  }
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const routePath = `${path}[${i}]`;
    if (!isObject(r)) {
      report(errors, routePath, 'route must be an object');
      continue;
    }
    const routeObj = r as RouteSchema;
    if (!('path' in routeObj) || typeof routeObj.path !== 'string') {
      report(errors, `${routePath}.path`, 'route.path is required and must be a string');
    }
    if ('type' in routeObj && typeof routeObj.type !== 'string') {
      report(errors, `${routePath}.type`, 'route.type must be a string');
    }
    if ('children' in routeObj) validateChildren(errors, routeObj.children, `${routePath}.children`);
    if ('routes' in routeObj) validateRoutes(errors, routeObj.routes, `${routePath}.routes`);
  }
}

export function validateNode(errors: ValidationError[], node: unknown | SchemaNode, path: string): void {
  if (!isObject(node)) {
    report(errors, path, 'node must be an object');
    return;
  }
  const obj = node as SchemaNode;

  if ('type' in obj) {
    if (typeof obj.type !== 'string') report(errors, `${path}.type`, 'type must be a string');
  } else {
    const hasTokenKey = Object.keys(obj).some((k) => k.startsWith('$'));
    if (!hasTokenKey) report(errors, path, "node should have a string 'type' or a $-token (e.g. $store/$action)");
  }

  if ('meta' in obj) validateMeta(errors, obj.meta as TemplateMeta, `${path}.meta`);
  if ('props' in obj) validateProps(errors, obj.props, `${path}.props`);
  if ('children' in obj) validateChildren(errors, obj.children, `${path}.children`);
  if ('slots' in obj) validateSlots(errors, obj.slots, `${path}.slots`);
  if ('routes' in obj) validateRoutes(errors, obj.routes, `${path}.routes`);
}

export function validateSchema(schema: unknown | TemplateSchema): ValidationResult {
  const errors: ValidationError[] = [];
  // validateNode(errors, schema, 'root');
  return { valid: errors.length === 0, errors };
}
