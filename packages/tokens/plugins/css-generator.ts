import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Plugin } from 'rollup';

import { animation as animationTokens } from '../src/animation';
import { border as borderTokens } from '../src/border';
import { color as colorTokens } from '../src/color';
import { component as componentTokens } from '../src/component';
import { effect as effectTokens } from '../src/effect';
import { font as fontTokens } from '../src/font';
import { avatarSize as avatarSizeTokens, radius as radiusTokens, size as sizeTokens } from '../src/size';
import { space as spaceTokens } from '../src/space';

interface CssGeneratorOptions {
  outputDir?: string;
}

export function cssGenerator(options: CssGeneratorOptions = {}): Plugin {
  const outputDir = options.outputDir || 'dist/css';

  return {
    name: 'css-generator',

    // Generate CSS after the main build is complete
    writeBundle: async (outputOptions) => {
      try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Import the compiled tokens dynamically
        const indexFile = path.resolve(outputOptions.dir || 'dist', 'index.js');

        // Use dynamic import to load the compiled tokens
        const tokens = await import(`file://${indexFile}`);
        const { animation, border, color, component, effect, font, size, radius, avatarSize, space } = tokens;

        // Generate CSS files
        generateAnimationCSS(animation, outputDir);
        generateBorderCSS(border, outputDir);
        generateColorCSS(color, outputDir);
        generateComponentCSS(component, outputDir);
        generateEffectCSS(effect, outputDir);
        generateFontCSS(font, outputDir);
        generateSizeCSS(size, radius, avatarSize, outputDir);
        generateSpaceCSS(space, outputDir);

        // Generate combined index file
        generateCombinedCSS(outputDir);

        console.log('✅ CSS files generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate CSS:', error);
        throw error;
      }
    },
  };
}

// Helper functions for CSS generation
function generateAnimationCSS(animation: typeof animationTokens, outputDir: string) {
  const transitionVars = Object.entries(animation.transition)
    .map(([key, value]) => `  --we-transition-${key}: ${value};`)
    .join('\n');

  const css = `/* ANIMATION TOKENS - Generated from JS tokens */

:root {
  /* Transition Speeds */
${transitionVars}
}`;

  fs.writeFileSync(path.join(outputDir, 'animation.css'), css);
}

function generateBorderCSS(border: typeof borderTokens, outputDir: string) {
  const radiusVars = Object.entries(border.radius)
    .map(([key, value]) => {
      const varName = key === 'base' ? '--we-border-radius' : `--we-border-radius-${key}`;
      return `  ${varName}: ${value};`;
    })
    .join('\n');

  const css = `/* BORDER TOKENS - Generated from JS tokens */

:root {
  /* Border Width */
  --we-border-width: ${border.width};

  /* Border Radius */
${radiusVars}

  /* Border Colors */
  --we-border-color: var(--we-color-ui-100);
  --we-border-color-strong: var(--we-color-ui-200);
}`;

  fs.writeFileSync(path.join(outputDir, 'border.css'), css);
}

function generateColorCSS(color: typeof colorTokens, outputDir: string) {
  const hueVars = Object.entries(color.hues)
    .map(([key, value]) => `  --we-color-${key}-hue: ${value};`)
    .join('\n');

  const lightnessVars = Object.entries(color.lightness)
    .map(
      ([key, value]) =>
        `  --we-color-lightness-${key}: calc((${value} - var(--we-color-subtractor)) * var(--we-color-multiplier));`,
    )
    .join('\n');

  const colorTypes = ['ui', 'primary', 'success', 'warning', 'danger'];
  const colorPalettes = colorTypes
    .map((type) => {
      const paletteVars = Object.keys(color.lightness)
        .map((lightnessKey) => {
          const saturationVar = type === 'ui' ? 'var(--we-color-ui-saturation)' : 'var(--we-color-saturation)';
          return `  --we-color-${type}-${lightnessKey}: hsl(var(--we-color-${type}-hue) ${saturationVar} var(--we-color-lightness-${lightnessKey}));`;
        })
        .join('\n');

      return `  /* ${type.charAt(0).toUpperCase() + type.slice(1)} Colors */
${paletteVars}`;
    })
    .join('\n\n');

  const css = `/* COLOR TOKENS - Generated from JS tokens */

:root {
  /* Color System Configuration */
  --we-color-multiplier: ${color.config.multiplier};
  --we-color-subtractor: ${color.config.subtractor};
  --we-color-saturation: ${color.config.saturation};
  --we-color-ui-saturation: ${color.config.uiSaturation};

  /* Color Hues */
${hueVars}

  /* Lightness Scale */
${lightnessVars}

${colorPalettes}

  /* Base Colors */
  --we-color-white: hsl(var(--we-color-ui-hue) var(--we-color-ui-saturation) var(--we-color-lightness-0));
  --we-color-black: hsl(var(--we-color-ui-hue) var(--we-color-ui-saturation) var(--we-color-lightness-1000));

  /* Focus Colors */
  --we-color-focus: var(--we-color-primary-500);
  --we-focus-outline: 0 0 0 2px var(--we-color-focus);
}`;

  fs.writeFileSync(path.join(outputDir, 'color.css'), css);
}

