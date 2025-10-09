import { CircleButton, Column } from '@we/components/solid';
import { Accessor, JSX } from 'solid-js';

type Button = {
  name: string;
  icon?: string;
  image?: string;
  onClick: () => void;
};

export interface NarrowSidebarWidgetProps {
  topButtons?: Accessor<Button[]>;
  bottomButtons?: Accessor<Button[]>;
  class?: string;
  style?: JSX.CSSProperties;
}

export function NarrowSidebarWidget(props: NarrowSidebarWidgetProps) {
  return (
    <Column
      class={`we-narrow-sidebar-widget ${props.class || ''}`}
      style={props.style}
      ax="center"
      ay="between"
      bg="ui-0"
      gap="300"
      py="500"
      data-we-sidebar
    >
      {props.topButtons && (
        <Column gap="400">
          {props.topButtons().map((button) => (
            <CircleButton name={button.name} image={button.image} icon={button.icon} onClick={button.onClick} />
          ))}
        </Column>
      )}

      {props.bottomButtons && (
        <Column gap="400">
          {props.bottomButtons().map((button) => (
            <CircleButton name={button.name} image={button.image} icon={button.icon} onClick={button.onClick} />
          ))}
        </Column>
      )}
    </Column>
  );
}
