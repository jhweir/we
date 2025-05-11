import { useAdamContext } from '@/contexts/AdamContext';
import CreateSpaceModal from './CreateSpace';

export default function Modals() {
  const { activeModals } = useAdamContext();

  return <>{activeModals().createSpace && <CreateSpaceModal />}</>;
}
