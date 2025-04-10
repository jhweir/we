import { $createListNode, $isListItemNode, $isListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  LexicalNode,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

// Todo:
// + tidy up
// + fix: delete on nested list item removing parent item
// + handle drag and drop

function findListItemNode(node: LexicalNode): LexicalNode | null {
  if ($isListItemNode(node)) return node;

  // Traverse up the nodes parents to search for a list item node
  let parent = node.getParent();
  while (parent !== null) {
    if ($isListItemNode(parent)) return parent;
    parent = parent.getParent();
  }

  return null;
}

export default function TabIndentationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeTabListener = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        event.preventDefault();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const node = selection.anchor.getNode();
        console.log('tab pressed', node);

        const listItemNode = findListItemNode(node);
        console.log('listItemNode', listItemNode);

        // Handle list item indentation
        if (listItemNode) {
          // Find the parent list node
          const listNode = listItemNode.getParent();
          if (!listNode || !$isListNode(listNode)) return false;

          // Remove indentation if SHIFT key is pressed and item is nested
          if (event.shiftKey) {
            // Fallback on deafult handling if list item isn't nested
            const listParent = listNode.getParent();
            if (!$isListItemNode(listParent)) return false;
            else {
              // Todo: handle empty list items here... (need further step up the tree...)
              // use: findListItemNode(listParent) ?
              const grandParentList = listParent.getParent();

              if (!grandParentList || !$isListNode(grandParentList)) return false;

              editor.update(() => {
                // Insert this list item after its parent list item in the grandparent list
                listParent.insertAfter(listItemNode);

                // Check if parent list is now empty after removing this item
                if (listNode.getChildrenSize() === 0) listNode.remove();
              });

              return true;
            }
          }

          // Prevent indentation if this is the first item in the list
          if (listItemNode === listNode.getFirstChild()) return false;

          // Not the first item - get the previous sibling
          const previousSibling = listItemNode.getPreviousSibling();
          if (!previousSibling || !$isListItemNode(previousSibling)) return false;

          // Check if the previous sibling already has a nested list of the same type
          let nestedList = null;
          previousSibling.getChildren().forEach((child) => {
            if ($isListNode(child) && child.getTag() === listNode.getTag()) {
              nestedList = child;
            }
          });

          editor.update(() => {
            if (!nestedList) {
              // Create a new nested list with same tag as parent
              const listType = listNode.getTag(); // 'bullet', 'number', or 'check'
              nestedList = $createListNode(listType as any);
              previousSibling.append(nestedList);
            }

            // Move current list item to the nested list
            nestedList.append(listItemNode);
          });

          return true;
        } else {
          // Handle standard indentation
          if (event.shiftKey) editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          else editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          return true;
        }
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    return () => removeTabListener();
  }, [editor]);

  return null;
}
