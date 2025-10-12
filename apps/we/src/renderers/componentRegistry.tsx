import { CircleButton, Column, PopoverMenu, Row } from '@we/components/solid';
import { HomePage, PageNotFound } from '@we/pages/solid';
import { DefaultTemplate } from '@we/templates/solid';
import { CreateSpaceModalWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

export type ComponentRegistry = {
  [key: string]: (props: any) => JSX.Element;
};

export const componentRegistry: ComponentRegistry = {
  // Elements
  'we-text': (props) => <we-text>{props.children}</we-text>,

  // Components
  Column,
  Row,
  CircleButton,
  PopoverMenu,

  // Widgets
  CreateSpaceModalWidget,

  // Pages
  PageNotFound,
  HomePage,

  // Templates
  DefaultTemplate,
};
