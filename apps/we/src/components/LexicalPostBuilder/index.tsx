// src/components/LexicalPostBuilder/index.tsx
'use client';

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $createParagraphNode, $getRoot } from 'lexical';
import './index.scss';
import { $createBlockNode, BlockNode } from './nodes/BlockNode';
import { PollNode } from './nodes/PollNode';
import BlockPlugin from './plugins/BlockPlugin';
import DragDropBlockPlugin from './plugins/DragDropBlockPlugin';
import KeyboardShortcutsPlugin from './plugins/KeyboardShortcutsPlugin';
import PlaceholderPlugin from './plugins/PlaceholderPlugin';
import SlashCommandsPlugin from './plugins/SlashCommandsPlugin';

export default function PostBuilder() {
  const theme = {
    paragraph: 'editor-paragraph',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
    },
    list: {
      ul: 'editor-list-ul',
      ol: 'editor-list-ol',
      listitem: 'editor-listitem',
    },
  };

  const initialConfig = {
    namespace: 'NotionEditor',
    theme,
    onError: (error: Error) => console.error('Editor Error:', error),
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      BlockNode,
      PollNode,
    ],
    editorState: () => {
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        const blockNode = $createBlockNode('paragraph');
        const paragraph = $createParagraphNode();
        blockNode.append(paragraph);
        root.append(blockNode);
      }
    },
  };

  return (
    <div className="post-builder">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <BlockPlugin />
          <KeyboardShortcutsPlugin />
          <PlaceholderPlugin placeholder="Write or type '/' to see available commands..." />
          <DragDropBlockPlugin />
          <SlashCommandsPlugin />
          <HistoryPlugin />
          <ListPlugin />
        </div>
      </LexicalComposer>

      {/* <div class="editor-input">
        <div class="block" data-block-type="paragraph">
          <div class="block-ui-container">
          <div class="block-ui-wrapper">
            <!-- Controls: +, drag handle, type indicator -->
          </div>
          </div>
          <p class="editor-paragraph">Second block content</p>
          <p class="editor-paragraph">Second block content</p>
          <p class="editor-paragraph">Second block content</p>
        </div>
      </div> */}
    </div>
  );
}
