import type { AppProps } from '@we/app/src/types';
import { Column, PostCard, Row } from '@we/components/solid';
import { HeaderWidget, SidebarWidget } from '@we/widgets/solid';
import { z } from 'zod';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

type Space = { name: string; uuid: string }; // Simplified Space type for this example

const spaceSchema: z.ZodType<Space> = z.object({ name: z.string(), uuid: z.string() });
const themeSchema = z.object({ name: z.string(), icon: z.string() });

export const defaultTemplatePropsSchema = z.object({
  // State
  spaces: z.function({ input: [], output: z.array(spaceSchema) }),
  themes: z.function({ input: [], output: z.array(themeSchema) }),
  currentTheme: z.function({ input: [], output: themeSchema }),
  // Actions
  setTheme: z.function({ input: [z.string()], output: z.void() }),
  navigate: z.function({ input: [z.string()], output: z.void() }),
  openModal: z.function({ input: [z.string()], output: z.void() }),
  // Optional props
  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

export function getPropsFromApp(app: AppProps) {
  return {
    // State
    spaces: app.stores.adam.mySpaces,
    themes: app.stores.theme.themes,
    currentTheme: app.stores.theme.currentTheme,
    // Actions
    setTheme: app.stores.theme.setCurrentTheme,
    openModal: app.stores.modal.actions.openModal,
    navigate: app.navigate,
  };
}

export type DefaultTemplateProps = z.infer<typeof defaultTemplatePropsSchema>;

export function DefaultTemplate(props: DefaultTemplateProps) {
  const topButtons = [
    { name: 'Home', image: WECO_LOGO, onClick: () => props.navigate('/') },
    { name: 'Search', icon: 'magnifying-glass', onClick: () => props.navigate('/search') },
    { name: 'Spaces', icon: 'users-three', onClick: () => props.navigate('/all-spaces') },
    ...props.spaces().map((space) => ({
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
    <Row class={`we-default-template ${props.class || ''}`} style={props.style} ax="center" bg="ui-0" data-we-template>
      <SidebarWidget class="left" topButtons={topButtons} bottomButtons={bottomButtons} />
      <Column class="main-content" bg="ui-25">
        <HeaderWidget themes={props.themes()} currentTheme={props.currentTheme()} setTheme={props.setTheme} />
        <Column p="1000">
          {posts.map((post) => (
            <PostCard creator={post.creator} title={post.title} content={post.content} style={{ margin: '20px 0' }} />
          ))}
        </Column>

        {props.children}
      </Column>
    </Row>
  );
}
