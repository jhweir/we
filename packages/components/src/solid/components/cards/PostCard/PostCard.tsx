import { JSX } from 'solid-js';

import { Column, Row } from '../../../index';

export interface PostCardProps {
  creator: {
    name: string;
    avatarUrl: string;
  };
  title: string;
  content: string;
  class?: string;
  style?: JSX.CSSProperties;
}

export function PostCard(props: PostCardProps) {
  return (
    <Column p="400" class={`we-post-card ${props.class || ''}`} style={props.style} data-we-card>
      <Row>
        <we-avatar image={props.creator.avatarUrl} size="md" />
      </Row>
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--we-space-200)' }}>
        <we-avatar image={props.user.avatarUrl} size="md" />
        <we-text tag="b" size="lg">
          {props.user.name}
        </we-text>
      </div>
      <we-text tag="h3" size="xl" style={{ margin: 'var(--we-space-200) 0 var(--we-space-100) 0' }}>
        {props.title}
      </we-text>
      <we-text tag="p" size="md">
        {props.content}
      </we-text> */}
    </Column>
  );
}
