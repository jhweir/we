import PostBuilder from '@/components/PostBuilder';
import { useAdamContext } from '@/contexts/AdamContext';
import { useSpaceContext } from '@/contexts/SpaceContext';
import InnerSidebar from '@/templates/Default/components/InnerSidebar';
import { createEffect, createSignal } from 'solid-js';

export default function SpacePage() {
  const { ad4mClient } = useAdamContext();
  const { loading, spacePerspective, spaceId, spacePosts, getSpacePosts } = useSpaceContext();
  const [newPost, setNewPost] = createSignal(false);

  // Log when the component is mounted
  createEffect(() => {
    console.log('*** mounted');
  });

  // Fetch space posts when loading or spacePerspective changes
  createEffect(() => {
    console.log('** createEffect spacePerspective', loading());
    if (!loading() && spacePerspective()) {
      getSpacePosts(spacePerspective()!);
    }
  }, [loading, spacePerspective]);

  return (
    <we-row>
      <InnerSidebar />

      <we-column ax="center" bg="ui-50" p="800" style={{ width: '100%', height: '100vh', margin: '0 0 0 400px' }}>
        <we-button onClick={() => setNewPost(true)}>New block</we-button>
        {newPost() && <PostBuilder />}
        {spacePosts.length > 0 && <PostBuilder post={spacePosts()[0]} />}
      </we-column>
    </we-row>
  );
}

// import PostBuilder from '@/components/PostBuilder';
// import { useAdamContext } from '@/contexts/AdamContext';
// import { useSpaceContext } from '@/contexts/SpaceContext';
// import InnerSidebar from '@/templates/Default/components/InnerSidebar';
// import { useEffect, useState } from 'react';

// export default function SpacePage() {
//   const { ad4mClient } = useAdamContext();
//   const { loading, spacePerspective, spaceId, spacePosts, getSpacePosts } = useSpaceContext();
//   const [newPost, setNewPost] = useState(false);

//   useEffect(() => {
//     console.log('*** mounted');
//   }, []);

//   useEffect(() => {
//     console.log('** useEffect spacePerspective', loading);
//     if (!loading && spacePerspective) getSpacePosts(spacePerspective);
//   }, [loading]);

//   return (
//     <we-row>
//       <InnerSidebar />

//       <we-column ax="center" bg="ui-50" style={{ width: '100%', height: '100vh' }}>
//         <we-button onClick={() => setNewPost(true)}>New block</we-button>
//         {newPost && <PostBuilder />}
//         {spacePosts.length > 0 && <PostBuilder post={spacePosts[0]} />}
//       </we-column>
//     </we-row>
//   );
// }
