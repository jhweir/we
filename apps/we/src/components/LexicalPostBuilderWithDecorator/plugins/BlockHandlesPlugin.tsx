import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Create a React component for the handles
function BlockHandle({ blockElement }: { blockElement: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Update position when the block element moves
  useEffect(() => {
    if (!blockElement) return;

    const updatePosition = () => {
      const rect = blockElement.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX - 40, // Position left of the block
      });
    };

    // Initial position update
    updatePosition();

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [blockElement]);

  const handleDragStart = (e: React.DragEvent) => {
    const key = blockElement.getAttribute('data-lexical-node-key');
    if (key) {
      e.dataTransfer.setData('text/plain', key);
      blockElement.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    blockElement.style.opacity = '1';
  };

  const showBlockTypeMenu = () => {
    alert('Block type menu would show here');
    // Implementation to be added
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        background: 'red',
        padding: '5px',
        borderRadius: '4px',
        zIndex: 9999,
        border: '2px solid black',
        width: '30px',
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={showBlockTypeMenu}
        style={{
          cursor: 'pointer',
          display: 'block',
          width: '100%',
          marginBottom: '5px',
          background: 'white',
          color: 'black',
          border: '1px solid black',
        }}
      >
        +
      </button>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          cursor: 'move',
          textAlign: 'center',
          marginBottom: '5px',
          fontWeight: 'bold',
        }}
      >
        ⋮⋮
      </div>
      <span
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: '10px',
        }}
      >
        P
      </span>
    </div>
  );
}

export default function BlockHandlesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [blocks, setBlocks] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const findBlocks = () => {
      const root = editor.getRootElement();
      if (!root) return;

      // Find all paragraph blocks in the editor
      const paragraphs = Array.from(
        root.querySelectorAll('p.LexicalPostBuilderWithDecorator_editorParagraph__TKNlt, p'),
      ) as HTMLElement[];

      // Only update state if we found different blocks
      if (paragraphs.length !== blocks.length || paragraphs.some((p, i) => blocks[i] !== p)) {
        console.log('Found blocks:', paragraphs.length);
        setBlocks(paragraphs);
      }
    };

    // Initial check
    setTimeout(findBlocks, 500);

    // Check whenever editor updates
    const removeUpdateListener = editor.registerUpdateListener(() => {
      setTimeout(findBlocks, 10);
    });

    // Periodic check as fallback
    const interval = setInterval(findBlocks, 1000);

    return () => {
      removeUpdateListener();
      clearInterval(interval);
    };
  }, [editor, blocks.length]);

  // Create portals for the handles
  return (
    <>
      {blocks.map((block, index) =>
        createPortal(
          <BlockHandle key={block.getAttribute('data-lexical-node-key') || index} blockElement={block} />,
          document.body,
        ),
      )}
    </>
  );
}
