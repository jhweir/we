'use client';

import { useAdamContext } from '@/contexts/AdamContext';
import { useSpaceContext } from '@/contexts/SpaceContext';
import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import { ListItemNode, ListNode } from '@lexical/list';
import { CHECK_LIST, HEADING, ORDERED_LIST, QUOTE, UNORDERED_LIST } from '@lexical/markdown'; // use full TRANSFORMERS array when other node types added
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { useEffect } from 'react';
import styles from './index.module.scss';
import { ImageNode } from './nodes/Image';
import BlockHandlesPlugin from './plugins/BlockHandles';
import ImagePlugin from './plugins/ImageBlock';
import IndentationPlugin from './plugins/Indentation';
import PlaceholdersPlugin from './plugins/Placeholders';
import SlashCommandPlugin from './plugins/SlashCommand';

// interface CommonNode {
//   type: string;
//   baseExpression?: string;
//   children?: CommonNode[];
// }

// // Define specific node types
// interface ElementNode extends CommonNode {
//   direction?: string;
//   format?: string;
//   indent?: number;
//   textFormat?: number;
//   textStyle?: string;
//   textType?: string;
//   listType?: string;
//   start?: number;
//   tag?: string;
//   version?: number;
// }

// interface ImageNode extends CommonNode {
//   src?: string;
//   altText?: string;
//   width?: number;
//   height?: number;
//   version?: number;
// }

// todo:
// + save root node as CollectionBlock

function SaveButton() {
  const { ad4mClient } = useAdamContext();
  const { spacePerspective } = useSpaceContext();
  const [editor] = useLexicalComposerContext();

  async function createBlocks(node: any, parent?: any) {
    if (!ad4mClient || !spacePerspective) return;

    let blockType = '';
    if (node.type === 'root') blockType = 'collection';
    if (['text', 'paragraph', 'heading', 'quote', 'list', 'listitem'].includes(node.type)) blockType = 'text';
    if (node.type === 'image') blockType = 'image';

    // Create block
    const blockWrapper = new Block(spacePerspective, undefined, parent?.baseExpression || undefined);
    blockWrapper.type = blockType;
    await blockWrapper.save();
    console.log('blockWrapper', blockWrapper);

    // Create collection block
    if (blockType === 'collection') {
      const elementNode = node as any; // SerializedElementNode;
      const collectionBlock = new CollectionBlock(spacePerspective, undefined, blockWrapper.baseExpression);
      collectionBlock.type = elementNode.type || '';
      collectionBlock.display = elementNode.display || '';
      collectionBlock.direction = elementNode.direction || '';
      collectionBlock.format = elementNode.format || '';
      collectionBlock.indent = elementNode.indent || 0;
      collectionBlock.version = elementNode.version || 0;
      console.log('collectionBlock', collectionBlock);
      await collectionBlock.save();
    }

    // Create text block
    if (blockType === 'text') {
      const elementNode = node as any; // SerializedElementNode;
      const textBlock = new TextBlock(spacePerspective, undefined, blockWrapper.baseExpression);
      textBlock.type = elementNode.type || '';
      textBlock.direction = elementNode.direction || '';
      textBlock.format = elementNode.format || '';
      textBlock.indent = elementNode.indent || 0;
      textBlock.textFormat = elementNode.textFormat || 0;
      textBlock.textStyle = elementNode.textStyle || '';
      textBlock.listType = elementNode.listType || '';
      textBlock.start = elementNode.start || 0;
      textBlock.tag = elementNode.tag || '';
      textBlock.text = elementNode.text || '';
      textBlock.version = elementNode.version || 0;
      console.log('textBlock', textBlock);
      await textBlock.save();
    }

    if (node.type === 'image') {
      const elementNode = node as any;
      const imageBlock = new ImageBlock(spacePerspective, undefined, blockWrapper.baseExpression);
      imageBlock.type = elementNode.type || '';
      imageBlock.src = elementNode.src || '';
      imageBlock.altText = elementNode.altText || '';
      imageBlock.width = elementNode.width || 0;
      imageBlock.height = elementNode.height || 0;
      imageBlock.version = elementNode.version || 0;
      await imageBlock.save();
      console.log('imageBlock', imageBlock);
    }

    if (node.children) {
      node.baseExpression = blockWrapper.baseExpression;
      for (const child of node.children) await createBlocks(child, node);
    }
  }

  function save() {
    editor.update(async () => {
      const editorState = editor.getEditorState();
      console.log('Editor State:', editorState);
      console.log('Editor State JSON:', editorState.toJSON().root);
      const { root } = editorState.toJSON();
      await createBlocks(root);

      console.log('Saved!');
    });
  }

  return (
    <we-row alignX="end" mt="600">
      <we-button variant="ghost" onClick={save}>
        <we-icon name="floppy-disk" />
      </we-button>
    </we-row>
  );
}

function PostEditorWithData({ post }: { post?: any }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!post || !editor) return;

    try {
      const editorState = editor.parseEditorState({ root: post });
      editor.setEditorState(editorState);
    } catch (error) {
      console.error('Error loading post data:', error);
    }
  }, [post, editor]);

  return null; // This is just a logic component, no UI
}

export default function PostBuilder({ post }: { post?: any }) {
  // Pass post JSON to Lexical editor if available

  const initialConfig = {
    namespace: 'PostBuilder',
    theme: { root: styles.editor },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, ImageNode],
    onError: (error: Error) => console.error('Editor Error:', error),
  };

  return (
    <we-column bg="white" p="1000" r="xs" style={{ width: '100%', maxWidth: 1000 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <SaveButton />
        <PostEditorWithData post={post} />

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
