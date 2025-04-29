import { promises as fs } from 'fs';
import path from 'path';

interface Runtime {
  name: string;
  moduleName?: string;
}

interface ComponentProperty {
  name: string;
  type: string;
  default?: string;
}

interface Component {
  className: string;
  tagName: string;
  properties: Record<string, ComponentProperty>;
  customTypes: Set<string>;
  filePath: string;
}

interface TypeInfo {
  definition: string;
  constDependencies: string[];
  constDefinitions: Record<string, string>;
}

interface DeclarationOutput {
  declarationFile: string;
  formattedPropTypes: string;
}

interface CemData {
  modules: Array<{
    declarations?: Array<{
      kind: string;
      customElement?: boolean;
      tagName?: string;
      members?: Array<{
        kind: string;
        name: string;
        attribute?: boolean;
        type?: { text?: string };
        default?: string;
        readonly?: boolean;
      }>;
    }>;
    path?: string;
  }>;
}

const RUNTIMES: Runtime[] = [
  { name: 'global' },
  { name: 'react', moduleName: 'react' },
  { name: 'react-jsx', moduleName: 'react/jsx-runtime' },
  { name: 'react-jsxdev', moduleName: 'react/jsx-dev-runtime' },
  // Todo:
  // { name: 'preact', moduleName: 'preact', extends: 'Preact.JSX.IntrinsicElements' },
  // { name: 'preact-jsx', moduleName: 'preact/jsx-runtime' },
  // { name: 'solid', moduleName: 'solid-js/jsx-runtime' },
  // { name: 'vue', moduleName: '@vue/runtime-dom' },
  // { name: 'svelte', moduleName: 'svelte' },
  // { name: 'qwik', moduleName: '@builder.io/qwik' },
];

function indent(level: number): string {
  return ' '.repeat(level * 2); // 2 spaces per indentation level
}

async function generateRuntimeTypes(): Promise<void> {
  try {
    // Load source files
    const [cemData, typesContent] = await Promise.all([
      fs
        .readFile(path.resolve(process.cwd(), 'custom-elements.json'), 'utf8')
        .then((data) => JSON.parse(data) as CemData),
      fs.readFile(path.resolve(process.cwd(), 'src/types.ts'), 'utf8'),
    ]);

    // Extract type definitions and components
    const typeDefinitions = extractTypeDefinitions(typesContent);
    const components = extractComponentsFromManifest(cemData);

    console.log(`Found ${components.length} components`);
    console.log('Generating type declarations...');

    // Process all runtimes in parallel
    await Promise.all(
      RUNTIMES.map(async (runtime) => {
        // Create directory
        await fs.mkdir(`dist/runtime/${runtime.name}/components`, { recursive: true });

        // Generate all component declarations and collect them
        const formattedDeclarations: Record<string, string> = {};
        await Promise.all(
          components.map(async (component) => {
            // Generate declaration content
            const { declarationFile, formattedPropTypes } = generateComponentDeclaration(
              component,
              runtime,
              typeDefinitions,
            );

            // Write component declaration file
            await fs.writeFile(`dist/runtime/${runtime.name}/components/${component.className}.d.ts`, declarationFile);

            // Store formatted prop types for index reuse
            formattedDeclarations[component.tagName] = formattedPropTypes;
          }),
        );

        // Generate index file using the already processed declarations
        await generateRuntimeIndex(components, runtime, typeDefinitions, formattedDeclarations);

        console.log(`✅ Type declarations generated for ${runtime.name} runtime`);
      }),
    );

    console.log('✅ All runtime type declarations generated successfully!');
  } catch (err) {
    console.error('Error generating types:', err);
    process.exit(1);
  }
}

// Extract type definitions and their dependencies
function extractTypeDefinitions(content: string): Map<string, TypeInfo> {
  const typeMap = new Map<string, TypeInfo>();
  const constMap = new Map<string, string>();

  // Extract constants (both exported and non-exported)
  const constRegex = /(?:export\s+)?const\s+(\w+)\s*=\s*([^;]+);/g;
  const constMatches = [...content.matchAll(constRegex)];
  constMatches.forEach(([, name, definition]) => constMap.set(name, definition.trim()));

  // Extract type definitions
  const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;]+);/g;
  const typeMatches = [...content.matchAll(typeRegex)];
  typeMatches.forEach(([, name, definition]) => {
    const constDependencies: string[] = [];
    const constDefinitions: Record<string, string> = {};

    // Check for typeof references
    const typeofRegex = /\(typeof\s+(\w+)\)\[number\]/g;
    const typeofMatches = [...definition.matchAll(typeofRegex)];
    for (const [, referencedConst] of typeofMatches) {
      if (constMap.has(referencedConst)) {
        constDependencies.push(referencedConst);
        constDefinitions[referencedConst] = constMap.get(referencedConst) || '';
      }
    }

    // Store the type with its dependencies
    typeMap.set(name, { definition: definition.trim(), constDependencies, constDefinitions });
  });

  return typeMap;
}

// Extract components from the manifest
function extractComponentsFromManifest(cemData: CemData): Component[] {
  return cemData.modules
    .filter((module) => module.declarations)
    .flatMap((module) => {
      const baseName = module.path ? path.basename(module.path, '.ts') : '';

      return (module.declarations || [])
        .filter((declaration) => declaration.kind === 'class' && declaration.customElement)
        .map((declaration) => {
          // Extract properties
          const properties: Record<string, ComponentProperty> = {};
          const customTypes = new Set<string>();

          declaration.members
            ?.filter((member) => member.kind === 'field' && !member.name.startsWith('_'))
            .forEach((member) => {
              // Clean up type name
              let typeName = member.type?.text || 'any';
              if (typeName.includes(' | undefined')) typeName = typeName.replace(' | undefined', '');
              // Keep track of custom types needed for declaration
              const isBasicType = ['string', 'boolean', 'number', 'any'].includes(typeName);
              const isReadonly = member.readonly;
              const isFunction = typeName.includes('=>');
              if (!isReadonly && !isFunction && !isBasicType) customTypes.add(typeName);
              // Store the property
              properties[member.name] = { name: member.name, type: typeName, default: member.default };
            });

          return {
            className: baseName,
            tagName: declaration.tagName || '',
            properties,
            customTypes,
            filePath: module.path || '',
          };
        });
    });
}

