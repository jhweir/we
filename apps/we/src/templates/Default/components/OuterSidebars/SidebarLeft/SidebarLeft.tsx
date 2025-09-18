import { useNavigate } from '@solidjs/router';
import { Column } from '@we/components/solid';

import { useAdamStore, useModalStore } from '@/stores';

import styles from '../OuterSidebars.module.scss';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

function CircleButton(props: { key?: string; icon?: string; image?: string; initials?: string; onClick: () => void }) {
  const { icon, image, initials, onClick } = props;
  return (
    <we-button circle variant="ghost" onClick={onClick}>
      {icon && <we-icon name={icon} color="ui-700" />}
      {image && <we-avatar image={image} />}
      {initials && <we-avatar initials={initials} />}
    </we-button>
  );
}

export default function SidebarLeft() {
  const adamStore = useAdamStore();
  const modalStore = useModalStore();
  const navigate = useNavigate();

  return (
    <Column py="700" ax="center" ay="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
      <Column gap="400">
        <CircleButton image={WECO_LOGO} onClick={() => navigate('/')} />
        <CircleButton icon="magnifying-glass" onClick={() => navigate('/search')} />
        <CircleButton icon="users-three" onClick={() => navigate('/all-spaces')} />
        {adamStore.state.mySpaces.map((space) => (
          <CircleButton key={space.uuid} initials={space.name} onClick={() => navigate(`/space/${space.uuid}`)} />
        ))}
        <CircleButton icon="plus" onClick={() => modalStore.actions.openModal('createSpace')} />
      </Column>

      <Column gap="400">
        <CircleButton icon="gear" onClick={() => navigate('/settings')} />
      </Column>
    </Column>
  );
}
