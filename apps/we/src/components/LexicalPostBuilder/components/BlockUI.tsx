// components/BlockUI.tsx
import { $createListItemNode, $createListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
  $createNodeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $setSelection,
  NodeKey,
} from 'lexical';
import React, { useState } from 'react';
import { $isBlockNode } from '../nodes/BlockNode';

interface BlockUIProps {
  nodeKey: NodeKey;
  blockType: string;
}

function BlockUI({ nodeKey, blockType }: BlockUIProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);

  const changeBlockType = (newBlockType: string) => {
    editor.update(() => {
      const blockNode = $getNodeByKey(nodeKey);
      if (!blockNode || !$isBlockNode(blockNode)) return;

      const child = blockNode.getFirstChild();
      if (!child) return;

      const selection = $createNodeSelection();
      selection.add(child.getKey());
      $setSelection(selection);

      if (newBlockType.startsWith('h')) {
        $setBlocksType($getSelection(), () => $createHeadingNode(newBlockType as HeadingTagType));
      } else if (newBlockType === 'paragraph') {
        $setBlocksType($getSelection(), () => $createParagraphNode());
      } else if (newBlockType === 'bullet') {
        const listNode = $createListNode('bullet');
        const listItemNode = $createListItemNode();
        listNode.append(listItemNode);
        child.replace(listNode);
      } else if (newBlockType === 'number') {
        const listNode = $createListNode('number');
        const listItemNode = $createListItemNode();
        listNode.append(listItemNode);
        child.replace(listNode);
      }
      blockNode.setBlockType(newBlockType);
    });
    setShowMenu(false);
  };

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('text/plain', nodeKey);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="block-ui-wrapper">
      <div className="block-handle" contentEditable={false}>
        <button className="block-menu-button" onClick={() => setShowMenu(!showMenu)} aria-label="Block menu">
          +
        </button>
        <div className="block-drag-handle" draggable onDragStart={handleDragStart} aria-label="Drag block">
          ⋮⋮
        </div>
        <span className="block-type-indicator">{blockType}</span>
      </div>
      {showMenu && (
        <div className="block-type-menu">
          <button onClick={() => changeBlockType('paragraph')}>Text</button>
          <button onClick={() => changeBlockType('h1')}>Heading 1</button>
          <button onClick={() => changeBlockType('h2')}>Heading 2</button>
          <button onClick={() => changeBlockType('h3')}>Heading 3</button>
          <button onClick={() => changeBlockType('bullet')}>Bullet List</button>
          <button onClick={() => changeBlockType('number')}>Numbered List</button>
        </div>
      )}
    </div>
  );
}

export default BlockUI;
