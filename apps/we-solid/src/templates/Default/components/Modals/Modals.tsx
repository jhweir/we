import { useAdamContext } from '@/contexts/AdamContext';
import CreateSpaceModal from './CreateSpaceModal';

export default function Modals() {
  const { activeModals } = useAdamContext();

  return <>{activeModals().createSpace && <CreateSpaceModal />}</>;
}
