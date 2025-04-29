import { useAdamContext } from '@/contexts/AdamContext';
import styles from '../index.module.scss';

function CircleButton(props: { icon?: string; image?: string; initials?: string; onClick: () => void }) {
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
  const { mySpaces, setActiveModals } = useAdamContext();
  const wecoLogo = 'https://avatars.githubusercontent.com/u/34165012?s=200&v=4';

  return (
    <we-column py="700" ax="center" ay="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
      <we-column gap="400">
        <CircleButton image={wecoLogo} onClick={() => router.push('/')} />
        <CircleButton icon="magnifying-glass" onClick={() => router.push('/search')} />
        <CircleButton icon="users-three" onClick={() => router.push('/all-spaces')} />
        {mySpaces.map((space) => (
          <CircleButton key={space.uuid} initials={space.name} onClick={() => router.push(`/space/${space.uuid}`)} />
        ))}
        <CircleButton icon="plus" onClick={() => setActiveModals((prev) => ({ ...prev, createSpace: true }))} />
      </we-column>

      <we-column gap="400">
        <CircleButton icon="gear" onClick={() => router.push('/settings')} />
      </we-column>
    </we-column>
  );
}
