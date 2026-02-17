#!/usr/bin/env node

/**
 * Basic tests for Google Cloud setup scripts
 * These tests verify script syntax and basic functionality without actually running gcloud commands
 */

import { spawn } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { test, expect } from 'vitest';

const TEST_TIMEOUT = 10000; // 10 seconds

test('gcp-setup.sh exists and is executable', async () => {
  await expect(access('./gcp-setup.sh', constants.F_OK | constants.X_OK)).resolves.not.toThrow();
}, TEST_TIMEOUT);

test('gcp-bootstrap.sh exists and is executable', async () => {
  await expect(access('./gcp-bootstrap.sh', constants.F_OK | constants.X_OK)).resolves.not.toThrow();
}, TEST_TIMEOUT);

test('gcp-setup.sh has valid bash syntax', async () => {
  const result = await new Promise((resolve, reject) => {
    const proc = spawn('bash', ['-n', './gcp-setup.sh'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stderr });
    });
    
    proc.on('error', reject);
  });
  
  expect(result.code).toBe(0);
  expect(result.stderr).toBe('');
}, TEST_TIMEOUT);

test('gcp-bootstrap.sh has valid bash syntax', async () => {
  const result = await new Promise((resolve, reject) => {
    const proc = spawn('bash', ['-n', './gcp-bootstrap.sh'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stderr });
    });
    
    proc.on('error', reject);
  });
  
  expect(result.code).toBe(0);
  expect(result.stderr).toBe('');
}, TEST_TIMEOUT);

test('gcp-bootstrap.sh --help works', async () => {
  const result = await new Promise((resolve, reject) => {
    const proc = spawn('./gcp-bootstrap.sh', ['--help'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', reject);
  });
  
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Google Cloud Project Bootstrap Script');
  expect(result.stdout).toContain('Usage:');
  expect(result.stdout).toContain('Examples:');
}, TEST_TIMEOUT);

test('npm run gcp:setup script exists', async () => {
  const packageJson = await import('../package.json', { assert: { type: 'json' } });
  expect(packageJson.default.scripts['gcp:setup']).toBe('./gcp-setup.sh');
});

test('npm run gcp:bootstrap script exists', async () => {
  const packageJson = await import('../package.json', { assert: { type: 'json' } });
  expect(packageJson.default.scripts['gcp:bootstrap']).toBe('./gcp-bootstrap.sh');
});