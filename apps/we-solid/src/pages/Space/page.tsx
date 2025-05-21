import PostBuilder from '@/components/PostBuilder';
import { useSpaceContext } from '@/contexts/SpaceContext';
import InnerSidebar from '@/templates/Default/components/InnerSidebar';
import { useLocation } from '@solidjs/router';
import { createEffect, createSignal } from 'solid-js';

export default function SpacePage() {
  const { loading, spacePerspective, setSpaceId, spacePosts, getSpacePosts } = useSpaceContext();
  const [newPost, setNewPost] = createSignal(false);
  const location = useLocation();

  // Update the spaceId in the space context when the route changes
  createEffect(() => {
    const newSpaceId = location.pathname.split('/')[2];
    setSpaceId(newSpaceId);
  });

  // Fetch space posts when loading or spacePerspective changes
  createEffect(() => {
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
