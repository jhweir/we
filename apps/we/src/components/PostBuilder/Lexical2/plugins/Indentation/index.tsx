import { $createListNode, $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  INDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

// Todo:
// + exit out of list if enter pressed on empty list item (includes blank space)
// + prevent empty spaces from accumulating in list items when appending via delete or backspace
// + fix: delete on nested list item removing parent item
// + handle drag and drop

function handleIndentation(event: KeyboardEvent, editor: LexicalEditor): boolean {
  event.preventDefault();
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;

  const node = selection.anchor.getNode();
  const parentNode = node.getParent();
  const listItemNode = $isListItemNode(parentNode) ? parentNode : null;

  // Handle list item indentation
  if (listItemNode) {
    // Find the parent list node
    const listNode = listItemNode.getParent();
    if (!listNode || !$isListNode(listNode)) return false;

    // Remove indentation if SHIFT key also pressed (and item is nested)
    if (event.shiftKey) {
      // Fallback on deafult handling if list item isn't nested
      const listParent = listNode.getParent();
      console.log('listParent', listParent);
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

    // Get the previous sibling
    const previousSibling = listItemNode.getPreviousSibling(); // always a list item node (but could be empty)...
    if (!previousSibling || !$isListItemNode(previousSibling)) return false;
    // if (!findListItemNode(previousSibling)) return false;

    console.log('passed!!!', previousSibling);

    // 1.

    // Check if the previous sibling already has a nested list of the same type (why)
    let nestedList = null as null | ListNode;
    previousSibling.getChildren().forEach((child) => {
      if ($isListNode(child) && child.getTag() === listNode.getTag()) nestedList = child;
    });

    console.log('nestedList 1', nestedList);

    editor.update(() => {
      if (!nestedList) {
        // Create a new nested list with same tag as parent
        const listType = listNode.getTag(); // 'bullet', 'number', or 'check'
        nestedList = $createListNode(listType as any);
        previousSibling.append(nestedList);
      }

      console.log('nestedList 2', nestedList);

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
}

function listItemNodeTransform(node: ListItemNode): void {
  // Add blank text node to empty list items to mainatin consistent html structure & avoid positioning issues
  if (node.getChildrenSize() === 0) {
    const textNode = $createTextNode('\u200B');
    node.append(textNode);
  }
}

function listNodeTransform(node: ListNode): void {
  // Fix nested list structures when copy pasted from other text editors
  const children = node.getChildren();
  // Loop through the children of the list node
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child instanceof ListItemNode) {
      // Check if this is an empty container for a nested list
      const grandchildren = child.getChildren();
      // If there's only one child and it's a list node, we need to fix the structure
      if (grandchildren.length === 1 && grandchildren[0] instanceof ListNode) {
        // 1. Find the previous list item
        const prevSibling = child.getPreviousSibling();
        if (prevSibling instanceof ListItemNode) {
          // 2. Move the nested list to the previous item
          const nestedList = grandchildren[0];
          child.remove();
          prevSibling.append(nestedList);
          i--; // Adjust for the removed node
        }
      }
    }
  }
}

export default function IndentationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeTabKeyListener = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => handleIndentation(event, editor),
      COMMAND_PRIORITY_CRITICAL,
    );

    const removeListNodeTransform = editor.registerNodeTransform(ListNode, listNodeTransform);
    const removeListItemNodeTransform = editor.registerNodeTransform(ListItemNode, listItemNodeTransform);

    return () => {
      removeTabKeyListener();
      removeListNodeTransform();
      removeListItemNodeTransform();
    };
  }, [editor]);

  return null;
}
