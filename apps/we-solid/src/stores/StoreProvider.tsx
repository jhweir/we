import { ParentProps } from 'solid-js';
import AdamContext from './AdamStore';
import SpaceStore from './SpaceStore';

export default function StoreProvider(props: ParentProps) {
  return (
    <AdamContext>
      <SpaceStore>{props.children}</SpaceStore>
    </AdamContext>
  );
}
