'use client';

import { ListItemNode, ListNode } from '@lexical/list';
import { HEADING } from '@lexical/markdown'; // use full TRANSFORMERS array when other node types added
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import styles from './index.module.scss';
import BlockHandlePlugin from './plugins/BlockHandle';
import BlockPlaceholderPlugin from './plugins/BlockPlaceholder';
import SlashCommandPlugin from './plugins/SlashCommand';
import TabIndentationPlugin from './plugins/TabIndentation';

export default function PostBuilder() {
  const initialConfig = {
    namespace: 'PostBuilder',
    theme: { root: styles.editor },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: Error) => console.error('Editor Error:', error),
  };

  return (
    <we-column bg="white" p="1000" r="xs" style={{ width: '100%', maxWidth: 1000 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
        <HistoryPlugin />
        <ListPlugin />
        <BlockHandlePlugin />
        <BlockPlaceholderPlugin />
        <SlashCommandPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={[HEADING] as any} />
      </LexicalComposer>
    </we-column>
  );
}
