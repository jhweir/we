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
  { type: 'p', label: 'Text', icon: 'text-t' },
  { type: 'h1', label: 'Heading 1', icon: 'text-h-one' },
  { type: 'h2', label: 'Heading 2', icon: 'text-h-two' },
  { type: 'h3', label: 'Heading 3', icon: 'text-h-three' },
];

type NodeInfo = { element: HTMLElement; type: string };

function mapsAreEqual<K>(map1: Map<K, NodeInfo>, map2: Map<K, NodeInfo>): boolean {
  // Quick size check
  if (map1.size !== map2.size) return false;
  for (const [key, val1] of map1) {
    // Check if key exists in second map - maps must have same keys
    if (!map2.has(key)) return false;
    // Check if values are equal - compare element and type
    const val2 = map2.get(key)!;
    if (val1.element !== val2.element || val1.type !== val2.type) return false;
  }
  return true;
}

function BlockTypeMenu(props: {
  visible: boolean;
  position: { top: number; left: number };
  selectedType: string;
  selectType: (type: string) => void;
  close: () => void;
}) {
  const { visible, position, selectedType, selectType, close } = props;
  const [focusIndex, setFocusIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'ArrowUp') setFocusIndex((prev) => (prev > 0 ? prev - 1 : blockTypes.length - 1));
    if (e.key === 'ArrowDown') setFocusIndex((prev) => (prev < blockTypes.length - 1 ? prev + 1 : 0));
    if (e.key === 'Escape') close();
  }

  function onOptionKeyDown(e: React.KeyboardEvent, type: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      selectType(type);
      close();
    }
  }

  function onOptionClick(e: React.MouseEvent, type: string) {
    e.stopPropagation();
    selectType(type);
    close();
  }

  // Close menu on click outside
  useEffect(() => {
    menuRef.current?.focus(); // Focus the menu when it opens
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus on currently selected block type when menu opens
  useEffect(() => {
    if (visible) {
      const index = blockTypes.findIndex((item) => item.type === selectedType);
      setFocusIndex(index);
    }
  }, [visible]);

  // Update focus when focusIndex changes
  useEffect(() => {
    const item = document.getElementById(`block-type-menu-${blockTypes[focusIndex]?.type}`);
    if (item) item.focus();
  }, [focusIndex]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onKeyDown={onMenuKeyDown}
    >
      {blockTypes.map((option, index) => (
        <button
          key={option.type}
          id={`block-type-menu-${option.type}`}
          className={`${styles.menuItem} ${focusIndex === index ? styles.focused : ''}`}
          role="menuitem"
          tabIndex={index === focusIndex ? 0 : -1}
          onMouseEnter={() => setFocusIndex(index)}
          onClick={(e) => onOptionClick(e, option.type)}
          onKeyDown={(e) => onOptionKeyDown(e, option.type)}
        >
          <we-icon name={option.icon} weight="bold" color="ui-400" size="sm" style={{ marginRight: '10px' }} />
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BlockHandle({ block, nodeKey, nodeType }: { block: HTMLElement; nodeKey: string; nodeType: string }) {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });
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
    const relatedTarget = e.relatedTarget as Node;
    const isRelatedToBlock = block.contains(relatedTarget);
    const isRelatedToHandle = handleRef.current?.contains(relatedTarget);
    if (!isRelatedToBlock && !isRelatedToHandle) setIsHovered(false);
  }

  function onDragStart(e: React.DragEvent) {
    // Set the block id as the drag data
    e.dataTransfer.setData('text/plain', block.getAttribute('data-block-id')!);
    block.style.opacity = '0.5';
  }

  function onDragEnd() {
    block.style.opacity = '1';
  }

  function transformBlockType(type: string) {
    editor.dispatchCommand(TRANSFORM_BLOCK_COMMAND, { type, nodeKey });
  }

  // Apply hover effect to block and handle
  useEffect(() => {
    if (isHovered || showMenu) {
      block.style.backgroundColor = 'var(--we-color-ui-50)';
      handleRef.current!.style.opacity = '1';
    } else {
      block.style.backgroundColor = '';
      handleRef.current!.style.opacity = '0';
    }
  }, [isHovered, showMenu]);

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
        <button onClick={() => setShowMenu(true)}>
          <we-icon name="gear" size="sm" color="ui-600" />
        </button>
        <div className={styles.dragHandle} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <we-icon name="dots-six-vertical" weight="bold" size="sm" color="ui-600" />
        </div>
      </div>

      {createPortal(
        <BlockTypeMenu
          position={{ top: position.top + 38, left: position.left - 10 }}
          visible={showMenu}
          selectedType={nodeType}
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
  const [nodeInfoMap, setNodeInfoMap] = useState<Map<string, NodeInfo>>(new Map());
  const prevNodeMapRef = useRef<Map<string, NodeInfo>>(new Map());
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
            (type === 'p' && $isParagraphNode(node)) ||
            (type === 'h1' && $isHeadingNode(node) && node.getTag() === 'h1') ||
            (type === 'h2' && $isHeadingNode(node) && node.getTag() === 'h2') ||
            (type === 'h3' && $isHeadingNode(node) && node.getTag() === 'h3')
          )
            return;

          // Create the new node based on type
          let newNode;
          if (type === 'p') newNode = $createParagraphNode();
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
        const newNodeInfoMap = new Map<string, NodeInfo>();

        // Walk through all block-level nodes
        root.getChildren().forEach((node) => {
          if ($isParagraphNode(node) || $isHeadingNode(node)) {
            const key = node.getKey();
            const element = editor.getElementByKey(key);

            if (element) {
              let type = '';
              if ($isParagraphNode(node)) type = 'p';
              else if ($isHeadingNode(node)) type = node.getTag();
              newNodeInfoMap.set(key, { element: element as HTMLElement, type });
            }
          }
        });

        // Only update if the map has actually changed
        if (!mapsAreEqual(prevNodeMapRef.current, newNodeInfoMap)) {
          prevNodeMapRef.current = new Map(newNodeInfoMap);
          setNodeInfoMap(newNodeInfoMap);
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
      {Array.from(nodeInfoMap.entries()).map(([nodeKey, info]) =>
        createPortal(
          <BlockHandle key={nodeKey} block={info.element} nodeKey={nodeKey} nodeType={info.type} />,
          document.body,
        ),
      )}
    </>
  );
}
