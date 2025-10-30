import { JSX } from 'solid-js';

import { Column, Row } from '../../index';

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
    <Column
      class={`we-post-card ${props.class || ''}`}
      style={props.style}
      bg="ui-100"
      gap="300"
      p="400"
      r="md"
      data-we-card
    >
      <Row ay="center" gap="300">
        <we-avatar image={props.creator.avatarUrl} size="md" />
        <we-text size="600">{props.creator.name}</we-text>
      </Row>
      <Column gap="100">
        <we-text tag="h3" size="600" weight="600">
          {props.title}
        </we-text>
        <we-text tag="p" size="400">
          {props.content}
        </we-text>
      </Column>
    </Column>
  );
}
