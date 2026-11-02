import { createRequire } from 'node:module';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

// Next's standalone tracing can omit the dynamically loaded query compiler.
// Resolve from @prisma/client so pnpm's versioned directory is preserved.
const require = createRequire(import.meta.url);
const clientRequire = createRequire(require.resolve('@prisma/client'));
const source = dirname(clientRequire.resolve('.prisma/client/default'));
const destination = join(process.cwd(), '.next/standalone', relative(process.cwd(), source));
if (!existsSync(join(source, 'query_compiler_bg.wasm'))) {
  throw new Error('Generated Prisma query compiler is missing');
}
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
if (!existsSync(join(destination, 'query_compiler_bg.wasm'))) {
  throw new Error('Standalone Prisma query compiler was not copied');
}
console.log('Prisma runtime included in standalone package');
