import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalEditor,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Create a custom command for block transformations
export const TRANSFORM_BLOCK_COMMAND = createCommand<{ type: string; nodeKey?: string }>('TRANSFORM_BLOCK_COMMAND');

// Block type menu component
function BlockTypeMenu({
  position,
  onClose,
  onSelectBlockType,
  isVisible,
}: {
  position: { top: number; left: number };
  onClose: () => void;
  onSelectBlockType: (type: string) => void;
  isVisible: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const blockTypes = [
    { type: 'paragraph', label: 'Paragraph' },
    { type: 'h1', label: 'Heading 1' },
    { type: 'h2', label: 'Heading 2' },
    { type: 'h3', label: 'Heading 3' },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
        zIndex: 10000,
        minWidth: '150px',
        border: '1px solid #ddd',
      }}
    >
      {blockTypes.map((blockType) => (
        <div
          key={blockType.type}
          onClick={() => {
            onSelectBlockType(blockType.type);
            onClose();
          }}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            hover: 'backgroundColor: #f5f5f5',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = '';
          }}
        >
          {blockType.label}
        </div>
      ))}
    </div>
  );
}

// Fix the transformBlockType function
function transformBlockType(editor: LexicalEditor, type: string, element: HTMLElement) {
  console.log(`Direct transformation to ${type}`);

  // Set selection to this element
  const range = document.createRange();
  range.selectNodeContents(element);

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Focus the editor
  editor.focus();

  // Use a direct update approach
  editor.update(() => {
    const selection = $getSelection();
    if (!selection || !$isRangeSelection(selection)) {
      console.error('No valid selection for transformation');
      return;
    }

    // Get the current paragraph node
    const nodes = selection.getNodes();
    if (nodes.length === 0) {
      console.error('No nodes in selection');
      return;
    }

    // Find the block node - FIX HERE
    const anchorNode = selection.anchor.getNode();

    // Try to find a direct parent that's a block node
    let blockNode = anchorNode;

    // Instead of looking for root, look for paragraph or heading node types
    while (
      blockNode &&
      blockNode.getType() !== 'paragraph' &&
      blockNode.getType() !== 'heading' &&
      blockNode.getParent()
    ) {
      blockNode = blockNode.getParent();
    }

    // Safety check - make sure we don't have the root
    if (!blockNode || !blockNode.getParent()) {
      console.error('Could not find a valid block node to replace');
      return;
    }

    // Get content
    const content = blockNode.getTextContent();
    console.log(`Transforming node with content: "${content}"`);

    // Create appropriate new node
    let newNode;
    switch (type) {
      case 'h1':
        newNode = $createHeadingNode('h1');
        console.log('Created H1 node');
        break;
      case 'h2':
        newNode = $createHeadingNode('h2');
        console.log('Created H2 node');
        break;
      case 'h3':
        newNode = $createHeadingNode('h3');
        console.log('Created H3 node');
        break;
      default:
        newNode = $createParagraphNode();
        console.log('Created paragraph node');
    }

    // Add content
    if (content) {
      const textNode = $createTextNode(content);
      newNode.append(textNode);
    }

    // Replace the node and preserve selection
    const newSelection = $createRangeSelection();
    blockNode.replace(newNode);

    // Set selection to the new text node
    const newTextNode = newNode.getFirstDescendant();
    if (newTextNode) {
      newSelection.anchor.set(newTextNode.getKey(), 0, 'text');
      newSelection.focus.set(newTextNode.getKey(), newTextNode.getTextContent().length, 'text');
      $setSelection(newSelection);
    }

    console.log('Node replaced');
  });
}

// Block handle component with menu
function BlockHandle({ blockElement, id }: { blockElement: HTMLElement; id: string }) {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  // Store a stable reference to the block element
  useEffect(() => {
    if (!blockElement) return;

    // Ensure the block has our stable ID attribute
    if (!blockElement.hasAttribute('data-block-id')) {
      blockElement.setAttribute('data-block-id', id);
    }

    // Determine block type from element
    const tagName = blockElement.tagName.toLowerCase();
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      setBlockType(tagName);
    } else {
      setBlockType('paragraph');
    }

    const updatePosition = () => {
      const rect = blockElement.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX - 40,
      });
    };

    // Initial position update
    updatePosition();

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    // Make block clickable to establish selection
    const handleClick = () => {
      editor.focus();
    };
    blockElement.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      blockElement.removeEventListener('click', handleClick);
    };
  }, [blockElement, editor, id]);

  const handleDragStart = (e: React.DragEvent) => {
    // Use the consistent block ID for drag operations
    e.dataTransfer.setData('text/plain', id);
    blockElement.style.opacity = '0.5';
  };

  const handleDragEnd = () => {
    blockElement.style.opacity = '1';
  };

  const openBlockTypeMenu = () => {
    const buttonRect = blockElement.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX,
    });
    setShowMenu(true);
  };

  const handleBlockTypeChange = (type: string) => {
    transformBlockType(editor, type, blockElement);
    setBlockType(type);
  };

  // Get display label for the block type indicator
  const getBlockTypeLabel = () => {
    switch (blockType) {
      case 'h1':
        return 'H1';
      case 'h2':
        return 'H2';
      case 'h3':
        return 'H3';
      default:
        return 'P';
    }
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: `${position.top}px`,
          left: `${position.left - 60}px`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'white',
          padding: '5px',
          borderRadius: '4px',
          zIndex: 9999,
          border: '1px solid #ccc',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: '80px',
          pointerEvents: 'auto',
          opacity: '0.7',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
      >
        <button
          onClick={openBlockTypeMenu}
          style={{
            cursor: 'pointer',
            display: 'block',
            width: '20px',
            marginBottom: '5px',
            background: 'white',
            color: 'black',
            border: '1px solid #ddd',
            borderRadius: '2px',
            padding: '2px 0',
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
            fontWeight: 'bold',
          }}
        >
          {getBlockTypeLabel()}
        </span>
      </div>

      {createPortal(
        <BlockTypeMenu
          position={menuPosition}
          onClose={() => setShowMenu(false)}
          onSelectBlockType={handleBlockTypeChange}
          isVisible={showMenu}
        />,
        document.body,
      )}
    </>
  );
}

