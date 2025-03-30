import PostBuilder from '@/components/PostBuilder/Lexical2';

export default function New() {
  return (
    <we-column p="500" style={{ height: '100%' }}>
      New Post
      <we-row alignX="center" mt="400" style={{ height: '100%' }}>
        <PostBuilder />
      </we-row>
    </we-column>
  );
}
