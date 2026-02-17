#!/usr/bin/env node
import { spawn } from 'node:child_process';
const args = process.argv.slice(2);
const prompt = args.join(' ') || 'Summarize repo health and next actions.';
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['gemini', prompt], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
