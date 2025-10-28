import { JSX } from 'solid-js';

export interface IconLabelButtonProps {
  icon: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  class?: string;
  style?: JSX.CSSProperties;
}

export function IconLabelButton(props: IconLabelButtonProps) {
  return (
    <we-button
      class={`we-icon-label-button ${props.class || ''}`}
      style={props.style}
      onClick={props.onClick}
      slot="trigger"
      variant="ghost"
      data-we-button
    >
      <we-icon name={props.icon} color="ui-700" weight={props.selected ? 'fill' : 'regular'} />
      <we-text size="600" color="ui-700" nomargin>
        {props.label}
      </we-text>
    </we-button>
  );
}
