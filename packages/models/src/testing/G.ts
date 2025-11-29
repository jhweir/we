import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'G' })
export class G extends Ad4mModel {
  @Property({ through: 'we://text-g', resolveLanguage: 'literal', writable: true })
  textG: string = '';
}
