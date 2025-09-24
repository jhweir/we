import type { AppProps, RouteDefinition } from '@we/app/src/types';
import { Column, Row } from '@we/components/solid';
import { HomePage, PageNotFound, PostPage } from '@we/pages/solid';
import { HeaderWidget, SidebarWidget } from '@we/widgets/solid';
import { z } from 'zod';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

// TODO: Get Space & Theme types from types package?
// type Space = { name: string; uuid: string };

// const spaceSchema: z.ZodType<Space> = z.object({ name: z.string(), uuid: z.string() });
const themeSchema = z.object({ name: z.string(), icon: z.string() });
const postSchema = z.object({
  creator: z.object({ name: z.string(), avatarUrl: z.string() }),
  title: z.string(),
  content: z.string(),
});
// const postSchema = z.any();

const propSchema = z.object({
  // State
  // spaces: z.function({ input: [], output: z.array(spaceSchema) }),
  themes: z.function({ input: [], output: z.array(themeSchema) }),
  currentTheme: z.function({ input: [], output: themeSchema }),
  posts: z.function({ input: [], output: z.array(postSchema) }),
  // Actions
  setTheme: z.function({ input: [z.string()], output: z.void() }),
  openModal: z.function({ input: [z.string()], output: z.void() }),
  navigate: z.function({ input: [z.string()], output: z.void() }),
  // Optional props

  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

export function getRoutes(props: z.infer<typeof propSchema>): RouteDefinition[] {
  return [
    { path: '*', component: () => <PageNotFound /> },
    { path: '/', component: () => <HomePage /> },
    { path: '/posts', component: () => <PostPage posts={props.posts()} /> },
  ];
}

function getPropsFromApp(app: AppProps) {
  const { modalStore, themeStore } = app.stores;
  return {
    // State
    // spaces: adamStore.mySpaces,
    posts: themeStore.posts,
    themes: themeStore.themes,
    currentTheme: themeStore.currentTheme,
    // Actions
    setTheme: themeStore.setCurrentTheme,
    openModal: modalStore.actions.openModal,
    navigate: app.navigate,
  };
}

export function DefaultTemplate(props: z.infer<typeof propSchema>) {
  const topButtons = [
    { name: 'Home', image: WECO_LOGO, onClick: () => props.navigate('/') },
    { name: 'Search', icon: 'magnifying-glass', onClick: () => props.navigate('/search') },
    { name: 'Posts', icon: 'note-pencil', onClick: () => props.navigate('/posts') },
    // { name: 'Spaces', icon: 'users-three', onClick: () => props.navigate('/all-spaces') },
    // ...props.spaces().map((space) => ({
    //   name: space.name,
    //   onClick: () => props.navigate(`/space/${space.uuid}`),
    // })),
    { name: 'New space', icon: 'plus', onClick: () => props.openModal('createSpace') },
  ];

  const bottomButtons = [{ name: 'Settings', icon: 'gear', onClick: () => props.navigate('/settings') }];

  return (
    <Row class={`we-default-template ${props.class || ''}`} style={props.style} ax="center" bg="ui-0" data-we-template>
      <SidebarWidget class="left" topButtons={topButtons} bottomButtons={bottomButtons} />
      <Column class="main-content" bg="ui-25">
        <HeaderWidget themes={props.themes()} currentTheme={props.currentTheme()} setTheme={props.setTheme} />
        {props.children}
      </Column>
    </Row>
  );
}

export const defaultTemplate = { id: 'default', component: DefaultTemplate, getPropsFromApp, getRoutes, propSchema };
