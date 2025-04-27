import '@we/elements';
import '@we/elements/themes/dark';
import '@we/elements/variables.css';

// import Header from './components/Header';
// import Modals from './components/Modals';
// import SidebarLeft from './components/OuterSidebars/SidebarLeft';
// import SidebarRight from './components/OuterSidebars/SidebarRight';
// import styles from './index.module.scss';

export default function DeafultTemplate({ children: pageContent }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* <Modals /> */}

      <we-badge>Yoooo</we-badge>

      <we-row bg="ui-300" alignX="center" style={{ width: 20, height: 20 }}>
        test
      </we-row>

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

// declare global {
//   namespace JSX {
//       interface IntrinsicElements {
//           'we-badge': {
//               variant?: Variant;
//               size?: Size;
//               children?: any;
//           };
//       }
//   }
// }
