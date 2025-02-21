// scripts/generate-types.js
import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const generateTypes = () => {
  const manifestPath = resolve(__dirname, '../dist/custom-elements.json');

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    const declarations = manifest.modules
      .flatMap((m) => m.declarations || [])
      .filter((d) => d.kind === 'class' && d.customElement);

    const types = `
      declare global {
        namespace JSX {
          interface IntrinsicElements {
            ${declarations
              .map(
                (declaration) => `
                  '${declaration.tagName}': React.DetailedHTMLProps<
                    React.HTMLAttributes<HTMLElement> & {
                      ${declaration.members
                        ?.filter((m) => m.kind === 'field' && !m.static && m.name !== 'styles')
                        .map((prop) => `${prop.name}?: ${prop.type?.text || 'any'};`)
                        .join('\n            ')}
                    },
                    HTMLElement
                  >;
                `,
              )
              .join('\n')}
          }
        }
      }
      export {};
    `;

    writeFileSync(resolve(__dirname, '../dist/custom-elements.d.ts'), types);
    console.log('Generated types successfully');
  } catch (error) {
    console.error('Error generating types:', error);
    process.exit(1);
  }
};

generateTypes();
