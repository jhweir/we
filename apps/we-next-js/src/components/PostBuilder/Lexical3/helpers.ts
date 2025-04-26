export function isEdgeOfBlock(event: React.KeyboardEvent, direction: 'up' | 'down') {
  // Use DOM-based detection to find the cursor position and check if it's in the top or bottom line of the block
  const domSelection = window.getSelection();
  if (domSelection && domSelection.rangeCount > 0) {
    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // Find the editor container element
    const editorElement = event.currentTarget;
    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const lineSize = 20;
      if (direction === 'up') return rect.top - editorRect.top <= lineSize; // in top line
      return editorRect.bottom - rect.bottom <= lineSize; // in bottom line
    }
  }
  return false;
}
