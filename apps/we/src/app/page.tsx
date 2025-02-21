'use client';

import '@we/elements/variables.css';
import dynamic from 'next/dynamic';
import styles from './page.module.scss';
// import Row from '@/components/Row/Row';
import { Row, Column } from '@/components';

const Elements = dynamic(() => import('@we/elements').then(() => () => null), { ssr: false });

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>WE!!!</h1>
      <Elements />
      <we-badge size="lg" variant="primary">
        Badge
      </we-badge>
      <we-button loading>Button</we-button>
      <Row centerX style={{ width: 600, backgroundColor: '#ddd' }}>
        <p>1</p>
        <p>2</p>
        <p>3</p>
      </Row>
      <Column centerX style={{ width: 600, backgroundColor: '#ddd' }}>
        <p>1</p>
        <p>2</p>
        <p>3</p>
      </Column>
      <we-row alignX="between" alignY="end" style={{ width: 600, height: 300, backgroundColor: '#ddd' }}>
        <p>1</p>
        <p>2</p>
        <p>3</p>
      </we-row>
      <we-row alignX="around" alignY="center" style={{ width: 600, height: 300, backgroundColor: 'red' }}>
        <we-badge size="lg" variant="primary">
          1
        </we-badge>
        <we-badge size="lg" variant="primary">
          2
        </we-badge>
        <we-badge size="lg" variant="primary">
          3
        </we-badge>
      </we-row>
    </div>
  );
}
