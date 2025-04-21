'use client';

import '@we/elements/themes/dark';
import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import LoadingState from '../../components/LoadingState';
import { useAdamContext } from '../../contexts/AdamContext';
import Header from './components/Header';
import SidebarLeft from './components/Sidebars/SidebarLeft';
import SidebarRight from './components/Sidebars/SidebarRight';

const ImportElements = dynamic(() => import('@we/elements').then(() => () => null), {
  ssr: false,
  loading: () => <LoadingState />,
});

export default function DeafultTemplate({ children: pageContent }: Readonly<{ children: React.ReactNode }>) {
  const adamContext = useAdamContext();

  useEffect(() => {
    console.log('adamContext', adamContext);
  }, [adamContext]);

  return (
    <div style={{ width: '100vw', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ImportElements />

      <we-row alignX="center" style={{ width: '100%' }}>
        <SidebarLeft />
        <we-column bg="ui-25" style={{ width: '100%', minHeight: '100vh', padding: '0 74px', position: 'relative' }}>
          <Header />
          {pageContent}
        </we-column>
        <SidebarRight />
      </we-row>
    </div>
  );
}
