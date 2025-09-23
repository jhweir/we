import { Row } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface HeaderWidgetProps {
  themes: { name: string; icon: string }[];
  currentTheme: { name: string; icon: string };
  setTheme: (themeName: string) => void;
  class?: string;
  style?: JSX.CSSProperties;
}

export default function Header(props: HeaderWidgetProps) {
  const iconWeight = 'regular';

  return (
    <Row class={`we-header-widget ${props.class || ''}`} style={props.style} p="300" ay="center" ax="end">
      <we-popover placement="bottom-end">
        <we-button slot="trigger" variant="subtle">
          <we-icon name={props.currentTheme.icon} weight={iconWeight} />
          {props.currentTheme.name}
        </we-button>

        <we-menu slot="content">
          {props.themes.map((theme) => (
            <we-menu-item key={theme.name} onClick={() => props.setTheme(theme.name.toLowerCase())}>
              <we-icon slot="start" name={theme.icon} weight={iconWeight} />
              {theme.name}
            </we-menu-item>
          ))}
        </we-menu>
      </we-popover>
    </Row>
  );
}
