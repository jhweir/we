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

  const insertBlock = (index: number, type: string) => {
    const newBlock = {
      id: Date.now(), // Unique ID
      type,
      state: EditorState.create({ schema: customSchema }),
    };

    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  };

  const deleteBlock = (id: number) => {
    setBlocks((prevBlocks) => {
      // Don't delete the last block
      if (prevBlocks.length <= 1) {
        return prevBlocks;
      }
      return prevBlocks.filter((block) => block.id !== id);
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
        />
      ))}
    </div>
  );
}
