'use client';

import { EditorState, Selection } from 'prosemirror-state';
import { useState } from 'react';
import BlockEditor from './BlockEditor';
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
      const currentDoc = currentState.doc;

      let nextText = '';
      nextDoc.content.forEach((node) => {
        if (node.type.name === 'paragraph') {
          node.content.forEach((child) => {
            if (child.isText) {
              nextText += child.text;
            }
          });
        }
      });

      let insertPos = 0;
      currentDoc.descendants((node, pos) => {
        if (node.isText) {
          insertPos = pos + node.nodeSize; // End of the text node
          return false;
        }
        return true;
      });

      if (insertPos === 0) {
        currentDoc.content.forEach((node, pos) => {
          if (node.type.name === 'paragraph') {
            insertPos = pos + 1;
            return false;
          }
        });
      }

      const tr = currentState.tr;
      tr.insertText(nextText, insertPos);

      // Set cursor between original and appended text
      const cursorPos = insertPos; // After "ABC", before "DEF"
      tr.setSelection(Selection.near(tr.doc.resolve(cursorPos)));

      return currentState.apply(tr);
    };

  const mergeWithPreviousBlock =
    (index: number) =>
    (currentState: EditorState): { updatedState: EditorState; targetId: number } | null => {
      const currentBlocks = blocks;
      if (index <= 0) {
        return null;
      }

      const previousBlock = currentBlocks[index - 1];
      const previousDoc = previousBlock.state.doc;
      const currentDoc = currentState.doc;

      let currentText = '';
      currentDoc.content.forEach((node) => {
        if (node.type.name === 'paragraph') {
          node.content.forEach((child) => {
            if (child.isText) {
              currentText += child.text;
            }
          });
        }
      });

      let insertPos = 0;
      previousDoc.descendants((node, pos) => {
        if (node.isText) {
          insertPos = pos + node.nodeSize; // End of the text node
          return false;
        }
        return true;
      });

      if (insertPos === 0) {
        previousDoc.content.forEach((node, pos) => {
          if (node.type.name === 'paragraph') {
            insertPos = pos + 1;
            return false;
          }
        });
      }

      const tr = previousBlock.state.tr;
      tr.insertText(currentText, insertPos);

      // Set cursor between original and appended text
      const cursorPos = insertPos; // After "ABC", before "DEF"
      tr.setSelection(Selection.near(tr.doc.resolve(cursorPos)));

      const updatedState = previousBlock.state.apply(tr);
      return { updatedState, targetId: previousBlock.id };
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
        />
      ))}
    </div>
  );
}
