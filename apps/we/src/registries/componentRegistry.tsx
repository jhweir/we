import { CircleButton, Column, PopoverMenu, RerenderLog, Row } from '@we/components/solid';
import { HomePage, PageNotFound, SpacePage } from '@we/pages/solid';
import type { ComponentRegistry } from '@we/schema-renderer/solid';
import { DefaultTemplate } from '@we/templates/solid';
import { CreateSpaceModalWidget, SpaceSidebarWidget } from '@we/widgets/solid';

export const componentRegistry: ComponentRegistry = {
  // @we/elements
  'we-text': (props) => <we-text {...props}>{props.children}</we-text>,
  'we-button': (props) => <we-button {...props}>{props.children}</we-button>,

  // @we/components
  Column,
  Row,
  CircleButton,
  PopoverMenu,
  RerenderLog,

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
