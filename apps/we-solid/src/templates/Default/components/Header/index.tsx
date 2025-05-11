import { useAdamContext } from '@/contexts/AdamContext';
import { createMemo } from 'solid-js';
import styles from './index.module.scss';

export default function Header() {
  const { myThemeSettings, setMyThemeSettings } = useAdamContext();

  const allThemes = createMemo(() => myThemeSettings().allThemes);
  const currentTheme = createMemo(() => myThemeSettings().currentTheme);
  const iconWeight = createMemo(() => myThemeSettings().iconWeight);

  return (
    <we-row p="300" ax="end" class={styles.header}>
      <we-popover placement="bottom-end">
        <we-button size="sm" slot="trigger" variant="subtle">
          <we-icon name={currentTheme().icon} weight={iconWeight()} />
          {currentTheme().name}
        </we-button>
        <we-menu slot="content">
          {allThemes().map((theme) => (
            <we-menu-item
              key={theme.name}
              onClick={() => setMyThemeSettings((prev) => ({ ...prev, currentTheme: theme }))}
            >
              <we-icon slot="start" name={theme.icon} weight={iconWeight()} />
              {theme.name}
            </we-menu-item>
          ))}
        </we-menu>
      </we-popover>
    </we-row>
  );
}
