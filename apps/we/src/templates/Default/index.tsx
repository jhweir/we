// import '@we/elements/react-jsx';
import '@we/elements/react-jsx/Avatar';
import '@we/elements/react-jsx/Badge';
// import '@we/elements/test';
// import '@we/elements/react-jsx/Badge';
// import '@we/elements/types/react-jsx';

// Add a console log to check if components are registered
console.log('Custom elements defined:', {
  badgeDefined: customElements.get('we-badge') !== undefined,
  rowDefined: customElements.get('we-row') !== undefined,
});

// import '@we/elements/jsx-runtime';

// import '@we/elements/jsx-runtime/Badge';

// import '@we/elements/types-react';
// import '@we/elements/themes/dark';
import '@we/elements/variables';
// import './themes/themes.css';

// import Header from './components/Header';
// import Modals from './components/Modals';
// import SidebarLeft from './components/OuterSidebars/SidebarLeft';
// import SidebarRight from './components/OuterSidebars/SidebarRight';
// import styles from './index.module.scss';

// declare module 'react/jsx-runtime' {
//   namespace JSX {
//     interface IntrinsicElements {
//       'we-row': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
//         bg?: string;
//         alignX?: string;
//         style?: React.CSSProperties;
//       };
//     }
//   }
// }

export default function DeafultTemplate({ children: pageContent }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* <Modals /> */}

      {/* <j-badge>Test</j-badge> */}

      <we-badge>Yoooo</we-badge>
      <we-avatar size="sm"></we-avatar>

      <we-row bg="ui-400" style={{ width: 20, height: 20 }}>
        test
      </we-row>

      {pageContent}

      {/* <we-row alignX="center" style={{ width: '100vw' }}>
        <SidebarLeft />
        <we-column bg="ui-25" class={styles.centerColumn}>
          <Header />
          {pageContent}
        </we-column>
        <SidebarRight />
      </we-row> */}
    </>
  );
}
