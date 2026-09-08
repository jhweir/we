# Boards

How work is arranged in WE, and why the arrangement is a different fact from the work.

This is the reasoning behind `taskBoard` in `@we/template-kit`, the board actions on `spaceStore`,
and the `Boards` view. Read it before changing any of them — most of what follows is decisions that
look arbitrary from the code alone, and two of them are the difference between a board that loses
work and one that cannot.

## The founding decision

> **State is a fact about the work. Position is a fact about the pair.**

A `TaskBlock.status` is read by every surface in WE — the boards, an agent through MCP, a peer's
node, a view written next year. Where that task sits on _one_ board is that board's business alone.

The scenario that settles it: the same task on a community sprint board and somebody's personal
board. One person drags it to Done. On the other board it sits under "Thursday". Is it done?
Obviously yes — so state cannot be derived from position, because position is plural the moment a
second board exists.

Everything below follows from that one sentence.

## The structure

```
Board      CollectionBlock { kind: 'board' }        ordered children ⇒ column order
 └─ Column CollectionBlock { kind: 'column', slug } ordered children ⇒ card order
      └─ TaskBlock…
```

## Three kinds of board, and which of them gather

A board's **candidate cards** and a column's **membership** are different questions, and conflating
them was a real bug: every board showed the whole space, so a hiring pipeline and a content calendar
were one card set with different column headings.

| Board                              | `type`   | Its cards                                        |
| ---------------------------------- | -------- | ------------------------------------------------ |
| **Everything**                     | `space`  | all work in the space — the catch-all            |
| **A container's board** (a call's) | `anchor` | that container's work, so extraction lands on it |
| **One somebody made**              | _(none)_ | only what somebody put on it                     |

A made board's **membership is the union of its columns' children** — no separate relation to keep in
step. Placing a card anywhere on the board makes it a member; which _column_ shows it is still its
`status`, so a member marked done elsewhere moves to that board's done column rather than falling off
it, and one whose state no column here names drops to Unplaced.

**Curating is safe only because Everything exists.** It gathers, it is unanchored, and nothing in the
space can hide from it — so a card nobody has triaged is always somewhere, and every other board is
free to hold only what it is about. That is the whole reason the catch-all is a _board_ rather than a
fallback inside every board. It is also why a board with no record shows **nothing** rather than
everything: the view gates on `boardLoaded`, so that state reads as loading, and an empty made board
stays distinguishable from a broken one.

## Two kinds of column

A column carries a **`slug`**: the `status` value it stands for. That single field is what makes a
column one of two quite different things.

|                   | **Bound column** (`slug` set)                           | **Local lane** (`slug` empty)                       |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------- |
| What is in it     | every task whose `status` matches, plus its arrangement | only what somebody put there                        |
| Dropping a card   | writes `status` — **every board follows**               | writes one link — this board only                   |
| New matching work | arrives on its own                                      | never arrives on its own                            |
| On other boards   | their column for that slug shows it                     | invisible there; the card sits in its status column |

A lane is how somebody organises without imposing: "Thursday", "Waiting on Ana", "Discuss at
standup". Never filling itself is the price of claiming no shared meaning, and it is the right
price — a lane called "Thursday" has no business collecting extracted work. A lane that turns out to
matter is **promoted** by naming it in Settings → Vocabulary, which makes it a slug and gives it a
`semantic`; from then on it behaves like any other bound column, on every board.

A card placed in a lane is excluded from the status columns **on that board only**, or it would
appear twice.

## Why a _gathering_ board's membership is a query and not containment

The obvious design is pure containment: a card is in To-do because To-do's `children` holds a link
to it. It is rejected, and not because the link is hard to write — an extraction pass knows which
call it ran on and could write it in a few lines. It is rejected for four reasons that all follow
from membership _being_ the link:

1. **Membership would have to be maintained per board, forever.** A board created tomorrow is empty
   of yesterday's work unless creating a board backfills links from every existing task. Every new
   board is a backfill; every new task is a fan-out across every board that should show it.
