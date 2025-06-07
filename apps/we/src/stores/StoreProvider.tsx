import { ParentProps } from 'solid-js';
import AdamContext from './AdamStore';
import ModalsStore from './ModalStore';
import SpaceStore from './SpaceStore';

export default function StoreProvider(props: ParentProps) {
  return (
    <AdamContext>
      <ModalsStore>
        <SpaceStore>{props.children}</SpaceStore>
      </ModalsStore>
    </AdamContext>
  );
}
