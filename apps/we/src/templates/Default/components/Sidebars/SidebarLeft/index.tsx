'use client';

import { useAdamContext } from '@/contexts/AdamContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../index.module.scss';

export default function SidebarLeft() {
  const { mySpaces, myThemeSettings, setActiveModals } = useAdamContext();
  const { iconWeight } = myThemeSettings;
  const router = useRouter();

  return (
    <we-column p="400" alignY="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
      <we-column gap="400">
        <we-button circle variant="ghost" onClick={() => router.push('/')}>
          <we-avatar src="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
        </we-button>
        {/* <Link href="/">
          <we-avatar src="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
        </Link> */}

        <we-button circle variant="ghost" onClick={() => router.push('/search')}>
          <we-icon name="magnifying-glass" weight={iconWeight} color="ui-700" />
        </we-button>

        <we-button circle variant="ghost" onClick={() => router.push('/all-spaces')}>
          <we-icon name="users-three" weight={iconWeight} color="ui-700" />
        </we-button>

        <we-button circle variant="ghost" onClick={() => router.push('/new')}>
          <we-icon name="note-pencil" weight={iconWeight} color="ui-700" />
        </we-button>

        {mySpaces.map((space) => (
          <we-button circle variant="ghost" onClick={() => router.push(`/space/${space.uuid}`)}>
            <we-avatar initials={space.name} />
            {/* src={space.flagImage} */}
          </we-button>
        ))}

        <we-button circle variant="ghost" onClick={() => setActiveModals((prev) => ({ ...prev, createSpace: true }))}>
          <we-icon name="plus" />
        </we-button>
      </we-column>

      <we-column gap="400">
        <Link href="/">
          <we-icon name="gear" weight={iconWeight} color="ui-700" />
        </Link>
      </we-column>
    </we-column>
  );
}