2. **The fan-out is one member's node writing into everybody's containers.** Extraction runs
   wherever the election lands. That node would write into boards it has not synced, or that were
   made while it was offline.
3. **The failure modes are opposite, and this is what decides it.** When containment goes wrong the
   task is _invisible_ — "in the space but on no board" is a negative over link sets and no query
   finds it. When the query design goes wrong the task shows up somewhere obvious: its status
   column, or the unplaced column. **Silently gone versus visibly misfiled** is not a close call for
   a system whose point is that a community's work survives.
4. **The common case costs nothing.** A pass writes N tasks and zero board writes.

So: **a column is a saved query with an arrangement.** Keep that sentence in mind whenever the
design looks like an awkward hybrid — a smart playlist you can also hand-order is the same shape,
and it is well understood.

## Why this survives a partition

The property worth stating on its own, because it is what the design buys:

> The link state can be inconsistent and the board still renders exactly one answer.

Two people drag the same card to different columns while partitioned. The `status` scalar converges
(last write wins). The links may end up saying the card is in **both** columns or in **neither** —
and either way it displays in exactly one place, because status decides which column shows it and
hints are advisory. A stale hint in a column whose slug no longer matches is ignored, and cleaned up
the next time anything writes that column.

Containment has no such fallback: inconsistent links there mean a card that is genuinely nowhere.

## Ordering

Card order within a column is `children` on an ordered relation:

```ts
@HasMany({ through: 'we://children', ordering: { strategy: 'linkedList' } })
```

That is an RGA in the executor (`rust-executor/src/perspectives/ordering/linked_list.rs`): each
entry is `{item, after, pid}`, one winner per item by highest pid, concurrent inserts fork and
linearise deterministically. Three things follow that this design depends on:

- Two people arranging the same column converge, **to the same answer on every peer** — the pid
  tiebreak exists so that link arrival order, which peers do not share, cannot decide it.
- The executor **diffs** before writing, so assigning the whole array emits entries only for what
  actually moved. Writing a column's full order does not stomp a concurrent move of a card you did
  not touch.
- Nothing is deleted; superseded entries are never selected. So a partition merges on rejoin.

**A `position` scalar was refused for the obvious reason**: two people reordering write the same
number and one answer is lost. So was holding the order in a JSON blob on the board — that is a
read-modify-write on one field, so two people arranging _different_ columns would clobber each
other. Conflict-free ordering is why each column needs its own identity, which is why columns are
records rather than configuration.

**The strategy is not baked into WE.** `RelationSchema.ordered` is a boolean in the neutral manifest
and the AD4M generator turns it into `linkedList`. When ad4m gains other strategies, widening that to
name one is two files — the manifest type and the generator — and nothing else in WE reads it. WE's
contract with the ordering is only _assign an array, read an array_.

When writing an order, write **the column's whole visible order** — which is what `we-sortable`
hands over — and let the executor's diff decide what actually moved. Ids still in `children` that the
column no longer shows (stale hints for cards whose state changed elsewhere) follow after it; where
they sit cannot matter, since nothing displays them. What to avoid is writing an order that moves
cards nobody touched, which claims positions and can overwrite somebody else's concurrent drag.

## Boards a person does not create

- **Everything** — the space's own board, `type: 'space'`. Made the first time somebody opens it.
- **A call's board** — `type: 'anchor'`, parented to the call's collection, so an anchored Boards view
  lists it and the Workshop's tasks route finds it. Made by **the first extraction pass that leaves
  the call holding a task** — not when somebody opens the route.

Neither is created on a route mounting. Writing records into a space everybody shares as a side
effect of navigating would have every member who opened the tab racing to create the same board; a
pass runs on exactly one node, and Everything is made by a deliberate click.

