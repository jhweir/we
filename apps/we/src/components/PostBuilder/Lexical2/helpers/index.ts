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
  else if ($isHeadingNode(node)) type = node.getTag();
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
      (['h1', 'h2', 'h3'].includes(nodeType) && $isHeadingNode(node) && node.getTag() === nodeType)
    )
      return;

    // Create the new node based on nodeType
    let newNode;
    if (nodeType === 'p') newNode = $createParagraphNode();
    else if (['h1', 'h2', 'h3'].includes(nodeType)) newNode = $createHeadingNode(nodeType as 'h1' | 'h2' | 'h3');
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
