'use client';

import '@we/elements/themes/dark';
import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoadingState from '../../components/LoadingState';
import styles from './index.module.scss';
// import { useAdamContext } from "../../contexts/AdamContext";

const Elements = dynamic(() => import('@we/elements').then(() => () => null), {
  ssr: false,
  loading: () => <LoadingState />,
});

const themes = [
  { name: 'Light', icon: 'sun' },
  { name: 'Dark', icon: 'moon' },
];

const iconWeight = 'regular';

export default function DeafultTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  // const { client, loading } = useAdamContext();

  function setTheme(theme: any) {
    // Remove old theme and add new theme class on html element
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme.name.toLowerCase());
    setCurrentTheme(theme);
  }

  // useEffect(() => {
  //   console.log('client', client);
  // }, [client])

  // useEffect(() => {
  //   console.log('loading', loading);
  // }, [loading])

  return (
    <div style={{ width: '100vw', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Elements />

      <we-row alignX="center" style={{ width: '100%' }}>
        {/* Left Sidebar */}
        <we-column p="400" alignY="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
          <we-column gap="400">
            <Link href="/">
              <we-avatar src="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
            </Link>
            <Link href="/">
              <we-icon name="magnifying-glass" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="users-three" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/new">
              <we-icon name="note-pencil" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/posts/1">1</Link>
            <Link href="/posts/2">2</Link>
          </we-column>
          <we-column gap="400">
            <Link href="/">
              <we-icon name="gear" weight={iconWeight} color="ui-700" />
            </Link>
          </we-column>
        </we-column>

        {/* Center */}
        <we-column bg="ui-25" style={{ width: 'calc(100% - 148px)', minHeight: '100vh', position: 'relative' }}>
          {/* Header */}
          <we-row p="300" style={{ position: 'fixed', right: 75 }}>
            <we-popover placement="bottom-end">
              <we-button size="sm" slot="trigger" variant="subtle">
                <we-icon name={currentTheme.icon} weight={iconWeight} />
                {currentTheme.name}
              </we-button>
              <we-menu slot="content">
                {themes.map((theme) => (
                  <we-menu-item key={theme.name} onClick={() => setTheme(theme)}>
                    <we-icon slot="start" name={theme.icon} weight={iconWeight} />
                    {theme.name}
                  </we-menu-item>
                ))}
              </we-menu>
            </we-popover>
          </we-row>

          {/* Main Content */}
          {children}
        </we-column>

        {/* Right Sidebar */}
        <we-column p="400" alignY="between" bg="ui-0" class={`${styles.sidebar} ${styles.right}`}>
          <we-column gap="400">
            <Link href="/">
              <we-avatar src="https://weco-prod-user-flag-images.s3.eu-west-1.amazonaws.com/user-flag-image-1-1-1597655878532-gif-1693527111503.gif" />
            </Link>
            <Link href="/">
              <we-icon name="bell" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="envelope" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/">
              <we-icon name="cube" weight={iconWeight} color="ui-700" />
            </Link>
            <Link href="/posts/1">1</Link>
            <Link href="/posts/2">2</Link>
          </we-column>
          <we-column gap="400">
            <Link href="/">
              <we-icon name="question" weight={iconWeight} color="ui-700" />
            </Link>
          </we-column>
        </we-column>
      </we-row>
    </div>
  );
}
