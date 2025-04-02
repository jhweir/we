// index.tsx
'use client';

import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import styles from './index.module.scss';
import BlockHandlePlugin from './plugins/BlockHandle';
import BlockPlaceholderPlugin from './plugins/BlockPlaceholder';

export default function PostBuilder() {
  // Define theme with explicit styles for all elements
  const theme = {
    // paragraph: styles.editorParagraph || 'editor-paragraph',
    // heading: {
    //   h1: styles.editorH1 || 'editor-h1',
    //   h2: styles.editorH2 || 'editor-h2',
    //   h3: styles.editorH3 || 'editor-h3',
    // },
    // text: {
    //   bold: styles.editorTextBold,
    //   italic: styles.editorTextItalic,
    //   underline: styles.editorTextUnderline,
    // },
    root: styles.editor,
  };

  const initialConfig = {
    namespace: 'NotionEditor',
    theme,
    onError: (error: Error) => console.error('Editor Error:', error),
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  };

  return (
    <we-column bg="white" p="1000" r="xs" style={{ width: '100%', maxWidth: 1000 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
        <HistoryPlugin />
        <BlockHandlePlugin />
        <BlockPlaceholderPlugin />
      </LexicalComposer>
    </we-column>
  );
}
