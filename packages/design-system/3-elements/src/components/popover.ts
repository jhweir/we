// import type { Instance as PopperInstance } from '@popperjs/core';
import { createPopper, VirtualElement } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import sharedStyles from '../styles/shared';
import { Placement, PopoverEvent } from '../types';

const styles = css`
  :host [part='content'] {
    z-index: 999;
    display: none;
  }
  :host([open]) [part='content'] {
    display: inline-block;
    animation: fade-in 0.2s ease;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// // portal wrapper defaults — when we move slot content to body it will live here
// const portalStyles = css`
//   .we-popover-portal {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 0;
//     height: 0;
//     z-index: 1000000; /* should be above modals */
//     pointer-events: none;
//   }
//   .we-popover-portal > * {
//     pointer-events: auto;
//   }
// `;

const generateGetBoundingClientRect = (x = 0, y = 0) => {
  return (): DOMRect => ({
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x,
    x,
    y,
    toJSON() {
      return this;
    },
  });
};

@customElement('we-popover')
export default class Popover extends LitElement {
  static styles = [sharedStyles, styles];

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String, reflect: true }) placement: Placement = 'auto';
  @property({ type: String, reflect: true }) event: PopoverEvent = 'click';

  @state() clientY = 0;
  @state() clientX = 0;

  constructor() {
    super();
    this._createPopover = this._createPopover.bind(this);
  }

  private popperInstance: any | null = null;
  // portal bookkeeping: container appended to document.body and moved nodes list
  private _portalContainer: HTMLElement | null = null;
  private _movedNodes: { node: Node; parent: Node | null; nextSibling: Node | null }[] = [];

  get triggerPart(): HTMLElement {
    const trigger = this.renderRoot.querySelector<HTMLElement>("[part='trigger']");
    if (!trigger) throw new Error('Trigger element not found');
    return trigger;
  }

  get contentPart(): HTMLElement {
    const content = this.renderRoot.querySelector<HTMLElement>("[part='content']");
    if (!content) throw new Error('Content element not found');
    return content;
  }

  get triggerAssignedNode(): Node {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>("[name='trigger']");
    if (!slot) throw new Error('Trigger slot not found');
    const node = slot.assignedNodes()[0];
    if (!node) throw new Error('No node assigned to trigger slot');
    return node;
  }

  get contentAssignedNode(): Node {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>("[name='content']");
    if (!slot) throw new Error('Content slot not found');
    const node = slot.assignedNodes()[0];
    if (!node) throw new Error('No node assigned to content slot');
    return node;
  }

  firstUpdated() {
    const trigger = this.triggerPart;
    if (trigger) {
      trigger.addEventListener(this.event, (e: MouseEvent) => {
        e.preventDefault();
        this.clientY = e.clientY;
        this.clientX = e.clientX;
        this.open = !this.open;
      });

      if (this.event === 'mouseover') {
        trigger.addEventListener('mouseover', () => (this.open = true));
        trigger.addEventListener('mouseleave', () => (this.open = false));
        trigger.addEventListener('mouseleave', () => (this.open = false));
      }

      // Handle click outside. When content is portalled, the slot will be empty,
      // so we also check moved nodes recorded in _movedNodes.
      window.addEventListener('mousedown', (e: MouseEvent) => {
        let path: EventTarget[] = [];
        if (typeof e.composedPath === 'function') {
          path = e.composedPath();
        } else if ('path' in e && Array.isArray((e as { path: unknown }).path)) {
          path = (e as { path: EventTarget[] }).path;
        }

        const clickedTrigger = path.includes(this.triggerAssignedNode);

        let clickedInside = false;
        // if we moved nodes to a portal, check those nodes
        if (this._movedNodes && this._movedNodes.length > 0) {
          for (const entry of this._movedNodes) {
            if (path.includes(entry.node)) {
              clickedInside = true;
              break;
            }
          }
        }

        // fallback: if no moved nodes, try checking the original slot-assigned node
        if (!clickedInside) {
          try {
            clickedInside = path.includes(this.contentAssignedNode);
          } catch (err) {
            // no assigned node — treat as not clicked inside
            clickedInside = false;
          }
        }

        if (!clickedInside && !clickedTrigger) this.open = false;
      });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyPopper();
  }

  private destroyPopper() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
    // restore any portalled nodes to their original positions
    if (this._portalContainer) {
      for (const entry of this._movedNodes) {
        const { node, parent, nextSibling } = entry;
        if (parent) parent.insertBefore(node, nextSibling);
        else document.body.appendChild(node);
      }
      this._movedNodes = [];
      if (this._portalContainer.parentNode) this._portalContainer.parentNode.removeChild(this._portalContainer);
      this._portalContainer = null;
    }
  }

  _createPopover() {
    const trigger = this.triggerPart;
    const content = this.contentPart;

    // find the content slot so we can portal its assigned nodes
    const contentSlot = this.renderRoot.querySelector<HTMLSlotElement>("[name='content']");

    if (!trigger || !content) return;

    this.destroyPopper();

    // If there are assigned nodes in the content slot, portal them to body to avoid
    // transform/overflow/clipping issues (modals create new stacking contexts).
    let popperTarget: HTMLElement | Element = content;
    try {
      if (contentSlot) {
        const assigned = contentSlot.assignedNodes({ flatten: true });
        if (assigned && assigned.length > 0) {
          // create portal container
          this._portalContainer = document.createElement('div');
          this._portalContainer.style.zIndex = '1000000';
          document.body.appendChild(this._portalContainer);

          // move nodes into portal and remember their original parents
          this._movedNodes = assigned.map((n) => ({ node: n, parent: n.parentNode, nextSibling: n.nextSibling }));
          for (const { node } of this._movedNodes) this._portalContainer.appendChild(node);

          popperTarget = this._portalContainer;
        }
      }
    } catch (err) {
      // fallback — ignore portal failures
      // console.warn('Popover portal failed', err);
    }

    if (this.event === 'contextmenu') {
      const virtualElement: VirtualElement = {
        contextElement: trigger,
        getBoundingClientRect: generateGetBoundingClientRect(),
      };

      this.popperInstance = createPopper(virtualElement, popperTarget as HTMLElement, {
        placement: this.placement as Placement,
        strategy: 'fixed',
      });
    } else {
      this.popperInstance = createPopper(trigger, popperTarget as HTMLElement, {
        placement: this.placement as Placement,
        strategy: 'fixed',
        modifiers: [
          { name: 'offset', options: { offset: [0, 10] } },
          { name: 'computeStyles', options: { gpuAcceleration: false } },
        ],
      });
    }
  }

  shouldUpdate(props: Map<string, unknown>) {
    if (props.has('open')) {
      this.dispatchEvent(new CustomEvent('toggle', { bubbles: true }));
      if (this.open) this._createPopover();
      else this.destroyPopper();
    }
    return true;
  }

  render() {
    return html`
      <div part="base">
        <span part="trigger"><slot name="trigger"></slot></span>
        <span part="content"><slot name="content"></slot></span>
      </div>
    `;
  }
}
