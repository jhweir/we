import '@we/elements/solid';
import '@we/elements/themes/dark';
import '@we/elements/variables';

import type { Component } from 'solid-js';
import Test from './test';

const App: Component = () => {
  return (
    <we-row bg="ui-300" ax="center" style={{ width: '100vw' }}>
      <we-badge variant="success">Badge ?</we-badge>
      <Test title="yooo">
        <div>Test</div>
        <p>Wassup</p>
        <p>Hey</p>
      </Test>
    </we-row>
  );
};

export default App;
