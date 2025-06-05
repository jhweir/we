import { useAdamStore } from '@/stores/AdamStore';
import CreateSpaceModal from './CreateSpaceModal';

export default function Modals() {
  const adamStore = useAdamStore();

  return <>{adamStore.state.activeModals.createSpace && <CreateSpaceModal />}</>;
}
