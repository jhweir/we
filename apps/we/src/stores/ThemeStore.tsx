import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

import type { Theme, ThemeKey } from '../registries/themeRegistry';
import { isValidThemeKey, themeRegistry } from '../registries/themeRegistry';

const THEME_KEY = 'we.theme';

export interface ThemeStore {
  // State
  themes: Accessor<Theme[]>;
  currentTheme: Accessor<Theme>;

  // Setters
  setThemes: (themes: Theme[]) => void;
  setCurrentTheme: (themeKey: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeStore>();

export function ThemeStoreProvider(props: ParentProps) {
  // Use saved theme key from localStorage if available
  const savedThemeKey = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
  const initialThemeKey: ThemeKey = isValidThemeKey(savedThemeKey) ? savedThemeKey : 'light';
  document.documentElement.setAttribute('data-we-theme', initialThemeKey);

  const [themes, setThemes] = createSignal<Theme[]>(Object.values(themeRegistry));
  const [currentThemeKey, setCurrentThemeKey] = createSignal<ThemeKey>(initialThemeKey);

  const currentTheme: Accessor<Theme> = () => themeRegistry[currentThemeKey()];

  function setCurrentTheme(themeKey: ThemeKey) {
    if (isValidThemeKey(themeKey)) {
      setCurrentThemeKey(themeKey);
      document.documentElement.setAttribute('data-we-theme', themeKey);
      localStorage.setItem(THEME_KEY, themeKey);
    }
  }

  const store: ThemeStore = {
    // State
    themes,
    currentTheme,

    // Setters
    setThemes,
    setCurrentTheme,
  };

  return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

export function useThemeStore(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeStore must be used within ThemeProvider');
  return ctx;
}

export default ThemeStoreProvider;
