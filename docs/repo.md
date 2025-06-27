monorepo/
├── apps/  
│ ├── we/
│ └── wiki/
├── packages/
│ ├── elements/ # Basic building blocks
│ ├── widgets/ # Complex interactive components (including cards)
│ ├── templates/ # Page layouts
│ └── blocks/ # Content modules

@we/tokens/
├── src/
│ ├── css/
│ │ ├── variables.css # Core CSS variables
│ │ ├── colors.css
│ │ └── spacing.css
│ └── js/
│ ├── colors.ts # JS constants
│ ├── spacing.ts
│ └── index.ts
├── package.json
└── README.md

// Import CSS variables
import '@we/tokens/css';

// Import JS constants
import { colors, spacing } from '@we/tokens';

@we/types/
├── src/
│ ├── components/
│ │ ├── button.ts
│ │ └── input.ts
│ ├── tokens/
│ │ ├── colors.ts
│ │ └── spacing.ts
│ └── index.ts
├── package.json
└── README.md

@we/themes/
├── src/
│ ├── cyberpunk/
│ │ ├── cyberpunk.css
│ │ └── index.ts
│ ├── corporate/
│ │ ├── corporate.css  
│ │ └── index.ts
│ └── index.ts # Exports all themes
├── package.json
└── README.md