function generateJsxDeclaration(runtime: Runtime, tagName: string | null, content: string): string {
  // Determine module or global declaration
  const declarationType = runtime.name === 'global' ? 'declare global' : `declare module '${runtime.moduleName}'`;

  // Format the property content based on whether it's for a component or index
  const propertyContent = tagName ? [`'${tagName}': {`, content, `${indent(3)}};`].join('\n') : `${content};`;

  // Determine the prefix for the JSX namespace based on the runtime
  let extensionPrefix = '';
  if (runtime.name.split('-')[0] === 'react') extensionPrefix = 'React.';

  // Create the declaration with the appropriate type and content
  return [
    `${declarationType} {`,
    `${indent(1)}namespace JSX {`,
    `${indent(2)}interface IntrinsicElements extends ${extensionPrefix}JSX.IntrinsicElements {`,
    `${indent(3)}${propertyContent}`,
    `${indent(2)}}`,
    `${indent(1)}}`,
    `}`,
  ].join('\n');
}

// Generate component declaration file
function generateComponentDeclaration(
  component: Component,
  runtime: Runtime,
  typeDefinitions: Map<string, TypeInfo>,
): DeclarationOutput {
  const { tagName, properties, customTypes } = component;

  // Collect required constants and types
  const typeContent = generateTypeContent(
    customTypes,
    typeDefinitions,
    // Pass the component when handling the global runtime for error handling
    runtime.name === 'global' ? component : undefined,
  );

  // Generate property definitions with consistent indentation
  const propTypes = [
    // Map properties from the component
    ...Object.entries(properties).map(([name, prop]) => `${indent(4)}${name}?: ${prop.type};`),

    // Add standard properties
    `${indent(4)}key?: string | number;`,
    `${indent(4)}slot?: string | number;`,
    `${indent(4)}id?: string;`,
    `${indent(4)}class?: string;`,
    `${indent(4)}style?: any;`,
    `${indent(4)}children?: any;`,
  ].join('\n');

  // Create JSX declaration using the helper function
  const jsxDeclaration = generateJsxDeclaration(runtime, tagName, propTypes);

  // Create the final declaration file content
  const declarationFile = `// Generated type declaration for ${tagName} in ${runtime.name} runtime\n// Generated from custom-elements.json\n\n${typeContent}${jsxDeclaration}\n`;

  // Return both the file content and formatted prop types
  return { declarationFile, formattedPropTypes: propTypes };
}

// Generate index file for a runtime
async function generateRuntimeIndex(
  components: Component[],
  runtime: Runtime,
  typeDefinitions: Map<string, TypeInfo>,
  formattedDeclarations: Record<string, string>,
): Promise<void> {
  // Collect all unique custom types
  const allCustomTypes = new Set<string>(components.flatMap((component) => Array.from(component.customTypes)));

  // Generate type content
  const typeContent = generateTypeContent(allCustomTypes, typeDefinitions);

  // Use the pre-generated component declarations
  const componentDeclarations = components
    .map((component) =>
      [`'${component.tagName}': {`, formattedDeclarations[component.tagName], `${indent(3)}}`].join('\n'),
    )
    .join(`;\n${indent(3)}`); // Add indentation after each semicolon

  // Create JSX declaration using the helper function (no tag name for index)
  const jsxDeclaration = generateJsxDeclaration(runtime, null, componentDeclarations);

  // Create the index file content
  const indexContent = `// Combined ${runtime.name} runtime declarations for all components\n// Generated from custom-elements.json\n\n${typeContent}${jsxDeclaration}\n`;

  // Write the files
  await Promise.all([fs.writeFile(`dist/runtime/${runtime.name}/index.d.ts`, indexContent)]);
}

// Generate type definitions content
function generateTypeContent(
  customTypes: Set<string>,
  typeDefinitions: Map<string, TypeInfo>,
  component?: Component,
): string {
  // Early return if no custom types
  if (customTypes.size === 0) return '';

  // Collect needed constants
  const constants = new Map<string, string>();

  // Check each type for dependencies
  for (const typeName of customTypes) {
    const typeInfo = typeDefinitions.get(typeName);
    if (typeInfo?.constDependencies?.length) {
      for (const constName of typeInfo.constDependencies) {
        if (typeInfo.constDefinitions[constName]) {
          constants.set(constName, typeInfo.constDefinitions[constName]);
        }
      }
    }
  }

  // Generate content
  let content = '';

  // Add constants
  if (constants.size > 0) {
    for (const [constName, constDef] of constants) content += `declare const ${constName} = ${constDef};\n`;
    content += '\n';
  }

  // Add type definitions
  for (const typeName of customTypes) {
    const typeInfo = typeDefinitions.get(typeName);
    if (typeInfo) content += `type ${typeName} = ${typeInfo.definition};\n`;
    else {
      content += `type ${typeName} = any; // Type not found in types.ts \n`;
      if (component) console.log(`❌ Type ${typeName} not found in ${component?.tagName}, defaulting to 'any'`);
    }
  }

  return `${content}\n`;
}

// Run the generator
generateRuntimeTypes();

export default generateRuntimeTypes;
