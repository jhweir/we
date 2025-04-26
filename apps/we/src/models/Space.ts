import { Ad4mModel, Collection, Flag, ModelOptions, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'Space' })
export default class Space extends Ad4mModel {
  @Property({ through: 'we://has_uuid', resolveLanguage: 'literal', writable: true })
  uuid: string = '';

  @Property({ through: 'we://has_name', resolveLanguage: 'literal', writable: true })
  name: string = '';

  @Property({ through: 'we://has_description', resolveLanguage: 'literal', writable: true })
  description: string = '';

  @Property({ through: 'we://has_visability', resolveLanguage: 'literal', writable: true })
  visibility: string = '';

  @Collection({ through: 'we://has_location' })
  locations: string[] = [];
}
