'use client';

import { ListItemNode, ListNode } from '@lexical/list';
import { CHECK_LIST, HEADING, ORDERED_LIST, QUOTE, UNORDERED_LIST } from '@lexical/markdown'; // use full TRANSFORMERS array when other node types added
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import styles from './index.module.scss';
import { ImageNode } from './nodes/Image';
import BlockHandlesPlugin from './plugins/BlockHandles';
import ImagePlugin from './plugins/ImageBlock';
import IndentationPlugin from './plugins/Indentation';
import PlaceholdersPlugin from './plugins/Placeholders';
import SlashCommandPlugin from './plugins/SlashCommand';

export default function PostBuilder() {
  const initialConfig = {
    namespace: 'PostBuilder',
    theme: { root: styles.editor },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, ImageNode],
    onError: (error: Error) => console.error('Editor Error:', error),
  };

  return (
    <we-column bg="white" p="1000" r="xs" style={{ width: '100%', maxWidth: 1000 }}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* Lexcial plugins */}
        <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
        <MarkdownShortcutPlugin transformers={[HEADING, QUOTE, UNORDERED_LIST, ORDERED_LIST, CHECK_LIST]} />
        <HistoryPlugin />
        <ListPlugin />
        {/* Custom plugins */}
        <BlockHandlesPlugin />
        <PlaceholdersPlugin />
        <SlashCommandPlugin />
        <IndentationPlugin />
        <ImagePlugin />
      </LexicalComposer>
    </we-column>
  );
}
