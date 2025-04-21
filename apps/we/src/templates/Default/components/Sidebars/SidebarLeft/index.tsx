import Link from 'next/link';
import { useAdamContext } from '../../../../../contexts/AdamContext';
import styles from '../index.module.scss';

export default function SidebarLeft() {
  const { mySpaces } = useAdamContext();
  const iconWeight = 'regular';

  return (
    <we-column p="400" alignY="between" bg="ui-0" class={`${styles.sidebar} ${styles.left}`}>
      <we-column gap="400">
        <Link href="/">
          <we-avatar src="https://avatars.githubusercontent.com/u/34165012?s=200&v=4" />
        </Link>

        <Link href="/search">
          <we-icon name="magnifying-glass" weight={iconWeight} color="ui-700" />
        </Link>

        <Link href="/all-spaces">
          <we-icon name="users-three" weight={iconWeight} color="ui-700" />
        </Link>

        <Link href="/new">
          <we-icon name="note-pencil" weight={iconWeight} color="ui-700" />
        </Link>

        {mySpaces.map((space) => (
          <Link href={`/space/${space.uuid}`}>{space.name}</Link>
        ))}
      </we-column>

      <we-column gap="400">
        <Link href="/">
          <we-icon name="gear" weight={iconWeight} color="ui-700" />
        </Link>
      </we-column>
    </we-column>
  );
}
