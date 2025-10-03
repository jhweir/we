import { Accessor, createContext, createEffect, createSignal, ParentProps, useContext } from 'solid-js';

import { asVoid, clone } from '../utils';

const THEMES = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
  black: { name: 'Black', icon: 'square' },
  retro: { name: 'Retro', icon: 'floppy-disk' },
  cyberpunk: { name: 'Cyberpunk', icon: 'cpu' },
} as const;

const POSTS = [
  {
    creator: { name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    title: 'Hello World',
    content: 'This is my first post!',
  },
  {
    creator: { name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
    title: 'SolidJS is Awesome',
    content: 'Just started learning SolidJS, and I love it!',
  },
];

export type ThemeName = keyof typeof THEMES;
export type Theme = (typeof THEMES)[ThemeName];
export type Post = {
  creator: { name: string; avatarUrl: string };
  title: string;
  content: string;
};

const THEME_KEY = 'we.theme';

export interface ThemeStore {
  // State
  themes: Accessor<Theme[]>;
  currentTheme: Accessor<Theme>;
  posts: Accessor<Post[]>; // Placeholder for posts, replace 'any' with actual Post type
  // Actions
  setThemes: (themes: Theme[]) => void;
  setCurrentTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeStore>();

export function ThemeStoreProvider(props: ParentProps) {
  // Get the initial theme from localStorage if available before creating signals
  const savedTheme = (typeof window !== 'undefined' && localStorage.getItem(THEME_KEY)) as ThemeName;

  const [themes, setThemes] = createSignal<Theme[]>(clone(Object.values(THEMES)));
  const [currentTheme, setCurrentTheme] = createSignal<Theme>(clone(THEMES[savedTheme] ?? THEMES.light));
  const [posts] = createSignal<Post[]>(clone(POSTS));

  const store: ThemeStore = {
    // State
    themes,
    currentTheme,
    posts,
    // Actions
    setThemes: asVoid((newThemes: Theme[]) => setThemes(clone(newThemes))),
    setCurrentTheme: asVoid((name: ThemeName) => setCurrentTheme(clone(THEMES[name]))),
  };

  // Update the document attribute and localStorage whenever the theme changes
  createEffect(() => {
    const currentThemeName = currentTheme().name.toLowerCase();
    document.documentElement.setAttribute('data-we-theme', currentThemeName);
    localStorage.setItem(THEME_KEY, currentThemeName);
  });

  return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

export function useThemeStore(): ThemeStore {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeStore must be used within ThemeProvider');
  return ctx;
}

export default ThemeStoreProvider;
