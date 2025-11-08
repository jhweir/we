import { designSystemKeys, mergeProps } from '@we/design-system-utils';
import { buildLayoutStyles, type LayoutProps } from '@we/solid-utils';
import { FlexCrossAxis, FlexMainAxis } from 'packages/types/dist';
import { createMemo, splitProps } from 'solid-js';

export type ColumnProps = Omit<LayoutProps, 'ax' | 'ay'> & { ax?: FlexCrossAxis; ay?: FlexMainAxis };

const DEFAULTS: Partial<ColumnProps> = {};
const columnKeys = [...designSystemKeys.filter((key) => key !== 'direction'), 'reverse', 'children'];

export function Column(allProps: ColumnProps) {
  const [designSystemProps, rest] = splitProps(allProps, columnKeys as (keyof ColumnProps)[]);
  const props = mergeProps(designSystemProps, DEFAULTS, columnKeys) as ColumnProps;
  const reactiveStyles = createMemo(() => buildLayoutStyles(props, 'column'));

  return (
    <div style={reactiveStyles()} {...rest}>
      {props.children}
    </div>
  );
}
