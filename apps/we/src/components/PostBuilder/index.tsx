'use client';

import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { DOMParser } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { useEffect, useRef, useState } from 'react';
import './index.scss';
import { customSchema } from './schema';

const SLASH_COMMANDS = [
  { title: 'Text', type: 'paragraph' },
  { title: 'Heading 1', type: 'heading', attrs: { level: 1 } },
  { title: 'Bullet List', type: 'bullet_list' },
  { title: 'Numbered List', type: 'ordered_list' },
  { title: 'Code Block', type: 'code_block' },
  { title: 'Image', type: 'image' },
];

const createPlaceholderPlugin = () => {
  return new Plugin({
    key: new PluginKey('placeholder'),
    props: {
      decorations: (state) => {
        const doc = state.doc;
        if (doc.childCount === 1 && doc.firstChild?.isTextblock && doc.firstChild.content.size === 0) {
          return DecorationSet.create(doc, [
            Decoration.widget(1, () => {
              const span = document.createElement('span');
              span.className = 'placeholder';
              span.textContent = 'Write or type "/" to see available commands...';
              return span;
            }),
          ]);
        }
        return DecorationSet.empty;
      },
    },
  });
};

const createSlashCommandsPlugin = (handlers: {
  setShowMenu: (show: boolean) => void;
  setMenuPosition: (pos: { top: number; left: number }) => void;
}) => {
  return new Plugin({
    key: new PluginKey('slash-commands'),
    props: {
      handleKeyDown(view, event) {
        if (event.key === '/') {
          const { $from } = view.state.selection;
          const coords = view.coordsAtPos($from.pos);
          handlers.setMenuPosition({ top: coords.bottom, left: coords.left });
          handlers.setShowMenu(true);
          return false; // Let the '/' character be inserted
        }
        return false;
      },
    },
  });
};

export default function PostBuilder() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const doc = document.createElement('div');
      doc.innerHTML = '<p></p>';

      // Create plugins
      const placeholderPlugin = createPlaceholderPlugin();
      const slashCommands = createSlashCommandsPlugin({
        setShowMenu,
        setMenuPosition,
      });

      const state = EditorState.create({
        schema: customSchema,
        doc: DOMParser.fromSchema(customSchema).parse(doc),
        plugins: [keymap(baseKeymap), slashCommands, placeholderPlugin],
      });

      viewRef.current = new EditorView(editorRef.current, {
        state,
        dispatchTransaction(transaction) {
          if (!viewRef.current) return;
          const newState = viewRef.current.state.apply(transaction);
          viewRef.current.updateState(newState);

          // Check for slash command
          const { selection } = newState;
          const { $from } = selection;
          const textBefore = $from.nodeBefore?.text;

          if (textBefore?.endsWith('/')) {
            const coords = viewRef.current.coordsAtPos($from.pos);
            setMenuPosition({ top: coords.bottom, left: coords.left });
            setShowMenu(true);
          } else {
            setShowMenu(false);
          }
        },
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  const insertBlock = (type: string, attrs?: Record<string, any>) => {
    if (!viewRef.current) return;

    const { state } = viewRef.current;
    const { tr } = state;
    const pos = state.selection.from;

    if (type === 'image') {
      // Show file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const src = reader.result as string;
            tr.replaceWith(pos, pos, customSchema.nodes.image.create({ src }));
            viewRef.current?.dispatch(tr);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const node = customSchema.nodes[type].create(attrs);
      tr.replaceWith(pos, pos, node);
      viewRef.current.dispatch(tr);
    }

    setShowMenu(false);
  };

  return (
    <we-column p="500" style={{ height: '100%' }}>
      <div className="menu-bar">
        {['paragraph', 'heading', 'bullet_list', 'ordered_list', 'code_block', 'image'].map((type) => (
          <button key={type} onClick={() => insertBlock(type)}>
            {type}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="prose-editor"
        style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '4px',
          minHeight: '200px',
          border: '1px solid #e2e8f0',
        }}
      />
      {showMenu && (
        <div
          className="slash-menu"
          style={{
            position: 'absolute',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          {SLASH_COMMANDS.map((command) => (
            <button key={command.title} onClick={() => insertBlock(command.type, command.attrs)}>
              {command.title}
            </button>
          ))}
        </div>
      )}
    </we-column>
  );
}
