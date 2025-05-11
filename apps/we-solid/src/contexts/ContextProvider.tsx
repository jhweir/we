import { ParentProps } from 'solid-js';
import AdamContext from './AdamContext';
import SpaceContext from './SpaceContext';

export default function ContextProvider(props: ParentProps) {
  return (
    <AdamContext>
      <SpaceContext>{props.children}</SpaceContext>
    </AdamContext>
  );
}
