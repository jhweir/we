import { DecoratorNode, LexicalNode, NodeKey } from 'lexical';
import { ReactNode } from 'react';

export class CustomParagraphNode extends DecoratorNode<ReactNode> {
  __content: string;

  static getType(): string {
    return 'custom-paragraph';
  }

  static clone(node: CustomParagraphNode): CustomParagraphNode {
    return new CustomParagraphNode(node.__content, node.__key);
  }

  constructor(content: string = '', key?: NodeKey) {
    super(key);
    this.__content = content;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'paragraph-block';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): ReactNode {
    return <BlockDecorator nodeKey={this.__key} content={this.__content} />;
  }

  getTextContent(): string {
    return this.__content;
  }

  // Method to update content
  setContent(content: string): void {
    this.__content = content;
  }
}

function BlockDecorator({ nodeKey, content }: { nodeKey: string; content: string }) {
  return (
    <div className="flex items-start group">
      <div className="w-6 h-6 opacity-0 group-hover:opacity-100 flex justify-center items-center mr-2">
        <span className="text-gray-500">⠿</span>
      </div>
      <div className="flex-1">{content}</div>
    </div>
  );
}

export function $createCustomParagraphNode(content: string = ''): CustomParagraphNode {
  return new CustomParagraphNode(content);
}

export function $isCustomParagraphNode(node: LexicalNode | null | undefined): node is CustomParagraphNode {
  return node instanceof CustomParagraphNode;
}
