import { ParentProps } from 'solid-js';

import AdamContext from './AdamStore';
import ModalsStore from './ModalStore';
import SpaceStore from './SpaceStore';
import ThemeStore from './ThemeStore';

export default function StoreProvider(props: ParentProps) {
  return (
    <AdamContext>
      <ThemeStore>
        <ModalsStore>
          <SpaceStore>{props.children}</SpaceStore>
        </ModalsStore>
      </ThemeStore>
    </AdamContext>
  );
}
