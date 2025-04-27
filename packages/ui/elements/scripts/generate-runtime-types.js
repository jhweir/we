import { promises as fs } from 'fs';
import path from 'path';

// Define all supported runtimes
const RUNTIMES = [
  { name: 'global', moduleFormat: 'global' },
  { name: 'react', moduleFormat: 'module', moduleName: 'react' },
  { name: 'react-jsx', moduleFormat: 'module', moduleName: 'react/jsx-runtime' },
  { name: 'react-jsx-dev', moduleFormat: 'module', moduleName: 'react/jsx-dev-runtime' },
];

async function generateRuntimeTypes() {
  try {
    // Load the custom-elements.json file
    const cemData = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'custom-elements.json'), 'utf8'));

    // Load and parse types.ts to extract type definitions
    const typesContent = await fs.readFile(path.resolve(process.cwd(), 'src/types.ts'), 'utf8');

    // Extract type definitions using regex
    const typeDefinitions = extractTypeDefinitions(typesContent);

    // Extract components from the manifest and identify used types
    const components = extractComponentsFromManifest(cemData);

    console.log(`Found ${components.length} components`);

    // Create directories for each runtime
    for (const runtime of RUNTIMES) {
      await fs.mkdir(`dist/runtime/${runtime.name}/components`, { recursive: true });

      // Generate type declarations for each component in this runtime
      for (const component of components) {
        await generateComponentDeclaration(component, runtime, typeDefinitions);
      }

      // Generate index file for this runtime
      await generateRuntimeIndex(components, runtime, typeDefinitions);
    }

    console.log('✅ Runtime type declarations generated successfully!');
  } catch (err) {
    console.error('Error generating types:', err);
    process.exit(1);
  }
}

// Extract type definitions and their dependencies from types.ts
function extractTypeDefinitions(content) {
  const typeMap = new Map();
  const constMap = new Map();

  // Match exported constants (for typeof references)
  const constRegex = /export\s+const\s+(\w+)\s*=\s*([^;]+);/g;
  let constMatch;

  while ((constMatch = constRegex.exec(content)) !== null) {
    const constName = constMatch[1];
    const constDefinition = constMatch[2].trim();
    constMap.set(constName, constDefinition);
  }

  // Match standalone constants (non-exported)
  const standaloneConstRegex = /const\s+(\w+)\s*=\s*([^;]+);/g;
  let standaloneMatch;

  while ((standaloneMatch = standaloneConstRegex.exec(content)) !== null) {
    const constName = standaloneMatch[1];
    // Don't override if already defined as export
    if (!constMap.has(constName)) {
      const constDefinition = standaloneMatch[2].trim();
      constMap.set(constName, constDefinition);
    }
  }

  // Match export type statements
  const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;]+);/g;
  let typeMatch;

  while ((typeMatch = typeRegex.exec(content)) !== null) {
    const typeName = typeMatch[1];
    const typeDefinition = typeMatch[2].trim();

    // Check if type references a const using typeof
    const typeofMatches = typeDefinition.match(/\(typeof\s+(\w+)\)\[number\]/g) || [];
    const constDependencies = [];
    const constDefinitions = {};

    // Extract all const references
    for (const typeofMatch of typeofMatches) {
      const match = typeofMatch.match(/\(typeof\s+(\w+)\)\[number\]/);
      if (match) {
        const referencedConst = match[1];
        if (constMap.has(referencedConst)) {
          constDependencies.push(referencedConst);
          constDefinitions[referencedConst] = constMap.get(referencedConst);
        }
      }
    }

    // Store the type and its dependencies
    typeMap.set(typeName, {
      definition: typeDefinition,
      constDependencies,
      constDefinitions,
    });
  }

  return typeMap;
}

function extractComponentsFromManifest(cemData) {
  const components = [];

  // Loop through all modules to find component declarations
  for (const module of cemData.modules) {
    if (!module.declarations) continue;

    // Find custom element classes
    for (const declaration of module.declarations) {
      if (declaration.kind !== 'class' || !declaration.customElement) continue;

      // Extract the file name from the path for a more consistent naming
      const filePath = module.path;
      const fileName = path.basename(filePath, '.ts');

      const className = fileName; // Use file name instead of class name
      const tagName = declaration.tagName || `we-${className.toLowerCase()}`;

      // Extract properties from class members
      const properties = {};
      const customTypes = new Set(); // Track custom types used by this component

      if (declaration.members) {
        for (const member of declaration.members) {
          if (member.kind === 'field' && member.attribute) {
            const propName = member.name;
            let typeName = member.type?.text || 'any';
            const defaultValue = member.default;

            // Extract custom type names (not primitives)
            if (typeName.includes(' | undefined')) {
              // Strip " | undefined" if present to get the core type
              typeName = typeName.replace(' | undefined', '');
            }

            // Add to custom types if not a primitive type
            if (typeName !== 'string' && typeName !== 'boolean' && typeName !== 'number' && typeName !== 'any') {
              customTypes.add(typeName);
            }

            properties[propName] = {
              name: propName,
              type: typeName,
              default: defaultValue,
            };
          }
        }
      }

      components.push({
        className,
        tagName,
        properties,
        customTypes, // Store which custom types this component uses
        filePath,
      });
    }
  }

  return components;
}

