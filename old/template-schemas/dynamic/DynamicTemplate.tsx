import type { AppProps, RouteDefinition } from '@we/app/src/types';
import { Row } from '@we/components/solid';
import { HomePage } from '@we/pages/solid';
import {
  HeaderWidget,
  type HeaderWidgetProps,
  NarrowSidebarWidget,
  type NarrowSidebarWidgetProps,
} from '@we/widgets/solid';
import { JSX } from 'solid-js';
import { z } from 'zod';

// Zod schemas for template props
const routeSchema = z.object({ path: z.string(), component: z.string(), props: z.array(z.string()).optional() });
const propSchema = z.object({
  slots: z.record(z.string(), z.any()),
  routes: z.array(routeSchema),
  // Optional props
  class: z.string().optional(),
  style: z.any().optional(),
  children: z.any().optional(),
});

export type DynamicTemplateProps = z.infer<typeof propSchema>;

type TemplateSchema = {
  slots: Record<string, string>;
  routes: { path: string; component: string; props?: string[] }[];
};

type ComponentEntry = {
  component: (props: unknown) => JSX.Element;
  getProps?: (appProps: AppProps) => Record<string, unknown>;
};

const componentRegistry: Record<string, ComponentEntry> = {
  HeaderWidget: {
    component: (props) => <HeaderWidget {...(props as HeaderWidgetProps)} />,
    getProps: (appProps: AppProps) => {
      const { themeStore } = appProps.stores;
      return {
        themes: themeStore.themes,
        currentTheme: themeStore.currentTheme,
        setTheme: themeStore.setCurrentTheme,
      };
    },
  },
  NarrowSidebarWidget: {
    component: (props) => <NarrowSidebarWidget {...(props as NarrowSidebarWidgetProps)} />,
    getProps: (appProps: AppProps) => {
      const { modalStore, adamStore } = appProps.stores;
      const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';
      console.log('appProps.navigate', appProps.navigate);
      return {
        topButtons: () => [
          { name: 'Home', image: WECO_LOGO, onClick: () => appProps.navigate('/') },
          { name: 'Search', icon: 'magnifying-glass', onClick: () => appProps.navigate('/search?test=true') },
          { name: 'Block Composer', icon: 'note-pencil', onClick: () => appProps.navigate('/block-composer') },
          { name: 'Posts', icon: 'cards', onClick: () => appProps.navigate('/posts') },
          {
            name: 'Spaces',
            icon: 'users-three',
            onClick: () => {
              console.log('Navigating to /all-spaces', appProps.navigate);
              appProps.navigate('/all-spaces');
            },
          },
          ...adamStore
            .mySpaces()
            .map((space) => ({ name: space.name, onClick: () => appProps.navigate(`/space/${space.uuid}`) })),
          { name: 'New space', icon: 'plus', onClick: () => modalStore.openModal('create-space') },
        ],
        bottomButtons: () => [{ name: 'Settings', icon: 'gear', onClick: () => appProps.navigate('/settings') }],
      };
    },
  },
  HomePage: { component: () => <HomePage /> },
  Footer: { component: () => <div>Footer!!!!</div> },
};

function getProps(appProps: AppProps, schema: TemplateSchema) {
  const slots: Record<string, JSX.Element | undefined> = {};
  for (const [slotName, componentName] of Object.entries(schema.slots)) {
    const entry = componentRegistry[componentName];
    if (!entry) continue;
    const props = entry.getProps ? entry.getProps(appProps) : {};
    slots[slotName] = entry.component(props);
  }
  console.log('999', { slots, routes: schema.routes });
  return { slots, routes: schema.routes };
}

function getRoutes(appProps: AppProps, schema: TemplateSchema): RouteDefinition[] {
  return schema.routes.map((route) => {
    const entry = componentRegistry[route.component];
    if (!entry) return { path: route.path, component: () => null };
    const routeProps = entry.getProps ? entry.getProps(appProps) : {};
    return {
      path: route.path,
      component: () => entry.component(routeProps),
    };
  });
}

export function DynamicTemplate(props: DynamicTemplateProps) {
  return (
    <Row class={`we-dynamic-template ${props.class || ''}`} style={props.style}>
      {props.slots.sidebar && <aside>{props.slots.sidebar}</aside>}
      <main>
        {props.slots.header && <header>{props.slots.header}</header>}
        {props.slots.main}
        {props.slots.footer && <footer>{props.slots.footer}</footer>}
      </main>
    </Row>
  );
}

export const dynamicTemplate = {
  id: 'dynamic',
  name: 'Dynamic',
  description: 'A dynamic template defined by JSON schema for slots and routes.',
  propSchema,
  getProps,
  getRoutes,
  component: DynamicTemplate,
};
