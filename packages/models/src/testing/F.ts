import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'F' })
export class F extends Ad4mModel {
  @Property({ through: 'we://text-f', resolveLanguage: 'literal', writable: true })
  textF: string = '';
}
