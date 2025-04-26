// PostBuilder/Block.tsx
import { useRef } from 'react';
import Editor from '../editor';
import styles from './index.module.scss';

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
    if (fromIndex !== toIndex) moveBlock(fromIndex, toIndex);
  };

  return (
    <div className={styles.wrapper} onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className={styles.handle}>
        <button>
          <we-icon name="gear" size="sm" color="ui-600" />
        </button>
        <div ref={ref} draggable onDragStart={handleDragStart}>
          <we-icon name="dots-six-vertical" weight="bold" size="sm" color="ui-600" />
        </div>
      </div>
      <div className={styles.input}>
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
