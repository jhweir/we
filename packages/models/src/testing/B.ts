import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'B' })
export class B extends Ad4mModel {
  @Property({ through: 'we://text-b', resolveLanguage: 'literal', writable: true })
  textB: string = '';
}
