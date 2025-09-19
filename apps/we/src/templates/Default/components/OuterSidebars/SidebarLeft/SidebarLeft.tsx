import { useNavigate } from '@solidjs/router';
import { CircleButton, Column } from '@we/components/solid';

import { useAdamStore, useModalStore } from '@/stores';

import styles from '../OuterSidebars.module.scss';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

export default function SidebarLeft() {
  const adamStore = useAdamStore();
  const modalStore = useModalStore();
  const navigate = useNavigate();

  return (
    <Column py="700" ax="center" ay="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
      <Column gap="400">
        <CircleButton name="Home" image={WECO_LOGO} onClick={() => navigate('/')} />
        <CircleButton name="Search" icon="magnifying-glass" onClick={() => navigate('/search')} />
        <CircleButton name="Spaces" icon="users-three" onClick={() => navigate('/all-spaces')} />
        {adamStore.state.mySpaces.map((space) => (
          <CircleButton name={space.name} onClick={() => navigate(`/space/${space.uuid}`)} />
        ))}
        <CircleButton name="New space" icon="plus" onClick={() => modalStore.actions.openModal('createSpace')} />
      </Column>

      <Column gap="400">
        <CircleButton name="Settings" icon="gear" onClick={() => navigate('/settings')} />
      </Column>
    </Column>
  );
}
