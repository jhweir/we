import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';

interface PlaceholderPluginProps {
  placeholder: string;
}

export default function PlaceholderPlugin({ placeholder }: PlaceholderPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Create placeholder element
    const div = document.createElement('div');
    div.className = 'editor-placeholder';
    div.textContent = placeholder;

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.appendChild(div);
    }

    // Function to check if editor is empty
    const checkEmpty = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const isEmpty =
          root.getChildrenSize() === 0 ||
          (root.getChildrenSize() === 1 && root.getFirstChild()?.getTextContent() === '');

        div.style.display = isEmpty ? 'block' : 'none';
      });
    };

    // Check initially
    checkEmpty();

    // Update whenever editor changes
    return editor.registerUpdateListener(() => {
      checkEmpty();
    });
  }, [editor, placeholder]);

  return null;
}
