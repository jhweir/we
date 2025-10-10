import { Column, Row } from '@we/components/solid';
import { JSX } from 'solid-js';

export type DefaultTemplateProps = {
  // Slots
  sidebar?: JSX.Element;
  header?: JSX.Element;
  pages: JSX.Element;
  // Other optional props
  class?: string;
  style?: JSX.CSSProperties;
};

export function DefaultTemplate(props: DefaultTemplateProps) {
  const baseClass = 'we-default-template';
  return (
    <Row class={`${baseClass} ${props.class || ''}`} style={props.style} bg="ui-0" data-we-template>
      {/* Sidebar */}
      {props.sidebar && <aside class={`${baseClass}-sidebar`}>{props.sidebar}</aside>}

      {/* Main content */}
      <Column class={`${baseClass}-content`} ax="center" bg="ui-25">
        {/* Header */}
        {props.header && <header class={`${baseClass}-header`}>{props.header}</header>}

        {/* Page routes */}
        <main class={`${baseClass}-pages`}>{props.pages}</main>
      </Column>
    </Row>
  );
}
