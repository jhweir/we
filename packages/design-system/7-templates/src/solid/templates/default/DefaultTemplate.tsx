import type { AppProps, RouteDefinition } from '@we/app/src/types';
import { Column, Row } from '@we/components/solid';
import { HomePage, PageNotFound, PostPage } from '@we/pages/solid';
import { CreateSpaceModalWidget, HeaderWidget, NarrowSidebarWidget } from '@we/widgets/solid';
import { z } from 'zod';

// const spaceSchema: z.ZodType<Space> = z.object({ name: z.string(), uuid: z.string() });
const themeSchema = z.object({ name: z.string(), icon: z.string() });
const creatorSchema = z.object({ name: z.string(), avatarUrl: z.string() });
const postSchema = z.object({ creator: creatorSchema, title: z.string(), content: z.string() });
const fullPropSchema = z.object({
  // State
  // spaces: z.function({ input: [], output: z.array(spaceSchema) }),
  themes: z.function({ input: [], output: z.array(themeSchema) }),
  currentTheme: z.function({ input: [], output: themeSchema }),
  posts: z.function({ input: [], output: z.array(postSchema) }),
  createSpaceModalOpen: z.function({ input: [], output: z.boolean() }),
  // Actions
  setTheme: z.function({ input: [z.string()], output: z.void() }),
  openModal: z.function({ input: [z.string()], output: z.void() }),
  closeModal: z.function({ input: [z.string()], output: z.void() }),
  navigate: z.function({ input: [z.string()], output: z.void() }),
  // Optional props
  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

export type DefaultTemplateProps = z.infer<typeof fullPropSchema>;

function getProps(app: AppProps) {
  const { modalStore, themeStore } = app.stores;
  return {
    // State
    // spaces: adamStore.mySpaces,
    // adamClient: adamStore.adamClient,
    posts: themeStore.posts,
    themes: themeStore.themes,
    currentTheme: themeStore.currentTheme,
    createSpaceModalOpen: modalStore.createSpaceModalOpen,
    // Actions
    setTheme: themeStore.setCurrentTheme,
    openModal: modalStore.openModal,
    closeModal: modalStore.closeModal,
    // addNewSpace: adamStore.addNeweSpace,
    navigate: app.navigate,
  };
}

function getRoutes(props: DefaultTemplateProps): RouteDefinition[] {
  return [
    { path: '*', component: () => <PageNotFound /> },
    { path: '/', component: () => <HomePage /> },
    { path: '/posts', component: () => <PostPage posts={props.posts()} /> },
  ];
}

function getButtons(props: DefaultTemplateProps) {
  const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';
  return {
    topButtons: [
      { name: 'Home', image: WECO_LOGO, onClick: () => props.navigate('/') },
      { name: 'Search', icon: 'magnifying-glass', onClick: () => props.navigate('/search') },
      { name: 'Posts', icon: 'note-pencil', onClick: () => props.navigate('/posts') },
      // { name: 'Spaces', icon: 'users-three', onClick: () => props.navigate('/all-spaces') },
      // ...props.spaces().map((space) => ({
      //   name: space.name,
      //   onClick: () => props.navigate(`/space/${space.uuid}`),
      // })),
      { name: 'New space', icon: 'plus', onClick: () => props.openModal('create-space') },
    ],
    bottomButtons: [{ name: 'Settings', icon: 'gear', onClick: () => props.navigate('/settings') }],
  };
}

export function DefaultTemplate(props: DefaultTemplateProps) {
  const { topButtons, bottomButtons } = getButtons(props);

  return (
    <Row class={`we-default-template ${props.class || ''}`} style={props.style} ax="center" bg="ui-0" data-we-template>
      <NarrowSidebarWidget class="left" topButtons={topButtons} bottomButtons={bottomButtons} />
      <Column class="main-content" bg="ui-25">
        <HeaderWidget themes={props.themes()} currentTheme={props.currentTheme()} setTheme={props.setTheme} />
        {props.children}
      </Column>

      {props.createSpaceModalOpen() && (
        <CreateSpaceModalWidget
          adamClient={undefined}
          close={() => props.closeModal('create-space')}
          addNewSpace={() => undefined}
        />
      )}
    </Row>
  );
}

export const defaultTemplate = {
  id: 'default',
  component: DefaultTemplate,
  getProps,
  getRoutes,
  propSchema: fullPropSchema,
};
