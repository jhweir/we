import { useAdamContext } from '@/contexts/AdamContext';
import DefaultTemplate from '@/templates/Default';
import { ReactNode } from 'react';

function getTemplateComponent(templateId: string) {
  switch (templateId) {
    //   case 'alternate': return AlternateTemplate;
    //   case 'minimal': return MinimalTemplate;
    default:
      return DefaultTemplate;
  }
}

export default function Template({ children }: { children: ReactNode }) {
  const { myThemeSettings } = useAdamContext();
  const TemplateComponent = getTemplateComponent(myThemeSettings.currentTemplate || 'default');

  return <TemplateComponent>{children}</TemplateComponent>;
}
