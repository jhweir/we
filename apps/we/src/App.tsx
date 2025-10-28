import AppSettings from '@/components/AppSettings';
import StoreProvider from '@/providers/StoreProvider';
import TemplateProvider from '@/providers/TemplateProvider';

export default function App() {
  return (
    <StoreProvider>
      <AppSettings />
      <TemplateProvider />
    </StoreProvider>
  );
}
