import { Row } from '../../../../../../../packages/design-system/3-components/dist/solid';

import { ThemeName, useThemeStore } from '@/stores';

import styles from './Header.module.scss';

export default function Header() {
  const { state, actions } = useThemeStore();
  const iconWeight = 'regular';

  // Derive keys for setTheme (store exposes only display objects)
  const items = () => state.all.map((t) => ({ key: t.name.toLowerCase() as ThemeName, ...t }));

  return (() => {
    return (
      <Row p="300" ax="end" class={styles.header}>
        <we-popover placement="bottom-end">
          <we-button size="sm" slot="trigger" variant="subtle">
            <we-icon name={state.current().icon} weight={iconWeight} />
            {state.current().name}
          </we-button>

          <we-menu slot="content">
            {items().map((t) => (
              <we-menu-item key={t.key} onClick={() => actions.setTheme(t.key)}>
                <we-icon slot="start" name={t.icon} weight={iconWeight} />
                {t.name}
              </we-menu-item>
            ))}
          </we-menu>
        </we-popover>
      </Row>
    );
  })();
}
