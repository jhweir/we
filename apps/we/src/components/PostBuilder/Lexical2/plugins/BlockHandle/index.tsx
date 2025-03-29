import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './index.module.scss';

const TRANSFORM_BLOCK_COMMAND = createCommand<{ type: string; nodeKey?: string }>('TRANSFORM_BLOCK_COMMAND');

const blockTypes = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'h1', label: 'Heading 1' },
  { type: 'h2', label: 'Heading 2' },
  { type: 'h3', label: 'Heading 3' },
];

function mapsAreEqual<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
  // Quick size check
  if (map1.size !== map2.size) {
    return false;
  }

  // Check if all keys in map1 exist in map2 with the same values
  for (const [key, val1] of map1) {
    // If the key doesn't exist in map2 or refers to a different value
    if (!map2.has(key)) {
      return false;
    }

    // For DOM elements, we just check reference equality
    // This works because we're comparing DOM element references
    const val2 = map2.get(key);
    if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

function BlockTypeMenu({
  visible,
  position,
  selectType,
  close,
}: {
  visible: boolean;
  position: { top: number; left: number };
  selectType: (type: string) => void;
  close: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  function handleClickOutside(e: MouseEvent) {
    if (!menuRef.current?.contains(e.target as Node)) close();
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;
  return (
    <div ref={menuRef} className={styles.menu} style={{ top: `${position.top}px`, left: `${position.left}px` }}>
      {blockTypes.map((blockType) => (
        <div
          key={blockType.type}
          className={styles.menuItem}
          onClick={() => {
            selectType(blockType.type);
            close();
          }}
        >
          {blockType.label}
        </div>
      ))}
    </div>
  );
}

function BlockHandle({ block, nodeKey }: { block: HTMLElement; nodeKey: string }) {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ top: 0, left: 0, height: 0 });

  function updatePosition() {
    const { top, left, height } = block.getBoundingClientRect();
    const newPosition = { top: top + window.scrollY, left: left + window.scrollX - 40, height };

    // Only update state if position actually changed
    if (
      positionRef.current.top !== newPosition.top ||
      positionRef.current.left !== newPosition.left ||
      positionRef.current.height !== newPosition.height
    ) {
      positionRef.current = newPosition;
      setPosition(newPosition);
    }
  }

  function onClick() {
    editor.focus();
  }

  function onMouseEnter() {
    setIsHovered(true);
    updatePosition();
  }

  function onMouseLeave(e: MouseEvent) {
    const movingFromBlockToHandle = e.target === block && e.relatedTarget === handleRef.current;
    const movingFromHandleToBlock = e.target === handleRef.current && e.relatedTarget === block;
    if (!movingFromBlockToHandle && !movingFromHandleToBlock) {
      setIsHovered(false);
    }
  }

  function onDragStart(e: React.DragEvent) {
    // Set the block id as the drag data
    e.dataTransfer.setData('text/plain', block.getAttribute('data-block-id')!);
    block.style.opacity = '0.5';
  }

  function onDragEnd() {
    block.style.opacity = '1';
  }

  function openMenu() {
    const { top, left } = handleRef.current!.getBoundingClientRect();
    setMenuPosition({ top: top + window.scrollY + 40, left: left + window.scrollX });
    setShowMenu(true);
  }

  function transformBlockType(type: string) {
    editor.dispatchCommand(TRANSFORM_BLOCK_COMMAND, { type, nodeKey });
  }

  // Apply hover effect to block and handle
  useEffect(() => {
    if (isHovered) {
      block.style.backgroundColor = '#f5f5f5';
      handleRef.current!.style.opacity = '1';
    } else {
      block.style.backgroundColor = '';
      handleRef.current!.style.opacity = '0';
    }
  }, [isHovered]);

  useEffect(() => {
    // Use ResizeObserver for monitoring size changes
    const resizeObserver = new ResizeObserver(() => updatePosition());
    resizeObserver.observe(block);

    // Use IntersectionObserver for visibility changes
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        // If block is visible, update position
        if (entries[0].isIntersecting) updatePosition();
      },
      { threshold: 0.1 },
    );
    visibilityObserver.observe(block);

    // Initial position update
    updatePosition();

    // Mouse enter and leave events
    block.addEventListener('click', onClick);
    block.addEventListener('mouseenter', onMouseEnter);
    block.addEventListener('mouseleave', onMouseLeave);
    handleRef.current?.addEventListener('mouseenter', onMouseEnter);
    handleRef.current?.addEventListener('mouseleave', onMouseLeave);

    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Listen for content changes in this block
    const mutationObserver = new MutationObserver(() => updatePosition());
    mutationObserver.observe(block, { childList: true, subtree: true, characterData: true });

    return () => {
      block.removeEventListener('click', onClick);
      block.removeEventListener('mouseenter', onMouseEnter);
      block.removeEventListener('mouseleave', onMouseLeave);
      handleRef.current?.removeEventListener('mouseenter', onMouseEnter);
      handleRef.current?.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={handleRef}
        className={styles.handle}
        style={{ top: `${position.top}px`, left: `${position.left - 10}px`, height: `${position.height}px` }}
      >
        <button onClick={openMenu}>
          <we-icon name="gear" size="sm" color="ui-600" />
        </button>
        <div className={styles.dragHandle} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <we-icon name="dots-six-vertical" weight="bold" size="sm" color="ui-600" />
        </div>
      </div>

      {createPortal(
        <BlockTypeMenu
          position={menuPosition}
          visible={showMenu}
          selectType={(type) => transformBlockType(type)}
          close={() => setShowMenu(false)}
        />,
        document.body,
      )}
    </>
  );
}

export default function BlockHandlesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [nodeMap, setNodeMap] = useState<Map<string, HTMLElement>>(new Map());
  const prevNodeMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const debouncedUpdate = useRef<number | null>(null);

  useEffect(() => {
    // Register the command listener
    const removeTransformListener = editor.registerCommand(
      TRANSFORM_BLOCK_COMMAND,
      (payload) => {
        const { type, nodeKey } = payload;
        if (!nodeKey) return false;

        // Transform the block
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          // Skip if node not found or its not an element node
          if (!node || !$isElementNode(node)) return;

          // Skip if node is already the desired type
          if (
            (type === 'paragraph' && $isParagraphNode(node)) ||
            (type === 'h1' && $isHeadingNode(node) && node.getTag() === 'h1') ||
            (type === 'h2' && $isHeadingNode(node) && node.getTag() === 'h2') ||
            (type === 'h3' && $isHeadingNode(node) && node.getTag() === 'h3')
          )
            return;

          // Create the new node based on type
          let newNode;
          if (type === 'paragraph') newNode = $createParagraphNode();
          else if (['h1', 'h2', 'h3'].includes(type)) newNode = $createHeadingNode(type as 'h1' | 'h2' | 'h3');
          else return; // Skip if unsupported block type

          // Transfer content and replace the node
          node.getChildren().forEach((child) => newNode.append(child));
          node.replace(newNode);
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    function updateBlocksFromNodes() {
      editor.update(() => {
        const root = $getRoot();
        const newNodeMap = new Map<string, HTMLElement>();

        // Walk through all block-level nodes
        root.getChildren().forEach((node) => {
          if (node.getType() === 'paragraph' || node.getType() === 'heading') {
            const key = node.getKey();
            const element = editor.getElementByKey(key);
            if (element) newNodeMap.set(key, element as HTMLElement);
          }
        });

        // Only update if the map has actually changed
        if (!mapsAreEqual(prevNodeMapRef.current, newNodeMap)) {
          prevNodeMapRef.current = new Map(newNodeMap);
          setNodeMap(newNodeMap);
        }
      });
    }

    // Initial update
    setTimeout(updateBlocksFromNodes, 100);

    // Listen for editor changes, but debounce updates
    const removeUpdateListener = editor.registerUpdateListener(() => {
      if (debouncedUpdate.current !== null) window.clearTimeout(debouncedUpdate.current);
      debouncedUpdate.current = window.setTimeout(() => {
        updateBlocksFromNodes();
        debouncedUpdate.current = null;
      }, 100);
    });

    return () => {
      removeTransformListener();
      removeUpdateListener();
      if (debouncedUpdate.current !== null) window.clearTimeout(debouncedUpdate.current);
    };
  }, [editor]);

  // Create block handles for each node
  return (
    <>
      {Array.from(nodeMap.entries()).map(([nodeKey, element]) =>
        createPortal(<BlockHandle key={nodeKey} block={element} nodeKey={nodeKey} />, document.body),
      )}
    </>
  );
}
