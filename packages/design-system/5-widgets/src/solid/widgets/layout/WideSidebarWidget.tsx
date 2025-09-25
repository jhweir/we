import { Column, Row } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface WideSidebarWidgetProps {
  name: string;
  description?: string;
  image?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

export function WideSidebarWidget(props: WideSidebarWidgetProps) {
  return (
    <Column class={`we-wide-sidebar-widget ${props.class || ''}`} bg="ui-25" data-we-sidebar>
      <div style={{ height: '200px', background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)' }} />
      <Column gap="400">
        <Row gap="300" ay="center">
          <we-avatar size="xxl" image={props.image} />
          <we-text size="800" weight="500" nomargin>
            {props.name}
          </we-text>
        </Row>

        <we-text>{props.description}</we-text>
      </Column>
    </Column>
  );
}
