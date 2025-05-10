import type { Component, ParentProps } from 'solid-js';

const Test: Component<ParentProps<{ title: string }>> = (props) => {
  return (
    <we-row ax="center" style={{ width: '100vw' }}>
      <we-column bg="ui-25">Testtttt</we-column>
      <we-badge variant="success">Badge: {props.title}</we-badge>
      {props.children}
    </we-row>
  );
};

export default Test;