async function generateComponentDeclaration(component, runtime, typeDefinitions) {
  const { className, tagName, properties, customTypes } = component;

  // Track consts that need to be included
  const neededConsts = new Map();

  // Generate local type definitions for this component
  let typeDefinitionsContent = '';

  // First collect all custom types and their dependencies
  if (customTypes.size > 0) {
    // Check each custom type for const dependencies
    for (const typeName of customTypes) {
      const typeInfo = typeDefinitions.get(typeName);
      if (typeInfo && typeInfo.constDependencies && typeInfo.constDependencies.length > 0) {
        // Add all const dependencies to our needed consts map
        for (const constName of typeInfo.constDependencies) {
          if (typeInfo.constDefinitions[constName]) {
            neededConsts.set(constName, typeInfo.constDefinitions[constName]);
          }
        }
      }
    }

    // Now add const definitions first
    if (neededConsts.size > 0) {
      for (const [constName, constDef] of neededConsts.entries()) {
        typeDefinitionsContent += `// Required constant from types.ts\nconst ${constName} = ${constDef};\n\n`;
      }
    }

    // Then add type definitions
    for (const typeName of customTypes) {
      const typeInfo = typeDefinitions.get(typeName);
      if (typeInfo) {
        typeDefinitionsContent += `// Local type definition from types.ts\ntype ${typeName} = ${typeInfo.definition};\n\n`;
      } else {
        typeDefinitionsContent += `// Type not found in types.ts\ntype ${typeName} = any;\n\n`;
      }
    }
  }

  // Convert property types to TypeScript definitions with consistent indentation
  const propTypes = Object.entries(properties)
    .map(([name, prop]) => {
      return `      ${name}?: ${prop.type};`;
    })
    .join('\n');

  // JSX declaration based on runtime format
  const jsxDeclaration =
    runtime.moduleFormat === 'global'
      ? `declare global {
  namespace JSX {
    interface IntrinsicElements {
      '${tagName}': {
${propTypes}
      children?: any;
      [key: string]: any;
      };
    }
  }
}`
      : `// @ts-ignore - Suppress module not found errors during development
declare module '${runtime.moduleName}' {
  namespace JSX {
    interface IntrinsicElements {
      '${tagName}': {
${propTypes}
      children?: any;
      [key: string]: any;
      };
    }
  }
}`;

  // Create the declaration file
  const declarationFile = `// Generated type declaration for ${tagName} in ${runtime.name} runtime
// Generated from custom-elements.json

${typeDefinitionsContent}${jsxDeclaration}
`;

  // Write the declaration file
  await fs.writeFile(`dist/runtime/${runtime.name}/components/${className}.d.ts`, declarationFile);
  console.log(`Generated ${runtime.name} declarations for ${tagName}`);
}

async function generateRuntimeIndex(components, runtime, typeDefinitions) {
  // Collect all unique custom types used across all components
  const allCustomTypes = new Set();
  for (const component of components) {
    if (component.customTypes) {
      for (const type of component.customTypes) {
        allCustomTypes.add(type);
      }
    }
  }

  // Track consts that need to be included
  const neededConsts = new Map();

  // Generate local type definitions for all components
  let typeDefinitionsContent = '';

  // First collect all custom types and their dependencies
  if (allCustomTypes.size > 0) {
    // Check each custom type for const dependencies
    for (const typeName of allCustomTypes) {
      const typeInfo = typeDefinitions.get(typeName);
      if (typeInfo && typeInfo.constDependencies && typeInfo.constDependencies.length > 0) {
        // Add all const dependencies to our needed consts map
        for (const constName of typeInfo.constDependencies) {
          if (typeInfo.constDefinitions[constName]) {
            neededConsts.set(constName, typeInfo.constDefinitions[constName]);
          }
        }
      }
    }

    // Now add const definitions first
    if (neededConsts.size > 0) {
      for (const [constName, constDef] of neededConsts.entries()) {
        typeDefinitionsContent += `// Required constant from types.ts\nconst ${constName} = ${constDef};\n\n`;
      }
    }

    // Then add type definitions
    for (const typeName of allCustomTypes) {
      const typeInfo = typeDefinitions.get(typeName);
      if (typeInfo) {
        typeDefinitionsContent += `// Local type definition from types.ts\ntype ${typeName} = ${typeInfo.definition};\n\n`;
      } else {
        typeDefinitionsContent += `// Type not found in types.ts\ntype ${typeName} = any;\n\n`;
      }
    }
  }

  // Generate component declarations with proper indentation
  const componentDeclarations = components
    .map((component) => {
      const { tagName, properties } = component;

      const propTypes = Object.entries(properties)
        .map(([name, prop]) => {
          return `      ${name}?: ${prop.type};`;
        })
        .join('\n');

      return `      '${tagName}': {
${propTypes}
      children?: any;
      [key: string]: any;
      }`;
    })
    .join(';\n');

  // Generate JSX declaration
  const jsxDeclaration =
    runtime.moduleFormat === 'global'
      ? `declare global {
  namespace JSX {
    interface IntrinsicElements {
${componentDeclarations};
    }
  }
}`
      : `// @ts-ignore - Suppress module not found errors during development
declare module '${runtime.moduleName}' {
  namespace JSX {
    interface IntrinsicElements {
${componentDeclarations};
    }
  }
}`;

  // Create the index file
  const indexContent = `// Combined ${runtime.name} runtime declarations for all components
// Generated from custom-elements.json

${typeDefinitionsContent}${jsxDeclaration}
`;

  // Write the index files
  await fs.writeFile(`dist/runtime/${runtime.name}/index.d.ts`, indexContent);
  await fs.writeFile(`dist/runtime/${runtime.name}/index.js`, `export {};`);
  console.log(`Generated ${runtime.name} index files`);
}

// Run the generator
generateRuntimeTypes();

export default generateRuntimeTypes;
