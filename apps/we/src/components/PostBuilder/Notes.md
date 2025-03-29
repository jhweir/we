# PostBuilder

### Approaches tested

- ProseMirror: Multiple Editors
- Lexical 1: Single editor, BlockNode with BlockPlugin that uses direct DOM maniuplations to create surrounding div
- Lexical 2 (best choice): Single editor, normal nodes, handles created as portals (seperate DOM appeneded to document.body) (AI mess)
- Lexical 3: Multiple Editors (doesn't work well with text selection, less efficient rendering)
- Lexical 4: Single editor, custom decorated nodes (decorated nodes not designed for editable content, break lexicals default key actions)

### Considerations

- Copy pasting: Paste into hidden single editor → Process → Convert to blocks → Display in multiple editors
- Hybrid DOM vs Decorator approach:
  - DOM approach for: UI overlays, toolbars, context menus (maybe not necissary with nested editors)
  - Decorator approach for: Custom node rendering, specialized content types
