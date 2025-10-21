// import { For, onMount } from 'solid-js';
// import { createStore } from 'solid-js/store';

// import { RerenderLog } from './RerenderLog';

// export function ListRendering() {
//   onMount(() => console.log('Re-mounted ListRendering component'));

//   const [items, setItems] = createStore([{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }]);

//   return (
//     <div>
//       <p>List Rendering</p>
//       <button onClick={() => setItems([...items, { name: `Item ${items.length + 1}` }])}>Add Item</button>
//       <For each={items} fallback={<p>Loading items...</p>}>
//         {(item) => <RerenderLog location={`List item: ${item.name}`} />}
//       </For>
//     </div>
//   );
// }

import { For, onMount } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

import { RerenderLog } from './RerenderLog';

const testButtons = {
  type: 'Row',
  props: { bg: 'ui-200', ay: 'center', gap: '400', p: '400' },
  children: [
    { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Testing buttons'] },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.removeTemplateHeaderSlot' },
        children: ['removeTemplateHeaderSlot'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.editSpacePageHeaderButton' },
        children: ['editSpacePageHeaderButton'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.editPostsPageHeaderButton' },
        children: ['editPostsPageHeaderButton'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'templateStore.addPostsPageHeaderButton' },
        children: ['addPostsPageHeaderButton'],
      },
    },
  ],
};

const templateSidebar = {
  type: 'Column',
  props: { bg: 'ui-0', p: '500', ay: 'between' },
  children: [
    {
      type: 'Column',
      props: { ax: 'center', gap: '500' },
      children: [
        {
          type: 'CircleButton',
          props: {
            label: 'Home',
            image: 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4',
            onClick: { $action: 'adamStore.navigate', args: ['/'] },
          },
        },
        {
          type: 'CircleButton',
          props: {
            label: 'Search',
            icon: 'magnifying-glass',
            onClick: { $action: 'adamStore.navigate', args: ['/search'] },
          },
        },
        {
          type: '$forEach',
          props: { items: { $store: 'adamStore.mySpaces' }, as: 'space' },
          children: [
            {
              type: 'CircleButton',
              props: {
                label: { $expr: 'space.name' },
                onClick: { $action: 'adamStore.navigate', args: [{ $expr: '`/space/${space.uuid}`' }] },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Column',
      props: { ax: 'center', gap: '500' },
      children: [
        {
          type: 'CircleButton',
          props: {
            label: 'New Space',
            icon: 'plus',
            onClick: { $action: 'modalStore.openModal', args: ['create-space'] },
          },
        },
      ],
    },
    { type: 'RerenderLog', props: { location: 'Template Sidebar' } },
  ],
};

const templateHeader = {
  type: 'Row',
  props: { p: '400', gap: '400', ax: 'end', ay: 'center' },
  children: [
    {
      type: 'PopoverMenu',
      props: {
        options: { $store: 'themeStore.themes' },
        currentOption: { $store: 'themeStore.currentTheme' },
        setOption: { $store: 'themeStore.setCurrentTheme' },
      },
    },
    {
      type: 'PopoverMenu',
      props: {
        options: {
          $map: {
            items: { $store: 'templateStore.templates' },
            select: { id: '$item.id', name: '$item.name', icon: '$item.icon' },
          },
        },
        currentOption: {
          $pick: {
            from: { $store: 'templateStore.currentTemplate' },
            props: ['name', 'icon'],
          },
        },
        setOption: { $store: 'templateStore.setCurrentTemplate' },
      },
    },
    { type: 'RerenderLog', props: { location: 'Template Header' } },
  ],
};

const templateModals = {
  children: [
    {
      type: '$if',
      props: {
        condition: { $store: 'modalStore.createSpaceModalOpen' },
        then: {
          type: 'CreateSpaceModalWidget',
          props: {
            adamClient: { $store: 'adamStore.adamClient' },
            close: { $action: 'modalStore.closeModal', args: ['create-space'] },
            addNewSpace: { $action: 'adamStore.addNewSpace' },
          },
        },
      },
    },
    { type: 'RerenderLog', props: { location: 'Template Modals' } },
  ],
};

const spacePageSidebar = {
  type: 'SpaceSidebarWidget',
  props: {
    name: { $store: 'spaceStore.space.name' },
    description: { $store: 'spaceStore.space.description' },
  },
  children: [{ type: 'RerenderLog', props: { location: 'SpacePage Sidebar' } }],
};

const spacePageHeader = {
  type: 'Row',
  props: { bg: 'ui-100', p: '400', gap: '400', ay: 'center' },
  children: [
    { type: 'we-text', props: { size: '600', nomargin: true }, children: ['Space page'] },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'adamStore.navigate', args: ['.'] },
        children: ['About'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'adamStore.navigate', args: ['./posts'] },
        children: ['Posts'],
      },
    },
    {
      type: 'we-button',
      props: {
        variant: 'subtle',
        onClick: { $action: 'adamStore.navigate', args: ['./users'] },
        children: ['Users'],
      },
    },
    { type: 'RerenderLog', props: { location: 'SpacePage Header' } },
  ],
};

export const defaultTemplateSchema = {
  meta: {
    name: 'Default template',
    description: 'A simple template with a sidebar, header, and page area.',
    icon: 'layout',
  },
  type: 'DefaultTemplate',
  slots: { sidebar: templateSidebar, header: templateHeader, modals: templateModals },
  children: [{ type: 'ListRendering' }, testButtons, { type: '$routes' }],
  routes: [
    { path: '*', type: 'PageNotFound' },
    { path: '/', type: 'HomePage' },
    {
      path: '/space/:spaceId',
      type: 'SpacePage',
      slots: { sidebar: spacePageSidebar, header: spacePageHeader },
      children: [{ type: '$routes' }],
      routes: [
        {
          path: '/*',
          type: 'we-text',
          props: { size: '800' },
          children: ['Space page not found...!'],
        },
        {
          path: '/',
          type: 'Row',
          props: { bg: 'ui-200', ay: 'center', px: '400', style: { height: '60px' } },
          children: [
            { type: 'we-text', props: { size: '600', nomargin: true }, children: ['About sub-page'] },
            { type: 'RerenderLog', props: { location: 'AboutPage' } },
          ],
        },
        {
          path: '/posts',
          children: [
            {
              type: 'Row',
              props: { bg: 'ui-200', ay: 'center', gap: '400', px: '400', style: { height: '60px' } },
              key: 'posts-header-btns',
              children: [
                { type: 'RerenderLog', key: 'a', props: { location: 'PostsPage header buttons' } },
                { type: 'we-text', key: 'b', props: { size: '600', nomargin: true }, children: ['Posts sub-page'] },
                {
                  type: 'we-button',
                  key: 'c',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['./1'] },
                    children: ['Post 1'],
                  },
                },
                {
                  type: 'we-button',
                  key: 'd',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['./2'] },
                    children: ['Post 2'],
                  },
                },
                {
                  type: 'we-button',
                  key: 'e',
                  props: {
                    variant: 'subtle',
                    onClick: { $action: 'adamStore.navigate', args: ['../users'] },
                    children: ['Return back up to users'],
                  },
                },
                // { type: 'RerenderLog', key: 'd', props: { location: 'PostsPage header buttons' } },
              ],
            },
            {
              type: 'Column',
              props: { bg: 'ui-300', p: '400' },
              children: [{ type: '$routes' }],
            },
            { type: 'RerenderLog', props: { location: 'PostsPage' } },
          ],
          routes: [
            { path: '/*', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post not found...'] },
            { path: '/', type: 'we-text', props: { size: '600', nomargin: true }, children: ['No posts selected...'] },
            { path: '/1', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 1 sub-sub-page'] },
            { path: '/2', type: 'we-text', props: { size: '600', nomargin: true }, children: ['Post 2 sub-sub-page'] },
          ],
        },
        {
          path: '/users',
          type: 'Row',
          props: { bg: 'ui-200', ay: 'center', px: '400', style: { height: '60px' } },
          children: [
            { type: 'we-text', props: { size: '600', nomargin: true }, children: ['User sub-page'] },
            { type: 'RerenderLog', props: { location: 'UserPage' } },
          ],
        },
      ],
    },
  ],
};

