/**
 * A panel says its own name, in one treatment, at the top.
 *
 * Seventeen panel bodies had arrived at five: the reference caps label, a `heading-sm`, a `fontSize:
 * 500` bold heading in a second bordered bar under the host's own, a section heading standing in for
 * a name four children down, and two panels that named themselves nowhere at all. Nothing was wrong
 * with any one of them in isolation, which is exactly why they diverged — the cost only shows when
 * they are open beside each other.
 *
 * Asserted on the expansion rather than on how it draws, for the reason the picker's tests are:
 * what is being protected is the recipe, and a recipe restated is a recipe that drifts.
 */
import { describe, expect, it } from 'vitest';

import { PANEL_TITLE_PROPS, panelHeader, panelShell, SECTION_LABEL_PROPS, sectionLabel } from './panelShell.ts';

describe('a panel header', () => {
  it('is the muted capitalised label, whatever the caller passes', () => {
    const props = (panelHeader({ title: 'Inspector' }).children?.[0] as { props: Record<string, unknown> }).props;

    expect(props).toMatchObject(PANEL_TITLE_PROPS);
  });

  it('takes an expression, because a panel can be about more than one thing', () => {
    /*
      The transcript is "Transcript" or "Past call" depending on the address, which is why the title
      could never move into the host's titlebar — that name comes from a static declaration.

      The fixture reads a local rather than that panel's actual `routeStore` expression: this package
      names no store, and its portability guard reads the sources rather than trusting the fragments
      to be honest about it. A test is a source.
    */
    const title = { $: "local.past ? 'Past call' : 'Transcript'" };
    const header = panelHeader({ title });

    expect((header.children?.[0] as { children: unknown[] }).children).toEqual([title]);
  });

  it('pushes an aside to the far edge rather than up against the name', () => {
    const aside = { type: 'we-button' };
    const header = panelHeader({ title: 'Calls', aside });
    const titleProps = (header.children?.[0] as { props: Record<string, unknown> }).props;

    expect(titleProps.flex).toBe('1');
    expect(header.children?.[1]).toBe(aside);
  });

  it('never shrinks', () => {
    // A panel is a scroll region under a fixed name. A header that can be squeezed is a name that
    // disappears exactly when there is most content to be lost in.
    expect(panelHeader({ title: 'Inspector' }).props?.flex).toBe('0 0 auto');
  });
});

describe('a section label', () => {
  it('is quieter than a panel own name, so the two do not compete', () => {
    const props = (sectionLabel({ label: 'Extracted' }).children?.[0] as { props: Record<string, unknown> }).props;

    expect(props).toMatchObject(SECTION_LABEL_PROPS);
    // The distinction the extraction panel had no way to draw: its only capitalised line said what
    // the list below held, and with one treatment available that read as the panel's name.
    expect(SECTION_LABEL_PROPS.color).not.toBe(PANEL_TITLE_PROPS.color);
    expect(SECTION_LABEL_PROPS.variant).not.toBe(PANEL_TITLE_PROPS.variant);
  });
});

describe('a panel shell', () => {
  it('opens with the header, before anything conditional', () => {
    // The failure this prevents: a title below a `$if`, which is missing in the state that most
    // needs a name — the one where the panel is explaining why it has nothing to show.
    const shell = panelShell({ title: 'Extraction', children: [{ type: '$if' }] });

    expect(shell.children?.[0]).toEqual(panelHeader({ title: 'Extraction' }));
  });

  it('clips, and leaves the scrolling to its content', () => {
    // A panel is given a box by the host and stays inside it; a `we-scroll-area` in the content is
    // what lets the header stay put while the list under it moves.
    expect(panelShell({ title: 'Notes', children: [] }).props?.overflow).toBe('hidden');
  });

  it('uses one padding, so panels side by side line up', () => {
    // There were two, `300` and `400`, split between the templates and the modules, which nobody
    // chose between and which reads as a wobble the moment two panels share an edge.
    const shell = panelShell({ title: 'Notes', children: [] });

    expect(shell.props?.p).toBe('300');
    expect(shell.props?.gap).toBe('300');
  });
});
