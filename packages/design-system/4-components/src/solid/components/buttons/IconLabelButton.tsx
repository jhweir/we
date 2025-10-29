import type { ButtonSize, ButtonVariant } from '@we/elements/types';
import { MaybeAccessor, toValue } from '@we/solid-utils';
import { JSX } from 'solid-js';

export interface IconLabelButtonProps {
  icon: MaybeAccessor<string>;
  label: MaybeAccessor<string>;
  variant?: MaybeAccessor<ButtonVariant>;
  size?: MaybeAccessor<ButtonSize>;
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
      variant={toValue(props.variant)}
      size={toValue(props.size)}
      data-we-button
    >
      <we-icon name={toValue(props.icon)} weight={toValue(props.selected) ? 'fill' : 'regular'} />
      {toValue(props.label) && (
        <we-text size="600" color="ui-black" nomargin>
          {toValue(props.label)}
        </we-text>
      )}
    </we-button>
  );
}
