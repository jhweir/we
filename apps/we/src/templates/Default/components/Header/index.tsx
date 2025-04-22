import { useAdamContext } from '@/contexts/AdamContext';

export default function Header() {
  const { myThemeSettings, setMyThemeSettings } = useAdamContext();
  const { allThemes, currentTheme, iconWeight } = myThemeSettings;

  return (
    <we-row p="300" alignX="end" style={{ position: 'fixed', width: 'calc(100% - 148px)' }}>
      <we-popover placement="bottom-end">
        <we-button size="sm" slot="trigger" variant="subtle">
          <we-icon name={currentTheme.icon} weight={iconWeight} />
          {currentTheme.name}
        </we-button>
        <we-menu slot="content">
          {allThemes.map((theme) => (
            <we-menu-item
              key={theme.name}
              onClick={() => setMyThemeSettings((prev) => ({ ...prev, currentTheme: theme }))}
            >
              <we-icon slot="start" name={theme.icon} weight={iconWeight} />
              {theme.name}
            </we-menu-item>
          ))}
        </we-menu>
      </we-popover>
    </we-row>
  );
}
