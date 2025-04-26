import { Ad4mModel, Collection, Flag, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'Block' })
export default class Block extends Ad4mModel {
  @Property({ through: 'we://block_type', resolveLanguage: 'literal', writable: true })
  type: string = '';

  @Collection({ through: 'we://has_comments' })
  comments: string[] = [];

  @Collection({ through: 'we://has_reactions' })
  reactions: string[] = [];
}

// we://has_child
// we://has_descendant (for node tree only needs to connect root to all descendants, for holonic map needs to be used at every level?)
// we://next_sibling

// 1. use has_descendant to grab all nodes (and attached next_sibling links) in a single prolog query
// 2. construct the tree & ordering in the frontend

// if speed of query is not an issue and storage space is tight, don't add has_descendant links to every node, instead retrieve data with recursive query
