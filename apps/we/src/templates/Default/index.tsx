'use client';

import '@we/elements/themes/dark';
import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import LoadingState from '../../components/LoadingState';
import Header from './components/Header';
import Modals from './components/Modals';
import SidebarLeft from './components/OuterSidebars/SidebarLeft';
import SidebarRight from './components/OuterSidebars/SidebarRight';
import styles from './index.module.scss';

const ImportElements = dynamic(() => import('@we/elements').then(() => () => null), {
  ssr: false,
  loading: () => <LoadingState />,
});

export default function DeafultTemplate({ children: pageContent }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ImportElements />

      <Modals />

      <we-row alignX="center" style={{ width: '100vw' }}>
        <SidebarLeft />
        <we-column bg="ui-25" class={styles.centerColumn}>
          <Header />
          {pageContent}
        </we-column>
        <SidebarRight />
      </we-row>
    </>
  );
}
