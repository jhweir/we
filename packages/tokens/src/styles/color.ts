/* SYSTEM CONFIGURATION */
const system = {
  saturation: 'var(--we-color-saturation)',
  subtractor: 'var(--we-color-subtractor)',
  multiplier: 'var(--we-color-multiplier)',
};

/* LIGHTNESS SCALE */
const lightness = {
  '0': 'var(--we-color-lightness-0)',
  '25': 'var(--we-color-lightness-25)',
  '50': 'var(--we-color-lightness-50)',
  '75': 'var(--we-color-lightness-75)',
  '100': 'var(--we-color-lightness-100)',
  '200': 'var(--we-color-lightness-200)',
  '300': 'var(--we-color-lightness-300)',
  '400': 'var(--we-color-lightness-400)',
  '500': 'var(--we-color-lightness-500)',
  '600': 'var(--we-color-lightness-600)',
  '700': 'var(--we-color-lightness-700)',
  '800': 'var(--we-color-lightness-800)',
  '900': 'var(--we-color-lightness-900)',
  '1000': 'var(--we-color-lightness-1000)',
};

/* COLOR PALETTES */
const primary = {
  hue: 'var(--we-color-primary-hue)',
  '0': 'var(--we-color-primary-0)',
  '25': 'var(--we-color-primary-25)',
  '50': 'var(--we-color-primary-50)',
  '75': 'var(--we-color-primary-75)',
  '100': 'var(--we-color-primary-100)',
  '200': 'var(--we-color-primary-200)',
  '300': 'var(--we-color-primary-300)',
  '400': 'var(--we-color-primary-400)',
  '500': 'var(--we-color-primary-500)',
  '600': 'var(--we-color-primary-600)',
  '700': 'var(--we-color-primary-700)',
  '800': 'var(--we-color-primary-800)',
  '900': 'var(--we-color-primary-900)',
  '1000': 'var(--we-color-primary-1000)',
};

const success = {
  hue: 'var(--we-color-success-hue)',
  '0': 'var(--we-color-success-0)',
  '25': 'var(--we-color-success-25)',
  '50': 'var(--we-color-success-50)',
  '75': 'var(--we-color-success-75)',
  '100': 'var(--we-color-success-100)',
  '200': 'var(--we-color-success-200)',
  '300': 'var(--we-color-success-300)',
  '400': 'var(--we-color-success-400)',
  '500': 'var(--we-color-success-500)',
  '600': 'var(--we-color-success-600)',
  '700': 'var(--we-color-success-700)',
  '800': 'var(--we-color-success-800)',
  '900': 'var(--we-color-success-900)',
  '1000': 'var(--we-color-success-1000)',
};

const warning = {
  hue: 'var(--we-color-warning-hue)',
  '0': 'var(--we-color-warning-0)',
  '25': 'var(--we-color-warning-25)',
  '50': 'var(--we-color-warning-50)',
  '75': 'var(--we-color-warning-75)',
  '100': 'var(--we-color-warning-100)',
  '200': 'var(--we-color-warning-200)',
  '300': 'var(--we-color-warning-300)',
  '400': 'var(--we-color-warning-400)',
  '500': 'var(--we-color-warning-500)',
  '600': 'var(--we-color-warning-600)',
  '700': 'var(--we-color-warning-700)',
  '800': 'var(--we-color-warning-800)',
  '900': 'var(--we-color-warning-900)',
  '1000': 'var(--we-color-warning-1000)',
};

const danger = {
  hue: 'var(--we-color-danger-hue)',
  '0': 'var(--we-color-danger-0)',
  '25': 'var(--we-color-danger-25)',
  '50': 'var(--we-color-danger-50)',
  '75': 'var(--we-color-danger-75)',
  '100': 'var(--we-color-danger-100)',
  '200': 'var(--we-color-danger-200)',
  '300': 'var(--we-color-danger-300)',
  '400': 'var(--we-color-danger-400)',
  '500': 'var(--we-color-danger-500)',
  '600': 'var(--we-color-danger-600)',
  '700': 'var(--we-color-danger-700)',
  '800': 'var(--we-color-danger-800)',
  '900': 'var(--we-color-danger-900)',
  '1000': 'var(--we-color-danger-1000)',
};

const ui = {
  hue: 'var(--we-color-ui-hue)',
  saturation: 'var(--we-color-ui-saturation)',
  '0': 'var(--we-color-ui-0)',
  '25': 'var(--we-color-ui-25)',
  '50': 'var(--we-color-ui-50)',
  '75': 'var(--we-color-ui-75)',
  '100': 'var(--we-color-ui-100)',
  '200': 'var(--we-color-ui-200)',
  '300': 'var(--we-color-ui-300)',
  '400': 'var(--we-color-ui-400)',
  '500': 'var(--we-color-ui-500)',
  '600': 'var(--we-color-ui-600)',
  '700': 'var(--we-color-ui-700)',
  '800': 'var(--we-color-ui-800)',
  '900': 'var(--we-color-ui-900)',
  '1000': 'var(--we-color-ui-1000)',
};

/* UTILITY COLORS */
const utility = {
  white: 'var(--we-color-white)',
  black: 'var(--we-color-black)',
};

/* SEMANTIC COLORS */
const focus = {
  color: 'var(--we-color-focus)',
  outline: 'var(--we-focus-outline)',
};

export const color = { system, lightness, primary, success, warning, danger, ui, utility, focus };
