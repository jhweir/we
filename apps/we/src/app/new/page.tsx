import PostBuilder from '@/components/PostBuilder/Lexical3';

export default function New() {
  return (
    <we-column p="500" style={{ height: '100%' }}>
      New Post
      <we-row alignX="center" style={{ height: '100%' }}>
        <PostBuilder />
      </we-row>
    </we-column>
  );
}
