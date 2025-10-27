import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

import type { Theme, ThemeKey } from '../registries/themeRegistry';
import { isValidThemeKey, themeRegistry } from '../registries/themeRegistry';

const THEME_KEY = 'we.theme';

type ThemeWithId = Theme & { id: ThemeKey };

export interface ThemeStore {
  // State
  themes: Accessor<ThemeWithId[]>;
  currentTheme: Accessor<ThemeWithId>;

  // Setters
  setThemes: (themes: ThemeWithId[]) => void;
  setCurrentTheme: (theme: ThemeWithId) => void;
}

const ThemeContext = createContext<ThemeStore>();

// Map registry entries to include id
function mapTheme(key: ThemeKey, theme: Theme): ThemeWithId {
  return { id: key, ...theme };
}

// Get all themes from the registry with their ids
function getMappedThemes(): ThemeWithId[] {
  return Object.entries(themeRegistry).map(([key, theme]) => mapTheme(key as ThemeKey, theme));
}

// Get initial theme key from localStorage if available otherwise fall back to the first key in the registry
function getInitialThemeKey(): ThemeKey {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
  console.log('Saved theme key:', saved);
  const fallback = Object.keys(themeRegistry)[0] as ThemeKey;
  return isValidThemeKey(saved) ? saved : fallback;
}

export function ThemeStoreProvider(props: ParentProps) {
  const [themes, setThemes] = createSignal<ThemeWithId[]>(getMappedThemes());
  const [currentThemeKey, setCurrentThemeKey] = createSignal<ThemeKey>(getInitialThemeKey());

  // Derive the current theme based on the currentThemeKey
  const currentTheme: Accessor<ThemeWithId> = () =>
    themes().find((t) => t.id === currentThemeKey()) ?? mapTheme('light', themeRegistry.light);

  // Update the current theme and persist the choice in localStorage
  function setCurrentTheme(theme: ThemeWithId) {
    if (isValidThemeKey(theme.id)) {
      setCurrentThemeKey(theme.id);
      document.documentElement.setAttribute('data-we-theme', theme.id);
      localStorage.setItem(THEME_KEY, theme.id);
    }
  }

  setCurrentTheme(currentTheme());

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
