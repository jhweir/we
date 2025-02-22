'use client';

import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import styles from './page.module.scss';

const Elements = dynamic(() => import('@we/elements').then(() => () => null), { ssr: false });

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>WE!!!</h1>
      <Elements />
      <we-row alignX="center" bg="ui-100" gap="400" p="500" radius="lg" style={{ width: 600, height: 600 }}>
        <we-column style={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} />
        <we-column alignX="between" m="500" p="500" gap="300" bg="ui-500" radius="md" color="ui-200">
          James
          <we-badge size="lg" variant="primary">
            1
          </we-badge>
          <we-badge size="lg" variant="primary">
            2
          </we-badge>
          <we-badge size="lg" variant="primary">
            3
          </we-badge>
        </we-column>
        {/* <we-column style={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} /> */}
      </we-row>
    </div>
  );
}
