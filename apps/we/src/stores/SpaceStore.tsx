import { PerspectiveProxy } from '@coasys/ad4m';
import { Block, CollectionBlock, ImageBlock, Space, TextBlock } from '@we/models';
import { createContext, createEffect, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

import { useAdamStore } from './AdamStore';

// TODO: pass spaceId to getSpace function and dont store spaceId seperately in the store

type BlockType = ImageBlock | TextBlock | CollectionBlock;

export interface SpaceStore {
  state: {
    spaceId: string;
    perspective: PerspectiveProxy | null;
    space: Partial<Space>;
    posts: any[];
    loading: boolean;
    // loadingStates: { space: false, posts: false },
  };
  actions: {
    setSpaceId: (id: string) => void;
    getSpace: () => Promise<void>;
    getPosts: (perspective: PerspectiveProxy) => Promise<void>;
  };
}

const defaultSpace: Partial<Space> = {
  author: '',
  timestamp: '',
  name: '',
  description: '',
  uuid: '',
  visibility: '',
  locations: [],
};

const defaultStore: SpaceStore['state'] = {
  loading: true,
  spaceId: '',
  perspective: null,
  space: defaultSpace,
  posts: [],
};

const spaceContext = createContext<SpaceStore>();

export function SpaceProvider(props: ParentProps) {
  const adamStore = useAdamStore();
  const [state, setState] = createStore(defaultStore);

  // Setters
  const setSpaceId = (id: string) => setState('spaceId', id);

  // Getters
  async function getSpace(): Promise<void> {
    console.log('*** getSpace: ', state.spaceId);
    try {
      console.log('spaceId', state.spaceId);
      const perspective = await adamStore.ad4mClient()!.perspective.byUUID(state.spaceId);
      const [space] = await Space.findAll(perspective!);
      setState('perspective', perspective);
      setState('space', space);
      console.log('New space', space);
    } catch (error) {
      console.error('SpaceContext: getSpace error', error);
    }
  }

  async function getPosts(perspective: PerspectiveProxy): Promise<void> {
    try {
      const posts = await Block.findAll(perspective, { where: { type: 'collection' } });
      const postsWithBlocks = await Promise.all(posts.map((post) => getBlockTree(post)));
      console.log('getPosts', postsWithBlocks);
      setState('posts', postsWithBlocks);
    } catch (error) {
      console.error('SpacePage: getPosts error', error);
    }
  }

  // Helpers
  async function getBlockTree(parent: any): Promise<BlockType | undefined> {
    // Recursive function to fetch block tree data
    try {
      if (!state.perspective) throw new Error('getBlockTree: perspective is not set');

      // Get the block type
      const modelMap = { collection: CollectionBlock, image: ImageBlock, text: TextBlock };
      const model = modelMap[parent.type as 'collection' | 'image' | 'text'];
      if (!model) throw new Error(`No model found for block type: ${parent.type}`);

      // Get the block
      const [block] = await (model as any).findAll(state.perspective, { source: parent.baseExpression });

      // Get child blocks if present
      const children = await Block.findAll(state.perspective, { source: parent.baseExpression });
      const childrenWithBlocks = await Promise.all(children.map((child) => getBlockTree(child)));

      // Return the block with its children
      return { ...block, children: childrenWithBlocks };
    } catch (error) {
      console.error('SpacePage: getBlockTree error', error);
    }
  }

  // Get space data when spaceId changes
  createEffect(() => {
    if (adamStore.ad4mClient() && state.spaceId) getSpace();
  });

  return (
    <spaceContext.Provider value={{ state, actions: { setSpaceId, getSpace, getPosts } }}>
      {props.children}
    </spaceContext.Provider>
  );
}

// Custom hook for using the context
export function useSpaceStore(): SpaceStore {
  const context = useContext(spaceContext);
  if (!context) throw new Error('useSpaceStore must be used within a SpaceProvider');
  return context;
}

export default SpaceProvider;
