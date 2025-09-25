import { Column } from '@we/components/solid';
import type { Space } from '@we/models';
import { WideSidebarWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

export interface SpacePageProps {
  space: Partial<Space> & { name: Space['name'] };
  class?: string;
  style?: JSX.CSSProperties;
}

export function SpacePage(props: SpacePageProps) {
  return (
    <Column class={`we-space-page ${props.class || ''}`} style={{ ...props.style }} data-we-page>
      <WideSidebarWidget name={props.space.name} description={props.space.description} />
    </Column>
  );
}
