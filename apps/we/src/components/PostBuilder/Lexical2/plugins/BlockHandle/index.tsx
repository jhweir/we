import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
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
const REORDER_BLOCK_COMMAND = createCommand<{ sourceKey: string; targetKey: string; insertBefore: boolean }>(
  'REORDER_BLOCK_COMMAND',
);

const blockTypes = [
  { type: 'p', label: 'Text', icon: 'text-t' },
  { type: 'h1', label: 'Heading 1', icon: 'text-h-one' },
  { type: 'h2', label: 'Heading 2', icon: 'text-h-two' },
  { type: 'h3', label: 'Heading 3', icon: 'text-h-three' },
];

type NodeData = { element: HTMLElement; type: string };

function mapsAreEqual<K>(map1: Map<K, NodeData>, map2: Map<K, NodeData>): boolean {
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
      e.preventDefault();
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

function BlockHandle({ nodeKey, nodeData }: { nodeKey: string; nodeData: NodeData }) {
  const { element: block, type: nodeType } = nodeData;
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ top: 0, left: 0, height: 0 });

  function onDragStart(e: React.DragEvent) {
    // Use the node key from props instead of DOM attribute
    e.dataTransfer.setData('application/x-lexical-node-key', nodeKey);
    e.dataTransfer.effectAllowed = 'move';

    // Use React state instead of direct DOM manipulation
    setIsDragging(true);

    // Add a class to the body for global drag state
    document.body.classList.add('block-dragging');
    document.body.setAttribute('data-dragging-node-key', nodeKey);
  }

  function onDragEnd() {
    setIsDragging(false);
    document.body.classList.remove('block-dragging');
    document.body.removeAttribute('data-dragging-node-key');
  }

  function transformBlockType(type: string) {
    editor.dispatchCommand(TRANSFORM_BLOCK_COMMAND, { type, nodeKey });
  }

  // Listen for resize and visibility changes
  useEffect(() => {
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

  // Apply hover effect to block and handle
  useEffect(() => {
    if (isHovered || showMenu) {
      block.style.backgroundColor = 'var(--we-color-ui-25)';
      handleRef.current!.style.opacity = '1';
    } else {
      block.style.backgroundColor = '';
      handleRef.current!.style.opacity = '0';
    }
  }, [isHovered, showMenu]);

  // Add effect for opacity change based on state
  useEffect(() => {
    if (isDragging) block.style.opacity = '0.5';
    else block.style.opacity = '1';
  }, [isDragging, block]);

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

export default function BlockHandlePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [nodeMap, setNodeMap] = useState<Map<string, NodeData>>(new Map());
  const [dropIndicator, setDropIndicator] = useState({ visible: false, top: 0, left: -74, width: 0 });
  const prevNodeMapRef = useRef<Map<string, NodeData>>(new Map());
  const debouncedUpdate = useRef<number | null>(null);

  useEffect(() => {
    // Register the command listener
    const unregisterCommands = mergeRegister(
      editor.registerCommand(
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
      ),
      editor.registerCommand(
        REORDER_BLOCK_COMMAND,
        ({ sourceKey, targetKey, insertBefore }) => {
          editor.update(() => {
            const sourceNode = $getNodeByKey(sourceKey);
            const targetNode = $getNodeByKey(targetKey);

            if (sourceNode && targetNode && $isElementNode(sourceNode) && $isElementNode(targetNode)) {
              if (insertBefore) targetNode.insertBefore(sourceNode);
              else {
                // Insert after - find next sibling or append to parent
                const nextSibling = targetNode.getNextSibling();
                if (nextSibling) nextSibling.insertBefore(sourceNode);
                else targetNode.getParent()?.append(sourceNode);
              }
            }
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );

    function updateBlocksFromNodes() {
      editor.update(() => {
        const root = $getRoot();
        const newNodeMap = new Map<string, NodeData>();

        // Walk through all block-level nodes
        root.getChildren().forEach((node) => {
          if ($isParagraphNode(node) || $isHeadingNode(node)) {
            const key = node.getKey();
            const element = editor.getElementByKey(key);

            if (element) {
              // Add data attribute for identification during drag/drop
              element.setAttribute('data-block-id', key);
              // Store the node key and type in the map
              let type = '';
              if ($isParagraphNode(node)) type = 'p';
              else if ($isHeadingNode(node)) type = node.getTag();
              newNodeMap.set(key, { element: element as HTMLElement, type });
            }
          }
        });

        // Only update if the map has actually changed
        if (!mapsAreEqual(prevNodeMapRef.current, newNodeMap)) {
          prevNodeMapRef.current = new Map(newNodeMap);
          setNodeMap(newNodeMap);
        }
      });
    }

    // Find the editor root element
    const editorRootElement = editor.getRootElement()!;
    if (!editorRootElement) return;

    // Handle dragover to show drop indicators
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      const sourceKey = document.body.getAttribute('data-dragging-node-key');
      if (!sourceKey) return;

      let targetElement: HTMLElement | null = null;
      let insertBefore = true;

      // Find all block elements
      const blockElements = Array.from(editorRootElement.querySelectorAll('[data-block-id]'));

      for (let i = 0; i < blockElements.length; i++) {
        const element = blockElements[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const blockKey = element.getAttribute('data-block-id');

        // Skip the dragged block
        if (blockKey === sourceKey) continue;

        // If mouse is above the middle of this block
        if (e.clientY < rect.top + rect.height / 2) {
          targetElement = element;
          insertBefore = true;
          break;
        }

        // If this is the last block and mouse is below it
        if (i === blockElements.length - 1) {
          targetElement = element;
          insertBefore = false;
          break;
        }

        // If mouse is between this block and the next
        const nextElement = blockElements[i + 1] as HTMLElement;
        const nextKey = nextElement?.getAttribute('data-block-id');
        if (nextKey === sourceKey) continue;

        if (e.clientY < nextElement.getBoundingClientRect().top) {
          targetElement = element;
          insertBefore = false;
          break;
        }
      }

      // Update drop indicator
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setDropIndicator({
          visible: true,
          left: rect.left - 74,
          width: rect.width,
          top: (insertBefore ? rect.top : rect.bottom) - 2,
        });

        // Store the target for drop
        editorRootElement.setAttribute('data-drop-target', targetElement.getAttribute('data-block-id') || '');
        editorRootElement.setAttribute('data-drop-position', insertBefore ? 'before' : 'after');
      }
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();

      const sourceKey = document.body.getAttribute('data-dragging-node-key');
      const targetKey = editorRootElement.getAttribute('data-drop-target');
      const insertBefore = editorRootElement.getAttribute('data-drop-position') === 'before';

      // Hide indicator
      setDropIndicator((prev) => {
        return { ...prev, visible: false };
      });

      // Clean up attributes
      editorRootElement.removeAttribute('data-drop-target');
      editorRootElement.removeAttribute('data-drop-position');

      // Execute reorder if we have both keys
      if (sourceKey && targetKey && sourceKey !== targetKey) {
        editor.dispatchCommand(REORDER_BLOCK_COMMAND, {
          sourceKey,
          targetKey,
          insertBefore,
        });
      }
    }

    function handleDragLeave(e: DragEvent) {
      // Only hide if leaving the editor
      if (!editorRootElement.contains(e.relatedTarget as Node)) {
        setDropIndicator((prev) => {
          return { ...prev, visible: false };
        });
      }
    }

    // Add event listeners
    editorRootElement.addEventListener('dragover', handleDragOver);
    editorRootElement.addEventListener('drop', handleDrop);
    editorRootElement.addEventListener('dragleave', handleDragLeave);

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
      unregisterCommands();
      removeUpdateListener();
      if (debouncedUpdate.current !== null) window.clearTimeout(debouncedUpdate.current);
      editorRootElement.removeEventListener('dragover', handleDragOver);
      editorRootElement.removeEventListener('drop', handleDrop);
      editorRootElement.removeEventListener('dragleave', handleDragLeave);
    };
  }, [editor]);

  // Create block handles for each node
  return (
    <>
      {Array.from(nodeMap.entries()).map(([nodeKey, data]) =>
        createPortal(<BlockHandle key={nodeKey} nodeKey={nodeKey} nodeData={data} />, document.body),
      )}
      <div
        id="drop-indicator"
        className={`${styles.dropIndicator} ${dropIndicator.visible && styles.visible}`}
        style={{ top: `${dropIndicator.top}px`, left: `${dropIndicator.left}px`, width: `${dropIndicator.width}px` }}
      />
    </>
  );
}
