import { batch } from 'solid-js';
import { produce, SetStoreFunction } from 'solid-js/store';

import { findMutations } from '../../shared/mutations';
import { validateSchema } from '../../shared/validators';
import type { SchemaNode, TemplateSchema } from './types';

export function updateSchemaNode<T extends TemplateSchema | SchemaNode>(
  oldNode: T,
  newNode: T,
  setSchema: SetStoreFunction<T>,
) {
  // Validate the schema node
  const { valid, errors } = validateSchema(newNode);
  if (!valid) {
    console.error('Invalid schema node:', errors);
    return;
  }

  // Find mutations between the old and new nodes
  const mutations = findMutations(oldNode, newNode);
  if (!mutations.length) return;

  // Apply mutations based on their size
  console.time('applyMutations');
  if (mutations.length > 10) {
    // Use produce for large updates
    setSchema(
      produce((draft: T) => {
        for (const { path, value } of mutations) {
          let target = draft as Record<string, unknown>;
          for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!target[key]) target[key] = typeof path[i + 1] === 'number' ? [] : {};
            target = target[key] as Record<string, unknown>;
          }
          const lastKey = path[path.length - 1];
          if (value === undefined) delete target[lastKey];
          else target[lastKey] = value;
        }
      }),
    );
  } else {
    // Batch direct updates for small changes
    batch(() => {
      // @ts-expect-error TypeScript cannot verify the tuple type here
      for (const { path, value } of mutations) setSchema(...path, value);
    });
  }

  console.timeEnd('applyMutations');
}
