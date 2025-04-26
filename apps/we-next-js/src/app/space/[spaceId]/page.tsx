'use client';

import PostBuilder from '@/components/PostBuilder/Lexical2';
import { useAdamContext } from '@/contexts/AdamContext';
import { useSpaceContext } from '@/contexts/SpaceContext';
import Block from '@/models/Block';
import CollectionBlock from '@/models/block-types/CollectionBlock';
import ImageBlock from '@/models/block-types/ImageBlock';
import TextBlock from '@/models/block-types/TextBlock';
import InnerSidebar from '@/templates/Default/components/InnerSidebar';
import { PerspectiveProxy } from '@coasys/ad4m';
import { use, useEffect, useState } from 'react';

export default function SpacePage() {
  const { ad4mClient } = useAdamContext();
  const { loading, spacePerspective, spacePosts, getSpacePosts } = useSpaceContext();
  const [newPost, setNewPost] = useState(false);

  useEffect(() => {
    console.log('*** mounted')
  }, [])

  useEffect(() => {
    console.log('** useEffect spacePerspective', loading);
    if (!loading && spacePerspective) getSpacePosts(spacePerspective);
  }, [loading]);

  return (
    <we-row>
      <InnerSidebar />

      <we-column alignX="center" bg="ui-50" style={{ width: '100%', height: '100vh' }}>
        <we-button onClick={() => setNewPost(true)}>New block</we-button>
        {newPost && <PostBuilder />}
        {spacePosts.length > 0 && <PostBuilder post={spacePosts[0]} />}
      </we-column>
    </we-row>
  );
}
