// src/components/LexicalPostBuilder/plugins/KeyboardShortcutsPlugin.tsx
'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { $createBlockNode, $isBlockNode } from '../nodes/BlockNode';

export default function KeyboardShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        console.log('Enter key handler triggered');
        if (event) event.preventDefault();
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          let blockNode = anchorNode.getParent();
          if (!$isBlockNode(blockNode) && blockNode) {
            blockNode = blockNode.getParent();
          }
          if ($isBlockNode(blockNode)) {
            editor.update(() => {
              console.log('Creating new block after:', blockNode.getKey());
              const newBlockNode = $createBlockNode('paragraph');
              const newParagraph = $createParagraphNode();
              newBlockNode.append(newParagraph);
              blockNode.insertAfter(newBlockNode);
              // Use 'element' point type for ParagraphNode
              const newSelection = $createRangeSelection();
              newSelection.anchor.set(newParagraph.getKey(), 0, 'element');
              newSelection.focus.set(newParagraph.getKey(), 0, 'element');
              $setSelection(newSelection);
              console.log('New block created:', newBlockNode.getKey(), 'Selection set to:', newParagraph.getKey());
            });
            return true;
          } else {
            console.log('No BlockNode found in hierarchy for anchor:', anchorNode.getType());
          }
        } else {
          console.log('Selection is not a RangeSelection');
        }
        return false;
      },
      4,
    );

    return () => {
      unregister();
    };
  }, [editor]);

  return null;
}
