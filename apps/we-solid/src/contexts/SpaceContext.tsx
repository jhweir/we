import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import Space from '@/models/Space';
import { PerspectiveProxy } from '@coasys/ad4m';
import { createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';
import { useAdamContext } from './AdamContext';

export interface ISpaceContext {
  loading: boolean;
  spaceId: string;
  spacePerspective: PerspectiveProxy | null;
  spaceData: Space;
  spacePosts: any[];
  getSpacePosts: (spacePerspective: PerspectiveProxy) => Promise<void>;
}

const defaultSpaceContext: ISpaceContext = {
  loading: true,
  spaceId: '',
  spacePerspective: null,
  spaceData: { author: '', timestamp: '', name: '', description: '', uuid: '', visibility: '', locations: [] } as any,
  spacePosts: [],
  getSpacePosts: async () => {},
};

type BlockType = ImageBlock | TextBlock | CollectionBlock;

// Create the context
const SpaceContext = createContext<ISpaceContext>(defaultSpaceContext);

// Create the provider component
export function SpaceProvider(props: ParentProps) {
  const { ad4mClient } = useAdamContext();
  const [loading, setLoading] = createSignal(defaultSpaceContext.loading);
  const [spaceId, setSpaceId] = createSignal(defaultSpaceContext.spaceId);
  const [spacePerspective, setSpacePerspective] = createSignal(defaultSpaceContext.spacePerspective);
  const [spaceData, setSpaceData] = createSignal(defaultSpaceContext.spaceData);
  const [spacePosts, setSpacePosts] = createSignal(defaultSpaceContext.spacePosts);

  async function getSpaceData(): Promise<void> {
    try {
      console.log('spaceId', spaceId());
      const perspective = await ad4mClient!.perspective.byUUID(spaceId());
      const [space] = await Space.findAll(perspective!);
      console.log('set new perspective');
      setSpacePerspective(perspective);
      setSpaceData(space);
    } catch (error) {
      console.error('SpaceContext: getSpaceData error', error);
    }
  }

  async function getData(): Promise<void> {
    await Promise.all([getSpaceData()]);
    setLoading(false);
  }

  async function getBlockTree(parent: any): Promise<BlockType | undefined> {
    // Recursive function that traverses the block tree and fetches each blocks data
    try {
      const currentSpacePerspective = spacePerspective();
      if (!currentSpacePerspective) throw new Error('getBlockTree: spacePerspective is not set');

      // Get the block type
      const modelMap = { collection: CollectionBlock, image: ImageBlock, text: TextBlock };
      const model = modelMap[parent.type as 'collection' | 'image' | 'text'];
      if (!model) throw new Error(`No model found for block type: ${parent.type}`);

      // Get the block
      const [block] = await (model as any).findAll(currentSpacePerspective, { source: parent.baseExpression });

      // Get child blocks if present
      const children = await Block.findAll(currentSpacePerspective, { source: parent.baseExpression });
      const childrenWithBlocks = await Promise.all(children.map((child) => getBlockTree(child)));

      // Return the block with its children
      return { ...block, children: childrenWithBlocks };
    } catch (error) {
      console.error('SpacePage: getBlockTree error', error);
    }
  }

  async function getSpacePosts(perspectiveParam: PerspectiveProxy): Promise<void> {
    try {
      // Use the provided perspective parameter
      // if (!perspectiveParam) throw new Error('spacePerspective is not set');

      const posts = await Block.findAll(perspectiveParam, { where: { type: 'collection' } });
      const postsWithBlocks = await Promise.all(posts.map((post) => getBlockTree(post)));
      console.log('getSpacePosts', postsWithBlocks);
      setSpacePosts(postsWithBlocks);
    } catch (error) {
      console.error('SpacePage: getPosts error', error);
    }
  }

  // OnMount effect
  createEffect(() => {
    console.log('SpaceContext mounted');
  });

  // Fetch data when the component ad4mClient is present and spaceId is set
  createEffect(() => {
    if (ad4mClient && spaceId()) {
      getData();
    }
  });

  // Create context value - access all signals to get current values
  const contextValue: ISpaceContext = {
    loading: loading(),
    spaceId: spaceId(),
    spacePerspective: spacePerspective(),
    spaceData: spaceData(),
    spacePosts: spacePosts(),
    getSpacePosts,
  };

  return <SpaceContext.Provider value={contextValue}>{props.children}</SpaceContext.Provider>;
}

// Custom hook for using the context
export function useSpaceContext() {
  return useContext(SpaceContext);
}

export default SpaceProvider;
