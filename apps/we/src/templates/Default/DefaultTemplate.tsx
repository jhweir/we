// import { Column } from '@we/elements/frameworks/solid';
// import { Column } from '@we/elements/solid/framework-components';
// import { Column } from '@we/elements/solid/template-components';
// import { Column } from '@we/elements/solid/components';
// import '@we/elements/themes/dark';
// import '@we/elements/variables';

import '@we/elements/solid';
import '@we/themes';
import '@we/tokens/css';
// import { Column, Post } from '@we/components/solid';
// import { PostFeed } from '@we/widgets/solid';
// import '@we/themes';
// import '@we/variables'; // import '@we/tokens' (consts as well as css values)?;
// import '@we/types';

import { ParentProps } from 'solid-js';
import Header from './components/Header';
import Modals from './components/Modals/Modals';
import SidebarLeft from './components/OuterSidebars/SidebarLeft/SidebarLeft';
import SidebarRight from './components/OuterSidebars/SidebarRight/SidebarRight';
import styles from './DefaultTemplate.module.scss';

// TODO: split native template components into seperate package from we/elements?

export default function DeafultTemplate(props: ParentProps) {
  return (
    <>
      <Modals />

      {/* <Column>
        <p>Yoo im in a column</p>
      </Column> */}

      <we-row ax="center" style={{ width: '100vw' }}>
        <SidebarLeft />
        <we-column bg="ui-25" class={styles.centerColumn}>
          <Header />
          {/* <we-badge variant='success'>Badge test</we-badge> */}
          {props.children}
        </we-column>
        <SidebarRight />
      </we-row>
    </>
  );
}
