import { ParentProps } from 'solid-js';

// import AdamContext from '../stores/AdamStore';
// import ModalsStore from '../stores/ModalStore';
// import SpaceStore from '../stores/SpaceStore';
// import ThemeStore from '../stores/ThemeStore';
import { AdamProvider, ModalProvider, SpaceProvider, ThemeProvider } from '@/stores';

export default function StoreProvider(props: ParentProps) {
  return (
    <AdamProvider>
      <ThemeProvider>
        <ModalProvider>
          <SpaceProvider>{props.children}</SpaceProvider>
        </ModalProvider>
      </ThemeProvider>
    </AdamProvider>
  );
}
