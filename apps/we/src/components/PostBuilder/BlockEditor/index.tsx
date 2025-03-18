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
}

const BlockEditor = ({ id, state, insertBlock, deleteBlock }: BlockEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
        // We could add onUpdate callback here if needed
      },
    });

    viewRef.current = view;

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertBlock();
    }
  };

  return (
    <div className="block-editor">
      <div ref={editorRef} className="editor-container" onKeyDown={handleKeyDown}></div>
      <button className="delete-btn" onClick={deleteBlock}>
        Delete
      </button>
      <button className="insert-btn" onClick={insertBlock}>
        Insert Block Below
      </button>
    </div>
  );
};

export default BlockEditor;
