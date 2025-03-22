import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_NORMAL, createCommand } from 'lexical';
import { useEffect } from 'react';
import { $createPollNode } from '../nodes/PollNode';

// Create a custom command for slash commands
export const SHOW_SLASH_MENU = createCommand('SHOW_SLASH_MENU');
export const SLASH_KEY_COMMAND = createCommand('SLASH_KEY_COMMAND');

export default function SlashCommandsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register keyboard listener for slash key
    const removeKeyDownListener = editor.registerRootListener((rootElement: HTMLElement | null) => {
      if (rootElement !== null) {
        rootElement.addEventListener('keydown', (event) => {
          if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
            editor.dispatchCommand(SLASH_KEY_COMMAND, undefined);
          }
        });
      }

      return () => {
        if (rootElement !== null) {
          rootElement.removeEventListener('keydown', (event) => {
            if (event.key === '/') {
              editor.dispatchCommand(SLASH_KEY_COMMAND, undefined);
            }
          });
        }
      };
    });

    // Handle slash key
    const unregisterSlash = editor.registerCommand(
      SLASH_KEY_COMMAND,
      () => {
        // Show slash menu (simplified version)
        const menu = document.createElement('div');
        menu.className = 'slash-menu';

        const pollButton = document.createElement('button');
        pollButton.textContent = 'Poll';
        pollButton.onclick = () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              // Delete the slash character
              selection.deleteCharacter(true);

              // Insert poll node
              const pollNode = $createPollNode({
                question: 'What do you think?',
                options: [
                  { id: '1', text: 'Option 1', votes: 0 },
                  { id: '2', text: 'Option 2', votes: 0 },
                ],
              });
              selection.insertNodes([pollNode]);
            }
          });

          // Remove menu
          menu.remove();
        };

        menu.appendChild(pollButton);

        // Position menu near cursor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          menu.style.position = 'absolute';
          menu.style.left = `${rect.left}px`;
          menu.style.top = `${rect.bottom + 5}px`;

          document.body.appendChild(menu);

          // Close menu when clicking outside
          const closeMenu = () => {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          };

          setTimeout(() => {
            document.addEventListener('click', closeMenu);
          }, 0);
        }

        return true;
      },
      COMMAND_PRIORITY_NORMAL,
    );

    return () => {
      unregisterSlash();
      removeKeyDownListener();
    };
  }, [editor]);

  return null;
}
