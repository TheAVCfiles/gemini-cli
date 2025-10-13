import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.expo',
]);

function isAllowedSource(fullPath) {
  const normalized = fullPath.split(path.sep).join('/');
  return normalized.includes('/packages/') || normalized.includes('/web/');
}

async function listDirs(root) {
  const results = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        if (entry.name === 'src') {
          if (isAllowedSource(fullPath)) {
            results.push(fullPath);
          }
        }
        await walk(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}

async function listFiles(root, predicate) {
  const results = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!predicate(fullPath)) {
        continue;
      }
      results.push(fullPath);
    }
  }

  await walk(root);
  return results;
}

function extractComponents(content) {
  const names = new Set();
  const componentRegex = /(export\s+(?:default\s+)?(?:function|const|class)\s+)([A-Z][A-Za-z0-9_]*)/g;
  const namedRegex = /export\s*\{([^}]+)\}/g;
  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    names.add(match[2]);
  }
  while ((match = namedRegex.exec(content)) !== null) {
    const exports = match[1].split(',').map((token) => token.trim().split(/\sas\s/i)[0]);
    for (const candidate of exports) {
      if (/^[A-Z][A-Za-z0-9_]*$/.test(candidate)) {
        names.add(candidate);
      }
    }
  }
  return names;
}

function extractRoutes(content) {
  const routes = new Set();
  const routeRegex = /path\s*:\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const value = match[1].trim();
    if (value.length === 0) {
      continue;
    }
    if (value.startsWith(':')) {
      continue;
    }
    if (value.startsWith('.')) {
      continue;
    }
    if (value.includes('..')) {
      continue;
    }
    if (!/^[\w\-/{}:]+$/.test(value)) {
      continue;
    }
    if (value.length === 1 && value === '/') {
      routes.add('/');
      continue;
    }
    if (/^[\w\-{}]+$/.test(value) || value.startsWith('/')) {
      routes.add(value);
    }
  }
  return routes;
}

function extractJsonSchemas(content, filePath) {
  try {
    const json = JSON.parse(content);
    if (typeof json !== 'object' || json === null) {
      return null;
    }
    const hasSchemaKey = Boolean(json.$schema || json.type === 'object' || json.properties);
    if (!hasSchemaKey) {
      return null;
    }
    const title = typeof json.title === 'string' ? json.title : path.basename(filePath);
    return {
      title,
      path: filePath,
    };
  } catch {
    return null;
  }
}

function formatList(values, { limit = 12, emptyFallback = 'None detected' } = {}) {
  const sorted = Array.from(values).sort((a, b) => a.localeCompare(b));
  if (sorted.length === 0) {
    return emptyFallback;
  }
  if (sorted.length <= limit) {
    return sorted.join(', ');
  }
  const head = sorted.slice(0, limit).join(', ');
  const remaining = sorted.length - limit;
  return `${head}, +${remaining} more`;
}

function extractFunctions(content) {
  const names = new Set();
  const functionRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const constRegex = /export\s+const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::[^=]+)?=/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    names.add(match[1]);
  }
  while ((match = constRegex.exec(content)) !== null) {
    if (/^[a-z]/.test(match[1])) {
      names.add(match[1]);
    }
  }
  return names;
}

async function gatherComponents(sourceDirs) {
  const componentNames = new Set();
  for (const dir of sourceDirs) {
    const componentFiles = await listFiles(
      dir,
      (filePath) =>
        (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) && /\/(components|views|app|ui)\//i.test(filePath),
    );
    for (const filePath of componentFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const names = extractComponents(content);
      for (const name of names) {
        componentNames.add(name);
      }
    }
  }
  return componentNames;
}

