import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import Space from '@/models/Space';
import { PerspectiveProxy } from '@coasys/ad4m';
import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';
import { useAdamContext } from './AdamContext';

// Define the context interface
export interface ISpaceContext {
  loading: Accessor<boolean>; // Accessor for loading state
  spaceId: Accessor<string>; // Accessor for space ID
  spacePerspective: Accessor<PerspectiveProxy | null>; // Accessor for the space perspective
  spaceData: Accessor<Space>; // Accessor for space data
  spacePosts: Accessor<any[]>; // Accessor for space posts
  getSpacePosts: (spacePerspective: PerspectiveProxy) => Promise<void>; // Function to fetch space posts
}

// Default values for the context
const defaultSpaceContext: ISpaceContext = {
  loading: () => true,
  spaceId: () => '',
  spacePerspective: () => null,
  spaceData: () =>
    ({
      author: '',
      timestamp: '',
      name: '',
      description: '',
      uuid: '',
      visibility: '',
      locations: [],
    }) as any,
  spacePosts: () => [],
  getSpacePosts: async () => {},
};

type BlockType = ImageBlock | TextBlock | CollectionBlock;

// Create the context
const SpaceContext = createContext<ISpaceContext>(defaultSpaceContext);

// Create the provider component
export function SpaceProvider(props: ParentProps) {
  const { ad4mClient } = useAdamContext();

  // Signals for managing state
  const [loading, setLoading] = createSignal<boolean>(defaultSpaceContext.loading());
  const [spaceId, setSpaceId] = createSignal<string>(defaultSpaceContext.spaceId());
  const [spacePerspective, setSpacePerspective] = createSignal<PerspectiveProxy | null>(
    defaultSpaceContext.spacePerspective(),
  );
  const [spaceData, setSpaceData] = createSignal<Space>(defaultSpaceContext.spaceData());
  const [spacePosts, setSpacePosts] = createSignal<any[]>(defaultSpaceContext.spacePosts());

  // Fetch space data
  async function getSpaceData(): Promise<void> {
    console.log('*** getSpaceData: ', spaceId());
    try {
      console.log('spaceId', spaceId());
      const perspective = await ad4mClient()!.perspective.byUUID(spaceId());
      const [space] = await Space.findAll(perspective!);
      console.log('set new perspective');
      setSpacePerspective(perspective);
      setSpaceData(space);
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
    if (ad4mClient() && spaceId()) {
      getData();
    }
  });

  // Create context value - access all signals to get current values
  const contextValue: ISpaceContext = {
    loading,
    spaceId,
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

// import Block from '@/models/Block';
// import CollectionBlock from '@/models/block-types/CollectionBlock';
// import ImageBlock from '@/models/block-types/ImageBlock';
// import TextBlock from '@/models/block-types/TextBlock';
// import Space from '@/models/Space';
// import { PerspectiveProxy } from '@coasys/ad4m';
// import { createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';
// import { useAdamContext } from './AdamContext';

// export interface ISpaceContext {
//   loading: () => boolean;
//   spaceId: () => string;
//   spacePerspective: () => PerspectiveProxy | null;
//   spaceData: () => Space;
//   spacePosts: () => any[];
//   getSpacePosts: (spacePerspective: PerspectiveProxy) => Promise<void>;
// }

// const defaultSpaceContext: ISpaceContext = {
//   loading: () => true,
//   spaceId: () => '',
//   spacePerspective: () => null,
//   spaceData: () =>
//     ({ author: '', timestamp: '', name: '', description: '', uuid: '', visibility: '', locations: [] }) as any,
//   spacePosts: () => [],
//   getSpacePosts: async () => {},
// };

// type BlockType = ImageBlock | TextBlock | CollectionBlock;

// // Create the context
// const SpaceContext = createContext<ISpaceContext>(defaultSpaceContext);

// // Create the provider component
// export function SpaceProvider(props: ParentProps) {
//   const { ad4mClient } = useAdamContext();
//   const [loading, setLoading] = createSignal(defaultSpaceContext.loading);
//   const [spaceId, setSpaceId] = createSignal(defaultSpaceContext.spaceId);
//   const [spacePerspective, setSpacePerspective] = createSignal(defaultSpaceContext.spacePerspective);
//   const [spaceData, setSpaceData] = createSignal(defaultSpaceContext.spaceData);
//   const [spacePosts, setSpacePosts] = createSignal(defaultSpaceContext.spacePosts);

//   async function getSpaceData(): Promise<void> {
//     try {
//       console.log('spaceId', spaceId());
//       const perspective = await ad4mClient.perspective.byUUID(spaceId());
//       const [space] = await Space.findAll(perspective!);
//       console.log('set new perspective');
//       setSpacePerspective(perspective);
//       setSpaceData(space);
//     } catch (error) {
//       console.error('SpaceContext: getSpaceData error', error);
//     }
//   }

//   async function getData(): Promise<void> {
//     await Promise.all([getSpaceData()]);
//     setLoading(false);
//   }

//   async function getBlockTree(parent: any): Promise<BlockType | undefined> {
//     // Recursive function that traverses the block tree and fetches each blocks data
//     try {
//       const currentSpacePerspective = spacePerspective();
//       if (!currentSpacePerspective) throw new Error('getBlockTree: spacePerspective is not set');

//       // Get the block type
//       const modelMap = { collection: CollectionBlock, image: ImageBlock, text: TextBlock };
//       const model = modelMap[parent.type as 'collection' | 'image' | 'text'];
//       if (!model) throw new Error(`No model found for block type: ${parent.type}`);

//       // Get the block
//       const [block] = await (model as any).findAll(currentSpacePerspective, { source: parent.baseExpression });

//       // Get child blocks if present
//       const children = await Block.findAll(currentSpacePerspective, { source: parent.baseExpression });
//       const childrenWithBlocks = await Promise.all(children.map((child) => getBlockTree(child)));

//       // Return the block with its children
//       return { ...block, children: childrenWithBlocks };
//     } catch (error) {
//       console.error('SpacePage: getBlockTree error', error);
//     }
//   }

//   async function getSpacePosts(perspectiveParam: PerspectiveProxy): Promise<void> {
//     try {
//       // Use the provided perspective parameter
//       // if (!perspectiveParam) throw new Error('spacePerspective is not set');

//       const posts = await Block.findAll(perspectiveParam, { where: { type: 'collection' } });
//       const postsWithBlocks = await Promise.all(posts.map((post) => getBlockTree(post)));
//       console.log('getSpacePosts', postsWithBlocks);
//       setSpacePosts(postsWithBlocks);
//     } catch (error) {
//       console.error('SpacePage: getPosts error', error);
//     }
//   }

//   // OnMount effect
//   createEffect(() => {
//     console.log('SpaceContext mounted');
//   });

//   // Fetch data when the component ad4mClient is present and spaceId is set
//   createEffect(() => {
//     if (ad4mClient() && spaceId()) {
//       getData();
//     }
//   });

//   // Create context value - access all signals to get current values
//   const contextValue: ISpaceContext = {
//     loading,
//     spaceId,
//     spacePerspective,
//     spaceData,
//     spacePosts,
//     getSpacePosts,
//   };

//   return <SpaceContext.Provider value={contextValue}>{props.children}</SpaceContext.Provider>;
// }

// // Custom hook for using the context
// export function useSpaceContext() {
//   return useContext(SpaceContext);
// }

// export default SpaceProvider;