function generateComponentCSS(component: typeof componentTokens, outputDir: string) {
  const scrollbarVars = Object.entries(component.scrollbar)
    .filter(([key]) => key !== 'thumbBorderRadius' && key !== 'thumbBackground') // Handle these separately
    .map(([key, value]) => `  --we-scrollbar-${key}: ${value};`)
    .join('\n');

  const css = `/* COMPONENT TOKENS - Generated from JS tokens */

:root {
  /* Scrollbar Styles */
${scrollbarVars}
  --we-scrollbar-thumbBorderRadius: var(--we-border-radius);
  --we-scrollbar-thumbBackground: hsl(var(--we-color-ui-hue) 5% var(--we-color-lightness-100));
}`;

  fs.writeFileSync(path.join(outputDir, 'component.css'), css);
}

function generateEffectCSS(effect: typeof effectTokens, outputDir: string) {
  const depthVars = Object.entries(effect.depth)
    .filter(([key]) => key !== 'none') // Handle 'none' separately to put it first
    .map(([key, value]) => `  --we-depth-${key}: ${value};`)
    .join('\n');

  const css = `/* EFFECT TOKENS - Generated from JS tokens */

:root {
  /* Shadows */
  --we-depth-none: ${effect.depth.none};
${depthVars}
}`;

  fs.writeFileSync(path.join(outputDir, 'effect.css'), css);
}

function generateFontCSS(font: typeof fontTokens, outputDir: string) {
  const fontSizeVars = Object.entries(font.size)
    .filter(([key]) => key !== 'base') // Handle 'base' separately to put it first
    .map(([key, value]) => `  --we-font-size-${key}: ${value};`)
    .join('\n');

  const css = `/* FONT TOKENS - Generated from JS tokens */

:root {
  /* Font Family */
  --we-font-family: ${font.family.base};

  /* Font Sizes */
  --we-font-base-size: ${font.size.base};
${fontSizeVars}
}`;

  fs.writeFileSync(path.join(outputDir, 'font.css'), css);
}

function generateSizeCSS(
  size: typeof sizeTokens,
  radius: typeof radiusTokens,
  avatarSize: typeof avatarSizeTokens,
  outputDir: string,
) {
  const sizeVars = Object.entries(size)
    .map(([key, value]) => `  --we-size-${key}: ${value};`)
    .join('\n');

  const radiusVars = Object.entries(radius)
    .map(([key, value]) => `  --we-radius-${key}: ${value};`)
    .join('\n');

  const avatarVars = Object.entries(avatarSize)
    .map(([key, value]) => `  --we-avatar-size-${key}: ${value};`)
    .join('\n');

  const css = `/* SIZE TOKENS - Generated from JS tokens */

:root {
  /* Component Sizes */
${sizeVars}

  /* Border Radius Sizes */
${radiusVars}

  /* Avatar Sizes */
${avatarVars}
}`;

  fs.writeFileSync(path.join(outputDir, 'size.css'), css);
}

function generateSpaceCSS(space: typeof spaceTokens, outputDir: string) {
  const spaceVars = Object.entries(space)
    .map(([key, value]) => `  --we-space-${key}: ${value};`)
    .join('\n');

  const css = `/* SPACE TOKENS - Generated from JS tokens */

:root {
  /* Spacing Values */
${spaceVars}
}`;

  fs.writeFileSync(path.join(outputDir, 'space.css'), css);
}

function generateCombinedCSS(outputDir: string) {
  const indexCSS = `/* @we/tokens CSS variables - Main Entry Point */

/* Font imports */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans&display=swap');

/* Design token variables */
@import './animation.css';
@import './border.css';
@import './color.css';
@import './component.css';
@import './effect.css';
@import './font.css';
@import './size.css';
@import './space.css';
`;

  fs.writeFileSync(path.join(outputDir, 'index.css'), indexCSS);
}
