import { JSX } from 'solid-js';

export interface CircleButtonProps {
  name: string;
  icon?: string;
  image?: string;
  onClick?: () => void;
  class?: string;
  style?: JSX.CSSProperties;
}

export function CircleButton(props: CircleButtonProps) {
  return (
    <we-button slot="trigger" circle variant="ghost" onClick={props.onClick} class={props.class} style={props.style}>
      <we-tooltip placement="right" title={props.name}>
        {props.image ? (
          <we-avatar image={props.image} />
        ) : props.icon ? (
          <we-icon name={props.icon} color="ui-700" />
        ) : (
          <we-avatar initials={props.name} />
        )}
      </we-tooltip>
    </we-button>
  );
}
