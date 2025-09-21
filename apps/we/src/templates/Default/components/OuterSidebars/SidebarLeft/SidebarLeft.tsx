import { useNavigate } from '@solidjs/router';
import { SidebarWidget } from '@we/widgets/solid';

import { useAdamStore, useModalStore } from '@/stores';

import styles from '../OuterSidebars.module.scss';

const WECO_LOGO = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

export default function SidebarLeft() {
  const adamStore = useAdamStore();
  const modalStore = useModalStore();
  const navigate = useNavigate();

  const topButtons = [
    { name: 'Home', image: WECO_LOGO, onClick: () => navigate('/') },
    { name: 'Search', icon: 'magnifying-glass', onClick: () => navigate('/search') },
    { name: 'Spaces', icon: 'users-three', onClick: () => navigate('/all-spaces') },
    ...adamStore.state.mySpaces.map((space) => ({
      name: space.name,
      onClick: () => navigate(`/space/${space.uuid}`),
    })),
    { name: 'New space', icon: 'plus', onClick: () => modalStore.actions.openModal('createSpace') },
  ];

  const bottomButtons = [{ name: 'Settings', icon: 'gear', onClick: () => navigate('/settings') }];

  return (
    <SidebarWidget
      class={`${styles.sidebar} ${styles.left}`}
      width={90}
      topButtons={topButtons}
      bottomButtons={bottomButtons}
    />
  );
}
