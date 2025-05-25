import { useAdamStore } from '@/stores/AdamStore';
import DefaultTemplate from '@/templates/Default/DefaultTemplate';
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
  const adamStore = useAdamStore();
  const TemplateComponent = getTemplateComponent('default'); // adamStore.state.myThemeSettings.currentTemplate

  return <TemplateComponent>{props.children}</TemplateComponent>;
}
