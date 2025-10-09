import { CircleButton, Column, Row } from '@we/components/solid';
import { HomePage, PageNotFound } from '@we/pages/solid';
import { DefaultTemplate } from '@we/templates/solid';
import { JSX } from 'solid-js';

export type ComponentRegistry = {
  [key: string]: (props: any) => JSX.Element;
};

export const componentRegistry: ComponentRegistry = {
  Column,
  Row,
  DefaultTemplate,
  CircleButton,
  'we-text': (props) => <span>{props.children}</span>,
  PageNotFound,
  HomePage,
};
