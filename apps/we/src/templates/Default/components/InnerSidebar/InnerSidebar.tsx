import { useSpaceStore } from '@/stores/SpaceStore';

export default function SidebarLeft() {
  const spaceStore = useSpaceStore();

  return (
    <we-column
      bg="ui-25"
      style={{ width: '400px', height: '100vh', position: 'fixed', borderRight: '1px solid var(--we-color-ui-100)' }}
    >
      <div style={{ height: '200px', background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)' }} />
      <we-column p="z" gap="400">
        <we-row gap="300" ay="center">
          <we-avatar size="xxl" image="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
          <we-text size="800" weight="500" nomargin>
            {spaceStore.state.space.name}
          </we-text>
        </we-row>

        <we-text>{spaceStore.state.space.description}</we-text>
      </we-column>
    </we-column>
  );
}
