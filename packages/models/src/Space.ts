import { Ad4mModel, Collection, ModelOptions, Optional, Property } from '@coasys/ad4m';

@ModelOptions({ name: 'Space' })
export class Space extends Ad4mModel {
  @Property({ through: 'we://has_uuid', resolveLanguage: 'literal', writable: true })
  uuid: string = '';

  @Property({ through: 'we://has_name', resolveLanguage: 'literal', writable: true })
  name: string = '';

  @Property({ through: 'we://has_description', resolveLanguage: 'literal', writable: true })
  description: string = '';

  @Optional({ through: 'we://has_visibility', resolveLanguage: 'literal', writable: true })
  visibility: string = '';

  @Collection({ through: 'we://has_location' })
  locations: string[] = [];
}

export interface SpaceType {
  uuid: string;
  name: string;
  description: string;
  visibility: string;
  locations: string[];
}
