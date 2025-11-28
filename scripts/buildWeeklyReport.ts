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

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDataDir = join(root, 'public', 'data');

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

function countStaticRoutes(): number {
  // Count HTML files in public and web directories as static routes
  const publicDir = join(root, 'public');
  const webDir = join(root, 'web');
  let count = 0;

  try {
    const result = execSync(
      `find "${publicDir}" "${webDir}" -name "*.html" 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    );
    count = parseInt(result.trim(), 10) || 0;
  } catch {
    count = 0;
  }

  return count;
}

function countAssets(): number {
  const assetsDir = join(root, 'public', 'assets');
  let count = 0;

  try {
    const result = execSync(
      `find "${assetsDir}" -type f 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    );
    count = parseInt(result.trim(), 10) || 0;
  } catch {
    count = 0;
  }

  return count;
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
      dynamicRoutes: 2, // /ask and /api/gemini serverless functions
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
