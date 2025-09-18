import { Column, Row } from '@we/components/solid';

import { useSpaceStore } from '@/stores/SpaceStore';

export default function SidebarLeft() {
  const spaceStore = useSpaceStore();

  return (
    <Column
      bg="ui-25"
      style={{ width: '400px', height: '100vh', position: 'fixed', 'border-right': '1px solid var(--we-color-ui-100)' }}
    >
      <div style={{ height: '200px', background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)' }} />
      <Column gap="400">
        <Row gap="300" ay="center">
          <we-avatar size="xxl" image="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
          <we-text size="800" weight="500" nomargin>
            {spaceStore.state.space.name}
          </we-text>
        </Row>

        <we-text>{spaceStore.state.space.description}</we-text>
      </Column>
    </Column>
  );
}
