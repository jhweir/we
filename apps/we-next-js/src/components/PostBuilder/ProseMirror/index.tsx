'use client';

import { EditorState, Selection } from 'prosemirror-state';
import { useState } from 'react';
import BlockEditor from './BlockEditor';
import editorManager from './editorManager';
import { customSchema } from './schema';

interface Block {
  id: number;
  type: string;
  state: EditorState;
}

export default function PostBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: 'paragraph', state: EditorState.create({ schema: customSchema }) },
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<number>(1);

  const insertBlock = (index: number, type: string) => {
    const newBlockId = Date.now();
    const newBlock = {
      id: newBlockId,
      type,
      state: EditorState.create({ schema: customSchema }),
    };

    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    setFocusedBlockId(newBlockId);
  };

  const deleteBlock = (id: number) => {
    setBlocks((prevBlocks) => {
      if (prevBlocks.length <= 1) {
        return prevBlocks;
      }

      const indexToDelete = prevBlocks.findIndex((block) => block.id === id);
      const newBlocks = prevBlocks.filter((block) => block.id !== id);

      if (newBlocks.length > 0) {
        if (indexToDelete > 0) {
          setFocusedBlockId(newBlocks[indexToDelete - 1].id);
        } else {
          setFocusedBlockId(newBlocks[0].id);
        }
      }

      return newBlocks;
    });
  };

  const updateBlockState = (id: number, newState: EditorState) => {
    // Just update the block state - cursor positioning now happens in BlockEditor
    setBlocks((prevBlocks) => prevBlocks.map((block) => (block.id === id ? { ...block, state: newState } : block)));
  };

  const mergeWithNextBlock =
    (index: number) =>
    (currentState: EditorState): EditorState | null => {
      const currentBlocks = blocks;
      if (index >= currentBlocks.length - 1) {
        return null;
      }

      const nextBlock = currentBlocks[index + 1];
      const nextDoc = nextBlock.state.doc;

      // Extract all text from the next block
      let nextText = '';
      nextDoc.nodesBetween(0, nextDoc.content.size, (node) => {
        if (node.isText) {
          nextText += node.text;
        }
        return true;
      });

      // Find position to insert at (end of current document)
      const tr = currentState.tr;
      const insertPos = currentState.doc.content.size - 1;

      if (nextText) {
        tr.insertText(nextText, insertPos);
        tr.setSelection(Selection.near(tr.doc.resolve(insertPos)));
      }

      return tr.docChanged ? currentState.apply(tr) : null;
    };

  const mergeWithPreviousBlock =
    (index: number) =>
    (currentState: EditorState): { updatedState: EditorState; targetId: number } | null => {
      const currentBlocks = blocks;
      if (index <= 0) {
        return null;
      }

      const previousBlock = currentBlocks[index - 1];

      // Extract all text from current block
      let currentText = '';
      currentState.doc.nodesBetween(0, currentState.doc.content.size, (node) => {
        if (node.isText) {
          currentText += node.text;
        }
        return true;
      });

      // Find position to insert at (end of previous document)
      const tr = previousBlock.state.tr;
      const insertPos = previousBlock.state.doc.content.size - 1;

      if (currentText) {
        tr.insertText(currentText, insertPos);
        tr.setSelection(Selection.near(tr.doc.resolve(insertPos)));
      }

      return tr.docChanged ? { updatedState: previousBlock.state.apply(tr), targetId: previousBlock.id } : null;
    };

  // Simplified navigation functions - just focus the blocks
  const moveToPreviousBlock = (index: number, cursorOffset: number) => {
    if (index > 0) {
      console.log('Move to previous block', index, cursorOffset);
      // Set the active block ID and cursor position in editor manager
      editorManager.setActiveBlock(blocks[index - 1].id, cursorOffset);
      // Then update the focused block in React state
      setFocusedBlockId(blocks[index - 1].id);
    }
  };

  const moveToNextBlock = (index: number, cursorOffset: number) => {
    if (index < blocks.length - 1) {
      console.log('Move to next block', index, cursorOffset);
      // Set the active block ID and cursor position in editor manager
      editorManager.setActiveBlock(blocks[index + 1].id, cursorOffset);
      // Then update the focused block in React state
      setFocusedBlockId(blocks[index + 1].id);
    }
  };

  return (
    <div className="editor-container">
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          id={block.id}
          state={block.state}
          insertBlock={() => insertBlock(index, 'paragraph')}
          deleteBlock={deleteBlock}
          mergeWithNextBlock={mergeWithNextBlock(index)}
          mergeWithPreviousBlock={mergeWithPreviousBlock(index)}
          hasNextBlock={index < blocks.length - 1}
          hasPreviousBlock={index > 0}
          nextBlockId={index < blocks.length - 1 ? blocks[index + 1].id : undefined}
          previousBlockId={index > 0 ? blocks[index - 1].id : undefined}
          focused={focusedBlockId === block.id}
          onFocus={() => setFocusedBlockId(block.id)}
          onStateChange={updateBlockState}
          onMoveToPreviousBlock={(cursorOffset) => moveToPreviousBlock(index, cursorOffset)}
          onMoveToNextBlock={(cursorOffset) => moveToNextBlock(index, cursorOffset)}
        />
      ))}
    </div>
  );
}
