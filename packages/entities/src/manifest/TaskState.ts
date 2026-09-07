import type { CoreEntityDef } from './defs';

/**
 * A state a community's work can be in — "To do", "Blocked", "In review".
 *
 * The middle tier between a frozen enum and free text, and the third time WE has needed it:
 * `SignalType` for reactions, `RelationshipType` for connections, this for the states work moves
 * through. A record rather than a schema change, so any community can name its own; identified by a
 * slug, so a query can filter on it and a board column can bind to it.
 *
 * ## Why the semantic exists
 *
 * A name is for people and cannot be reasoned about. Once a community renames "Done" to "Shipped"
 * and adds "Parked", "what work is outstanding here" is no longer answerable by anything that did
 * not write the vocabulary — which is every other surface, every peer, and every agent. `semantic`
 * is the small closed fact underneath the free one: three values, chosen because they are the only
 * distinctions anything outside a board actually needs.
 *
 * Exactly `SignalType.semantic`'s reasoning, and for the same reason: a community should be able to
 * invent its vocabulary without making the space illegible to everything that has not learned it.
 *
 * ## Why a task holds the slug rather than the record id
 *
 * `Signal` names its type by record id, and the note on `SignalType.retired` records what that cost:
 * deleting a type strands every reaction ever given, because a re-created one is a new record with a
 * new id. A task's state is a much commoner thing to write and a much cheaper thing to be wrong
 * about, and the slug buys two things the id cannot — every task that already exists keeps working
 * with no migration at all, and the stored value stays legible to somebody reading raw links.
 *
 * The cost is that renaming a slug orphans the tasks holding it. So don't: rename the `name`, which
 * is the part people read, and leave the slug alone. `retired` is here for the same reason it is on
 * `SignalType` — withdrawing a state from use must not strand the work sitting in it.
 *
 * ## No explicit order
 *
 * Columns want an order, and this deliberately does not carry one. `semantic` already gives the only
 * ordering that means anything across communities — open, then active, then done — and a number
 * would be a position scalar of exactly the kind two people editing at once break. If a community
 * ever needs to interleave two "active" states in a chosen order, that is the point to add one, and
 * by then it will be clear whether it belongs here or on the board doing the showing.
 */
export const TaskState: CoreEntityDef = {
  base: 'WeNode',
  unions: {
    semantic: { alias: 'TaskStateSemantic', values: ['open', 'active', 'done'] },
  },
  entity: {
    flag: { predicate: 'we://flag', value: 'we://task_state' },
    properties: {
      name: { type: 'string', predicate: 'we://name', required: true, default: '' },
      /**
       * What `TaskBlock.status` holds. Stable — see the note above on renaming.
       *
       * Derived from the name when a community does not supply one, exactly as a signal type's is.
       */
      slug: { type: 'string', predicate: 'we://slug', default: '' },
      description: { type: 'string', predicate: 'we://description', default: '' },
      icon: { type: 'string', predicate: 'we://icon', default: '' },
      color: { type: 'string', predicate: 'we://color', default: '' },
      /**
       * What this state *is*, for everything that has not learned the community's word for it.
       *
       * `open` — not started. `active` — being worked on. `done` — finished, and the only one that
       * answers "is this outstanding?" negatively. A state that fits none of them is `open`, which
       * is the safe default: counting unfinished work as unfinished is the failure that shows.
       */
      semantic: { type: 'string', predicate: 'we://semantic', default: 'open', options: ['open', 'active', 'done'] },
      /** Withdrawn from use without stranding the work in it — see `SignalType.retired`. */
      retired: { type: 'boolean', predicate: 'we://retired', default: false },
      schemaVersion: { type: 'number', predicate: 'we://schema_version', default: 1 },
    },
    relations: {},
  },
};
