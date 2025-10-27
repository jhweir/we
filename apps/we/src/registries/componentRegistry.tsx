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
  RerenderLog, // Log component remounts for testing

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

// Ideas:
// Hero — common landing section (title, subtitle, image, cta)
// Card — repeatable content block (title, image, footer, actions)
// Image/Media — src, alt, ratio, fit
// Heading / Text primitives — H1..H4, Paragraph (gives AI typographic control)
// List / Repeat (data-driven) — itemTemplate + itemsSource ($store/$map)
// Nav / Menu — items array for site structure
// Modal / Drawer — overlay patterns
// Form primitives (Input, Select, Button) or a Form container (fields + onSubmit)
// Badge / Tag / Avatar — small metadata visuals
// DataTable (if you have tabular content use-cases)
