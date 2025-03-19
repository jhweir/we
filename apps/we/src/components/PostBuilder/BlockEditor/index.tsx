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
    } else if (e.key === 'Backspace' && viewRef.current) {
      const { state: editorState } = viewRef.current;
      const { selection } = editorState;
      const docSize = editorState.doc.content.size;
      const isEmpty = docSize <= 2;
      const isAtStart = selection.$from.pos <= 1;

      if (isEmpty) {
        e.preventDefault();
        deleteBlock(id);
      } else if (isAtStart && hasPreviousBlock && mergeWithPreviousBlock && previousBlockId) {
        e.preventDefault();
        const result = mergeWithPreviousBlock(editorState);
        if (result && viewRef.current) {
          const { updatedState, targetId } = result;
          if (onStateChange) {
            onStateChange(targetId, updatedState);
          }
          deleteBlock(id);
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
