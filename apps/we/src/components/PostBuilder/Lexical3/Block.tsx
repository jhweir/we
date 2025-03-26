// PostBuilder/Block.tsx
import { useRef } from 'react';
import Editor from './Editor';

interface BlockProps {
  id: string;
  index: number;
  content: string;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateContent: (id: string, content: string) => void;
  onEnter: (index: number) => void;
  onNavigate: (fromIndex: number, direction: 'up' | 'down') => void;
}

export default function Block({ id, index, content, moveBlock, updateContent, onEnter, onNavigate }: BlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const toIndex = index;
    if (fromIndex !== toIndex) {
      moveBlock(fromIndex, toIndex);
    }
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex items-start group relative"
    >
      {/* Handle */}
      <div className="w-6 h-6 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center cursor-move mr-2">
        <span className="text-gray-500">⠿</span>
      </div>
      {/* Editor */}
      <div className="flex-1">
        <Editor
          initialContent={content}
          onChange={(newContent) => updateContent(id, newContent)}
          onEnter={() => onEnter(index)}
          onNavigateUp={() => onNavigate(index, 'up')}
          onNavigateDown={() => onNavigate(index, 'down')}
        />
      </div>
    </div>
  );
}
