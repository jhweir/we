import '@we/tokens/css';
import '@we/themes';
import '@we/elements/solid';
import '@we/components/styles';

import { Column, PostCard, Row } from '@we/components/solid';
import { ParentProps } from 'solid-js';

// import Header from './components/Header';
import Modals from './components/Modals/Modals';
// import SidebarLeft from './components/OuterSidebars/SidebarLeft/SidebarLeft';
// import SidebarRight from './components/OuterSidebars/SidebarRight/SidebarRight';
// import styles from './DefaultTemplate.module.scss';

export default function DeafultTemplate(props: ParentProps) {
  const posts = [
    {
      creator: { name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
      title: 'Hello World',
      content: 'This is my first post!',
    },
    {
      creator: { name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
      title: 'SolidJS is Awesome',
      content: 'Just started learning SolidJS, and I love it!',
    },
  ];
  return (
    <>
      <Modals />

      <Column ax="center" bg="ui-500" mx="900" py="800">
        <we-text nomargin>Yoo im in a column</we-text>

        <Row bg="ui-200" rtl="xs" rbr="lg" p="800">
          <we-text nomargin>Row 1</we-text>
        </Row>

        <Row>
          <we-text nomargin>Row 2</we-text>
        </Row>
      </Column>

      <Column style={{ border: '1px solid var(--we-color-ui-300)' }}>
        {posts.map((post) => (
          <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
        ))}
      </Column>

      {props.children}

      {/* <we-row ax="center" style={{ width: '100vw' }}>
        <SidebarLeft />
        <we-column bg="ui-25" class={styles.centerColumn}>
          <Header />
          <we-badge variant="success">Badge test</we-badge>
          {props.children}
        </we-column>
        <SidebarRight />
      </we-row> */}
    </>
  );
}
