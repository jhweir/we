/**
 * The graph mounts.
 *
 * The one test in this package that renders the component, and it exists because everything else
 * here is a pure function — `pathFrom`, `resize`, `pending` — so a fourteen-hundred-line renderer
 * had no coverage of the only thing it does.
 *
 * What it catches is the class of failure that takes the *whole app* down rather than the graph:
 * anything thrown while the component body runs. The one that prompted it was a `createMemo`
 * declared beside the signals it resembled, reaching the engine `const` below it — `createMemo` runs
 * its body eagerly, so that is a `ReferenceError` before a single element exists, and the app failed
 * to start with a message naming a line nobody would look at twice. Typecheck passes it, every unit
 * test passes it, and the build passes it.
 *
 * Deliberately shallow. It asserts that mounting produces a canvas and does not throw, not what the
 * canvas contains — the geometry, the routing and the parsing are all tested where they live, and a
 * mount test that started asserting on markup would be a second, worse copy of those.
 */
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';

import { GraphView } from './GraphView.solid';

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = '';
});

/** Mount into a detached host and hand back what it drew. */
function mount(props: Parameters<typeof GraphView>[0] = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  dispose = render(() => <GraphView {...props} />, host);
  return host;
}

describe('GraphView mounts', () => {
  it('renders its canvas with no props at all', () => {
    const host = mount();

    expect(host.querySelector('.we-graph')).not.toBeNull();
    expect(host.querySelector('.we-graph__surface')).not.toBeNull();
  });

  it('renders with the board’s own wiring bound', () => {
    /*
      The props a board passes, which is what the route-editing handles are gated on: binding
      `onEdgeAnchor` and `onEdgeReroute` is what makes the grips exist at all, so a mount without
      them would not exercise the branches those live in.
    */
    const host = mount({
      layout: { type: 'manual' },
      edgeStyle: [{ style: { curve: 'smooth' } }],
      onEdgeAnchor: () => undefined,
      onEdgeReroute: () => undefined,
      onEdgeCreate: () => undefined,
      onNodeDragEnd: () => undefined,
      onNodeResize: () => undefined,
    });

    expect(host.querySelector('.we-graph__layer')).not.toBeNull();
    expect(host.querySelector('.we-graph__edges')).not.toBeNull();
  });

  it('renders with re-attachment bound as well', () => {
    // The third route-editing handler, and the one that writes the claim rather than the view.
    // Bound, its branch in the anchor gesture exists; unbound the drag falls back to anchoring.
    const host = mount({ onEdgeAnchor: () => undefined, onEdgeRetarget: () => undefined });

    expect(host.querySelector('.we-graph__edges')).not.toBeNull();
  });

  it('unmounts without throwing', () => {
    mount();

    expect(() => dispose?.()).not.toThrow();
    dispose = undefined;
  });
});
