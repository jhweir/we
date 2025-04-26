// PostBuilder/index.tsx
'use client';

import { useCallback, useState } from 'react';
import Block from './components/block';

interface BlockData {
  id: string;
  content: string;
}

export default function PostBuilder() {
  const [blocks, setBlocks] = useState<BlockData[]>([{ id: '1', content: 'First block' }]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prevBlocks) => {
      const updatedBlocks = [...prevBlocks];
      const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
      updatedBlocks.splice(toIndex, 0, movedBlock);
      return updatedBlocks;
    });
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setBlocks((prevBlocks) => prevBlocks.map((block) => (block.id === id ? { ...block, content } : block)));
  }, []);

  const onEnter = useCallback((index: number) => {
    const newBlock = { id: Date.now().toString(), content: '' };
    setBlocks((prevBlocks) => [...prevBlocks.slice(0, index + 1), newBlock, ...prevBlocks.slice(index + 1)]);
    // Focus the new block (requires ref management, omitted for brevity)
  }, []);

  const onNavigate = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      console.log('onNavigate', fromIndex, direction);
      const newIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (newIndex >= 0 && newIndex < blocks.length) {
        // Focus the block at newIndex (requires ref management)
        console.log(`Navigate to block ${newIndex}`);
      }
    },
    [blocks.length],
  );

  return (
    <we-column bg="white" p="1000" r="xs" style={{ width: '100%', maxWidth: 1000 }}>
      {/* Title */}
      {blocks.map((block, index) => (
        <Block
          key={block.id}
          id={block.id}
          index={index}
          content={block.content}
          moveBlock={moveBlock}
          updateContent={updateContent}
          onEnter={onEnter}
          onNavigate={onNavigate}
        />
      ))}
    </we-column>
  );
}
