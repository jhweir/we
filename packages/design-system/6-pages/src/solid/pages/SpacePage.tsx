import '@we/block-composer-solid/styles';

import { PerspectiveProxy } from '@coasys/ad4m';
import { BlockComposer } from '@we/block-composer-solid';
import { Column, Row } from '@we/components/solid';
import type { Space } from '@we/models';
// import { WideSidebarWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

export interface SpacePageProps {
  // Slots
  sidebar?: JSX.Element;
  // Router outlet for sub-pages
  children?: JSX.Element;
  // Styling
  class?: string;
  style?: JSX.CSSProperties;
}

export function SpacePage(props: SpacePageProps) {
  const baseClass = 'we-space-page';

  return (
    <Row class={`${baseClass} ${props.class || ''}`} style={{ ...props.style }} data-we-page>
      {/* Sidebar */}
      {props.sidebar && <aside class={`${baseClass}-sidebar`}>{props.sidebar}</aside>}

      {/* Content */}
      <main class={`${baseClass}-content`}>{props.children}</main>

      {/* <WideSidebarWidget name={props.space.name} description={props.space.description} /> */}
      {/* <Column style={{ 'margin-left': '400px' }}>
        <BlockComposer perspective={props.perspective} post={props.posts![props.posts!.length - 1]} />
      </Column> */}
    </Row>
  );
}
