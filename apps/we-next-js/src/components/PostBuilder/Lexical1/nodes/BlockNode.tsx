// src/components/LexicalPostBuilder/nodes/BlockNode.ts
import {
  $applyNodeReplacement,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

export type SerializedBlockNode = Spread<
  {
    blockType: string;
  },
  SerializedElementNode
>;

export class BlockNode extends ElementNode {
  __blockType: string;

  constructor(blockType: string, key?: NodeKey) {
    super(key);
    this.__blockType = blockType;
  }

  static getType(): string {
    return 'block';
  }

  static clone(node: BlockNode): BlockNode {
    return new BlockNode(node.__blockType, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = 'block';
    dom.setAttribute('data-block-type', this.__blockType);

    // UI container (non-editable)
    const blockUIContainer = document.createElement('div');
    blockUIContainer.className = 'block-ui-container';
    blockUIContainer.setAttribute('contenteditable', 'false'); // Explicitly non-editable
    const blockUIWrapper = document.createElement('div');
    blockUIWrapper.className = 'block-ui-wrapper';
    blockUIWrapper.innerHTML = `
      <div class="block-handle" contenteditable="false">
        <button class="block-menu-button">+</button>
        <div class="block-drag-handle" draggable="true">⋮⋮</div>
        <span class="block-type-indicator">${this.__blockType}</span>
      </div>
    `;
    blockUIContainer.appendChild(blockUIWrapper);
    dom.appendChild(blockUIContainer);

    // Content container (editable)
    const contentContainer = document.createElement('div');
    contentContainer.className = 'block-content';
    contentContainer.setAttribute('contenteditable', 'true'); // Only this is editable
    dom.appendChild(contentContainer);

    console.log('Created DOM for BlockNode:', this.__key, 'Structure:', dom.outerHTML);
    return dom;
  }

  getChildrenContainer(element: HTMLElement): HTMLElement {
    console.log('Getting children container for BlockNode:', this.__key);
    // Find the content container to place child nodes
    const contentContainer = element.querySelector('.block-content');
    if (!contentContainer) {
      console.warn('BlockNode: Could not find .block-content container, using parent element');
      return element;
    }
    return contentContainer as HTMLElement;
  }

  updateDOM(prevNode: BlockNode, dom: HTMLElement, config: EditorConfig): boolean {
    if (prevNode.__blockType !== this.__blockType) {
      dom.setAttribute('data-block-type', this.__blockType);
      const typeIndicator = dom.querySelector('.block-type-indicator');
      if (typeIndicator) typeIndicator.textContent = this.__blockType;
    }
    return false;
  }

  static importJSON(serializedNode: SerializedBlockNode): BlockNode {
    const node = $createBlockNode(serializedNode.blockType);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedBlockNode {
    return {
      ...super.exportJSON(),
      type: 'block',
      blockType: this.__blockType,
      version: 1,
    };
  }

  getBlockType(): string {
    return this.__blockType;
  }

  setBlockType(blockType: string): void {
    this.getWritable().__blockType = blockType;
  }
}

export function $createBlockNode(blockType: string): BlockNode {
  return $applyNodeReplacement(new BlockNode(blockType));
}

export function $isBlockNode(node: LexicalNode | null | undefined): node is BlockNode {
  return node instanceof BlockNode;
}
