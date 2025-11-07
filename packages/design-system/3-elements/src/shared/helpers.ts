import type { DesignSystemProps } from '@we/types';
import { paddingKeys, marginKeys, radiusKeys, tokenVar } from './tokens';

// Helper to update or remove a style property
function updateStyle(el: HTMLElement, prop: string, value?: string) {
  if (value !== undefined && value !== null && value !== '') el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
}

// Set design system CSS variables on an element
export function setDesignSystemVars(el: HTMLElement, props: DesignSystemProps, type?: string) {
  const prefix = `--we-${type ? `${type}-` : ''}`;

  // Colors
  updateStyle(el, `${prefix}bg`, props.bg ? tokenVar('color', props.bg, '') : undefined);
  updateStyle(el, `${prefix}color`, props.color ? tokenVar('color', props.color, '') : undefined);

  // Flex
  updateStyle(el, `${prefix}direction`, props.direction);
  updateStyle(el, `${prefix}ax`, props.ax);
  updateStyle(el, `${prefix}ay`, props.ay);
  updateStyle(el, `${prefix}wrap`, 'wrap' in props ? (props.wrap ? 'wrap' : 'nowrap') : undefined);
  updateStyle(el, `${prefix}gap`, props.gap ? tokenVar('space', props.gap) : undefined);

  // Margin
  updateStyle(
    el,
    `${prefix}margin`,
    marginKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('space', props.mt || props.my || props.m),
          tokenVar('space', props.mr || props.mx || props.m),
          tokenVar('space', props.mb || props.my || props.m),
          tokenVar('space', props.ml || props.mx || props.m),
        ].join(' ')
      : undefined,
  );

  // Padding
  updateStyle(
    el,
    `${prefix}padding`,
    paddingKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('space', props.pt || props.py || props.p),
          tokenVar('space', props.pr || props.px || props.p),
          tokenVar('space', props.pb || props.py || props.p),
          tokenVar('space', props.pl || props.px || props.p),
        ].join(' ')
      : undefined,
  );

  // Radius
  updateStyle(
    el,
    `${prefix}radius`,
    radiusKeys.some((k) => typeof props[k] !== 'undefined' && props[k] !== null)
      ? [
          tokenVar('radius', props.rtl || props.rt || props.rl || props.r),
          tokenVar('radius', props.rtr || props.rt || props.rr || props.r),
          tokenVar('radius', props.rbr || props.rb || props.rr || props.r),
          tokenVar('radius', props.rbl || props.rb || props.rl || props.r),
        ].join(' ')
      : undefined,
  );
}

// Generate base CSS variables for design system props
export function designSystemBaseCssVars(overrides?: Partial<DesignSystemProps>) {
  return `
    background: var(--we-bg, ${tokenVar('color', overrides?.bg, 'var(--we-color-primary-200)')});
    color: var(--we-color, ${tokenVar('color', overrides?.color, 'var(--we-color-primary-600)')});

    flex-direction: var(--we-direction, ${overrides?.direction ?? 'row'});
    justify-content: var(--we-ax, ${overrides?.ax ?? 'start'});
    align-items: var(--we-ay, ${overrides?.ay ?? 'start'});
    flex-wrap: var(--we-wrap, ${overrides?.wrap ?? 'nowrap'});
    gap: var(--we-gap, ${tokenVar('space', overrides?.gap, '0')});

    margin: var(--we-margin, ${tokenVar('space', overrides?.m, '0')});
    padding: var(--we-padding, ${tokenVar('space', overrides?.p, '0')});
    border-radius: var(--we-radius, ${tokenVar('radius', overrides?.r, '0')});
  `;
}

// Generate CSS variables for a specific state (hover, active etc.)
export function designSystemStateCssVars(state: 'hover' | 'active', overrides?: Partial<DesignSystemProps>) {
  const prefix = `--we-${state}-`;
  return `
    background: var(${prefix}bg, var(--we-bg, ${tokenVar('color', overrides?.bg, 'var(--we-color-primary-200)')}));
    color: var(${prefix}color, var(--we-color, ${tokenVar('color', overrides?.color, 'var(--we-color-primary-600)')}));

    flex-direction: var(${prefix}direction, var(--we-direction, ${overrides?.direction ?? 'row'}));
    justify-content: var(${prefix}ax, var(--we-ax, ${overrides?.ax ?? 'start'}));
    align-items: var(${prefix}ay, var(--we-ay, ${overrides?.ay ?? 'start'}));
    flex-wrap: var(${prefix}wrap, var(--we-wrap, ${overrides?.wrap ?? 'nowrap'}));
    gap: var(${prefix}gap, var(--we-gap, ${tokenVar('space', overrides?.gap, '0')}));

    margin: var(${prefix}margin, var(--we-margin, ${tokenVar('space', overrides?.m, '0')}));
    padding: var(${prefix}padding, var(--we-padding, ${tokenVar('space', overrides?.p, '0')}));
    border-radius: var(${prefix}radius, var(--we-radius, ${tokenVar('radius', overrides?.r, '0')}));
  `;
}
