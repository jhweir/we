# Todos

- centralise eslint, typescript, prettier, and stylelint config in monorepo then extend in each package

- update generate types script (is this approach better than gathering the types from each components .d.ts?)
- reorganise / simplify linting checks
- lint scripts as well as main files

- the dist structure I'm trying to create:

dist/
├── all-components.js // imports all components at once (could be renamed)
├── all-components.js.map
├── individual-components.js // allows for individual component imports (could be renamed)
├── individual-components.js.map
├── components/
│ ├── Badge.js
│ ├── Badge.d.ts // either include these here & figure out how to add custom web component definitions or remove and use manifest only
│ ├── Button.js
│ ├── Button.d.ts
│ └── ... (other components)
├── styles.css
├── index.js
├── index.d.ts
