import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { printBuildBanner } from '../src/banner.js';

const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkgJson = await readFile(pkgPath, 'utf8');
const pkg = JSON.parse(pkgJson);

await printBuildBanner(pkg);
