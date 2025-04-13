import { $isListItemNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import styles from './index.module.scss';

export default function PlaceholdersPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    function updatePlaceholders() {
      editor.getEditorState().read(() => {
        const nodeMap = editor._editorState._nodeMap;
        const selection = $getSelection();

        // Get the key of the currently focused node
        let focusedNodeKey = null;
        if ($isRangeSelection(selection)) {
          focusedNodeKey = selection.focus.getNode().getKey();
          // Walk up the tree to find the nearest element node
          let node = selection.focus.getNode();
          while ((node && !$isElementNode(node)) || $isRootNode(node)) node = node.getParent()!;
          if (node && $isElementNode(node) && !$isRootNode(node)) focusedNodeKey = node.getKey();
        }

        // Process all block nodes
        for (const [key, node] of nodeMap.entries()) {
          if ($isElementNode(node) && !$isRootNode(node)) {
            const element = editor.getElementByKey(key);
            if (!element) continue;

            const isEmpty = node.getChildrenSize() === 0 || node.getFirstChild()?.getTextContent() === '\u200B';

            if (isEmpty) {
              // Add classes
              element.classList.add(styles.empty);
              if (key === focusedNodeKey) element.classList.add(styles.focused);
              else element.classList.remove(styles.focused);

              // Set appropriate placeholder text based on node type
              let placeholderText = '';
              if ($isParagraphNode(node)) placeholderText = "Type or press '/' for commands...";
              else if ($isListItemNode(node)) placeholderText = 'List item';
              else if ($isQuoteNode(node)) placeholderText = 'Quote';
              else if ($isHeadingNode(node)) {
                const tag = node.getTag();
                placeholderText = `Heading ${tag.substring(1)}`;
              }

              element.setAttribute('data-placeholder', placeholderText);
            } else {
              // Remove classes
              element.classList.remove(styles.empty);
              element.classList.remove(styles.focused);
              element.removeAttribute('data-placeholder');
            }
          }
        }
      });
    }

    return mergeRegister(
      editor.registerUpdateListener(() => requestAnimationFrame(updatePlaceholders)),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          requestAnimationFrame(updatePlaceholders);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
