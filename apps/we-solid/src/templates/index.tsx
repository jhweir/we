import { useAdamContext } from '@/contexts/AdamContext';
import DefaultTemplate from '@/templates/Default';
import { ParentProps } from 'solid-js';

function getTemplateComponent(templateId: string) {
  switch (templateId) {
    //   case 'alternate': return AlternateTemplate;
    //   case 'minimal': return MinimalTemplate;
    default:
      return DefaultTemplate;
  }
}

export default function Template(props: ParentProps) {
  const { myThemeSettings } = useAdamContext();
  const TemplateComponent = getTemplateComponent(myThemeSettings.currentTemplate || 'default');

  return <TemplateComponent>{props.children}</TemplateComponent>;
}
