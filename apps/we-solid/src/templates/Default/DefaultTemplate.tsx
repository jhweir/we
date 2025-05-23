import '@we/elements/solid';
import '@we/elements/themes/dark';
import '@we/elements/variables';
import { ParentProps } from 'solid-js';
import Header from './components/Header';
import Modals from './components/Modals/Modals';
import SidebarLeft from './components/OuterSidebars/SidebarLeft/SidebarLeft';
import SidebarRight from './components/OuterSidebars/SidebarRight/SidebarRight';
import styles from './DefaultTemplate.module.scss';

export default function DeafultTemplate(props: ParentProps) {
  return (
    <>
      <Modals />

      <we-row ax="center" style={{ width: '100vw' }}>
        <SidebarLeft />
        <we-column bg="ui-25" class={styles.centerColumn}>
          <Header />
          {props.children}
        </we-column>
        <SidebarRight />
      </we-row>
    </>
  );
}
