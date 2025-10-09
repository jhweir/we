import '@we/block-composer-solid/styles';

import { PerspectiveProxy } from '@coasys/ad4m';
import { BlockComposer } from '@we/block-composer-solid';
import { Column } from '@we/components/solid';
import type { Space } from '@we/models';
// import { WideSidebarWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

export interface SpacePageProps {
  perspective: PerspectiveProxy;
  space: Partial<Space> & { name: Space['name'] };
  spacePosts?: any[];
  class?: string;
  style?: JSX.CSSProperties;
}

export function SpacePage(props: SpacePageProps) {
  return (
    <Column class={`we-space-page ${props.class || ''}`} style={{ ...props.style }} data-we-page>
      {/* <WideSidebarWidget name={props.space.name} description={props.space.description} /> */}
      <Column style={{ 'margin-left': '400px' }}>
        <BlockComposer perspective={props.perspective} post={props.spacePosts![props.spacePosts!.length - 1]} />
      </Column>
    </Column>
  );
}
