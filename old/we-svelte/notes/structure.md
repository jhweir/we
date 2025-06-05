myapp/
├── src/
│ ├── assets/ # Static assets (images, fonts, etc.)
│ │ ├── images/ # Image files (e.g., logo.png)
│ │ ├── fonts/ # Custom fonts
│ ├── components/ # Reusable UI components
│ │ ├── ui/ # Generic UI components
│ │ │ ├── Button.svelte # Example: Reusable button
│ │ │ ├── Card.svelte # Example: Reusable card
│ │ ├── layout/ # Layout-specific components
│ │ │ ├── Header.svelte # Site header
│ │ │ ├── Footer.svelte # Site footer
│ │ ├── feature/ # Feature-specific components
│ │ │ ├── PostCard.svelte # Post summary card
│ │ │ ├── SpaceCard.svelte # Space summary card
│ ├── lib/ # Utilities, helpers, and non-UI logic
│ │ ├── api/ # API client functions
│ │ │ ├── posts.js # Fetch post data
│ │ │ ├── spaces.js # Fetch space data
│ │ ├── stores/ # Svelte stores for state management
│ │ │ ├── theme.js # Example: Theme store
│ │ ├── utils/ # General utilities
│ │ │ ├── formatDate.js # Example: Date formatting
│ ├── routes/ # SvelteKit routes (pages and API)
│ │ ├── +layout.svelte # Root layout (site-wide wrapper)
│ │ ├── +layout.js # Root layout logic (optional)
│ │ ├── +error.svelte # Custom error page
│ │ ├── +page.svelte # Home page (client-side, SPA-like)
│ │ ├── +page.js # Home page config (disable SSR)
│ │ ├── post/
│ │ │ └── [id]/
│ │ │ ├── +page.svelte # Post page (SSR for metadata)
│ │ │ ├── +page.server.js # Post metadata fetch
│ │ ├── space/
│ │ │ └── [id]/
│ │ │ ├── +page.svelte # Space page (SSR for metadata)
│ │ │ ├── +page.server.js # Space metadata fetch
│ │ ├── api/ # API routes
│ │ │ ├── posts/
│ │ │ │ └── +server.js # Example: Posts API endpoint
│ ├── styles/ # SCSS styles
│ │ ├── global.scss # Global styles (reset, typography)
│ │ ├── variables.scss # SCSS variables (colors, sizes)
│ │ ├── mixins.scss # SCSS mixins (reusable styles)
│ │ ├── components/ # Component-specific styles
│ │ │ ├── button.scss # Styles for Button.svelte
│ │ │ ├── card.scss # Styles for Card.svelte
│ ├── app.html # Main HTML template
│ ├── app.scss # Entry point for SCSS
│ ├── types/ # TypeScript types (if using TypeScript)
│ │ ├── index.d.ts # Custom types (e.g., Post, Space)
│ ├── hooks.server.js # Server-side hooks (optional)
│ ├── hooks.client.js # Client-side hooks (optional)
├── static/ # Static files (served as-is)
│ ├── favicon.ico
│ ├── robots.txt
├── tests/ # Unit and integration tests
│ ├── components/ # Component tests
│ │ ├── Button.test.js
│ ├── routes/ # Route tests
│ │ ├── post.test.js
├── svelte.config.js # SvelteKit configuration
├── vite.config.js # Vite configuration
├── tsconfig.json # TypeScript configuration (if using TypeScript)
├── eslint.config.js # ESLint configuration
├── prettier.config.js # Prettier configuration
├── pnpm-lock.yaml # pnpm lockfile
├── package.json
├── README.md