export default function BlockHandlesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [blocks, setBlocks] = useState<HTMLElement[]>([]);

  // Register the transform command handler
  useEffect(() => {
    // Handle the block transformation command
    const removeTransformHandler = editor.registerCommand(
      TRANSFORM_BLOCK_COMMAND,
      (payload) => {
        const { type, nodeKey } = payload;

        editor.update(() => {
          try {
            // If we have a node key, use it directly
            if (nodeKey) {
              const node = $getNodeByKey(nodeKey);
              if (!node) return false;

              // Get the content before replacing
              const textContent = node.getTextContent();

              // Store selection state info
              const selection = $getSelection();
              const isSelected =
                selection && $isRangeSelection(selection) && selection.getNodes().some((n) => n.is(node));
              let selectionOffset = 0;

              if (isSelected && $isRangeSelection(selection)) {
                // Save selection position
                selectionOffset = selection.anchor.offset;
              }

              // Create the new node based on requested type
              let newNode;
              switch (type) {
                case 'h1':
                  newNode = $createHeadingNode('h1');
                  break;
                case 'h2':
                  newNode = $createHeadingNode('h2');
                  break;
                case 'h3':
                  newNode = $createHeadingNode('h3');
                  break;
                default:
                  newNode = $createParagraphNode();
                  break;
              }

              // Add the content to the new node
              if (textContent) {
                newNode.append($createTextNode(textContent));
              }

              // Replace the old node with the new one
              node.replace(newNode);

              // Restore the selection if needed
              if (isSelected) {
                const newSelection = $createRangeSelection();
                const textNode = newNode.getFirstDescendant();

                if (textNode) {
                  // Ensure offset is within bounds
                  const maxOffset = textNode.getTextContent().length;
                  const safeOffset = Math.min(selectionOffset, maxOffset);

                  newSelection.anchor.set(textNode.getKey(), safeOffset, 'text');
                  newSelection.focus.set(textNode.getKey(), safeOffset, 'text');
                  $setSelection(newSelection);
                } else {
                  // If no text node, select the block itself
                  newSelection.anchor.set(newNode.getKey(), 0, 'element');
                  newSelection.focus.set(newNode.getKey(), 0, 'element');
                  $setSelection(newSelection);
                }
              }

              console.log('Node transformed successfully to', type);
              return true;
            }

            // If no node key, try using selection
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false;

            const anchorNode = selection.anchor.getNode();
            let blockNode = anchorNode;

            // Find the top block element
            while (blockNode.getParent() && !['paragraph', 'heading'].includes(blockNode.getType())) {
              blockNode = blockNode.getParent();
            }

            const content = blockNode.getTextContent();

            // Create the new node
            let newNode;
            switch (type) {
              case 'h1':
                newNode = $createHeadingNode('h1');
                break;
              case 'h2':
                newNode = $createHeadingNode('h2');
                break;
              case 'h3':
                newNode = $createHeadingNode('h3');
                break;
              default:
                newNode = $createParagraphNode();
                break;
            }

            // Transfer content
            if (content) {
              newNode.append($createTextNode(content));
            }

            blockNode.replace(newNode);
            console.log('Node transformed via selection to', type);
            return true;
          } catch (error) {
            console.error('Error during transformation:', error);
            return false;
          }
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    return () => {
      removeTransformHandler();
    };
  }, [editor]);

  // Handle block finding and DOM augmentation
  useEffect(() => {
    // Add stable IDs to blocks for reference
    const augmentBlocks = () => {
      const root = editor.getRootElement();
      if (!root) return;

      // Find blocks
      const blockElements = Array.from(root.querySelectorAll('p, h1, h2, h3')) as HTMLElement[];

      // Add stable IDs if not present
      blockElements.forEach((el, idx) => {
        if (!el.hasAttribute('data-block-id')) {
          el.setAttribute('data-block-id', `block-${Date.now()}-${idx}`);
        }
      });

      // Only update state if we found different blocks
      const currentIds = blocks.map((b) => b.getAttribute('data-block-id'));
      const newIds = blockElements.map((b) => b.getAttribute('data-block-id'));

      const blocksChanged = blockElements.length !== blocks.length || newIds.some((id, idx) => id !== currentIds[idx]);

      if (blocksChanged) {
        console.log('Found blocks:', blockElements.length);
        setBlocks(blockElements);
      }
    };

    // Initial check
    setTimeout(augmentBlocks, 500);

    // Check whenever editor updates
    const removeUpdateListener = editor.registerUpdateListener(() => {
      setTimeout(augmentBlocks, 10);
    });

    // Periodic check as fallback
    const interval = setInterval(augmentBlocks, 1000);

    return () => {
      removeUpdateListener();
      clearInterval(interval);
    };
  }, [editor, blocks]);

  // Create portals for the handles with stable IDs
  return (
    <>
      {blocks.map((block) => {
        const blockId = block.getAttribute('data-block-id') || Math.random().toString();
        return createPortal(<BlockHandle key={blockId} blockElement={block} id={blockId} />, document.body);
      })}
    </>
  );
}
