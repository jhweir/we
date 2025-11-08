import { designSystemKeys, mergeProps } from '@we/design-system-utils';
import { buildLayoutStyles, type LayoutProps } from '@we/solid-utils';
import { FlexCrossAxis, FlexMainAxis } from 'packages/types/dist';
import { createMemo, splitProps } from 'solid-js';

export type RowProps = Omit<LayoutProps, 'ax' | 'ay'> & { ax?: FlexMainAxis; ay?: FlexCrossAxis };

const DEFAULTS: Partial<RowProps> = {};
const rowKeys = [...designSystemKeys.filter((key) => key !== 'direction'), 'reverse', 'children'];

export function Row(allProps: RowProps) {
  const [designSystemProps, rest] = splitProps(allProps, rowKeys as (keyof RowProps)[]);
  const props = mergeProps(designSystemProps, DEFAULTS, rowKeys) as RowProps;
  const reactiveStyles = createMemo(() => buildLayoutStyles(props, 'row'));

  return (
    <div style={reactiveStyles()} {...rest}>
      {props.children}
    </div>
  );
}
