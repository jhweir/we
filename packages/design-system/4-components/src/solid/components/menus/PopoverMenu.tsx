import { JSX } from 'solid-js';
import { Accessor } from 'solid-js';

export interface PopoverMenuProps {
  options: Accessor<{ id: string; name: string; icon: string }[]>;
  currentOption: Accessor<{ name: string; icon: string }>;
  setOption: (id: string) => void;
  class?: string;
  style?: JSX.CSSProperties;
}

export function PopoverMenu(props: PopoverMenuProps) {
  const iconWeight = 'regular';

  console.log('props.currentOption(): ', props.currentOption());

  return (
    <we-popover class={`we-popover-menu ${props.class || ''}`} style={props.style} placement="bottom-end" data-we-menu>
      <we-button slot="trigger" variant="subtle">
        <we-icon name={props.currentOption().icon} weight={iconWeight} />
        {props.currentOption().name}
      </we-button>

      <we-menu slot="content">
        {props.options().map((option) => (
          <we-menu-item key={option.name} onClick={() => props.setOption(option.id)}>
            <we-icon slot="start" name={option.icon} weight={iconWeight} />
            {option.name}
          </we-menu-item>
        ))}
      </we-menu>
    </we-popover>
  );
}
