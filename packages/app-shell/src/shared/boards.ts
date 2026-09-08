/**
 * What a board write means.
 *
 * A board's columns are records: the board's ordered `children` are its columns, and each column's
 * ordered `children` are the cards somebody arranged in it. The reasoning — why a column is a saved
 * query with an arrangement rather than a container, and why that is what survives a partition — is
 * `docs/architecture/boards.md`.
 *
 * **The ordering is not here.** An ordered relation is an RGA in the executor: it diffs a written
 * list against what it holds, records only what moved, and converges when two people drag at the
 * same moment. Nothing in this file indexes, renumbers, merges or breaks a tie — which is the whole
 * reason a column's arrangement is a relation rather than a `position` scalar on each card.
 *
 * What *is* here is everything a backend cannot be asked: which list to store (the visible order,
 * then the hints the screen no longer shows), what a drop means (up to three writes, the third
 * conditional on whether the target column names a state), the invariants only WE knows (a board's
 * children are columns), and when a shared record is allowed to come into being.
 *
 * Framework-neutral, per `CONVENTIONS.md`: the three things that reach outside — which dataset, what
 * the community's states are, and how a failure reaches a person — arrive as `BoardDeps` rather than
 * as imports.
 */
import { CollectionBlock, type DatasetProxy, getEntitiesForPerspective, Space } from '@we/entities';

/** What the board actions need from the app around them. */
export interface BoardDeps {
  /**
   * The dataset a write means: the one named, or the space on screen.
   *
   * Named rather than assumed, because a board is not always made where the reader is looking — the
   * extraction hook runs wherever the election landed, and a board must not land somewhere its own
   * cards did not.
   */
  dataset: (uri?: string) => DatasetProxy | undefined;
  /** The states this community offers, in its own order — what a new board's columns are seeded from. */
  offeredStates: () => { name: string; slug: string }[];
  /** How a failure reaches the person who caused it. */
  notify: (message: string) => void;
}

/** The board actions, as the store exposes them. */
export interface BoardActions {
  createBoard: (title: string, parentId?: string, options?: { dataset?: string }) => Promise<string>;
  openBoardFor: (anchorId?: string, title?: string, dataset?: string) => Promise<string>;
  ensureBoardFor: (collectionId: string, dataset?: string) => Promise<string>;
  addBoardColumn: (boardId: string, name: string, slug?: string) => Promise<void>;
  removeBoardColumn: (boardId: string, columnId: string) => Promise<void>;
  renameBoardColumn: (columnId: string, name: string) => Promise<void>;
  reorderBoardColumns: (boardId: string, orderedIds: string[]) => Promise<void>;
  arrangeColumn: (columnId: string, orderedIds: string[]) => Promise<void>;
  moveCardToColumn: (fromColumnId: string, toColumnId: string, cardId: string, orderedIds?: string[]) => Promise<void>;
  addTaskToColumn: (columnId: string, title: string, anchorId?: string) => Promise<void>;
}

