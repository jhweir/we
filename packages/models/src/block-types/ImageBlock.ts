import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'ImageBlock' })
export class ImageBlock extends Ad4mModel {
  @Property({ through: 'we://image_block_node_type', resolveLanguage: 'literal', writable: true })
  type: string = '';

  @Property({ through: 'we://image_block_src', resolveLanguage: 'literal', writable: true })
  src: string = '';

  @Property({ through: 'we://image_block_alt_text', resolveLanguage: 'literal', writable: true })
  altText: string = '';

  @Property({ through: 'we://image_block_width', resolveLanguage: 'literal', writable: true })
  width: number = 0;

  @Property({ through: 'we://image_block_height', resolveLanguage: 'literal', writable: true })
  height: number = 0;

  @Property({ through: 'we://image_block_version', resolveLanguage: 'literal', writable: true })
  version: number = 0;
}
