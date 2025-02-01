import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import sharedStyles from "../shared";

const styles = css`
  [part="base"] {
    border-radius: var(--j-border-radius);
    padding: var(--j-space-300) 0;
    min-width: 200px;
    background: var(--j-color-white);
    border: 1px solid var(--j-border-color);
    overflow: hidden;
  }
`;

@customElement("j-menu")
export default class Menu extends LitElement {
  static styles = [sharedStyles, styles];

  render() {
    return html` <div part="base" role="menu"><slot></slot></div>`;
  }
}
