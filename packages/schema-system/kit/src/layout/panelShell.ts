import type { ExpressionToken, SchemaNode } from '@we/schema-shared';

/**
 * How a panel says its own name.
 *
 * Exported as a prop bag, not only as the fragment below, because two of the consumers are not
 * schemas: the editor's panels are Solid components and can only spread this onto a `we-text`. One
 * definition, two languages — which is the difference between a shared recipe and a coincidence.
 * Before it existed there were three spellings of the letter-spacing alone (`'wide'`, `"widest"`
 * and a raw `"0.06em"`), and four of the whole header.
 *
 * `variant: 'label'` carries the size and weight; the caps and the tracking are what make it read
 * as a name for the region rather than as a heading inside it. Muted rather than full-strength on
 * purpose: the panel's *content* is the thing being read, and a title competing with it is a title
 * that has misunderstood the job.
 */
export const PANEL_TITLE_PROPS = {
  variant: 'label',
  color: 'text-muted',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
} as const;

/** The same treatment one step quieter, for a labelled region *inside* a panel. */
export const SECTION_LABEL_PROPS = {
  variant: 'footnote',
  color: 'text-faint',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
} as const;

export interface PanelHeaderOptions {
  /** The panel's name. An expression where it depends on what is being shown. */
  title: string | ExpressionToken;
  /** Shown at the right of the title row — a record button, a switch, a "start call". */
  aside?: SchemaNode;
}

/**
 * A panel's name, at the top of it.
 *
 * The host's titlebar deliberately draws no text: it carries the move handle and the window
 * controls, and its docblock says a panel alone names itself inside its own content. That premise
 * is fine and the execution was not — seventeen panel bodies had arrived at five different
 * treatments, two of them naming themselves nowhere at all, and one whose only capitalised line was
 * a section heading four children down that moved as the content above it grew.
 *
 * So the name is still the panel's to draw, and this is how. A fragment rather than a line in a
 * conventions file because the recipe is four props that are trivially mistyped, and because
 * nothing would be read at the moment panel eighteen is written.
 *
 * `aside` is not decoration: most panels want an action beside the name — Calls has "start a call",
 * extraction has "as it happens", the transcript has record — and it is the reason the title cannot
 * simply move into the host's titlebar, which cannot know about any of them.
 */
export function panelHeader(opts: PanelHeaderOptions): SchemaNode {
  const title: SchemaNode = {
    type: 'we-text',
    // `flex: '1'` so an `aside` sits at the right-hand edge rather than beside the word.
    props: { ...PANEL_TITLE_PROPS, flex: '1' },
    children: [opts.title],
  };

  return {
    type: 'Row',
    // Never shrinks: a panel is a scroll region under a fixed name, and a header that can be
    // squeezed is a name that disappears exactly when there is most content to be lost in.
    props: { width: '100%', ay: 'center', gap: '200', flex: '0 0 auto' },
    children: opts.aside ? [title, opts.aside] : [title],
  };
}

export interface SectionLabelOptions {
  /** What the region below is. An expression where it depends on what is being shown. */
  label: string | ExpressionToken;
  /** Shown at the right of the label row. */
  aside?: SchemaNode;
}

/**
 * A named region inside a panel — quieter than the panel's own name, so the two do not compete.
 *
 * Its absence is why the workshop's extraction panel had no title: the caps line in it said
 * "Extracted", which is what the list below it holds rather than what the panel is, and having only
 * one caps treatment made that read as the name.
 */
export function sectionLabel(opts: SectionLabelOptions): SchemaNode {
  const label: SchemaNode = {
    type: 'we-text',
    props: { ...SECTION_LABEL_PROPS, flex: '1' },
    children: [opts.label],
  };

  return {
    type: 'Row',
    props: { width: '100%', ay: 'center', gap: '200', flex: '0 0 auto' },
    children: opts.aside ? [label, opts.aside] : [label],
  };
}

export interface PanelShellOptions extends PanelHeaderOptions {
  children: SchemaNode[];
  /** Padding inside the panel. Defaults to the figure every docked panel uses. */
  p?: string;
  /** Space between the header and the content, and between the content's own blocks. */
  gap?: string;
}

/**
 * A panel's whole box: the name at the top, the content under it, and the room around both.
 *
 * The root was written out seventeen times — `width`/`height` 100%, a padding, a gap,
 * `overflow: 'hidden'` — and had drifted into two paddings (`300` and `400`) that nobody chose
 * between. Pinned at `300` here, which is the tighter of the two and right for a docked panel: it
 * is a column beside the content, not a page.
 *
 * `overflow: 'hidden'` is the load-bearing one. A panel is given a box by the host and has to stay
 * inside it; the scrolling belongs to a `we-scroll-area` in the content, which is what lets the
 * header stay put while the list under it moves.
 */
export function panelShell(opts: PanelShellOptions): SchemaNode {
  return {
    type: 'Column',
    props: {
      width: '100%',
      height: '100%',
      p: opts.p ?? '300',
      gap: opts.gap ?? '300',
      overflow: 'hidden',
    },
    children: [panelHeader({ title: opts.title, aside: opts.aside }), ...opts.children],
  };
}
