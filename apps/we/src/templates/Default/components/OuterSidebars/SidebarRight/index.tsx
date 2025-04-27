import { useAdamContext } from '@/contexts/AdamContext';
import styles from '../index.module.scss';

export default function SidebarRight() {
  const { myThemeSettings } = useAdamContext();
  const { iconWeight } = myThemeSettings;

  return (
    <we-column p="400" alignY="between" bg="ui-0" class={`${styles.sidebar} ${styles.right}`}>
      {/* <we-column gap="400">
        <Link href="/">
          <we-avatar src="https://weco-prod-user-flag-images.s3.eu-west-1.amazonaws.com/user-flag-image-1-1-1597655878532-gif-1693527111503.gif" />
        </Link>

        <Link href="/">
          <we-icon name="bell" weight={iconWeight} color="ui-700" />
        </Link>

        <Link href="/">
          <we-icon name="envelope" weight={iconWeight} color="ui-700" />
        </Link>

        <Link href="/">
          <we-icon name="cube" weight={iconWeight} color="ui-700" />
        </Link>

        <Link href="/posts/1">1</Link>
        <Link href="/posts/2">2</Link>
      </we-column>

      <we-column gap="400">
        <Link href="/">
          <we-icon name="question" weight={iconWeight} color="ui-700" />
        </Link>
      </we-column> */}
    </we-column>
  );
}
