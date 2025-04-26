# PostBuilder

### Approaches tested

- ProseMirror: Multiple Editors
- Lexical 1: Single editor, BlockNode with BlockPlugin that uses direct DOM maniuplations to create surrounding div
- Lexical 2 (Best choice): Single editor, normal nodes, handles created as portals (seperate DOM appeneded to document.body)
- Lexical 3: Multiple Editors (doesn't work well with text selection, less efficient rendering)
- Lexical 4: Single editor, custom decorated nodes (decorators not designed for editable content, breaks lexicals default key actions)

### Considerations

- Hybrid DOM vs Decorator approach:
  - Portals for block handle menu & inline editing menu
  - Default Lexical nodes for standard types (paragraph, heading, list items etc.)
  - Decorator nodes for custom block types (media, polls, games etc.)
