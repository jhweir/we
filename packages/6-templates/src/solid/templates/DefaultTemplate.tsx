import { Column, PostCard, Row } from '@we/components/solid';
import { HeaderWidget, SidebarWidget } from '@we/widgets/solid';
import { z } from 'zod';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

type Space = { name: string; uuid: string }; // Simplified Space type for this example

const spaceSchema: z.ZodType<Space> = z.object({ name: z.string(), uuid: z.string() });
const themeSchema = z.object({ name: z.string(), icon: z.string() });

export const defaultTemplatePropsSchema = z.object({
  spaces: z.array(spaceSchema),
  themes: z.array(themeSchema),
  currentTheme: themeSchema,
  setTheme: z.function({ input: [z.string()], output: z.void() }),
  navigate: z.function({ input: [z.string()], output: z.void() }),
  openModal: z.function({ input: [z.string()], output: z.void() }),
  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

// TODO: Replace with AppProps type from @we/types package which can be used in both the app and template package
type AppProps = {
  stores: {
    adam: { state: { mySpaces: string[] } };
    theme: { state: { themes: string[]; currentTheme: string }; setTheme: () => void };
    modal: { openModal: () => void };
  };
  navigate: () => void;
};

export function getPropsFromApp(app: AppProps) {
  return {
    spaces: app.stores.adam.state.mySpaces,
    themes: app.stores.theme.state.themes,
    currentTheme: app.stores.theme.state.currentTheme,
    setTheme: app.stores.theme.setTheme,
    openModal: app.stores.modal.openModal,
    navigate: app.navigate,
  };
}

export type DefaultTemplateProps = z.infer<typeof defaultTemplatePropsSchema>;

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
        <HeaderWidget themes={props.themes} currentTheme={props.currentTheme} setTheme={props.setTheme} />
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
