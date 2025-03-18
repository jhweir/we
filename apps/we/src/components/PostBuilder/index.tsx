'use client';

import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { DOMParser } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { useEffect, useRef, useState } from 'react';
import './index.scss';
import { customSchema } from './schema';

const SLASH_COMMANDS = [
  { title: 'Text', type: 'paragraph' },
  { title: 'Heading 1', type: 'heading', attrs: { level: 1 } },
  { title: 'Bullet List', type: 'bullet_list' },
  { title: 'Numbered List', type: 'ordered_list' },
  { title: 'Code Block', type: 'code_block' },
  { title: 'Image', type: 'image' },
];

const createSlashCommandsPlugin = (handlers: {
  setShowMenu: (show: boolean) => void;
  setMenuPosition: (pos: { top: number; left: number }) => void;
  setSelectedIndex: (index: number) => void;
}) => {
  return new Plugin({
    key: new PluginKey('slash-commands'),
    props: {
      handleKeyDown(view, event) {
        if (event.key === '/') {
          const { $from } = view.state.selection;
          const coords = view.coordsAtPos($from.pos);
          handlers.setMenuPosition({ top: coords.bottom, left: coords.left });
          handlers.setShowMenu(true);
          handlers.setSelectedIndex(0);
          return false; // Allow the '/' to be inserted
        }
        return false;
      },
    },
  });
};

const createPlaceholderPlugin = () => {
  return new Plugin({
    key: new PluginKey('placeholder'),
    props: {
      decorations: (state) => {
        const { doc, selection } = state;
        const decorations: Decoration[] = [];

        // Iterate through all blocks in the document
        doc.descendants((node, pos) => {
          // Check if this is a textblock and it's empty
          if (node.isTextblock && node.content.size === 0) {
            // Check if cursor is in this node
            const $from = selection.$from;
            const nodeStartPos = pos;
            const nodeEndPos = pos + node.nodeSize;

            if ($from.pos >= nodeStartPos && $from.pos <= nodeEndPos) {
              decorations.push(
                Decoration.widget(pos + 1, () => {
                  const span = document.createElement('span');
                  span.className = 'placeholder';
                  span.textContent = 'Write or type "/" to see available commands...';
                  return span;
                }),
              );
            }
          }
        });

        return DecorationSet.create(doc, decorations);
      },
    },
  });
};

const createBlockControlsPlugin = (handlers: {
  insertBlock: (type: string, attrs?: Record<string, any>, pos?: number) => void;
}) => {
  return new Plugin({
    key: new PluginKey('block-controls'),
    props: {
      decorations(state) {
        const { doc } = state;
        const decorations: Decoration[] = [];

        doc.descendants((node, pos) => {
          // Only add controls to top-level block nodes
          if (pos === 0 || doc.resolve(pos).depth !== 1) return;

          // Add decoration at the start of each block
          decorations.push(
            Decoration.widget(
              pos,
              () => {
                // Create container for the controls
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'block-controls';

                // Create add button
                const addButton = document.createElement('button');
                addButton.className = 'block-control add-block';
                addButton.innerHTML = '<span>+</span>';
                addButton.title = 'Add block';
                addButton.onmousedown = (e) => {
                  e.preventDefault(); // Prevent editor from losing focus
                  const menu = document.createElement('div');
                  menu.className = 'block-menu';

                  SLASH_COMMANDS.forEach((command) => {
                    const item = document.createElement('button');
                    item.innerText = command.title;
                    item.onclick = () => {
                      handlers.insertBlock(command.type, command.attrs, pos);
                      menu.remove();
                    };
                    menu.appendChild(item);
                  });

                  // Position and show menu
                  document.body.appendChild(menu);
                  const rect = addButton.getBoundingClientRect();
                  menu.style.position = 'absolute';
                  menu.style.top = `${rect.bottom}px`;
                  menu.style.left = `${rect.left}px`;

                  // Close menu when clicking outside
                  const closeMenu = () => {
                    menu.remove();
                    document.removeEventListener('mousedown', closeMenu);
                  };
                  setTimeout(() => {
                    document.addEventListener('mousedown', closeMenu);
                  });
                };

                // Create drag handle
                const dragHandle = document.createElement('div');
                dragHandle.className = 'block-control drag-handle';
                dragHandle.innerHTML = '⋮⋮'; // Simple drag handle icon
                dragHandle.title = 'Drag to reorder';

                // Add drag functionality
                dragHandle.draggable = true;

                let dragPos: number | null = null;

                dragHandle.ondragstart = (e) => {
                  // Store the position of the dragged block
                  dragPos = pos;
                  // Add some custom data to identify our drag operation
                  e.dataTransfer?.setData('text/plain', 'block-drag');

                  // Create a ghost element
                  const ghost = document.createElement('div');
                  ghost.textContent = node.textContent || 'Block';
                  ghost.style.opacity = '0.5';
                  document.body.appendChild(ghost);
                  ghost.style.position = 'absolute';
                  ghost.style.top = '-1000px';
                  e.dataTransfer?.setDragImage(ghost, 0, 0);

                  // Remove ghost after dragging
                  setTimeout(() => ghost.remove(), 0);
                };

                // Add control elements to the container
                controlsDiv.appendChild(addButton);
                controlsDiv.appendChild(dragHandle);

                return controlsDiv;
              },
              { side: -1, key: `block-controls-${pos}` },
            ),
          );
        });

        return DecorationSet.create(doc, decorations);
      },

      handleDrop(view, event, slice, moved) {
        // Return false to allow the default behavior for non-block drags
        if (!moved && event.dataTransfer?.getData('text/plain') !== 'block-drag') {
          return false;
        }

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        if (!coordinates) return false;

        const pos = coordinates.pos;
        const $pos = view.state.doc.resolve(pos);

        // Find target block position (start of the block)
        let targetPos = $pos.before(1);
        if (targetPos < 0) targetPos = 0;

        // Find the source block
        const draggedBlockPos = view.state.doc.resolve($pos.pos).before(1);

        // Don't do anything if dropping onto the same block
        if (targetPos === draggedBlockPos) return true;

        // Get the nodes
        const sourceNode = view.state.doc.nodeAt(draggedBlockPos);
        if (!sourceNode) return true;

        // Create a transaction to move the block
        const tr = view.state.tr;

        // Remove the source block
        tr.delete(draggedBlockPos, draggedBlockPos + sourceNode.nodeSize);

        // Adjust target position if necessary (if target is after source)
        const adjustedTargetPos = targetPos > draggedBlockPos ? targetPos - sourceNode.nodeSize : targetPos;

        // Insert the node at the target position
        tr.insert(adjustedTargetPos, sourceNode);

        // Apply the transaction
        view.dispatch(tr);

        return true;
      },
    },
  });
};

