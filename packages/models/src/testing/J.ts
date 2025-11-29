import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'J' })
export class J extends Ad4mModel {
  @Property({ through: 'we://text-j', resolveLanguage: 'literal', writable: true })
  textJ: string = '';
}
