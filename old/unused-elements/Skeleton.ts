import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import sharedStyles from "../shared";

const styles = css`
  :host {
    --j-skeleton-height: var(--j-size-md);
    --j-skeleton-width: 100%;
    --j-skeleton-border-radius: var(--j-border-radius, 0px);
    --j-skeleton-display: inline-block;
  }
  [part="base"] {
    display: var(--j-skeleton-display);
    width: var(--j-skeleton-width);
    height: var(--j-skeleton-height);
    border-radius: var(--j-skeleton-border-radius);
    background: linear-gradient(
      90deg,
      var(--j-color-ui-100) 0%,
      var(--j-color-ui-200) 50%,
      var(--j-color-ui-100) 100%
    );
    animation: placeHolderShimmer 10s linear infinite;
  }

  :host([height="xxs"]) {
    --j-skeleton-height: var(--j-size-xxs);
  }

  :host([height="xs"]) {
    --j-skeleton-height: var(--j-size-xs);
  }

  :host([height="sm"]) {
    --j-skeleton-height: var(--j-size-sm);
  }

  :host([height="md"]) {
    --j-skeleton-height: var(--j-size-md);
  }

  :host([height="lg"]) {
    --j-skeleton-height: var(--j-size-lg);
  }

  :host([height="xl"]) {
    --j-skeleton-height: var(--j-size-xl);
  }

  :host([height="xxl"]) {
    --j-skeleton-height: var(--j-size-xxl);
  }

  :host([height="full"]) {
    --j-skeleton-height: 100%;
  }

  :host([height="text"]) {
    --j-skeleton-height: 1em;
  }

  :host([width="xxs"]) {
    --j-skeleton-width: var(--j-size-xxs);
  }

  :host([width="xs"]) {
    --j-skeleton-width: var(--j-size-xs);
  }

  :host([width="sm"]) {
    --j-skeleton-width: var(--j-size-sm);
  }

  :host([width="md"]) {
    --j-skeleton-width: var(--j-size-md);
  }

  :host([width="lg"]) {
    --j-skeleton-width: var(--j-size-lg);
  }

  :host([width="xl"]) {
    --j-skeleton-width: var(--j-size-xl);
  }

  :host([width="xxl"]) {
    --j-skeleton-width: var(--j-size-xxl);
  }

  :host([width="full"]) {
    --j-skeleton-width: 100%;
    --j-skeleton-displa: block;
  }

  :host([width="text"]) {
    --j-skeleton-width: 1em;
  }

  :host([variant="circle"]) {
    --j-skeleton-border-radius: 50%;
  }

  :host([variant="circle"]) [part="base"] {
    aspect-ratio: 1/1;
  }

  @keyframes placeHolderShimmer {
    0% {
      background-position: -500px 0;
    }
    100% {
      background-position: 500px 0;
    }
  }
`;

@customElement("j-skeleton")
export default class Skeleton extends LitElement {
  static styles = [styles, sharedStyles];

  /**
   * Variant
   * @type {""|"circle"}
   * @attr
   */
  @property({ type: String, reflect: true }) variant = "";

  /**
   * Height
   * @type {""|"xxs"|"xs"|"sm"|"md"|"lg"|"xl"|"xxl"|"text"}
   * @attr
   */
  @property({ type: String, reflect: true }) height = "md";

  /**
   * Width
   * @type {""|"xxs"|"xs"|"sm"|"md"|"lg"|"xl"|"xxl"|"text"}
   * @attr
   */
  @property({ type: String, reflect: true }) width = "md";

  render() {
    return html`<div part="base"></div>`;
  }
}
