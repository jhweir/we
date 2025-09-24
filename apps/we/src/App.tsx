import TemplateProvider from '@/components/TemplateProvider';
import StoreProvider from '@/stores/StoreProvider';

export default function App() {
  return (
    <StoreProvider>
      <TemplateProvider />
    </StoreProvider>
  );
}
