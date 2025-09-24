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
  const posts = [
    {
      creator: { name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
      title: 'Hello World',
      content: 'This is my first post!',
    },
    {
      creator: { name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
      title: 'SolidJS is Awesome',
      content: 'Just started learning SolidJS, and I love it!',
    },
  ];

  return (
    <Column class={`we-post-page ${props.class || ''}`} style={{ ...props.style }} p="1000" data-we-page>
      {posts.map((post) => (
        <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
      ))}
      {props.posts.map((post) => (
        <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
      ))}
    </Column>
  );
}
