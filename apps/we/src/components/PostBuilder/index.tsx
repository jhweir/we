'use client';

import { EditorState } from 'prosemirror-state';
import { useState } from 'react';
import BlockEditor from './BlockEditor';
import { customSchema } from './schema';

interface Block {
  id: number;
  type: string;
  state: EditorState;
}

export default function PostBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: 'paragraph', state: EditorState.create({ schema: customSchema }) },
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<number>(1);

  const insertBlock = (index: number, type: string) => {
    const newBlockId = Date.now();
    const newBlock = {
      id: newBlockId,
      type,
      state: EditorState.create({ schema: customSchema }),
    };

    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    setFocusedBlockId(newBlockId);
  };

  const deleteBlock = (id: number) => {
    setBlocks((prevBlocks) => {
      if (prevBlocks.length <= 1) {
        return prevBlocks;
      }

      const indexToDelete = prevBlocks.findIndex((block) => block.id === id);
      const newBlocks = prevBlocks.filter((block) => block.id !== id);

      if (newBlocks.length > 0) {
        if (indexToDelete > 0) {
          setFocusedBlockId(newBlocks[indexToDelete - 1].id);
        } else {
          setFocusedBlockId(newBlocks[0].id);
        }
      }

      return newBlocks;
    });
  };

  const updateBlockState = (id: number, newState: EditorState) => {
    setBlocks((prevBlocks) => prevBlocks.map((block) => (block.id === id ? { ...block, state: newState } : block)));
  };

  const mergeWithNextBlock =
    (index: number) =>
    (currentState: EditorState): EditorState | null => {
      const currentBlocks = blocks;
      if (index >= currentBlocks.length - 1) {
        return null;
      }

      const nextBlock = currentBlocks[index + 1];
      const nextDoc = nextBlock.state.doc;

      // Extract text content from the next block
      let nextText = '';
      nextDoc.content.forEach((node) => {
        if (node.type.name === 'paragraph') {
          node.content.forEach((child) => {
            if (child.isText) {
              nextText += child.text;
            }
          });
        }
      });

      // Create a transaction to append the text to the last text node in the current block
      const tr = currentState.tr;
      const currentDoc = currentState.doc;

      // Find the position of the last text node in the current block
      let insertPos = currentDoc.content.size;
      currentDoc.forEach((node, offset) => {
        if (node.type.name === 'paragraph') {
          insertPos = offset + node.nodeSize - 1; // Position at the end of the paragraph
        }
      });

      // Insert the text content at the end of the current block's last text node
      tr.insertText(nextText, insertPos);

      return currentState.apply(tr);
    };

  return (
    <div className="editor-container">
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          id={block.id}
          state={block.state}
          insertBlock={() => insertBlock(index, 'paragraph')}
          deleteBlock={deleteBlock}
          mergeWithNextBlock={mergeWithNextBlock(index)}
          hasNextBlock={index < blocks.length - 1}
          nextBlockId={index < blocks.length - 1 ? blocks[index + 1].id : undefined}
          focused={focusedBlockId === block.id}
          onFocus={() => setFocusedBlockId(block.id)}
          onStateChange={updateBlockState}
        />
      ))}
    </div>
  );
}
