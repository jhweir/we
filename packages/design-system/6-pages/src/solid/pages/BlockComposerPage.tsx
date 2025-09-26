import { PerspectiveProxy } from '@coasys/ad4m';
import { PostBuilder } from '@we/block-composer-solid';
import { Column } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface BlockComposerPageProps {
  perspective: PerspectiveProxy;
  class?: string;
  style?: JSX.CSSProperties;
}

export function BlockComposerPage(props: BlockComposerPageProps) {
  return (
    <Column
      class={`we-block-composer-page ${props.class || ''}`}
      style={{ ...props.style }}
      ax="center"
      bg="ui-0"
      p="500"
      data-we-page
    >
      <we-text size="600">Block composer!!!</we-text>
      <PostBuilder perspective={props.perspective} />
    </Column>
  );
}
