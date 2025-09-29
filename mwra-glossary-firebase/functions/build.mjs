import { readFile } from 'node:fs/promises';

async function main() {
  const source = await readFile(new URL('./index.js', import.meta.url), 'utf8');
  if (!/export\s+const\s+ask/.test(source)) {
    throw new Error('Cloud Function entry point "ask" not found.');
  }
  console.log('Verified ask handler stub.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
