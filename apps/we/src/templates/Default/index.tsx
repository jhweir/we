'use client';

import '@we/elements/themes/dark';
import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import LoadingState from '../../components/LoadingState';
import styles from './index.module.scss';

const Elements = dynamic(() => import('@we/elements').then(() => () => null), {
  ssr: false,
  loading: () => <LoadingState />,
});

const themes = [
  { name: 'Light', icon: 'sun' },
  { name: 'Dark', icon: 'moon' },
];

export default function DeafultTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  function setTheme(theme: any) {
    // remove old theme and set new theme name as class on html element
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme.name.toLowerCase());
    setCurrentTheme(theme);
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Elements />

      <we-row style={{ width: '100%', height: '100%' }}>
        <we-column p="400" alignY="between" bg="ui-50" class={`${styles.sidebar} ${styles.left}`}>
          <we-column gap="400">
            <Link href="/">
              <we-avatar src="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
            </Link>
            <Link href="/">
              <we-icon name="search" color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="people" color="ui-700" />
            </Link>
            <Link href="/new">
              <we-icon name="pencil-square" color="ui-700" />
            </Link>
            <Link href="/posts/1">1</Link>
            <Link href="/posts/2">2</Link>
          </we-column>
          <we-column gap="400">
            <Link href="/">
              <we-icon name="gear" color="ui-700" />
            </Link>
          </we-column>
        </we-column>

        <we-column bg="ui-100" style={{ width: '100%', position: 'relative' }}>
          <we-row p="300" style={{ position: 'absolute', right: 0 }}>
            <we-popover placement="bottom-end">
              <we-button size="sm" slot="trigger" variant="subtle">
                <we-icon name={currentTheme.icon} />
                {currentTheme.name}
              </we-button>
              <we-menu slot="content">
                {themes.map((theme) => (
                  <we-menu-item key={theme.name} onClick={() => setTheme(theme)}>
                    <we-icon slot="start" name={theme.icon} />
                    {theme.name}
                  </we-menu-item>
                ))}
              </we-menu>
            </we-popover>
          </we-row>

          {children}
        </we-column>

        <we-column p="400" alignY="between" bg="ui-50" class={`${styles.sidebar} ${styles.right}`}>
          <we-column gap="400">
            <Link href="/">
              <we-avatar src="https://weco-prod-user-flag-images.s3.eu-west-1.amazonaws.com/user-flag-image-1-1-1597655878532-gif-1693527111503.gif" />
            </Link>
            <Link href="/">
              <we-icon name="bell" color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="envelope" color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="boxes" color="ui-700" />
            </Link>
            <Link href="/posts/1">1</Link>
            <Link href="/posts/2">2</Link>
          </we-column>
          <we-column gap="400">
            <Link href="/">
              <we-icon name="question-lg" color="ui-700" />
            </Link>
          </we-column>
        </we-column>
      </we-row>
    </div>
  );
}
