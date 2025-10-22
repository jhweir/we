import { Accessor, createContext, createSignal, ParentProps, useContext } from 'solid-js';

export type ModalName = 'create-space'; // | 'edit-profile' | 'settings';

export interface ModalStore {
  // State
  createSpaceModalOpen: Accessor<boolean>;

  // Actions
  openModal: (modal: ModalName) => void;
  closeModal: (modal: ModalName) => void;
}

const ModalContext = createContext<ModalStore>();

export function ModalStoreProvider(props: ParentProps) {
  // Individual signals for each modal
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = createSignal(false);
  // Add more signals as you add more modals

  // Actions
  function openModal(modal: ModalName) {
    console.log('open modal: ', modal);
    if (modal === 'create-space') setCreateSpaceModalOpen(true);
    console.log('createSpaceModalOpen:', createSpaceModalOpen());
    // Add more cases as you add more modals
  }

  function closeModal(modal: ModalName) {
    console.log('close modal: ', modal);
    if (modal === 'create-space') setCreateSpaceModalOpen(false);
    console.log('createSpaceModalOpen:', createSpaceModalOpen());
    // Add more cases as you add more modals
  }

  const store: ModalStore = {
    // State
    createSpaceModalOpen,
    // Actions
    openModal,
    closeModal,
  };

  return <ModalContext.Provider value={store}>{props.children}</ModalContext.Provider>;
}

export function useModalStore(): ModalStore {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalStore must be used within ModalProvider');
  return ctx;
}

export default ModalStoreProvider;

// import { createContext, ParentProps, useContext } from 'solid-js';
// import { createStore } from 'solid-js/store';

// export type ModalName = 'createSpace'; // | 'editProfile' | 'settings';

// export type ModalState = {
//   [K in `${ModalName}ModalOpen`]: boolean;
// };

// export interface ModalStore {
//   state: ModalState;
//   actions: {
//     openModal: (modalName: ModalName) => void;
//     closeModal: (modalName: ModalName) => void;
//   };
// }

// const modalContext = createContext<ModalStore>();

// export function ModalProvider(props: ParentProps) {
//   const [state, setState] = createStore<ModalStore['state']>({
//     createSpaceModalOpen: false,
//   });

//   const actions = {
//     openModal: (modalName: ModalName) => setState({ [`${modalName}ModalOpen`]: true }),
//     closeModal: (modalName: ModalName) => setState({ [`${modalName}ModalOpen`]: false }),
//   };

//   return <modalContext.Provider value={{ state, actions }}>{props.children}</modalContext.Provider>;
// }

// export function useModalStore(): ModalStore {
//   const context = useContext(modalContext);
//   if (!context) throw new Error('useModalStore must be used within the ModalProvider');
//   return context;
// }

// export default ModalProvider;
