import { Column } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface SidebarProps {
  width: number;
  class?: string;
  style?: JSX.CSSProperties;
  children: JSX.Element | JSX.Element[];
}

export function Sidebar(props: SidebarProps) {
  return (
    <Column
      class={`we-sidebar ${props.class || ''}`}
      style={{ width: `${props.width}px`, ...props.style }}
      bg="ui-0"
      gap="300"
      data-we-sidebar
    >
      {props.children}
    </Column>
  );
}
