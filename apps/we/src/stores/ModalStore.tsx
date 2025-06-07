import { createContext, ParentProps, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

export type ModalName = 'createSpace'; // | 'editProfile' | 'settings';

export type ModalState = {
  [K in `${ModalName}ModalOpen`]: boolean;
};

export interface ModalStore {
  state: ModalState;
  actions: {
    openModal: (modalName: ModalName) => void;
    closeModal: (modalName: ModalName) => void;
  };
}

const modalContext = createContext<ModalStore>();

export function ModalProvider(props: ParentProps) {
  const [state, setState] = createStore<ModalStore['state']>({
    createSpaceModalOpen: false,
  });

  const actions = {
    openModal: (modalName: ModalName) => setState({ [`${modalName}ModalOpen`]: true }),
    closeModal: (modalName: ModalName) => setState({ [`${modalName}ModalOpen`]: false }),
  };

  return <modalContext.Provider value={{ state, actions }}>{props.children}</modalContext.Provider>;
}

export function useModalStore(): ModalStore {
  const context = useContext(modalContext);
  if (!context) throw new Error('useModalStore must be used within the ModalProvider');
  return context;
}

export default ModalProvider;
