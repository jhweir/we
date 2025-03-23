// src/components/LexicalPostBuilder/plugins/BlockPlugin.tsx
'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot, $isElementNode, LexicalNode } from 'lexical';
import { useEffect } from 'react';
import { $createBlockNode, $isBlockNode } from '../nodes/BlockNode';

export default function BlockPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const wrapNodeInBlock = (node: LexicalNode) => {
      if ($isElementNode(node) && !$isBlockNode(node) && !node.isInline() && node.getParent() === $getRoot()) {
        console.log('Wrapping node:', node.getKey(), 'Type:', node.getType());
        const blockNode = $createBlockNode(node.getType());
        node.replace(blockNode);
        blockNode.append(node);
      }
    };

    // Initial wrapping
    editor.update(() => {
      const root = $getRoot();
      console.log(
        'Initial root children before wrap:',
        root.getChildren().map((n) => ({ key: n.getKey(), type: n.getType() })),
      );
      root.getChildren().forEach(wrapNodeInBlock);
      console.log(
        'Initial root children after wrap:',
        root.getChildren().map((n) => ({ key: n.getKey(), type: n.getType() })),
      );
    });

    // Handle dynamic updates
    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editor.update(() => {
        const root = $getRoot();
        const nodesToWrap = [];
        for (const node of root.getChildren()) {
          if ($isElementNode(node) && !$isBlockNode(node) && !node.isInline() && node.getParent() === $getRoot()) {
            nodesToWrap.push(node.getKey());
          }
        }
        nodesToWrap.forEach((key) => {
          const node = $getNodeByKey(key);
          if (node) wrapNodeInBlock(node);
        });
      });
    });

    return () => {
      unregisterUpdateListener();
    };
  }, [editor]);

  return null;
}
