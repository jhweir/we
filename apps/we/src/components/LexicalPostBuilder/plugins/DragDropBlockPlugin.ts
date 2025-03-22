import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, COMMAND_PRIORITY_HIGH, DRAGOVER_COMMAND, DROP_COMMAND } from 'lexical';
import { useEffect } from 'react';

export default function DragDropBlockPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle dragover
    const unregisterDragOver = editor.registerCommand(
      DRAGOVER_COMMAND,
      (event) => {
        // Set appropriate styling for drag target
        // Prevent default to allow dropping
        event.preventDefault();
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    // Handle drop
    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        event.preventDefault();
        const dragData = event.dataTransfer?.getData('text/plain');

        if (!dragData) return false;

        try {
          const draggedNodeKey = dragData;

          // Find drop target based on mouse position
          const targetElement = document.elementFromPoint(event.clientX, event.clientY);

          if (!targetElement || !(targetElement instanceof HTMLElement)) return false;

          // Find the block wrapper that contains the target
          let blockElement: HTMLElement | null = targetElement;
          while (blockElement && !blockElement.classList.contains('block-decorator')) {
            const parentElement = blockElement.parentElement as HTMLElement | null;
            if (!parentElement) return false;
            blockElement = parentElement;
          }

          // Get the target node key from the data attribute
          const targetNodeKey = blockElement?.getAttribute('data-lexical-node-key');
          if (!targetNodeKey) return false;

          // Move the node in the editor
          editor.update(() => {
            const draggedNode = $getNodeByKey(draggedNodeKey);
            const targetNode = $getNodeByKey(targetNodeKey);

            if (!draggedNode || !targetNode) return;

            // Don't do anything if dropping onto the same node
            if (draggedNodeKey === targetNodeKey) return;

            // Remove the dragged node from its current position
            draggedNode.remove();

            // Insert it at the new position
            targetNode.insertBefore(draggedNode);
          });

          return true;
        } catch (err) {
          console.error('Error during drag and drop operation', err);
          return false;
        }
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      unregisterDragOver();
      unregisterDrop();
    };
  }, [editor]);

  return null;
}
