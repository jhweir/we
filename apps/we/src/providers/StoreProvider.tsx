import { ParentProps } from 'solid-js';

import {
  AdamStoreProvider,
  ModalStoreProvider,
  SpaceStoreProvider,
  TemplateStoreProvider,
  ThemeStoreProvider,
} from '@/stores';

export default function StoreProvider(props: ParentProps) {
  return (
    <AdamStoreProvider>
      <ThemeStoreProvider>
        <TemplateStoreProvider>
          <ModalStoreProvider>
            <SpaceStoreProvider>{props.children}</SpaceStoreProvider>
          </ModalStoreProvider>
        </TemplateStoreProvider>
      </ThemeStoreProvider>
    </AdamStoreProvider>
  );
}
