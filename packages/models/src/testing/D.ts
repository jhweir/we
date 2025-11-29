import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'D' })
export class D extends Ad4mModel {
  @Property({ through: 'we://text-d', resolveLanguage: 'literal', writable: true })
  textD: string = '';
}
