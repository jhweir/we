import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getRoot, $isElementNode, LexicalNode } from 'lexical';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import BlockUI from '../components/BlockUI';
import { $createBlockNode, $isBlockNode, BlockNode } from '../nodes/BlockNode';

interface BlockUIContainerProps {
  nodeKey: string;
  blockType: string;
  container: HTMLElement | null;
}

function BlockUIContainer({ nodeKey, blockType, container }: BlockUIContainerProps) {
  if (!container) return null;
  return createPortal(<BlockUI nodeKey={nodeKey} blockType={blockType} />, container);
}

export default function BlockPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [blockContainers, setBlockContainers] = useState<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    const wrapNodeInBlock = (node: LexicalNode) => {
      if ($isElementNode(node) && !$isBlockNode(node) && !node.isInline() && node.getParent() === $getRoot()) {
        const blockNode = $createBlockNode(node.getType());
        node.replace(blockNode);
        blockNode.append(node);
      }
    };

    // Initial wrapping
    editor.update(() => {
      const root = $getRoot();
      console.log(
        'Initial root children:',
        root.getChildren().map((n) => n.getType()),
      );
      root.getChildren().forEach(wrapNodeInBlock);
    });

    // Handle dynamic updates
    const unregisterUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      setTimeout(() => {
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
      }, 50);
    });

    // Transform BlockNode to include a container for BlockUI
    const unregisterNodeTransformer = editor.registerNodeTransform(BlockNode, (node) => {
      const domElement = editor.getElementByKey(node.getKey());
      if (domElement && !domElement.__blockUIInitialized) {
        domElement.__blockUIInitialized = true;
        const blockUIContainer = document.createElement('div');
        blockUIContainer.className = 'block-ui-container';
        domElement.insertBefore(blockUIContainer, domElement.firstChild);
        setBlockContainers((prev) => {
          const newMap = new Map(prev);
          newMap.set(node.getKey(), blockUIContainer);
          return newMap;
        });
      }
    });

    return () => {
      unregisterUpdateListener();
      unregisterNodeTransformer();
    };
  }, [editor]);

  return (
    <>
      {Array.from(blockContainers.entries()).map(([nodeKey, container]) => {
        const blockNode = editor.getEditorState()._nodeMap.get(nodeKey);
        if (!blockNode || !$isBlockNode(blockNode)) return null;
        return (
          <BlockUIContainer
            key={nodeKey}
            nodeKey={nodeKey}
            blockType={blockNode.getBlockType()}
            container={container}
          />
        );
      })}
    </>
  );
}
