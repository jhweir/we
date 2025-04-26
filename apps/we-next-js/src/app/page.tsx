import type { Metadata } from 'next';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Homepage',
  description: 'Welcome to we',
};

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>Welcome to we</h1>
    </div>
  );
}
