import StoreProvider from '@/stores/StoreProvider';
import TemplateProvider from '@/templates/TemplateProvider';

export default function App() {
  return (
    <StoreProvider>
      <TemplateProvider />
    </StoreProvider>
  );
}
