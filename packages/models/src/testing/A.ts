import { Ad4mModel, ModelOptions, Property } from '@coasys/ad4m';

// pattern matching based on predicates, not property names!

@ModelOptions({ name: 'A' })
export class A extends Ad4mModel {
  @Property({ through: 'we://text-a', resolveLanguage: 'literal', writable: true })
  textA: string = '';
}
