import { CircleButton, Column, PopoverMenu, Row } from '@we/components/solid';
import { HomePage, PageNotFound, SpacePage } from '@we/pages/solid';
import { DefaultTemplate } from '@we/templates/solid';
import { CreateSpaceModalWidget, SpaceSidebarWidget } from '@we/widgets/solid';
import { JSX } from 'solid-js';

export type ComponentRegistry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (props: any) => JSX.Element;
};

export const componentRegistry: ComponentRegistry = {
  // @we/elements
  'we-text': (props) => <we-text {...props}>{props.children}</we-text>,
  'we-button': (props) => <we-button {...props}>{props.children}</we-button>,

  // @we/components
  Column,
  Row,
  CircleButton,
  PopoverMenu,

  // @we/widgets
  CreateSpaceModalWidget,
  SpaceSidebarWidget,

  // @we/pages
  PageNotFound,
  HomePage,
  SpacePage,

  // @we/templates
  DefaultTemplate,
};
