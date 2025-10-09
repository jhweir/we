import type { AppProps, RouteDefinition } from '@we/app/src/types';
import { Column, Row } from '@we/components/solid';
import { BlockComposerPage, HomePage, PageNotFound, PostPage, SpacePage } from '@we/pages/solid';
import { CreateSpaceModalWidget, HeaderWidget, NarrowSidebarWidget } from '@we/widgets/solid';
import { createMemo } from 'solid-js';
import { z } from 'zod';

import { zodAccessor, zodAction } from '../../../../shared/utils';

// Zod schemas for template props
// TODO: Add types: const spaceSchema: z.ZodType<Space> =
const spaceSchema = z.object({ name: z.string(), uuid: z.string(), description: z.string() });
const themeSchema = z.object({ name: z.string(), icon: z.string() });
const creatorSchema = z.object({ name: z.string(), avatarUrl: z.string() });
const postSchema = z.object({ creator: creatorSchema, title: z.string(), content: z.string() });
const propSchema = z.object({
  // State
  adamClient: zodAccessor(z.any()),
  spaces: zodAccessor(z.array(spaceSchema)),
  themes: zodAccessor(z.array(themeSchema)),
  currentTheme: zodAccessor(themeSchema),
  posts: zodAccessor(z.array(postSchema)),
  createSpaceModalOpen: zodAccessor(z.boolean()),
  currentSpace: zodAccessor(spaceSchema),
  currentSpacePerspective: zodAccessor(z.any()),
  spacePosts: zodAccessor(z.array(z.any())),
  // Actions
  setTheme: zodAction(z.string()),
  openModal: zodAction(z.string()),
  closeModal: zodAction(z.string()),
  addNewSpace: zodAction(spaceSchema),
  navigate: zodAction(z.string()),
  // Optional props
  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

export type DefaultTemplateProps = z.infer<typeof propSchema>;

function getProps(app: AppProps) {
  const { adamStore, modalStore, spaceStore, themeStore } = app.stores;
  return {
    // State
    spaces: adamStore.mySpaces,
    adamClient: adamStore.adamClient,
    posts: themeStore.posts,
    themes: themeStore.themes,
    currentTheme: themeStore.currentTheme,
    createSpaceModalOpen: modalStore.createSpaceModalOpen,
    currentSpace: spaceStore.space,
    currentSpacePerspective: spaceStore.perspective,
    spacePosts: spaceStore.posts,
    // Actions
    setTheme: themeStore.setCurrentTheme,
    openModal: modalStore.openModal,
    closeModal: modalStore.closeModal,
    addNewSpace: adamStore.addNewSpace,
    // Utility
    navigate: app.navigate,
  };
}

function getRoutes(props: DefaultTemplateProps): RouteDefinition[] {
  return [
    { path: '*', component: () => <PageNotFound /> },
    { path: '/', component: () => <HomePage /> },
    { path: '/posts', component: () => <PostPage posts={props.posts()} /> },
    {
      path: '/space/:spaceId',
      component: () => (
        <SpacePage
          space={props.currentSpace()}
          perspective={props.currentSpacePerspective()}
          spacePosts={props.spacePosts()}
        />
      ),
    },
    { path: '/block-composer', component: () => <BlockComposerPage perspective={props.currentSpacePerspective()} /> },
  ];
}

function getSidebarButtons(props: DefaultTemplateProps) {
  const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';
  return {
    top: () => [
      { name: 'Home', image: WECO_LOGO, onClick: () => props.navigate('/') },
      { name: 'Search', icon: 'magnifying-glass', onClick: () => props.navigate('/search?test=true') },
      { name: 'Block Composer', icon: 'note-pencil', onClick: () => props.navigate('/block-composer') },
      { name: 'Posts', icon: 'cards', onClick: () => props.navigate('/posts') },
      { name: 'Spaces', icon: 'users-three', onClick: () => props.navigate('/all-spaces') },
      ...props.spaces().map((space) => ({ name: space.name, onClick: () => props.navigate(`/space/${space.uuid}`) })),
      { name: 'New space', icon: 'plus', onClick: () => props.openModal('create-space') },
    ],
    bottom: () => [{ name: 'Settings', icon: 'gear', onClick: () => props.navigate('/settings') }],
  };
}

function DefaultTemplate(props: DefaultTemplateProps) {
  const sidebarButtons = createMemo(() => getSidebarButtons(props));

  return (
    <Row class={`we-default-template ${props.class || ''}`} style={props.style} ax="center" bg="ui-0" data-we-template>
      <NarrowSidebarWidget class="left" topButtons={sidebarButtons().top} bottomButtons={sidebarButtons().bottom} />
      <Column class="main-content" bg="ui-25">
        <HeaderWidget themes={props.themes} currentTheme={props.currentTheme} setTheme={props.setTheme} />
        {props.children}
      </Column>

      {props.createSpaceModalOpen() && (
        <CreateSpaceModalWidget
          close={() => props.closeModal('create-space')}
          adamClient={props.adamClient()}
          addNewSpace={props.addNewSpace}
        />
      )}
    </Row>
  );
}

export const defaultTemplate = {
  id: 'default',
  name: 'Default',
  description: 'A simple default template with header, sidebar, main, and footer slots.',
  propSchema,
  getProps,
  getRoutes,
  component: DefaultTemplate,
};
