/// <reference types="node" />

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface Runtime {
  name: string;
  moduleName?: string;
  namespace?: string;
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
  { name: 'svelte', namespace: 'svelteHTML' },
  { name: 'solid', moduleName: 'solid-js' },
  // { name: 'preact', moduleName: 'preact' },
  // { name: 'preact-jsx', moduleName: 'preact/jsx-runtime' },
  // { name: 'vue', moduleName: '@vue/runtime-dom' },
  // { name: 'qwik', moduleName: '@builder.io/qwik' },
];

function indent(level: number): string {
  return ' '.repeat(level * 2); // 2 spaces per indentation level
}

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

function generateProps(component: Component, typesPath: string): string {
  return [
    // Map properties from the component
    ...Object.entries(component.properties).map(([name, prop]) => {
      let typeDefinition = prop.type;

      // Check if it's a custom type that should be imported
      if (component.customTypes.has(typeDefinition)) typeDefinition = `import('${typesPath}').${typeDefinition}`;

      return `${indent(4)}${name}?: ${typeDefinition};`;
    }),

    // Add standard properties
    `${indent(4)}key?: string | number;`,
    `${indent(4)}slot?: string | number;`,
    `${indent(4)}id?: string;`,
    `${indent(4)}class?: string;`,
    `${indent(4)}style?: any;`,
    `${indent(4)}children?: any;`,
  ].join('\n');
}

function generateDeclaration(runtime: Runtime, content: string, tagName?: string): string {
  // Determine module or global declaration
  const declarationType = runtime.moduleName ? `declare module '${runtime.moduleName}'` : 'declare global';

  // Format the property content based on whether it's for an individual component file or part of an index
  const propertyContent = tagName ? [`'${tagName}': {`, content, `${indent(3)}};`].join('\n') : `${content};`;

  // Determine the prefix for the JSX namespace based on the runtime
  const reactRuntime = runtime.name.split('-')[0] === 'react';

  // Create the declaration lines
  const solidImport = ["import 'solid-js'", ''];

  const intrinsicElementsDeclaration = [
    `${declarationType} {`,
    `${indent(1)}namespace ${runtime.namespace || 'JSX'} {`,
    `${indent(2)}interface IntrinsicElements ${reactRuntime ? 'extends React.JSX.IntrinsicElements ' : ''}{`,
    `${indent(3)}${propertyContent}`,
    `${indent(2)}}`,
  ];

  const fixForReactChildren = [
    '',
    `${indent(2)}// Added to fix declaration conflict with the children prop in React`,
    `${indent(2)}interface ElementChildrenAttribute {`,
    `${indent(3)}children: React.ReactNode;`,
    `${indent(2)}}`,
  ];

  const closingBrackets = [`${indent(1)}}`, `}`];

  const emptyModuleExport = ['', 'export {};'];

  const declaration = [
    ...(runtime.name === 'solid' ? solidImport : []),
    ...intrinsicElementsDeclaration,
    ...(reactRuntime ? fixForReactChildren : []),
    ...closingBrackets,
    ...(runtime.name === 'svelte' ? emptyModuleExport : []),
  ];

  return declaration.join('\n');
}

async function generateComponentDeclaration(component: Component, runtime: Runtime) {
  const componentProps = generateProps(component, `../../../types`);
  const declaration = generateDeclaration(runtime, componentProps, component.tagName);
  const declarationFile = `// Generated type declaration for ${component.tagName} in ${runtime.name} runtime\n// Generated from custom-elements.json\n\n${declaration}\n`;
  await fs.writeFile(`dist/runtime/${runtime.name}/components/${component.className}.d.ts`, declarationFile);
}

async function generateIndexDeclaration(components: Component[], runtime: Runtime): Promise<void> {
  const componentsProps = components
    .map((component) =>
      [`'${component.tagName}': {`, generateProps(component, `../../types`), `${indent(3)}}`].join('\n'),
    )
    .join(`;\n${indent(3)}`); // Add indentation and semicolon between components

  const declaration = generateDeclaration(runtime, componentsProps);
  const declarationFile = `// Combined ${runtime.name} runtime declarations for all components\n// Generated from custom-elements.json\n\n${declaration}\n`;
  await fs.writeFile(`dist/runtime/${runtime.name}/index.d.ts`, declarationFile);
}

async function generateRuntimeTypes(): Promise<void> {
  try {
    // Load source files
    const cemData = await fs
      .readFile(path.resolve(process.cwd(), 'custom-elements.json'), 'utf8')
      .then((data) => JSON.parse(data) as CemData);

    // Extract components from the custom-elements.json manifest
    const components = extractComponentsFromManifest(cemData);

    console.log(`Found ${components.length} components`);
    console.log('Generating type declarations...');

    // Process all runtimes in parallel
    await Promise.all(
      RUNTIMES.map(async (runtime) => {
        // Create directory
        await fs.mkdir(`dist/runtime/${runtime.name}/components`, { recursive: true });

        // Generate individual component declarations
        await Promise.all(components.map(async (component) => generateComponentDeclaration(component, runtime)));

        // Generate index file declaration
        await generateIndexDeclaration(components, runtime);

        console.log(`✅ Type declarations generated for ${runtime.name} runtime`);
      }),
    );

    console.log('✅ All runtime type declarations generated successfully!');
  } catch (err) {
    console.error('Error generating types:', err);
    process.exit(1);
  }
}

// Run the generator
generateRuntimeTypes();

export default generateRuntimeTypes;
