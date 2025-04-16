import { $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $getNodeByKey,
  $isElementNode,
  $isParagraphNode,
  createCommand,
  LexicalEditor,
  LexicalNode,
} from 'lexical';

type TransformBlockProps = { editor: LexicalEditor; nodeKey: string; nodeType: string };
type ReorderBlockProps = { editor: LexicalEditor; sourceKey: string; targetKey: string; insertBefore: boolean };

export const TRANSFORM_BLOCK_COMMAND = createCommand<TransformBlockProps>('TRANSFORM_BLOCK_COMMAND');
export const REORDER_BLOCK_COMMAND = createCommand<ReorderBlockProps>('REORDER_BLOCK_COMMAND');

export function findNodeType(node: LexicalNode): string {
  let type = '';
  if ($isParagraphNode(node)) type = 'p';
  else if ($isHeadingNode(node) || $isListNode(node)) type = node.getTag();
  else if ($isListItemNode(node)) type = 'li';
  return type;
}

export function transformBlock(props: TransformBlockProps): boolean {
  const { editor, nodeKey, nodeType } = props;

  if (!nodeKey) return false;

  editor.update(() => {
    const node = $getNodeByKey(nodeKey);

    // Skip if node not found or its not an element node
    if (!node || !$isElementNode(node)) return;

    // Skip if node is already the desired type
    if (
      (nodeType === 'p' && $isParagraphNode(node)) ||
      (['h1', 'h2', 'h3'].includes(nodeType) && $isHeadingNode(node) && node.getTag() === nodeType) ||
      (['ul', 'ol', 'cl'].includes(nodeType) && $isListNode(node) && node.getTag() === nodeType) ||
      (nodeType === 'li' && $isListItemNode(node))
    )
      return;

    // Create the new node based on nodeType
    let newNode;
    if (nodeType === 'p') newNode = $createParagraphNode();
    else if (['h1', 'h2', 'h3'].includes(nodeType)) newNode = $createHeadingNode(nodeType as 'h1' | 'h2' | 'h3');
    else if (['ul', 'ol', 'cl'].includes(nodeType)) {
      const listMap = { ul: 'bullet', ol: 'number', cl: 'check' } as any;
      const listNode = $createListNode(listMap[nodeType]);
      const listItemNode = $createListItemNode();
      // console.log('children', node.getChildren());
      node.getChildren().forEach((child) => listItemNode.append(child));

      listNode.append(listItemNode);
      node.replace(listNode);
      // Return early since we've already handled the replacement
      return;
    } else if (nodeType === 'li') newNode = $createListItemNode();
    else return; // Skip if unsupported block type

    // Transfer content and replace the node
    node.getChildren().forEach((child) => newNode.append(child));
    node.replace(newNode);
  });

  return true;
}

export function reorderBlock(props: ReorderBlockProps): boolean {
  const { editor, sourceKey, targetKey, insertBefore } = props;

  if (!sourceKey || !targetKey) return false;

  editor.update(() => {
    const sourceNode = $getNodeByKey(sourceKey);
    const targetNode = $getNodeByKey(targetKey);

    if (sourceNode && targetNode && $isElementNode(sourceNode) && $isElementNode(targetNode)) {
      if (insertBefore) targetNode.insertBefore(sourceNode);
      else {
        const nextSibling = targetNode.getNextSibling();
        if (nextSibling) nextSibling.insertBefore(sourceNode);
        else targetNode.getParent()?.append(sourceNode);
      }
    }
  });

  return true;
}
