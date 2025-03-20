import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import { useEffect, useRef } from 'react';
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
}: BlockEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

    if (focused && viewRef.current) {
      setTimeout(() => {
        viewRef.current?.focus();
      }, 0);
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [id, focused, state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!viewRef.current) return;

    const { state: editorState } = viewRef.current;
    const { selection, doc } = editorState;

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
