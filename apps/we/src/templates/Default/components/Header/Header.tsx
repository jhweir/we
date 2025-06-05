import { useAdamStore } from '@/stores/AdamStore';
import styles from './Header.module.scss';

export default function Header() {
  const adamStore = useAdamStore();

  // TODO: move theme settins into a separate store

  return (() => {
    const { allThemes, currentTheme, iconWeight } = adamStore.state.myThemeSettings;

    return (
      <we-row p="300" ax="end" class={styles.header}>
        <we-popover placement="bottom-end">
          <we-button size="sm" slot="trigger" variant="subtle">
            <we-icon name={currentTheme.icon} weight={iconWeight} />
            {currentTheme.name}
          </we-button>
          <we-menu slot="content">
            {allThemes.map((theme) => (
              <we-menu-item
                key={theme.name}
                onClick={() => adamStore.actions.setMyThemeSettings((prev) => ({ ...prev, currentTheme: theme }))}
              >
                <we-icon slot="start" name={theme.icon} weight={iconWeight} />
                {theme.name}
              </we-menu-item>
            ))}
          </we-menu>
        </we-popover>
      </we-row>
    );
  })();
}
