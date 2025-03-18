import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';
import { useEffect, useRef } from 'react';
import './index.scss';

interface BlockEditorProps {
  id: number;
  state: EditorState;
  insertBlock: () => void;
  deleteBlock: () => void;
  focused?: boolean;
  onFocus?: () => void;
  onStateChange?: (id: number, state: EditorState) => void;
}

const BlockEditor = ({ id, state, insertBlock, deleteBlock, focused, onFocus, onStateChange }: BlockEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Notify parent component of state changes
        if (onStateChange) {
          onStateChange(id, newState);
        }
      },
    });

    viewRef.current = view;

    // Focus the editor when focused prop is true
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

  // Don't add state to the dependency array to prevent recreating the editor on every state change
  // The editor is already updated via updateState in dispatchTransaction

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow shift+enter to create a new line within the current block
        return;
      }
      // Regular enter creates a new block
      e.preventDefault();
      insertBlock();
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
      <button className="delete-btn" onClick={deleteBlock}>
        Delete
      </button>
      {/* <button className="insert-btn" onClick={insertBlock}>
        Insert Block Below
      </button> */}
    </div>
  );
};

export default BlockEditor;
