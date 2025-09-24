import { Column, PostCard } from '@we/components/solid';
import { JSX } from 'solid-js';

type Post = {
  creator: { name: string; avatarUrl: string };
  title: string;
  content: string;
};

export interface PostPageProps {
  posts: Post[];
  class?: string;
  style?: JSX.CSSProperties;
}

export function PostPage(props: PostPageProps) {
  return (
    <Column class={`we-post-page ${props.class || ''}`} style={{ ...props.style }} p="1000" data-we-page>
      {props.posts.map((post) => (
        <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
      ))}
    </Column>
  );
}
