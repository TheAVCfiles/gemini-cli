/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Build script that generates weekly JSON report snapshots for static hosting.
 *
 * This script creates:
 * - A dated snapshot (e.g., report-2025-01-15.json)
 * - A "latest" symlink/copy (report-latest.json)
 *
 * These files are placed in /public/data/ to be served as static resources,
 * reducing serverless function usage on platforms like Vercel's free tier.
 */

import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDataDir = join(root, 'public', 'data');

/**
 * Serverless function paths - these consume quota on hosting platforms.
 * Update this list when adding/removing serverless functions.
 */
const SERVERLESS_FUNCTIONS = [
  '/ask',          // OpenAI queries (netlify/functions/ask.js)
  '/api/gemini',   // Gemini queries (netlify/functions/gemini.js)
] as const;

interface WeeklyReportData {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  gitCommit: string;
  version: string;
  metrics: {
    staticRoutes: number;
    dynamicRoutes: number;
    totalAssets: number;
  };
  staticEndpoints: string[];
}

/**
 * Gets the current git commit hash.
 * Uses execSync with a hardcoded command string (no user input) which is safe.
 */
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getWeekBounds(date: Date): { weekStart: string; weekEnd: string } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
  };
}

function countFilesRecursively(dir: string, filter?: (file: string) => boolean): number {
  let count = 0;

  try {
    if (!existsSync(dir)) {
      return 0;
    }

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        count += countFilesRecursively(fullPath, filter);
      } else if (entry.isFile()) {
        if (!filter || filter(entry.name)) {
          count++;
        }
      }
    }
  } catch {
    return 0;
  }

  return count;
}

function countStaticRoutes(): number {
  // Count HTML files in public and web directories as static routes
  const publicDir = join(root, 'public');
  const webDir = join(root, 'web');

  const htmlFilter = (file: string): boolean => file.endsWith('.html');

  return countFilesRecursively(publicDir, htmlFilter) + countFilesRecursively(webDir, htmlFilter);
}

function countAssets(): number {
  const assetsDir = join(root, 'public', 'assets');
  return countFilesRecursively(assetsDir);
}

function listStaticEndpoints(): string[] {
  return [
    '/index.html',
    '/bot-gym/index.html',
    '/looppool/index.html',
    '/cache-up/index.html',
    '/retriever-ag/index.html',
    '/art-official-intelligence/index.html',
    '/data/report-latest.json',
    '/assets/images/',
  ];
}

export function generateWeeklyReport(): WeeklyReportData {
  const now = new Date();
  const { weekStart, weekEnd } = getWeekBounds(now);

  return {
    generatedAt: now.toISOString(),
    weekStart,
    weekEnd,
    gitCommit: getGitCommit(),
    version: process.env.npm_package_version || '0.0.0',
    metrics: {
      staticRoutes: countStaticRoutes(),
      dynamicRoutes: SERVERLESS_FUNCTIONS.length,
      totalAssets: countAssets(),
    },
    staticEndpoints: listStaticEndpoints(),
  };
}

export function buildWeeklyReport(): void {
  // Ensure public/data directory exists
  if (!existsSync(publicDataDir)) {
    mkdirSync(publicDataDir, { recursive: true });
  }

  const report = generateWeeklyReport();
  const reportJson = JSON.stringify(report, null, 2);

  // Generate dated filename
  const dateStr = report.generatedAt.split('T')[0];
  const datedFilename = `report-${dateStr}.json`;
  const datedFilePath = join(publicDataDir, datedFilename);
  const latestFilePath = join(publicDataDir, 'report-latest.json');

  // Write dated report
  writeFileSync(datedFilePath, reportJson, 'utf-8');
  console.log(`Generated: ${datedFilename}`);

  // Copy to latest
  copyFileSync(datedFilePath, latestFilePath);
  console.log('Updated: report-latest.json');

  console.log(`\nWeekly report generated successfully:`);
  console.log(`  Week: ${report.weekStart} to ${report.weekEnd}`);
  console.log(`  Static routes: ${report.metrics.staticRoutes}`);
  console.log(`  Dynamic routes: ${report.metrics.dynamicRoutes}`);
  console.log(`  Total assets: ${report.metrics.totalAssets}`);
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildWeeklyReport();
}
