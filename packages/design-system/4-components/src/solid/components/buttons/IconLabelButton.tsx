import { MaybeAccessor, toValue } from '@we/solid-utils';
import { JSX } from 'solid-js';

export interface IconLabelButtonProps {
  icon: MaybeAccessor<string>;
  label: MaybeAccessor<string>;
  selected?: MaybeAccessor<boolean>;
  onClick?: () => void;
  class?: MaybeAccessor<string>;
  style?: MaybeAccessor<JSX.CSSProperties>;
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
      <we-icon name={toValue(props.icon)} color="ui-700" weight={toValue(props.selected) ? 'fill' : 'regular'} />
      <we-text size="600" color="ui-700" nomargin>
        {toValue(props.label)}
      </we-text>
    </we-button>
  );
}
