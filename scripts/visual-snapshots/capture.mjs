#!/usr/bin/env node

import { createServer } from 'http';
import { extname, join, resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import process from 'process';
import url from 'url';
import { chromium } from 'playwright';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..', '..');
const webRoot = resolve(projectRoot, 'web');
const snapshotRoot = resolve(projectRoot, 'snapshots');

const defaultPages = [
  'index.html',
  'demon-huntrix.html',
  'rebuttal-interactive.html'
];

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

function parseArgs(argv) {
  const options = {
    pages: [...defaultPages],
    width: 1440,
    height: 900,
    delay: 400,
    outDir: ''
  };

  for (const arg of argv) {
    if (arg.startsWith('--pages=')) {
      const value = arg.split('=')[1];
      options.pages = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--width=')) {
      options.width = Number.parseInt(arg.split('=')[1], 10) || options.width;
    } else if (arg.startsWith('--height=')) {
      options.height = Number.parseInt(arg.split('=')[1], 10) || options.height;
    } else if (arg.startsWith('--delay=')) {
      options.delay = Number.parseInt(arg.split('=')[1], 10) || options.delay;
    } else if (arg.startsWith('--outDir=')) {
      options.outDir = arg.split('=')[1];
    }
  }

  return options;
}

function normalisePage(entry) {
  const [pathPart, labelPart] = entry.split('|');
  const cleanedPath = pathPart.replace(/^\//, '');
  const label = labelPart?.trim() || cleanedPath.replace(/\W+/g, '-').replace(/-+/g, '-');
  return { path: cleanedPath, label };
}

async function createStaticServer(rootDir) {
  const server = createServer(async (req, res) => {
    try {
      const requestPath = decodeURI(req.url.split('?')[0]);
      const relativePath = requestPath === '/' ? '/index.html' : requestPath;
      const targetPath = join(rootDir, relativePath);
      const resolved = resolve(targetPath);
      if (!resolved.startsWith(rootDir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      if (!existsSync(resolved)) {
        res.writeHead(404).end('Not found');
        return;
      }

      const data = await readFile(resolved);
      const ext = extname(resolved).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (error) {
      console.error('Static server error', error);
      res.writeHead(500).end('Internal server error');
    }
  });

  await new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => resolvePromise());
  });

  const address = server.address();
  if (typeof address !== 'object' || !address) {
    throw new Error('Unable to determine server port');
  }

  return { server, port: address.port };
}

async function ensureOutputDir(baseDir) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = baseDir ? resolve(projectRoot, baseDir) : join(snapshotRoot, timestamp);
  await mkdir(runDir, { recursive: true });

  return runDir;
}

async function captureSnapshots(options) {
  const parsedPages = options.pages.map(normalisePage);

  if (parsedPages.length === 0) {
    console.warn('No pages specified. Nothing to capture.');
    return;
  }

  const { server, port } = await createStaticServer(webRoot);
  const serverUrl = `http://127.0.0.1:${port}`;

  const outDir = await ensureOutputDir(options.outDir);
  console.log(`📸 Saving snapshots to: ${outDir}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height }
  });

  const results = [];

  try {
    for (const entry of parsedPages) {
      const page = await context.newPage();
      const targetUrl = `${serverUrl}/${entry.path}`;
      console.log(`→ Rendering ${targetUrl}`);

      const response = await page.goto(targetUrl, { waitUntil: 'networkidle' });
      if (!response || !response.ok()) {
        console.warn(`⚠️  Failed to load ${targetUrl} (status ${response?.status()})`);
      }

      if (options.delay > 0) {
        await page.waitForTimeout(options.delay);
      }

      const fileName = `${entry.label}.png`;
      const filePath = join(outDir, fileName);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`   Saved ${fileName}`);

      results.push({
        url: targetUrl,
        fileName,
        viewport: { width: options.width, height: options.height }
      });

      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }

  const manifestPath = join(outDir, 'manifest.json');
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        pages: results
      },
      null,
      2
    )
  );

  console.log(`✅ Snapshot manifest written to ${manifestPath}`);
}

(async () => {
  try {
    const options = parseArgs(process.argv.slice(2));
    await mkdir(snapshotRoot, { recursive: true });
    await captureSnapshots(options);
  } catch (error) {
    console.error('Snapshot capture failed');
    console.error(error);
    process.exitCode = 1;
  }
})();
