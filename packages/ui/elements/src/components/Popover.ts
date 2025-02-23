import { createPopper, VirtualElement } from '@popperjs/core';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import sharedStyles from '../shared';

type Placement =
  | 'auto'
  | 'auto-start'
  | 'auto-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'left'
  | 'left-start'
  | 'left-end';

type Event = 'contextmenu' | 'mouseover' | 'click';

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
  @property({ type: String, reflect: true }) event: Event = 'click';

  @state() clientY = 0;
  @state() clientX = 0;

  constructor() {
    super();
    this._createPopover = this._createPopover.bind(this);
  }

  private popperInstance: any = null;

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
      trigger.addEventListener(this.event, (e: any) => {
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

      // Handle click outside
      window.addEventListener('mousedown', (e: any) => {
        var path = e.path || (e.composedPath && e.composedPath());
        const clickedTrigger = path.includes(this.triggerAssignedNode);
        const clickedInside = path.includes(this.contentAssignedNode);
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
  }

  _createPopover() {
    const trigger = this.triggerPart;
    const content = this.contentPart;

    if (!trigger || !content) return;

    this.destroyPopper();

    if (this.event === 'contextmenu') {
      const virtualElement: VirtualElement = {
        contextElement: trigger,
        getBoundingClientRect: generateGetBoundingClientRect(),
      };

      this.popperInstance = createPopper(virtualElement, content, {
        placement: this.placement as Placement,
        strategy: 'fixed',
        // modifiers: [{ name: 'offset', options: { offset: [10, 10] } }],
      });

      virtualElement.getBoundingClientRect = generateGetBoundingClientRect(this.clientX, this.clientY);
      this.popperInstance.update();
    } else {
      this.popperInstance = createPopper(trigger, content, {
        placement: this.placement as Placement,
        strategy: 'fixed',
        modifiers: [
          { name: 'offset', options: { offset: [0, 10] } },
          { name: 'computeStyles', options: { gpuAcceleration: false } },
        ],
      });
    }
  }

  shouldUpdate(props: Map<string, any>) {
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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'we-popover': {
        open?: boolean;
        placement?: Placement;
        event?: Event;
        class?: string;
        style?: any;
        children?: any;
      };
    }
  }
}
