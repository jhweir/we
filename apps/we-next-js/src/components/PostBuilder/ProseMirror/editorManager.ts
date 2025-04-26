class EditorManager {
  pendingCursorPosition: number | null = null;
  activeBlockId: number | null = null;

  setActiveBlock(blockId: number, cursorPosition: number) {
    this.activeBlockId = blockId;
    this.pendingCursorPosition = cursorPosition;
  }

  clearPosition() {
    this.pendingCursorPosition = null;
  }
}

const editorManager = new EditorManager();
export default editorManager;
