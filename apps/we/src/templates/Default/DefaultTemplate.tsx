import '@we/tokens/css';
import '@we/themes';
import '@we/elements/solid';
import '@we/components/styles';

import { Column, PostCard, Row } from '@we/components/solid';
import { Sidebar } from '@we/widgets/solid';
import { ParentProps } from 'solid-js';

import Header from './components/Header';
import Modals from './components/Modals/Modals';
// import SidebarLeft from './components/OuterSidebars/SidebarLeft/SidebarLeft';
import SidebarRight from './components/OuterSidebars/SidebarRight/SidebarRight';
import styles from './DefaultTemplate.module.scss';

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

      <Row ax="center" style={{ width: '100vw' }}>
        {/* <SidebarLeft /> */}
        <Sidebar width={90}>
          <p>tooo</p>
        </Sidebar>
        <Column bg="ui-25" class={styles.centerColumn}>
          <Header />
          <Column p="1000">
            {posts.map((post) => (
              <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
            ))}
          </Column>

          {props.children}
        </Column>
        <SidebarRight />
      </Row>
    </>
  );
}
