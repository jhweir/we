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
  styles?: JSX.CSSProperties;
}

export function PostPage(props: PostPageProps) {
  return (
    <Column class={`we-post-page ${props.class || ''}`} styles={props.styles} p="1000" data-we-page>
      {props.posts.map((post) => (
        <PostCard creator={post.creator} title={post.title} content={post.content} styles={{ margin: '20px 0' }} />
      ))}
    </Column>
  );
}
