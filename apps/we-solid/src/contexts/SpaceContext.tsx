import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import Space from '@/models/Space';
import { PerspectiveProxy } from '@coasys/ad4m';
// import { useLocation } from '@solidjs/router';
import { Accessor, createContext, createEffect, createSignal, ParentProps, Setter, useContext } from 'solid-js';
import { useAdamContext } from './AdamContext';

export interface ISpaceContext {
  loading: Accessor<boolean>;
  spaceId: Accessor<string>;
  spacePerspective: Accessor<PerspectiveProxy | null>;
  spaceData: Accessor<Partial<Space>>;
  spacePosts: Accessor<any[]>;
  getSpacePosts: (spacePerspective: PerspectiveProxy) => Promise<void>;
  setSpaceId: Setter<string>;
}

const defaultSpaceData: Partial<Space> = {
  author: '',
  timestamp: '',
  name: '',
  description: '',
  uuid: '',
  visibility: '',
  locations: [],
};

const defaults: ISpaceContext = {
  loading: () => true,
  spaceId: () => '',
  setSpaceId: () => null,
  spacePerspective: () => null,
  spaceData: () => defaultSpaceData,
  spacePosts: () => [],
  getSpacePosts: async () => {},
};

type BlockType = ImageBlock | TextBlock | CollectionBlock;

// Create the context
const SpaceContext = createContext<ISpaceContext>(defaults);

// Create the provider component
export function SpaceProvider(props: ParentProps) {
  const { ad4mClient } = useAdamContext();
  // const location = useLocation();

  // Signals for managing state
  const [loading, setLoading] = createSignal<boolean>(defaults.loading());
  const [spaceId, setSpaceId] = createSignal<string>(defaults.spaceId());
  const [spacePerspective, setSpacePerspective] = createSignal<PerspectiveProxy | null>(defaults.spacePerspective());
  const [spaceData, setSpaceData] = createSignal<Partial<Space>>(defaults.spaceData());
  const [spacePosts, setSpacePosts] = createSignal<any[]>(defaults.spacePosts());

  // Fetch space data
  async function getSpaceData(): Promise<void> {
    console.log('*** getSpaceData: ', spaceId());
    try {
      console.log('spaceId', spaceId());
      const perspective = await ad4mClient()!.perspective.byUUID(spaceId());
      const [space] = await Space.findAll(perspective!);
      setSpacePerspective(perspective);
      setSpaceData(space);
      console.log('New space', space);
    } catch (error) {
      console.error('SpaceContext: getSpaceData error', error);
    }
  }

  // Fetch all necessary data
  async function getData(): Promise<void> {
    await Promise.all([getSpaceData()]);
    setLoading(false);
  }

  // Recursive function to fetch block tree data
  async function getBlockTree(parent: any): Promise<BlockType | undefined> {
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

  // Fetch space posts
  async function getSpacePosts(perspectiveParam: PerspectiveProxy): Promise<void> {
    try {
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

  // Fetch data when the ad4mClient is present and spaceId is set
  createEffect(() => {
    if (ad4mClient() && spaceId()) getData();
  });

  // createEffect(() => {
  //   console.log('new location: ', location.pathname);
  // });

  // Create context value - access all signals to get current values
  const contextValue: ISpaceContext = {
    loading,
    spaceId,
    setSpaceId,
    spacePerspective,
    spaceData,
    spacePosts,
    getSpacePosts,
  };

  return <SpaceContext.Provider value={contextValue}>{props.children}</SpaceContext.Provider>;
}

// Custom hook for using the context
export function useSpaceContext(): ISpaceContext {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpaceContext must be used within a SpaceProvider');
  }
  return context;
}

export default SpaceProvider;
