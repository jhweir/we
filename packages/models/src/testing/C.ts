import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'C' })
export class C extends Ad4mModel {
  @Property({ through: 'we://text-c', resolveLanguage: 'literal', writable: true })
  textC: string = '';
}
