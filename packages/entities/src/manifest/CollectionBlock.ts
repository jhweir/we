import type { CoreEntityDef } from './defs';

export const CollectionBlock: CoreEntityDef = {
  base: 'WeNode',
  methodRelations: ['children'],
  entity: {
    blockable: true,
    flag: { predicate: 'we://flag', value: 'we://collection_block' },
    properties: {
      editorState: { type: 'string', predicate: 'we://editor_state', format: 'file', default: null },
      type: { type: 'string', predicate: 'we://type', default: '' },
      /**
       * What this collection *is* — `'call'`, `'notes'`, later `'board'`. Semantic, and deliberately
       * separate from `type`.
       *
       * `type` is the **structural node type** (`root` for a composition, `collection` for a nested
       * one), which the serializer round-trips. It has been doing double duty as a discriminator — `type: 'root'`
       * currently means "is a post" — and overloading it further would put semantic values into a
       * structural field, which is the mistake the transcribe module made writing `tag: 'transcript'`
       * into `TextBlock.style` (a field that means `h1`/`blockquote`).
       *
       * A scalar rather than a tag relation because this is the field you *query by*:
       * `where: { kind: 'call' }` is a native `eq` that pushes down and composes with `order`/`limit`,
       * whereas tag membership would need a reverse traversal WE does not wire up. Tags remain for user
       * taxonomy — what a thing is *about*, not what surface owns it.
       *
       * Never written into `editorState`: the blob is a projection of the children, and `kind` is a
       * fact about the collection, not its content.
       *
       * Posts predate this field and are still identified by `type: 'root'`; the composer now also writes
       * `kind: 'post'` so new posts carry both, and the read side can switch once the legacy set stops
       * mattering. **A `CollectionBlock` with `type: 'root'` and no `kind` is a post.**
       */
      kind: { type: 'string', predicate: 'we://kind', default: '' },
      /**
       * Who owns this collection's children — `'document'` (one agent authored the whole artifact) or
       * `'feed'` (many agents append independently). See `CollectionMode` in `@we/block-shared`.
       *
       * The companion to `kind`, and the division of labour between them is the point: **`kind` is a
       * free label** saying what the collection is *for*, invented by whichever template needs it and
       * registered nowhere; `mode` is the one fact a consumer must know, because it is the one that
       * changes what code may do to the record. `reconcileBlocks` reads it and refuses anything not
       * `'document'` — running it on a feed deletes every child the editing agent's tree omits, which
       * is everyone else's.
       *
       * A property rather than a lookup from `kind`, and that is a peer-to-peer decision rather than a
       * modelling preference. A kind→mode registry answers differently depending on which modules the
       * *reading* client installed, so of two agents in one channel the one missing the module is
       * unprotected. Written here, the fact travels with the record and a client that has never heard
       * of the label still knows what it must not do.
       *
       * Denormalised — every channel repeats `'feed'` — which is the accepted cost of not requiring a
       * schema authority the space may never have shared with you. It is also the degenerate,
       * correctly-degrading form of shapes-in-the-space (content-models-plan stage F).
       *
       * Unset means legacy: collections written before this field existed. Treated as reconcilable,
       * since every pre-existing post is one and refusing them would break editing everywhere.
       */
      mode: { type: 'string', predicate: 'we://mode', default: '' },
      /**
       * What this collection is called, and what it is about — set by whoever owns it, not derived.
       *
       * On the shared model rather than per kind because they are the two pieces of metadata *every*
       * collection can have: a call, a notes collection, a board. Kind-specific state (a board's column
       * config, say) does not belong here and should not accumulate as more scalars — that is what a
       * per-kind model or a JSON bag is for.
       *
       * Scalars for the same reason `kind` is one: these are fields you query by. `where: { title:
       * { contains: … } }` pushes down to the backend and composes with `order` and `limit`, and a list
       * can sort by title. Held in `editorState` or a blob they would be invisible to all of that — and
       * a call has no `editorState` at all, since the transcribe module creates it rather than the
       * composer.
       *
       * Distinct from `textContent`, which is derived from the children for search and preview: a title
       * written there would be overwritten by the next reconcile.
       *
       * Unset costs nothing — an AD4M property is a link that exists only once written — so collections
       * that never get named carry no storage, and no migration was needed to add these.
       */
      title: { type: 'string', predicate: 'we://title', default: '' },
      /**
       * The vocabulary term this collection stands *for*, where it stands for one.
       *
       * A board's column is the case it exists for: a column bound to `todo` shows the work whose
       * `status` is `todo`, so the column is a saved query as much as a container — its `children`
       * are the order somebody put those cards in, and this is what decides which cards they are.
       * Empty means the collection stands for nothing, which for a column is a **local lane**:
       * "Thursday", "Waiting on Ana". Nothing arrives in one on its own, and dropping a card there
       * says nothing about the work — which is exactly what a lane claiming no shared meaning
       * should do.
       *
       * A slug rather than a link to the `TaskState` record, for the reason `TaskBlock.status` holds
       * one: the vocabulary is a naming of values that already exist, so a column keeps working when
       * a state is retired, and a task whose state nothing recognises can still be found and moved.
       *
       * Its own field rather than more meaning on `type`, which is already the post discriminator
       * and was explicitly not to accumulate a third reading.
       */
      slug: { type: 'string', predicate: 'we://slug', default: '' },
      description: { type: 'string', predicate: 'we://description', default: '' },
      version: { type: 'number', predicate: 'we://version', default: 0 },
      textContent: { type: 'string', predicate: 'we://text_content', default: '' },
    },
    relations: {
      /**
       * What is in this collection, in the order somebody put it there.
       *
       * `ordered` because the sequence is authored: a person dragged the image above the paragraph,
       * and reading the blocks back in a different order does not show them a differently-sorted
       * post, it shows them a different post. Until it was declared, the order held only by accident
       * — a save rewrote every child link, so their timestamps came out in array order and reading
       * by timestamp looked like reading the author's sequence. That accident survives one editor
       * and not two.
       *
       * The target is empty because a collection holds text, images, tasks, further collections and
       * whatever a community has since defined — which also makes it polymorphic by default, so
       * each child is read as the class it actually is rather than as a bare reference.
       */
      children: { target: '', cardinality: 'many', predicate: 'we://children', ordered: true },
      /**
       * Every time a model was asked to read this collection — see {@link ExtractionPass}.
       *
       * Its own relation rather than `children`, which holds a collection's *content*: a pass is a
       * fact about the collection, not something in it, and in `children` it would be loaded by the
       * board and drawn as a card.
       */
      extractionPasses: {
        target: 'ExtractionPass',
        cardinality: 'many',
        predicate: 'we://extraction_pass_record',
      },
    },
  },
};
