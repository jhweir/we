import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  ParentProps,
  useContext,
} from 'solid-js';

const THEMES = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
  black: { name: 'Black', icon: 'square' },
  retro: { name: 'Retro', icon: 'floppy-disk' },
  cyberpunk: { name: 'Cyberpunk', icon: 'cpu' },
} as const;

export type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const THEME_KEY = 'we.theme';

export interface ThemeStore {
  state: {
    name: Accessor<ThemeName>;
    current: Accessor<Theme>;
    all: Theme[]; // static list, not reactive
  };
  actions: {
    setTheme: (name: ThemeName) => void;
    toggle: (a?: ThemeName, b?: ThemeName) => void;
  };
}

const ThemeContext = createContext<ThemeStore>();

export function ThemeProvider(props: ParentProps) {
  const [name, setName] = createSignal<ThemeName>('light');
  const current = createMemo(() => THEMES[name()]);
  const all = Object.values(THEMES);

  onMount(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && saved in THEMES) setName(saved as ThemeName);
  });

  createEffect(() => {
    const n = name();
    // optional lazy CSS load:
    // await import(`@we/themes/${n}`);
    document.documentElement.setAttribute('data-we-theme', n);
    localStorage.setItem(THEME_KEY, n);
  });

  const store: ThemeStore = {
    state: { name, current, all },
    actions: {
      setTheme: (n) => setName(n),
      toggle: (a = 'light', b = 'dark') => setName((n) => (n === a ? b : a)),
    },
  };

  return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

export function useThemeStore(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeStore must be used within ThemeProvider');
  return ctx;
}

export default ThemeProvider;
