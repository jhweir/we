import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import React, { useEffect, useRef } from 'react';
import editorManager from '../editorManager';
import './index.scss';

interface BlockEditorProps {
  id: number;
  state: EditorState;
  insertBlock: () => void;
  deleteBlock: (id: number) => void;
  mergeWithNextBlock?: (currentState: EditorState) => EditorState | null;
  mergeWithPreviousBlock?: (currentState: EditorState) => { updatedState: EditorState; targetId: number } | null;
  focused?: boolean;
  onFocus?: () => void;
  onStateChange?: (id: number, state: EditorState) => void;
  hasNextBlock?: boolean;
  hasPreviousBlock?: boolean;
  nextBlockId?: number;
  previousBlockId?: number;
  onMoveToPreviousBlock: (cursorOffset: number) => void;
  onMoveToNextBlock: (cursorOffset: number) => void;
}

const BlockEditor = ({
  id,
  state,
  insertBlock,
  deleteBlock,
  mergeWithNextBlock,
  mergeWithPreviousBlock,
  focused,
  onFocus,
  onStateChange,
  hasNextBlock,
  hasPreviousBlock,
  nextBlockId,
  previousBlockId,
  onMoveToPreviousBlock,
  onMoveToNextBlock,
}: BlockEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Effect 1: Create/destroy the editor (runs only when necessary)
  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        if (onStateChange) {
          onStateChange(id, newState);
        }
      },
    });

    viewRef.current = view;

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [editorRef.current, id]); // Only recreate when ID or ref changes

  // Effect 2: Handle state updates separately (doesn't recreate the editor)
  useEffect(() => {
    if (viewRef.current && viewRef.current.state !== state) {
      viewRef.current.updateState(state);
    }
  }, [state]);

  // Handle focus events
  useEffect(() => {
    if (focused && viewRef.current) {
      // Use requestAnimationFrame for smoother visual transition
      requestAnimationFrame(() => {
        // If this block is receiving focus AND has a pending cursor position
        if (editorManager.activeBlockId === id && editorManager.pendingCursorPosition !== null) {
          try {
            // Set cursor position BEFORE focus
            const tr = viewRef.current!.state.tr;

            // Find the first text block node
            let targetNode = null;
            let nodePos = 0;

            viewRef.current.state.doc.descendants((node, pos) => {
              if (!targetNode && node.isTextblock) {
                targetNode = node;
                nodePos = pos;
                return false; // Stop traversal
              }
              return true;
            });

            if (targetNode) {
              // Ensure cursor position is within bounds
              const maxOffset = targetNode.content.size;
              const safeOffset = Math.min(editorManager.pendingCursorPosition, maxOffset);

              // Calculate absolute position (+1 to get inside the node)
              const pos = nodePos + 1 + safeOffset;

              // Set the selection
              tr.setSelection(TextSelection.create(viewRef.current.state.doc, pos));

              // Apply cursor position immediately
              viewRef.current.updateState(viewRef.current.state.apply(tr));

              console.log(`Block ${id}: Set cursor at position ${safeOffset} (max: ${maxOffset})`);
            }

            // THEN focus the editor
            viewRef.current.focus();

            // Clear pending position
            editorManager.pendingCursorPosition = null;
          } catch (e) {
            console.error('Error positioning cursor:', e);
            // Fallback to regular focus
            viewRef.current.focus();
          }
        } else {
          // No pending cursor position, just focus normally
          viewRef.current.focus();
        }
      });
    }
  }, [focused, id]); // Note: Using id directly, not props.id

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!viewRef.current) return;

    const { state: editorState } = viewRef.current;
    const { selection, doc } = editorState;

    // Calculate cursor offset within the current block
    const cursorOffset = selection.$from.parentOffset;
    console.log('Cursor offset:', cursorOffset);

    // Get all text content from the document
    let textContent = '';
    doc.nodesBetween(0, doc.content.size, (node) => {
      if (node.isText) {
        textContent += node.text;
      }
      return true;
    });

    const isEmpty = textContent.trim().length === 0;
    const isAtStart = selection.$from.parentOffset === 0;
    const isAtEnd = selection.$to.parentOffset === selection.$to.parent.content.size;

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        if (viewRef.current) {
          const hardBreak = editorState.schema.nodes.hard_break;
          if (hardBreak) {
            const tr = editorState.tr.replaceSelectionWith(hardBreak.create());
            viewRef.current.dispatch(tr);
          }
        }
        return;
      }
      e.preventDefault();
      insertBlock();
    } else if (e.key === 'Backspace') {
      if (isEmpty) {
        // Block is empty, delete it
        e.preventDefault();
        deleteBlock(id);
      } else if (isAtStart && hasPreviousBlock && mergeWithPreviousBlock && previousBlockId) {
        // Cursor at start, merge with previous block
        e.preventDefault();
        const result = mergeWithPreviousBlock(editorState);
        if (result && onStateChange) {
          const { updatedState, targetId } = result;
          onStateChange(targetId, updatedState);
          deleteBlock(id);
        }
      }
    } else if (e.key === 'Delete') {
      if (isAtEnd && hasNextBlock && mergeWithNextBlock && nextBlockId) {
        // Cursor at end, merge with next block
        e.preventDefault();
        const updatedState = mergeWithNextBlock(editorState);
        if (updatedState && viewRef.current) {
          viewRef.current.updateState(updatedState);
          if (onStateChange) {
            onStateChange(id, updatedState);
          }
          deleteBlock(nextBlockId);
        }
      }
    } else if (e.key === 'ArrowUp') {
      // Simply move to previous block
      if (hasPreviousBlock) {
        e.preventDefault();
        onMoveToPreviousBlock(cursorOffset);
      }
    } else if (e.key === 'ArrowDown') {
      // Simply move to next block
      if (hasNextBlock) {
        e.preventDefault();
        onMoveToNextBlock(cursorOffset);
      }
    }
  };

  return (
    <div className="block-editor">
      <div
        ref={editorRef}
        className="editor-container"
        onKeyDown={handleKeyDown}
        onClick={() => onFocus && onFocus()}
      ></div>
      <button className="delete-btn" onClick={() => deleteBlock(id)}>
        Delete
      </button>
    </div>
  );
};

export default BlockEditor;
