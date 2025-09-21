import { Column } from '@we/components/solid';
import { JSX } from 'solid-js';

export interface HomePageProps {
  class?: string;
  style?: JSX.CSSProperties;
}

export function HomePage(props: HomePageProps) {
  return (
    <Column
      class={`we-home-page ${props.class || ''}`}
      style={{ ...props.style }}
      ax="center"
      bg="ui-0"
      p="500"
      data-we-sidebar
    >
      <we-text size="600">Home page!!!</we-text>
    </Column>
  );
}
