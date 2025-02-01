'use client';

// import '@we/elements';
import '@we/elements/Badge';
import '@we/elements/Button';

import '@we/elements/variables.css';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <h1>WE!!!</h1>
      <we-badge variant="primary">Badge</we-badge>
      <we-button loading>Button</we-button>
    </div>
  );
}
