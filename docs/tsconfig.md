### Global TypeScript Config

# target: "ES2019"

Sets the JavaScript version to ECMAScript 2019, allowing the use of modern language features while maintaining compatibility with environments that support ES2019.

# module: "ESNext"

Uses the latest ECMAScript module system, which is compatible with modern bundlers and supports tree-shaking for optimized builds.

# strict: true

Enables all strict type-checking options, improving code quality and helping to catch potential errors during development.

# moduleResolution: "node"

Mimics Node.js module resolution strategy, which is widely used and ensures compatibility with Node.js applications and many bundlers.

# esModuleInterop: true

Allows default imports from CommonJS modules, improving interoperability between different module systems.

# forceConsistentCasingInFileNames: true

Enforces consistent casing in file names to prevent issues on case-sensitive file systems, reducing bugs related to incorrect import statements.

# skipLibCheck: true

Skips type checking of all declaration files (.d.ts), which speeds up the compilation process without affecting the type safety of your application code.

# declaration: true

Generates declaration files (.d.ts) for your TypeScript code, which is useful for type definitions when your packages are consumed by other TypeScript projects.

# sourceMap: true

Produces source map files alongside the emitted JavaScript, enabling debugging tools to map the compiled code back to the original TypeScript source.

# baseUrl: "."

Sets the base directory for resolving non-relative module imports, allowing for absolute import paths starting from the project root.

# paths: { "": ["node_modules/"] }

Defines how module paths are resolved, directing module lookups to the node_modules directory for third-party dependencies.
