import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'H' })
export class H extends Ad4mModel {
  @Property({ through: 'we://text-h', resolveLanguage: 'literal', writable: true })
  textH: string = '';
}
