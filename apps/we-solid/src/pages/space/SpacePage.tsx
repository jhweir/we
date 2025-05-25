import PostBuilder from '@/components/PostBuilder';
import { useSpaceStore } from '@/stores/SpaceStore';
import InnerSidebar from '@/templates/Default/components/InnerSidebar/InnerSidebar';
import { useLocation } from '@solidjs/router';
import { createEffect, createSignal } from 'solid-js';

export default function SpacePage() {
  const { state, actions } = useSpaceStore();
  const { setSpaceId, getPosts } = actions;
  const [newPost, setNewPost] = createSignal(false);
  const location = useLocation();

  // Update the spaceId in the space context when the route changes
  createEffect(() => {
    const newSpaceId = location.pathname.split('/')[2];
    if (newSpaceId && newSpaceId !== state.spaceId) setSpaceId(newSpaceId);
  });

  // Fetch space posts when loading or spacePerspective changes
  createEffect(() => {
    if (!state.loading && state.perspective) getPosts(state.perspective);
  });

  return (
    <we-row>
      <InnerSidebar />

      <we-column ax="center" bg="ui-50" p="800" style={{ width: '100%', height: '100vh', margin: '0 0 0 400px' }}>
        <we-button onClick={() => setNewPost(true)}>New block</we-button>
        {newPost() && <PostBuilder />}
        {state.posts.length > 0 && <PostBuilder post={state.posts[0]} />}
      </we-column>
    </we-row>
  );
}
