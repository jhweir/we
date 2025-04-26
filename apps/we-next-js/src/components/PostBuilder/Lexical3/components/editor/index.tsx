// PostBuilder/Editor.tsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical';
import { useEffect, useRef } from 'react';
import { isEdgeOfBlock } from '../../helpers';
import styles from './index.module.scss';

interface LexicalEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onEnter: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
}

const theme = {
  paragraph: 'editor-paragraph',
};

export default function Editor({
  initialContent = '',
  onChange,
  onEnter,
  onNavigateUp,
  onNavigateDown,
}: LexicalEditorProps) {
  const editorRef = useRef<LexicalEditor | null>(null);

  const initialConfig = {
    namespace: 'BlockEditor',
    theme,
    onError: (error: Error) => console.error(error),
    nodes: [],
  };

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(initialContent));
        root.append(paragraph);
      });
    }
  }, [initialContent]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onEnter();
    } else if (event.key === 'ArrowUp' && isEdgeOfBlock(event, 'up')) {
      event.preventDefault();
      onNavigateUp();
    } else if (event.key === 'ArrowDown' && isEdgeOfBlock(event, 'down')) {
      event.preventDefault();
      onNavigateDown();
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={<ContentEditable className={styles.wrapper} onKeyDown={handleKeyDown} />}
        // placeholder={<div className="text-gray-400">Type something...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin
        onChange={(editorState) => {
          editorState.read(() => {
            const text = $getRoot().getTextContent();
            onChange(text);
          });
        }}
      />
      <HistoryPlugin />
    </LexicalComposer>
  );
}
