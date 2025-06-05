import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import Space from '@/models/Space';
import { PerspectiveProxy } from '@coasys/ad4m';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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

const context = createContext<ISpaceContext>(defaultSpaceContext);

// todo: trigger all chaining of updates from url spaceId but use loading state to prevent multiple calls

const SpaceContext = ({ children }: { children: ReactNode }) => {
  const { ad4mClient } = useAdamContext();
  const [loading, setLoading] = useState(defaultSpaceContext.loading);
  const [spaceId, setSpaceId] = useState(defaultSpaceContext.spaceId);
  const [spacePerspective, setSpacePerspective] = useState(defaultSpaceContext.spacePerspective);
  const [spaceData, setSpaceData] = useState(defaultSpaceContext.spaceData);
  const [spacePosts, setSpacePosts] = useState(defaultSpaceContext.spacePosts);

  async function getSpaceData(): Promise<void> {
    try {
      console.log('spaceId', spaceId);
      const perspective = await ad4mClient!.perspective.byUUID(spaceId);
      const [space] = await Space.findAll(perspective!);
      console.log('set new perspective');
      setSpacePerspective(perspective);
      setSpaceData(space);
    } catch (error) {
      console.error('SpaceContext: getMyAgentData error', error);
    }
  }

  async function getData(): Promise<void> {
    await Promise.all([getSpaceData()]);
    setLoading(false);
  }

  async function getBlockTree(parent: any): Promise<BlockType | undefined> {
    // Recursive function that traverses the block tree and fetches each blocks data
    try {
      if (!spacePerspective) throw new Error('getBlockTree: spacePerspective is not set');

      // Get the block type
      const modelMap = { collection: CollectionBlock, image: ImageBlock, text: TextBlock };
      const model = modelMap[parent.type as 'collection' | 'image' | 'text'];
      if (!model) throw new Error(`No model found for block type: ${parent.type}`);

      // Get the block
      const [block] = await (model as any).findAll(spacePerspective, { source: parent.baseExpression });

      // Get child blocks if present
      const children = await Block.findAll(spacePerspective, { source: parent.baseExpression });
      const childrenWithBlocks = await Promise.all(children.map((child) => getBlockTree(child)));

      // Return the block with its children
      return { ...block, children: childrenWithBlocks };
    } catch (error) {
      console.error('SpacePage: getBlockTree error', error);
    }
  }

  async function getSpacePosts(spacePerspective: PerspectiveProxy): Promise<void> {
    try {
      // if (!spacePerspective) throw new Error('spacePerspective is not set');

      const posts = await Block.findAll(spacePerspective, { where: { type: 'collection' } });
      const postsWithBlocks = await Promise.all(posts.map((post) => getBlockTree(post)));
      console.log('getSpacePosts', postsWithBlocks);
      setSpacePosts(postsWithBlocks);
    } catch (error) {
      console.error('SpacePage: getPosts error', error);
    }
  }

  useEffect(() => {
    console.log('SpaceContext mounted');
  }, []);

  // Update the space ID when the pathname changes
  // useEffect(() => {
  //   const [page, id] = pathname.split('/').filter(Boolean);
  //   if (page === 'space') {
  //     setLoading(true);
  //     setSpaceId(id);
  //   }
  // }, [pathname]);

  // Fetch data when the component ad4mClient is present and spaceId is set
  useEffect(() => {
    if (ad4mClient && spaceId) getData();
  }, [ad4mClient, spaceId]);

  return (
    <context.Provider value={{ loading, spaceId, spacePerspective, spaceData, spacePosts, getSpacePosts }}>
      {children}
    </context.Provider>
  );
};

export const useSpaceContext = () => useContext(context);

export default SpaceContext;