export function ListRendering() {
  onMount(() => console.log('Re-mounted ListRendering component'));

  const [schema, setSchema] = createStore(defaultTemplateSchema);

  // function addItem() {

  //   setSchema('routes', 2, 'routes', 2, 'children', 0, 'children', (children: any) => [
  //     ...children,
  //     {
  //       type: 'we-button',
  //       key: 'new-btn-' + Date.now(), // or use uuid()
  //       props: {
  //         variant: 'subtle',
  //         children: ['New button'],
  //       },
  //     },
  //   ]);
  // }

  function addItem() {
    setSchema(
      'routes',
      2,
      'routes',
      2,
      'children',
      0,
      'children',
      produce((children: any[] = []) => {
        children.push({
          type: 'we-button',
          key: 'new-btn-' + Date.now(),
          props: { variant: 'subtle', children: ['New button'] },
        });
        return children; // produce returns the mutated array
      }),
    );
  }

  return (
    <div>
      <p>List Rendering</p>
      <button onClick={addItem}>Add Item</button>
      <For each={(schema as any).routes[2].routes[2].children[0].children} fallback={<p>Loading items...</p>}>
        {(item) => <RerenderLog location={`List item: ${item.key}`} />}
      </For>
    </div>
  );
}

// export function ListRendering() {
//   onMount(() => console.log('Re-mounted ListRendering component'));

//   const initialSchema = {
//     type: 'Type',
//     children: [
//       { type: 'ChildType1' },
//       { type: 'ChildType2' },
//       { type: 'ChildType3', items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }] },
//     ],
//   };

//   const [schema, setSchema] = createStore(initialSchema);

//   function addItem() {
//     setSchema('children', 2, 'items', (it: any) => [...it, { name: `Item ${it.length + 1}` }]);
//   }

//   return (
//     <div>
//       <p>List Rendering</p>
//       <button onClick={addItem}>Add Item</button>
//       <For each={schema.children[2].items} fallback={<p>Loading items...</p>}>
//         {(item) => <RerenderLog location={`List item: ${item.name}`} />}
//       </For>
//     </div>
//   );
// }
