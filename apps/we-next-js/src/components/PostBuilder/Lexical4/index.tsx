// components/PostBuilder.tsx
'use client';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { $getRoot } from 'lexical';
import { $createCustomParagraphNode, CustomParagraphNode } from './nodes/Paragraph';

export default function PostBuilder() {
  const theme = {
    paragraph: 'paragraph-block',
    // heading: {
    //   h1: 'editor-heading-h1',
    //   h2: 'editor-heading-h2',
    //   h3: 'editor-heading-h3',
    // },
    // list: {
    //   ul: 'editor-list-ul',
    //   ol: 'editor-list-ol',
    //   listitem: 'editor-listitem',
    // },
  };

  const initialConfig = {
    namespace: 'NotionEditor',
    theme,
    onError: (error: Error) => console.error('Editor Error:', error),
    nodes: [CustomParagraphNode],
    editorState: () => {
      const root = $getRoot();
      root.clear();
      root.append($createCustomParagraphNode('First paragraph'), $createCustomParagraphNode('Second paragraph'));
    },
  };

  return (
    <div className="post-builder">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <PlainTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}

// const initialConfig = {
//   namespace: 'PostBuilder',
//   theme: {
//     paragraph: 'paragraph-block',
//   },
//   onError: (error: Error) => console.error(error),
//   nodes: [CustomParagraphNode],
// };

// export default function PostBuilder() {
//   const [editor] = useLexicalComposerContext();

//   // Initialize with some custom paragraph blocks
//   useEffect(() => {
//     editor.update(() => {
//       const root = $getRoot();
//       root.clear();
//       root.append(
//         $createCustomParagraphNode().append($createTextNode('First paragraph')),
//         $createCustomParagraphNode().append($createTextNode('Second paragraph')),
//       );
//     });
//   }, [editor]);

//   // Handle Enter key to create new paragraph
//   editor.registerCommand(
//     'KEY_ENTER_COMMAND',
//     (event) => {
//       if (event && !event.shiftKey) {
//         event.preventDefault();
//         editor.update(() => {
//           const selection = $getSelection();
//           if (selection) {
//             const node = selection.anchor.getNode();
//             const parent = node.getParent();
//             if (parent) {
//               const newParagraph = $createCustomParagraphNode();
//               parent.insertAfter(newParagraph);
//               newParagraph.selectEnd();
//             }
//           }
//         });
//         return true;
//       }
//       return false;
//     },
//     COMMAND_PRIORITY_HIGH,
//   );

//   return (
//     <LexicalComposer initialConfig={initialConfig}>
//       <div className="max-w-3xl mx-auto p-4">
//         <PlainTextPlugin
//           contentEditable={<ContentEditable className="outline-none" />}
//           placeholder={<div className="text-gray-400">Type something...</div>}
//           ErrorBoundary={LexicalErrorBoundary}
//         />
//         <HistoryPlugin />
//       </div>
//     </LexicalComposer>
//   );
// }
