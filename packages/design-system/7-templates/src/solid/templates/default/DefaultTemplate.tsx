import { Column, Row } from '@we/components/solid';
import { JSX } from 'solid-js';

export type DefaultTemplateProps = {
  // Slots
  sidebarLeft?: JSX.Element;
  header?: JSX.Element;
  main?: JSX.Element;
  // Other optional props
  class?: string;
  style?: JSX.CSSProperties;
  children?: JSX.Element;
};

export function DefaultTemplate(props: DefaultTemplateProps) {
  return (
    <Row class={`we-default-template ${props.class || ''}`} style={props.style} bg="ui-0" data-we-template>
      <aside class="sidebar-left">{props.sidebarLeft}</aside>
      <Column ax="center" bg="ui-25">
        <header>{props.header}</header>
        <main>{props.main}</main>
      </Column>
    </Row>
  );
}