export function createBoardActions(deps: BoardDeps): BoardActions {
  const { dataset, offeredStates, notify } = deps;

  /**
   * Make a board, with a column for each state the community uses.
   *
   * A `CollectionBlock` like a call or a notes collection, so it inherits comments, signals, the
   * feed and the rest — and `mode: 'feed'` rather than `'document'`, which is the one field that
   * must be right. `reconcileBlocks` refuses anything not `'document'` precisely because running it
   * over a feed deletes every child the editing agent's tree omits, and on a shared board that is
   * everyone else's cards.
   *
   * ## The columns are records, and they are written now rather than lazily
   *
   * Written at creation rather than materialised on the first drag, which was the alternative: lazy
   * creation means two members dragging at the same moment both find no structure and both make
   * one, and it means the first drag anybody makes rebuilds the column list under them —
   * `taskStates` is a memo returning fresh objects and `<For>` is reference-keyed, so every column
   * would remount and re-issue its subscription. Creating a board is already a deliberate act by one
   * person; doing the work there costs one round trip and avoids both.
   *
   * The consequence, stated so it is a decision rather than an oversight: a state named *later* does
   * not appear on a board made earlier. The work in it is not lost — it lands in the unplaced
   * column, which is what that column is for — and the board's own "add column" offers the state.
   *
   * `parentId` puts the board inside another collection — a call's record, so the board belongs to
   * the gathering it came out of. Which board is the *canonical* one for a container is not marked
   * here: it is the container's `board` relation, set by `openBoardFor`. A call may hold any number
   * of boards, all of them its children; one of them is the one it points at.
   */
  async function createBoard(title: string, parentId?: string, options?: { dataset?: string }): Promise<string> {
    const p = dataset(options?.dataset);
    if (!p || !title.trim()) return '';
    try {
      const board = await CollectionBlock.create(p, {
        kind: 'board',
        mode: 'feed',
        title: title.trim(),
        type: '',
      });
      /*
        Seeded from what the community actually uses, so a new board opens looking like every other
        surface that reads the vocabulary. Sequential rather than parallel: the columns have to exist
        before `setChildren` can name them in order, and their order is the board's own.
      */
      const columns: string[] = [];
      for (const state of offeredStates()) {
        const column = await CollectionBlock.create(p, {
          kind: 'column',
          mode: 'feed',
          title: state.name,
          slug: state.slug,
          type: '',
        });
        columns.push(column.id);
      }
      if (columns.length) await board.setChildren(columns);
      if (parentId) {
        const parent = await CollectionBlock.findOne(p, { where: { id: parentId } });
        // A parent that has gone leaves the board loose rather than failing the create: the board is
        // already made, and losing it to report a missing container helps nobody.
        if (parent) await parent.addChildren(board.id);
      }
      return board.id;
    } catch (error) {
      console.error('SpaceStore: could not create board', error);
      notify('Could not create that board');
      return '';
    }
  }

  /**
   * The board for a container — one call's, or the space's own — making it if nobody has yet.
   *
   * Find-or-create rather than create, because every surface that opens a board calls this and only
   * the first caller should write. Returns the id either way, so the caller opens what it asked for
   * without knowing which happened.
   *
   * Reached from a click rather than from a view mounting, deliberately. Creating a board writes
   * records into a space everybody shares, and a side effect of *navigating* is a poor way to do
   * that: on a neighbourhood it would mean everyone who opened the tab raced to make the same board.
   */
  async function openBoardFor(anchorId?: string, title?: string, datasetUri?: string): Promise<string> {
    const p = dataset(datasetUri);
    if (!p) return '';
    try {
      /*
        The container points at its board, rather than the board carrying a marker saying it is the
        one. A marker cannot stop two boards claiming it — two members pressing this at the same
        moment on two nodes would make two — where a single-valued link converges on one and leaves
        the other as an ordinary board in the list.
      */
      if (anchorId) {
        const anchor = await CollectionBlock.findOne(p, { where: { id: anchorId }, include: { board: true } });
        if (!anchor) return '';
        const existing = anchor.board as unknown as CollectionBlock | undefined;
        if (existing?.id) return existing.id;
        const made = await createBoard(title?.trim() || 'This call', anchorId, { dataset: datasetUri });
        if (made) await anchor.setBoard({ id: made } as CollectionBlock);
        return made;
      }

      const space = await Space.findOne(p, { include: { board: true } });
      if (!space) return '';
      const existing = space.board as unknown as CollectionBlock | undefined;
      if (existing?.id) return existing.id;
      const made = await createBoard(title?.trim() || 'Everything', undefined, { dataset: datasetUri });
      if (made) await space.setBoard({ id: made } as CollectionBlock);
      return made;
    } catch (error) {
      console.error('SpaceStore: could not open that board', error);
      notify('Could not open that board');
      return '';
    }
  }

  /**
   * Make sure a container has a board, but only once it has work for one.
   *
   * The hook extraction calls. A call gets no board until a pass leaves it holding a task — which is
   * the rule worth stating in those words, because the alternative ("any record at all") would give
   * an events-only call an empty kanban and nobody could say why.
   *
   * `InterpretationResult` carries ids and no types, so the pass cannot answer this on its own; one
   * query does, and it runs after an LLM round trip, where its cost is nothing.
   */
  async function ensureBoardFor(collectionId: string, datasetUri?: string): Promise<string> {
    const p = dataset(datasetUri);
    if (!p || !collectionId) return '';
    try {
      /*
        `board` is hydrated; `children` deliberately is not.

        Including `children` here failed outright — "the relation declares no target class, so its
        targets cannot be hydrated" — even though the class declares `polymorphic: true` and the
        renderer's own query path hydrates the same relation happily. Whatever the difference is, it
        is not needed: an un-included to-many comes back as the ids, which is all this wants. Reading
        the ids is also cheaper than hydrating every block in a call to find out whether any is a
        task. See `notes/we/September-2026/ad4m-subscription-recovery.md`.
      */
      const anchor = await CollectionBlock.findOne(p, {
        where: { id: collectionId },
        include: { board: true },
      });
      if (!anchor) return '';
      const existing = anchor.board as unknown as CollectionBlock | undefined;
      if (existing?.id) return existing.id;
      const ids = (Array.isArray(anchor.children) ? anchor.children : []) as string[];

      // A bare list of ids is native on this backend — it pushes down to a VALUES clause — so this
      // asks "are any of these children tasks?" in one round trip rather than hydrating them all.
      if (!ids.length) return '';
      const Task = getEntitiesForPerspective('TaskBlock', p);
      const tasks = await Task?.findAll(p, { where: { id: ids }, limit: 1 });
      if (!tasks?.length) return '';

      return await openBoardFor(collectionId, anchor.title || 'This call', datasetUri);
    } catch (error) {
      console.error('SpaceStore: could not prepare a board for that collection', error);
      return '';
    }
  }

  /**
   * Add a column to a board — one bound to a state, or a lane of this board's own.
   *
   * `slug` is the whole difference, and it is two different promises:
   *
   * - **With one**, the column *is* that state on this board. Work in that state arrives on its own,
   *   including work an extraction pass wrote while nobody was looking, and dropping a card there
   *   says the card is in that state — everywhere, on every board.
   * - **Without one**, it is a local lane. Nothing arrives by itself, which is the price of claiming
   *   no shared meaning, and a card put there is positioned rather than reclassified.
   *
   * So the caller says which, rather than this guessing from whether the name happens to match a
   * state. A lane that turns out to matter is promoted by naming it in the space's vocabulary.
   */
  async function addBoardColumn(boardId: string, name: string, slug = ''): Promise<void> {
    const p = dataset();
    if (!p || !boardId || !name.trim()) return;
    try {
      const board = await CollectionBlock.findOne(p, { where: { id: boardId } });
      if (!board) return;
      const column = await CollectionBlock.create(p, {
        kind: 'column',
        mode: 'feed',
        title: name.trim(),
        slug,
        type: '',
      });
      await board.addChildren(column.id);
    } catch (error) {
      console.error('SpaceStore: could not add that column', error);
      notify('Could not add that column');
    }
  }

  /**
   * Take a column off a board — **the column only, never the work in it.**
   *
   * `deleteCollection` walks `children` and deletes descendants, which is right for a post and
   * catastrophic here: a column's children are the tasks it *positions*, not tasks it owns. So this
   * deletes the one record and leaves every card alone.
   *
   * ## The cards are handed to the board first
   *
   * On a board that gathers, deleting a column loses nothing on its own: the board draws from
   * everything in scope, so a card reappears in a column bound to its state, or in Unplaced. On a
   * board somebody **made**, membership *is* containment — so the column being deleted held the only
   * record that these cards were on this board at all, and deleting it took them off the board
   * silently. That contradicted the rule the whole design exists for, and it is what somebody sees:
   * delete a lane, and the card that was in it is simply gone.
   *
   * So the cards move up to the board, which is where a made board keeps what it holds in no column.
   * Nothing decides *which* column they belong in, because nothing has to — a column bound to their
   * state gathers them back as unarranged, and Unplaced catches the ones whose state no column here
   * names. The same write on a gathering board is harmless: it already showed them.
   */
  async function removeBoardColumn(boardId: string, columnId: string): Promise<void> {
    const p = dataset();
    if (!p || !boardId || !columnId) return;
    try {
      const [board, column] = await Promise.all([
        CollectionBlock.findOne(p, { where: { id: boardId } }),
        CollectionBlock.findOne(p, { where: { id: columnId } }),
      ]);
      if (board) {
        /*
          Written as one `setChildren`, so the board's own order is stated rather than appended to,
          and the removed column goes in the same write that keeps its cards.
        */
        const held = (Array.isArray(board.children) ? board.children : []) as string[];
        const orphans = (Array.isArray(column?.children) ? column.children : []) as string[];
        const keeping = held.filter((id) => id !== columnId);
        const added = orphans.filter((id) => !keeping.includes(id));
        await board.setChildren([...keeping, ...added]);
      }
      /*
        Only an actual column is deleted. `findOne` resolves an id to a `CollectionBlock` whatever
        the record turns out to be, so a board whose children got polluted — see
        `reorderBoardColumns` — would otherwise have "remove this column" delete a *task*. Taking it
        off the board is right either way; destroying the record is only right for a column.
      */
      if (column?.kind === 'column') await column.delete();
    } catch (error) {
      console.error('SpaceStore: could not remove that column', error);
      notify('Could not remove that column');
    }
  }

  /**
   * Rename one column, on this board.
   *
   * The label only — the slug it binds to, which is its meaning, is untouched. So two boards may
   * call one state different things, which is a presentation difference and not a disagreement:
   * both still write the same `status`, and `semantic` still answers "is this outstanding" for
   * either. Renaming what a state *is* called everywhere is Settings → Vocabulary.
   */
  async function renameBoardColumn(columnId: string, name: string): Promise<void> {
    const p = dataset();
    if (!p || !columnId || !name.trim()) return;
    try {
      const column = await CollectionBlock.findOne(p, { where: { id: columnId } });
      if (!column) return;
      column.title = name.trim();
      await column.save();
    } catch (error) {
      console.error('SpaceStore: could not rename that column', error);
      notify('Could not rename that column');
    }
  }

  /**
   * The order this board reads its columns in. Ordered `children`, so two draggers converge.
   *
   * **Only ids the board already holds are written.** A board's children are its columns, and
   * anything else in that list renders as a column — so a caller handing over the wrong list does
   * not misfile something, it invents structure. That happened: `we-sortable` dispatched its events
   * with `bubbles: true`, so reordering *cards* inside a column reached the columns' own sortable,
   * which wrote three task ids here and drew them as three empty columns. The primitive no longer
   * bubbles, and this refuses to write what it is not given.
   */
  async function reorderBoardColumns(boardId: string, orderedIds: string[]): Promise<void> {
    const p = dataset();
    if (!p || !boardId || !Array.isArray(orderedIds) || !orderedIds.length) return;
    try {
      const board = await CollectionBlock.findOne(p, { where: { id: boardId } });
      if (!board) return;
      const current = Array.isArray(board.children) ? (board.children as string[]) : [];
      const known = new Set(current);
      const ordered = orderedIds.filter((id) => known.has(id));
      if (!ordered.length) return;
      const moved = new Set(ordered);
      await board.setChildren([...ordered, ...current.filter((id) => !moved.has(id))]);
    } catch (error) {
      console.error('SpaceStore: could not reorder the columns', error);
      notify('Could not save that order');
    }
  }

  /**
   * Record the order somebody dragged one column into.
   *
   * The list is that column's cards as they now read — the ones already positioned and the ones that
   * had simply matched the state — so writing it is what turns a card nobody had placed into one
   * somebody has. Anything the list does not mention keeps its place, which matters only for a card
   * that has since moved elsewhere.
   *
   * An ordered relation rather than a `position` scalar, and this is the thing that could not be
   * done before: two people rearranging the same column at the same moment converge, where two
   * writes of the same number lose one of the answers.
   */
  async function arrangeColumn(columnId: string, orderedIds: string[]): Promise<void> {
    const p = dataset();
    if (!p || !columnId || !Array.isArray(orderedIds) || !orderedIds.length) return;
    try {
      const column = await CollectionBlock.findOne(p, { where: { id: columnId } });
      if (!column) return;
      const current = Array.isArray(column.children) ? (column.children as string[]) : [];
      const moved = new Set(orderedIds);
      /*
        The whole visible order, then whatever `children` still names that this column no longer
        shows — a stale hint for a card whose state changed on another surface. The executor diffs
        before writing ordering entries, so sending the full order costs entries only for the cards
        that actually moved, and a concurrent drag of a card nobody here touched is not overwritten.
      */
      await column.setChildren([...orderedIds, ...current.filter((id) => !moved.has(id))]);
    } catch (error) {
      console.error('SpaceStore: could not save the column arrangement', error);
      notify('Could not save that arrangement');
    }
  }

  /**
   * Move a card from one column to another.
   *
   * Up to three writes, because up to three things change. The card leaves one column's `children`
   * and joins another's — position, which is this board's business alone. And **if the column it
   * joins is bound to a state, the card's `status` is written too**, which every other surface
   * reads: that is what makes "done is done" true rather than true-on-this-board.
   *
   * A lane writes no status, deliberately. Dropping a card under "Thursday" positions it here and
   * says nothing about whether the work is finished, so nobody else's board moves.
   *
   * `orderedIds` is where it lands, and without it a drop would only ever append. `we-sortable`
   * reports the target zone's whole new order alongside the move, so the card can be seated exactly
   * where it was dropped — the same list `arrangeColumn` writes, which is why passing it also
   * materialises whichever of that column's cards had merely matched the state until now. The menu
   * path has no position to report and appends, which is what "move it there" means without a
   * pointer.
   *
   * Added before removed, as `moveChild` is: both are round trips, so a failure between them leaves
   * the card in two columns rather than in none — visible, and fixed by moving it again.
   */
  async function moveCardToColumn(
    fromColumnId: string,
    toColumnId: string,
    cardId: string,
    orderedIds?: string[],
  ): Promise<void> {
    const p = dataset();
    if (!p || !cardId || !toColumnId || fromColumnId === toColumnId) return;
    try {
      const [from, to] = await Promise.all([
        /*
          A `from` that resolves to nothing must not cost the move.

          An id is an IRI on this backend, so a caller handing over something that is not one — a
          zone's *name*, say — does not come back empty, it refuses the query outright and takes the
          whole move with it. The target write is the part that matters; leaving a stale link behind
          is a hint the board already ignores.
        */
        fromColumnId
          ? CollectionBlock.findOne(p, { where: { id: fromColumnId } }).catch(() => null)
          : Promise.resolve(null),
        CollectionBlock.findOne(p, { where: { id: toColumnId } }),
      ]);
      if (!to) return;
      const current = Array.isArray(to.children) ? (to.children as string[]) : [];
      const dropped = Array.isArray(orderedIds) && orderedIds.includes(cardId) ? orderedIds : null;
      if (dropped) {
        const moved = new Set(dropped);
        await to.setChildren([...dropped, ...current.filter((id) => !moved.has(id))]);
      } else if (!current.includes(cardId)) {
        await to.addChildren(cardId);
      }
      if (from) await from.removeChildren(cardId);
      if (to.slug) {
        const task = await getEntitiesForPerspective('TaskBlock', p)?.findOne(p, { where: { id: cardId } });
        if (task) {
          (task as Record<string, unknown>).status = to.slug;
          await (task as { save: () => Promise<unknown> }).save();
          // Development only: the write half of the picture the renderer's `[query]` lines give.
          // Together they say whether a status that reached the backend came back to the screen.
          if (import.meta.env.DEV) console.info(`[board] wrote status ${to.slug} to ${cardId}`);
        }
      }
    } catch (error) {
      console.error('SpaceStore: could not move that card', error);
      notify('Could not move that card');
    }
  }

  /**
   * Make a task straight into a column.
   *
   * Two links rather than one, and both matter. The task is parented to the **anchor** when there is
   * one — the call the board belongs to — so every other call-scoped surface finds it, which
   * parenting it to the column instead would quietly prevent. Then it is linked into the column, so
   * it opens where the person was looking.
   *
   * A bound column also gives it that column's state, so it would appear there anyway; the link is
   * what puts it at a known position rather than at the end. A lane gives it none, so the link is
   * the only reason it is there at all.
   */
  async function addTaskToColumn(columnId: string, title: string, anchorId?: string): Promise<void> {
    const p = dataset();
    if (!p || !columnId || !title.trim()) return;
    try {
      const column = await CollectionBlock.findOne(p, { where: { id: columnId } });
      if (!column) return;
      const Task = getEntitiesForPerspective('TaskBlock', p);
      if (!Task) return;
      const task = await Task.create(
        p,
        { title: title.trim(), ...(column.slug ? { status: column.slug } : {}) },
        anchorId ? { parent: { id: anchorId, predicate: 'we://children' } } : undefined,
      );
      await column.addChildren((task as { id: string }).id);
    } catch (error) {
      console.error('SpaceStore: could not add that task', error);
      notify('Could not add that task');
    }
  }

  return {
    createBoard,
    openBoardFor,
    ensureBoardFor,
    addBoardColumn,
    removeBoardColumn,
    renameBoardColumn,
    reorderBoardColumns,
    arrangeColumn,
    moveCardToColumn,
    addTaskToColumn,
  };
}
