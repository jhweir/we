# @we/tokens

A lightweight, flexible design token system for building consistent user interfaces across platforms.

## Installation

```bash
npm install @we/tokens
# or
yarn add @we/tokens
# or
pnpm add @we/tokens
```

## Usage

### Import CSS Variables

Include the base tokens in your application:

```js
// In your main entry file
import '@we/tokens/css';
```

### Use JavaScript/TypeScript Tokens

```js
// Import all tokens
import { tokens } from '@we/tokens';

// Or import specific token categories
import { color, font, space } from '@we/tokens';

// Usage examples
element.style.backgroundColor = color.primary[500];
element.style.fontSize = font.size['xl'];
element.style.padding = `${space[400]} ${space[600]}`;
```

## Available Token Categories

- **animation** - Timing and easing presets
- **border** - Border radii, widths, and styles
- **color** - Color palette including brand, semantic, and UI colors
- **component** - Component-specific tokens
- **effect** - Shadows, opacity, and other visual effects
- **font** - Typography settings including families, sizes, and weights
- **size** - Dimensional values for UI elements
- **space** - Spacing and layout measurements

## CSS Custom Properties

All tokens are available as CSS custom properties with the --we- prefix:

```css
.my-element {
  color: var(--we-color-primary-500);
  font-family: var(--we-font-family);
  font-size: var(--we-font-size-500);
  margin: var(--we-space-400);
}
```

## Customization

Add your own customizations by overriding the CSS variables:

```css
:root {
  --we-color-primary-500: #00875a;
  --we-font-family: 'Helvetica Neue', sans-serif;
}
```