export default function PostBuilder() {
  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const insertBlock = (type: string, attrs?: Record<string, any>, pos?: number) => {
    if (!viewRef.current) return;

    const { state } = viewRef.current;
    const { tr } = state;

    let targetPos: number;
    let targetEnd: number;

    if (pos !== undefined) {
      const $pos = state.doc.resolve(pos);
      targetPos = $pos.before();
      targetEnd = $pos.after();
    } else {
      const { $from } = state.selection;
      targetPos = $from.start() - 1;
      targetEnd = $from.end() + 1;
    }

    if (type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const src = reader.result as string;
            tr.replaceWith(targetPos, targetEnd, customSchema.nodes.image.create({ src }));
            viewRef.current?.dispatch(tr);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const node = customSchema.nodes[type].create(attrs);
      if (pos !== undefined) {
        tr.insert(targetEnd, node);
      } else {
        tr.replaceWith(targetPos, targetEnd, node);
      }
      viewRef.current.dispatch(tr);
    }

    setShowMenu(false);
  };

  const handleMenuKeyDown = (event: KeyboardEvent) => {
    if (!showMenu) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.key) {
      case 'ArrowUp':
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : SLASH_COMMANDS.length - 1));
        break;
      case 'ArrowDown':
        setSelectedIndex((prev) => (prev < SLASH_COMMANDS.length - 1 ? prev + 1 : 0));
        break;
      case 'Enter':
        const command = SLASH_COMMANDS[selectedIndex];
        insertBlock(command.type, command.attrs);
        break;
      case 'Escape':
        setShowMenu(false);
        break;
    }
  };

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const doc = document.createElement('div');
      doc.innerHTML = '<p></p>';

      const placeholderPlugin = createPlaceholderPlugin();
      const slashCommands = createSlashCommandsPlugin({
        setShowMenu,
        setMenuPosition,
        setSelectedIndex,
      });
      const blockControls = createBlockControlsPlugin({
        insertBlock,
      });

      const state = EditorState.create({
        schema: customSchema,
        doc: DOMParser.fromSchema(customSchema).parse(doc),
        plugins: [slashCommands, placeholderPlugin, blockControls, keymap(baseKeymap)],
      });

      viewRef.current = new EditorView(editorRef.current, {
        state,
        dispatchTransaction(transaction) {
          if (!viewRef.current) return;
          const newState = viewRef.current.state.apply(transaction);
          viewRef.current.updateState(newState);

          const { selection } = newState;
          const { $from } = selection;
          const textBefore = $from.nodeBefore?.text || '';

          // Only update menu state, don't interfere with content
          if (textBefore.endsWith('/') && !showMenu) {
            const coords = viewRef.current.coordsAtPos($from.pos);
            setMenuPosition({ top: coords.bottom, left: coords.left });
            setShowMenu(true);
            setSelectedIndex(0);
          } else if (!textBefore.endsWith('/') && showMenu) {
            setShowMenu(false);
          }
        },
      });
    }
  }, []); // Empty dependency array to run only once

  // Separate effect for menu key handling
  useEffect(() => {
    const menuElement = menuRef.current;
    if (menuElement && showMenu) {
      menuElement.addEventListener('keydown', handleMenuKeyDown);
      menuElement.focus();
    }

    return () => {
      if (menuElement) {
        menuElement.removeEventListener('keydown', handleMenuKeyDown);
      }
    };
  }, [showMenu]); // Only re-run when showMenu changes

  return (
    <we-column p="500" style={{ height: '100%', width: 800 }}>
      <div
        ref={editorRef}
        className="prose-editor"
        style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '4px',
          minHeight: '200px',
          border: '1px solid #e2e8f0',
        }}
      />
      {showMenu && (
        <div
          ref={menuRef}
          className="slash-menu"
          tabIndex={0}
          style={{
            position: 'absolute',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {SLASH_COMMANDS.map((command, index) => (
            <button
              key={command.title}
              className={index === selectedIndex ? 'selected' : ''}
              onClick={() => insertBlock(command.type, command.attrs)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {command.title}
            </button>
          ))}
        </div>
      )}
    </we-column>
  );
}
