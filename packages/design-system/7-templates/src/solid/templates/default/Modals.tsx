import { CreateSpaceModalWidget } from '@we/widgets/solid';

export default function Modals() {
  const modalStore = useModalStore();

  return <>{modalStore.state.createSpaceModalOpen && <CreateSpaceModalWidget />}</>;
}
