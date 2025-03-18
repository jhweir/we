import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import { useEffect, useRef } from 'react';
import './index.scss';

interface BlockEditorProps {
  id: number;
  state: EditorState;
  insertBlock: () => void;
  deleteBlock: (id: number) => void; // Updated to accept an ID
  mergeWithNextBlock?: (currentState: EditorState) => EditorState | null;
  focused?: boolean;
  onFocus?: () => void;
  onStateChange?: (id: number, state: EditorState) => void;
  hasNextBlock?: boolean;
  nextBlockId?: number; // Add this to know the next block's ID
}

const BlockEditor = ({
  id,
  state,
  insertBlock,
  deleteBlock,
  mergeWithNextBlock,
  focused,
  onFocus,
  onStateChange,
  hasNextBlock,
  nextBlockId,
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
  }, [id, focused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        if (viewRef.current) {
          const { state: editorState } = viewRef.current;
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
      if (viewRef.current) {
        const { state: editorState } = viewRef.current;
        const docSize = editorState.doc.content.size;
        const isEmpty = docSize <= 2;

        if (isEmpty) {
          e.preventDefault();
          deleteBlock(id); // Delete the current block if empty
        }
      }
    } else if (e.key === 'Delete' && hasNextBlock && mergeWithNextBlock && viewRef.current && nextBlockId) {
      const { state: editorState } = viewRef.current;
      const { selection } = editorState;
      const docSize = editorState.doc.content.size;
      const isAtEnd = selection.$to.pos >= docSize - 2;

      if (isAtEnd) {
        e.preventDefault();
        const updatedState = mergeWithNextBlock(editorState);
        if (updatedState && viewRef.current) {
          viewRef.current.updateState(updatedState); // Merge content instantly
          if (onStateChange) {
            onStateChange(id, updatedState); // Update parent state
          }
          deleteBlock(nextBlockId); // Delete the next block, not the current one
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
