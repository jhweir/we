Use lowercase & kababcase for generic folders (e.g., components/, hooks/, block-types/).

Use PascalCase for feature or component folders (e.g., Auth/, LoginForm/).

Use PascalCase for React component files and their SCSS counterparts (.tsx, .module.scss).

Use camelCase for hooks, utilities, and barrel files (index.ts).

src/
├── features/
│ ├── Auth/
│ │ ├── components/
│ │ │ ├── LoginForm/
│ │ │ │ ├── LoginForm.tsx
│ │ │ │ ├── LoginForm.module.scss
│ │ │ │ └── index.ts
│ │ ├── hooks/
│ │ │ ├── useAuth.ts
│ │ └── pages/
│ │ ├── Login.tsx

src/
├── lib/
│ ├── components/
│ │ ├── Feed/
│ │ │ ├── PostCard.svelte
│ │ │ ├── PostCard.module.css
│ │ │ └── index.ts
│ │ ├── Profile/
│ │ │ ├── UserProfile.svelte
│ │ │ ├── UserProfile.module.css
│ │ │ └── index.ts
│ ├── hooks/
│ │ ├── useAuth.ts
│ │ ├── usePosts.ts
│ ├── stores/
│ │ ├── user.js
│ │ ├── notifications.js
├── routes/
│ ├── feed/
│ │ ├── +page.svelte
│ │ ├── +page.server.js
│ ├── profile/
│ │ ├── [username]/
│ │ │ ├── +page.svelte
│ │ │ ├── +page.server.js
│ ├── auth/
│ │ ├── login/
│ │ │ ├── +page.svelte
│ │ │ ├── +page.server.js

# Typescript

Strict types.

Interfaces for object shapes and types for unions.

interface UserProps {
id: string;
name: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';
