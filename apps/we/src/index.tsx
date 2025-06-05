/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';
import './index.scss';

const root = document.getElementById('root');
if (import.meta.env.DEV && !(root instanceof HTMLElement)) console.error('Root element not found!');

render(() => <App />, root!);
