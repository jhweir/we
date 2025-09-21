import { Column, PostCard, Row } from '@we/components/solid';
import { HeaderWidget, SidebarWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

export interface DefaultTemplateProps {
  spaces: { name: string; uuid: string }[];
  navigate: (path: string) => void;
  openModal: (modal: string) => void;
  class?: string;
  style?: JSX.CSSProperties;
  children?: JSX.Element[];
}

export function DefaultTemplate(props: DefaultTemplateProps) {
  const topButtons = [
    { name: 'Home', image: WECO_LOGO, onClick: () => props.navigate('/') },
    { name: 'Search', icon: 'magnifying-glass', onClick: () => props.navigate('/search') },
    { name: 'Spaces', icon: 'users-three', onClick: () => props.navigate('/all-spaces') },
    ...props.spaces.map((space) => ({
      name: space.name,
      onClick: () => props.navigate(`/space/${space.uuid}`),
    })),
    { name: 'New space', icon: 'plus', onClick: () => props.openModal('createSpace') },
  ];

  const bottomButtons = [{ name: 'Settings', icon: 'gear', onClick: () => props.navigate('/settings') }];

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
    <Row
      class={`we-default-template ${props.class || ''}`}
      style={{ width: '100vw', ...props.style }}
      ax="center"
      bg="ui-0"
      p="500"
      data-we-template
    >
      <SidebarWidget
        // class={`${styles.sidebar} ${styles.left}`}
        width={90}
        topButtons={topButtons}
        bottomButtons={bottomButtons}
      />
      <Column bg="ui-25">
        <HeaderWidget themes={[]} currentTheme={} setTheme={() => null} />
        <Column p="1000">
          {posts.map((post) => (
            <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
          ))}
        </Column>

        {props.children}
      </Column>
      <SidebarWidget
        // class={`${styles.sidebar} ${styles.right}`}
        width={90}
        topButtons={topButtons}
        bottomButtons={bottomButtons}
      />
    </Row>
  );
}
