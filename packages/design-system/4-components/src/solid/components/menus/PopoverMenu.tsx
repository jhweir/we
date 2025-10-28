import { JSX } from 'solid-js';
import { Accessor } from 'solid-js';

type Option = { id: string; name: string; icon: string };

export interface PopoverMenuProps {
  options: Accessor<Option[]>;
  selectedOption: Accessor<Option>;
  onSelect: (option: Option) => void;
  class?: string;
  style?: JSX.CSSProperties;
}

// TODO: close menu when an option is selected (look at how we did this in flux and maybe update we-popover/we-menu to support this natively)

export function PopoverMenu(props: PopoverMenuProps) {
  return (
    <we-popover class={`we-popover-menu ${props.class || ''}`} style={props.style} placement="bottom-end" data-we-menu>
      <we-button slot="trigger" variant="subtle">
        <we-icon name={props.selectedOption().icon} />
        {props.selectedOption().name}
      </we-button>

      <we-menu slot="content">
        {props.options().map((option) => (
          <we-menu-item key={option.name} onClick={() => props.onSelect(option)}>
            <we-icon slot="start" name={option.icon} />
            {option.name}
          </we-menu-item>
        ))}
      </we-menu>
    </we-popover>
  );
}
