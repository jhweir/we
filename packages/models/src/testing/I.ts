import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'I' })
export class I extends Ad4mModel {
  @Property({ through: 'we://text-i', resolveLanguage: 'literal', writable: true })
  textI: string = '';
}
