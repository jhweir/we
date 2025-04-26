import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

// NODE SPECIFICATIONS
const nodes: { [key: string]: NodeSpec } = {
  // Top-level document node
  doc: {
    content: 'block+',
  },

  // Plain text node - basic content unit
  text: {
    group: 'inline',
  },

  // Base block for all content types
  block: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
      type: { default: 'paragraph' },
    },
    parseDOM: [
      {
        tag: 'div.notion-block',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
            type: dom.getAttribute('data-block-type') || 'paragraph',
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: `notion-block notion-${node.attrs.type}-block`,
          'data-block-id': node.attrs.id,
          'data-block-type': node.attrs.type,
        },
        0,
      ];
    },
  },

  // Heading block
  heading: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
      level: { default: 1 },
    },
    parseDOM: [
      {
        tag: 'div.notion-heading',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
            level: parseInt(dom.getAttribute('data-heading-level') || '1', 10),
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: `notion-block notion-heading notion-h${node.attrs.level}`,
          'data-block-id': node.attrs.id,
          'data-block-type': 'heading',
          'data-heading-level': node.attrs.level,
        },
        0,
      ];
    },
  },

  // Bullet list item
  bullet_list_item: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
    },
    parseDOM: [
      {
        tag: 'div.notion-bullet-list-item',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: 'notion-block notion-bullet-list-item',
          'data-block-id': node.attrs.id,
          'data-block-type': 'bullet_list_item',
        },
        0,
      ];
    },
  },

  // Numbered list item
  numbered_list_item: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
      number: { default: 1 },
    },
    parseDOM: [
      {
        tag: 'div.notion-numbered-list-item',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
            number: parseInt(dom.getAttribute('data-number') || '1', 10),
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: 'notion-block notion-numbered-list-item',
          'data-block-id': node.attrs.id,
          'data-block-type': 'numbered_list_item',
          'data-number': node.attrs.number,
        },
        0,
      ];
    },
  },

  // Todo/checkbox item
  todo_item: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
      checked: { default: false },
    },
    parseDOM: [
      {
        tag: 'div.notion-todo-item',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
            checked: dom.getAttribute('data-checked') === 'true',
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: 'notion-block notion-todo-item',
          'data-block-id': node.attrs.id,
          'data-block-type': 'todo_item',
          'data-checked': node.attrs.checked,
        },
        0,
      ];
    },
  },

  // Code block with syntax highlighting
  code_block: {
    content: 'text*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
      language: { default: 'text' },
    },
    parseDOM: [
      {
        tag: 'div.notion-code-block',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
            language: dom.getAttribute('data-language') || 'text',
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: 'notion-block notion-code-block',
          'data-block-id': node.attrs.id,
          'data-block-type': 'code_block',
          'data-language': node.attrs.language,
        },
        ['div', { class: 'notion-code-block-content' }, 0],
      ];
    },
    code: true,
  },

  // Quote block
  quote: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: {
      id: { default: null },
    },
    parseDOM: [
      {
        tag: 'div.notion-quote',
        getAttrs(dom: HTMLElement) {
          return {
            id: dom.getAttribute('data-block-id') || null,
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'div',
        {
          class: 'notion-block notion-quote',
          'data-block-id': node.attrs.id,
          'data-block-type': 'quote',
        },
        0,
      ];
    },
  },

  // Hard break (shift+enter)
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    },
  },
};

// MARK SPECIFICATIONS
const marks: { [key: string]: MarkSpec } = {
  // Bold text
  bold: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b' },
      { style: 'font-weight', getAttrs: (value) => /^(bold|700|800|900)$/.test(value as string) && null },
    ],
    toDOM() {
      return ['span', { class: 'notion-bold', style: 'font-weight: bold' }, 0];
    },
  },

  // Italic text
  italic: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return ['span', { class: 'notion-italic', style: 'font-style: italic' }, 0];
    },
  },

  // Underlined text
  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
    toDOM() {
      return ['span', { class: 'notion-underline', style: 'text-decoration: underline' }, 0];
    },
  },

  // Strikethrough text
  strike: {
    parseDOM: [{ tag: 's' }, { tag: 'strike' }, { style: 'text-decoration=line-through' }],
    toDOM() {
      return ['span', { class: 'notion-strike', style: 'text-decoration: line-through' }, 0];
    },
  },

  // Inline code
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return [
        'span',
        {
          class: 'notion-code',
          style:
            'font-family: monospace; background-color: rgba(135,131,120,0.15); padding: 2px 4px; border-radius: 3px;',
        },
        0,
      ];
    },
  },

  // Link
  link: {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom: HTMLElement) {
          return {
            href: dom.getAttribute('href'),
            title: dom.getAttribute('title'),
          };
        },
      },
    ],
    toDOM(node) {
      return [
        'a',
        {
          class: 'notion-link',
          href: node.attrs.href,
          title: node.attrs.title,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        0,
      ];
    },
  },

  // Text color
  textColor: {
    attrs: { color: {} },
    parseDOM: [
      {
        style: 'color',
        getAttrs: (color) => ({ color }),
      },
    ],
    toDOM(node) {
      return ['span', { class: 'notion-text-color', style: `color: ${node.attrs.color}` }, 0];
    },
  },

  // Background color/highlight
  highlight: {
    attrs: { color: {} },
    parseDOM: [
      {
        style: 'background-color',
        getAttrs: (color) => ({ color }),
      },
    ],
    toDOM(node) {
      return ['span', { class: 'notion-highlight', style: `background-color: ${node.attrs.color}` }, 0];
    },
  },
};

// Create and export the schema
export const customSchema = new Schema({
  nodes,
  marks,
});

// Helper function to generate a unique block ID
export const generateBlockId = () => `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Helper function to create an empty block
export const createEmptyBlock = (type = 'block', attrs = {}) => {
  const node = customSchema.nodes[type].create({
    id: generateBlockId(),
    ...attrs,
  });
  return node;
};
