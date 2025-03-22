import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, KEY_ENTER_COMMAND } from 'lexical';
import { useEffect } from 'react';
import { $createBlockNode, $isBlockNode } from '../nodes/BlockNode';

export default function KeyboardShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event) event.preventDefault(); // Prevent default Enter behavior
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const blockNode = anchorNode.getParent();
          if ($isBlockNode(blockNode)) {
            editor.update(() => {
              const newBlockNode = $createBlockNode('paragraph');
              const newParagraph = $createParagraphNode();
              newBlockNode.append(newParagraph);
              blockNode.insertAfter(newBlockNode);
              newParagraph.selectStart(); // Move cursor to new paragraph
            });
            return true; // Indicate command was handled
          }
        }
        return false; // Let default behavior proceed if not in a BlockNode
      },
      0, // Priority 0 (default)
    );
  }, [editor]);

  return null;
}
