# PostBuilder

### Approaches tested

- ProseMirror: Multiple Editors
- Lexical 1: BlockNode with BlockPlugin that uses direct DOM maniuplations to create surrounding div
- Lexical 2: Normal nodes, handles created as portals (seperate DOM appeneded to document.body)
- Lexical 3 (todo): Nested approach, each block is its own editor

### Considerations

- Copy pasting: Paste into hidden single editor → Process → Convert to blocks → Display in multiple editors
- Hybrid DOM vs Decorator approach:
  - DOM approach for: UI overlays, toolbars, context menus (maybe not necissary with nested editors)
  - Decorator approach for: Custom node rendering, specialized content types
