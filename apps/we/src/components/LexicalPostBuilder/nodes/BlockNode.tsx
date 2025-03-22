// src/components/LexicalPostBuilder/nodes/BlockNode.tsx
import { ElementNode, LexicalNode, NodeKey, SerializedElementNode, Spread } from 'lexical';

export type SerializedBlockNode = Spread<
  {
    type: 'block';
    blockType: string;
  },
  SerializedElementNode
>;

export class BlockNode extends ElementNode {
  __blockType: string;

  static getType(): string {
    return 'block';
  }

  static clone(node: BlockNode): BlockNode {
    return new BlockNode(node.__blockType, node.__key);
  }

  constructor(blockType: string, key?: NodeKey) {
    super(key);
    this.__blockType = blockType;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('block');
    dom.setAttribute('data-block-type', this.__blockType);
    return dom;
  }

  updateDOM(prevNode: BlockNode, dom: HTMLElement): boolean {
    if (this.__blockType !== prevNode.__blockType) {
      dom.setAttribute('data-block-type', this.__blockType);
    }
    return false;
  }

  getBlockType(): string {
    return this.__blockType;
  }

  setBlockType(blockType: string): void {
    const self = this.getWritable();
    self.__blockType = blockType;
  }

  static importJSON(serializedNode: SerializedBlockNode): BlockNode {
    const node = $createBlockNode(serializedNode.blockType);
    node.setBlockType(serializedNode.blockType);
    return node;
  }

  exportJSON(): SerializedBlockNode {
    return {
      ...super.exportJSON(),
      type: 'block',
      blockType: this.__blockType,
    };
  }
}

export function $createBlockNode(blockType: string): BlockNode {
  return new BlockNode(blockType);
}

export function $isBlockNode(node: LexicalNode | null): node is BlockNode {
  return node instanceof BlockNode;
}
