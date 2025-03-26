import type { Metadata } from 'next';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Homepage',
  description: 'We are one',
};

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>WE!!! home page</h1>
      <we-row alignX="center" bg="ui-100" gap="400" p="500" radius="lg" style={{ width: 600, height: 600 }}>
        <we-column style={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} />
        <we-column alignY="between" m="500" p="500" gap="300" bg="ui-500" radius="md" color="ui-200">
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
      </we-row>
    </div>
  );
}
