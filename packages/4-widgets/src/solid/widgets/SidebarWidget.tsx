import { CircleButton, Column } from '@we/components/solid';
import { JSX } from 'solid-js';

export type SidebarWidgetButton = {
  name: string;
  icon?: string;
  image?: string;
  onClick: () => void;
};

export interface SidebarWidgetProps {
  width: number;
  topButtons?: SidebarWidgetButton[];
  bottomButtons?: SidebarWidgetButton[];
  class?: string;
  style?: JSX.CSSProperties;
}

export function SidebarWidget(props: SidebarWidgetProps) {
  return (
    <Column
      class={`we-sidebar-widget ${props.class || ''}`}
      style={{ width: `${props.width}px`, ...props.style }}
      ax="center"
      ay="between"
      bg="ui-0"
      gap="300"
      py="500"
      data-we-sidebar
    >
      {props.topButtons && (
        <Column gap="400">
          {props.topButtons.map((button) => (
            <CircleButton name={button.name} image={button.image} icon={button.icon} onClick={button.onClick} />
          ))}
        </Column>
      )}

      {props.bottomButtons && (
        <Column gap="400">
          {props.bottomButtons.map((button) => (
            <CircleButton name={button.name} image={button.image} icon={button.icon} onClick={button.onClick} />
          ))}
        </Column>
      )}
    </Column>
  );
}
