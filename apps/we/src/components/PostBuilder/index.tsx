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
    const newBlockId = Date.now(); // Unique ID
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

    // Set focus to the new block
    setFocusedBlockId(newBlockId);
  };

  const deleteBlock = (id: number) => {
    setBlocks((prevBlocks) => {
      // Don't delete the last block
      if (prevBlocks.length <= 1) {
        return prevBlocks;
      }

      const indexToDelete = prevBlocks.findIndex((block) => block.id === id);
      const newBlocks = prevBlocks.filter((block) => block.id !== id);

      // Set focus to the previous block or next block if available
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

  return (
    <div className="editor-container">
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          id={block.id}
          state={block.state}
          insertBlock={() => insertBlock(index, 'paragraph')}
          deleteBlock={() => deleteBlock(block.id)}
          focused={focusedBlockId === block.id}
          onFocus={() => setFocusedBlockId(block.id)}
          onStateChange={updateBlockState}
        />
      ))}
    </div>
  );
}