The rule for a call's board is "once it holds a task" rather than "once a pass produced anything", so
an events-only call does not get an empty kanban nobody can explain. `InterpretationResult` carries
ids and no types, so one query decides it — after an LLM round trip, where its cost is nothing. See
`ensureBoardFor`, and `ModuleInterpretationAccess.ensureBoard` for the module-facing half, which
names a collection and nothing else like every other member of that surface.

That race still exists for two people clicking at the same moment on two nodes, and it is inherent —
there is no coordination point. The read-side rule is: **if two exist, the earliest `createdAt`
wins**; the other is listed as an ordinary board and can be deleted.

## Rules that are easy to break

**Deleting a column must never delete its cards.** `deleteCollection` → `deleteBlocks` walks
`children` recursively, which is right for a post and catastrophic here: a column's children are the
tasks it _positions_, not tasks it owns. `removeBoardColumn` deletes the one record. Nothing is
stranded, because membership never lived there — the cards keep their state and reappear in another
column bound to it, or in Unplaced.

**Reads must tolerate a dangling child.** A board's `children` can name a column another agent
deleted. Render nothing for it rather than a hole.

**Where new state goes**, so the entity does not accrete a scalar per feature:

| The state            | Where it lives                                     |
| -------------------- | -------------------------------------------------- |
| Queryable identity   | a scalar field (`kind`, `type`, `slug`)            |
| Concurrently edited  | an ordered relation (`children`)                   |
| Single-setter config | one JSON bag, added when the first consumer exists |

`slug` earns a scalar because it is queried and compared. A WIP limit, a per-board colour override, a
collapsed-by-default flag are all single-setter config and belong in a bag — not in three more
columns on `CollectionBlock`, which its own docstring warns against.

## What is not built, and how it fits

- **Swimlanes.** A board would gain a second axis. A column is the one-axis case of a **group**; a
  group with two bindings is a cell. Order stays where it already is, on the group. Rows derived from
  a field (assignee, priority) are a client-side partition of the column order and need no data at
  all. Arbitrary named rows need row records and a second binding on the group — additive, not a
  restructure.
- **WIP limits, per-board filters, saved views.** Single-setter config; see the table above.
- **Moving cards between boards in bulk.** The add-card modal pulls one card in at a time. The Pocket
  is the right surface for several, and is closed to a template on purpose: `modules.pocket.gather`
  is chrome-only because the Pocket writes to the agent's own root dataset, and a space template
  arriving from a stranger must not file things there or enumerate what somebody keeps. The
  interaction it leaves open — a button that opens the panel, and the person drags the card in —
  needs drag arbitration `we-draggable` and `we-sortable` do not have, since both claim
  `pointerdown`.
- **"On no board yet".** Everything shows all the work but cannot distinguish a card nobody has
  triaged from one already on three boards. That filter is a cross-board question an expression
  cannot cheaply ask; it wants a store accessor, and is worth building when somebody feels the lack.
- **Sub-tasks.** `TaskBlock` has no `children`; it would need one, or a parent link. Nothing about
  the board changes.

## Where the pieces are

| Piece              | File                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The board fragment | `packages/templates/kit/src/we/taskBoard.ts`                                                                                                                                            |
| The view           | `packages/templates/views/src/views/BoardsView/index.ts`                                                                                                                                |
| The writes         | `spaceStore` — `createBoard`, `openBoardFor`, `addBoardColumn`, `removeBoardColumn`, `renameBoardColumn`, `reorderBoardColumns`, `arrangeColumn`, `moveCardToColumn`, `addTaskToColumn` |
| The vocabulary     | `packages/entities/src/manifest/TaskState.ts`, and Settings → Vocabulary                                                                                                                |
| The anchor         | `packages/templates/kit/src/we/anchor.ts`                                                                                                                                               |

`kanbanBoard` in `@we/schema-kit` is a **different thing** and stays: it is the portable tier, it
knows nothing about states, and there a card's column _is_ its container. Both are right for what
they are. **Do not mix them in one view** — a status control beside containment columns is two
sources of truth for one fact.
