/**
 * A backend model manifest entry, as the graph engine reads it.
 *
 * A pure translation, kept out of the component that uses it so it can be tested without a DOM —
 * and because deciding what counts as a relation is a fact about the vocabulary rather than
 * anything to do with rendering.
 */
import type { EntityManifestEntry } from '@we/backend-shared';
import type { EntityShape } from '@we/graph-protocol';

/** Translate a backend model manifest entry into the neutral shape the graph reads. */
export function toEntityShape(entry: EntityManifestEntry): EntityShape {
  const properties: EntityShape['properties'] = [];
  const relations: EntityShape['relations'] = [];

  for (const property of entry.properties) {
    /*
      A relation is anything typed `uri` — the same test the model compiler uses. It used to be
      "anything naming a related entity", which quietly reclassified every **untyped** relation as a
      scalar property: `Relationship.source`, `Placement.node`, `CollectionBlock.children` and the
      shared WeNode edges all arrived as `uri`-typed properties and never appeared in `relations` at
      all.

      That is why no hand-drawn or extracted connection could be drawn in a knowledge graph. The
      reified reader looks its endpoints up in `shape.relations`, found neither, and reported the
      relationship as missing an endpoint — for records whose two ends existed and were readable.
      The backward walk in the entity expander was written for this case (it follows an untyped
      relation when the class holding it is reified) and had simply never been handed one.

      `target: ''` is the established spelling for "not declared", already read that way throughout
      the graph engine.
    */
    if (property.type === 'uri') {
      relations.push({
        name: property.name,
        target: property.relatedEntity ?? '',
        cardinality: property.isCollection ? 'many' : 'one',
      });
    } else {
      properties.push({
        name: property.name,
        type: property.type,
        ...(property.required ? { required: true } : {}),
      });
    }
  }

  return { name: entry.name, properties, relations };
}