async function gatherRoutes(sourceDirs) {
  const routeValues = new Set();
  for (const dir of sourceDirs) {
    const routeFiles = await listFiles(
      dir,
      (filePath) =>
        /\.(t|j)sx?$/.test(filePath) &&
        (/(routes?|router)\//i.test(filePath) || /router\.(t|j)sx?$/.test(filePath) || /routes?\.(t|j)sx?$/.test(filePath)),
    );
    for (const filePath of routeFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const routes = extractRoutes(content);
      for (const route of routes) {
        routeValues.add(route);
      }
    }
  }
  return routeValues;
}

async function gatherFunctions(sourceDirs) {
  const functionNames = new Set();
  for (const dir of sourceDirs) {
    const functionFiles = await listFiles(
      dir,
      (filePath) =>
        filePath.endsWith('.ts') &&
        !filePath.endsWith('.d.ts') &&
        !filePath.endsWith('.test.ts') &&
        /\/(apis?|commands?|services?|tools?|actions?)\//i.test(filePath),
    );
    for (const filePath of functionFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const names = extractFunctions(content);
      for (const name of names) {
        functionNames.add(name);
      }
    }
  }
  return functionNames;
}

async function gatherSchemas(sourceDirs, docsDir) {
  const schemaEntries = new Map();
  const roots = [...sourceDirs];
  if (docsDir) {
    roots.push(docsDir);
  }
  for (const root of roots) {
    const jsonFiles = await listFiles(root, (filePath) => filePath.endsWith('.json'));
    for (const filePath of jsonFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const schema = extractJsonSchemas(content, path.relative(repoRoot, filePath));
      if (!schema) {
        continue;
      }
      schemaEntries.set(schema.path, schema.title);
    }
  }
  return schemaEntries;
}

async function updateGlossary({ components, routes, schemas, functions }) {
  const glossaryPath = path.join(repoRoot, 'docs', 'avc-studio', 'SERVICES_GLOSSARY.md');
  let content;
  try {
    content = await fs.readFile(glossaryPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read glossary at ${glossaryPath}: ${error.message}`);
  }

  const formattedComponents = formatList(components);
  const formattedRoutes = formatList(routes, { emptyFallback: 'None detected (no router modules found)' });
  const formattedFunctions = formatList(functions, {
    emptyFallback: 'None detected (no exported API/command utilities found)',
  });
  const formattedSchemas = formatList(
    Array.from(schemas.entries()).map(([schemaPath, title]) => `${title} (${schemaPath})`),
    { limit: 8, emptyFallback: 'None detected' },
  );

  const replacements = [
    {
      pattern: /- \*\*User-facing:\*\* routes\/components TBD/g,
      value: `- **User-facing:** ${formattedRoutes}; Components: ${formattedComponents}`,
    },
    {
      pattern: /- \*\*APIs\/Functions:\*\* TBD \(see `docs\/api\.md`\)/g,
      value: `- **APIs/Functions:** ${formattedFunctions}`,
    },
    {
      pattern: /- \*\*Files\/Schemas:\*\* TBD/g,
      value: `- **Files/Schemas:** ${formattedSchemas}`,
    },
  ];

  let updated = content;
  for (const { pattern, value } of replacements) {
    updated = updated.replace(pattern, value);
  }

  if (updated === content) {
    return false;
  }

  await fs.writeFile(glossaryPath, `${updated.trimEnd()}\n`, 'utf8');
  await new Promise((resolve, reject) => {
    execFile('git', ['diff', '--', path.relative(repoRoot, glossaryPath)], { cwd: repoRoot }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      process.stdout.write(stdout);
      process.stderr.write(stderr);
      resolve();
    });
  });
  return true;
}

async function main() {
  const sourceDirs = await listDirs(repoRoot);
  const docsDir = path.join(repoRoot, 'docs');
  const [components, routes, schemas, functions] = await Promise.all([
    gatherComponents(sourceDirs),
    gatherRoutes(sourceDirs),
    gatherSchemas(sourceDirs, docsDir),
    gatherFunctions(sourceDirs),
  ]);

  const changed = await updateGlossary({ components, routes, schemas, functions });
  if (!changed) {
    console.log('SERVICES_GLOSSARY.md is already up to date.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
