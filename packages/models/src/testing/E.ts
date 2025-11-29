import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'E' })
export class E extends Ad4mModel {
  @Property({ through: 'we://text-e', resolveLanguage: 'literal', writable: true })
  textE: string = '';
}
