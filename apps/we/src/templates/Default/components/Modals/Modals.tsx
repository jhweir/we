import { useModalStore } from '@/stores';
import CreateSpaceModal from './CreateSpaceModal';

export default function Modals() {
  const modalStore = useModalStore();

  return <>{modalStore.state.createSpaceModalOpen && <CreateSpaceModal />}</>;
}
