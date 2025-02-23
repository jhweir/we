import OrderedMap from 'orderedmap';
import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';

// Define the node specifications
const nodes: OrderedMap<NodeSpec> = addListNodes(schema.spec.nodes, 'paragraph block*', 'block')
  .update('image', {
    inline: true,
    attrs: {
      src: { default: '' },
      alt: { default: null },
    },
    group: 'inline',
    draggable: true,
    parseDOM: [{ tag: 'img[src]', getAttrs: (dom: HTMLElement) => ({ src: dom.getAttribute('src') }) }],
    toDOM: (node) => ['img', node.attrs],
  })
  .addToEnd('code_block', {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM: () => ['pre', ['code', 0]],
  });

// Create and export the schema with explicit typing
export const customSchema = new Schema<string, string>({
  nodes,
  marks: schema.spec.marks as OrderedMap<MarkSpec>,
});
