import { Row } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface HeaderWidgetProps {
  themes: { key: string; name: string; icon: string }[];
  currentTheme: { key: string; name: string; icon: string };
  setTheme: (key: string) => void;
  class?: string;
  style?: JSX.CSSProperties;
}

export default function Header(props: HeaderWidgetProps) {
  const iconWeight = 'regular';

  return (
    <Row class={`we-header-widget ${props.class || ''}`} style={{ width: '100vw', ...props.style }} p="300" ax="end">
      <we-popover placement="bottom-end">
        <we-button size="sm" slot="trigger" variant="subtle">
          <we-icon name={props.currentTheme.icon} weight={iconWeight} />
          {props.currentTheme.name}
        </we-button>

        <we-menu slot="content">
          {props.themes.map((theme) => (
            <we-menu-item key={theme.key} onClick={() => props.setTheme(theme.key)}>
              <we-icon slot="start" name={theme.icon} weight={iconWeight} />
              {theme.name}
            </we-menu-item>
          ))}
        </we-menu>
      </we-popover>
    </Row>
  );
}
