import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'web', 'kpop-stageport');
const outputZip = '/mnt/data/KPop_Choreo_Planner_StagePort_Linked.zip';
const stagingRootName = 'KPop_Planner_Deliverable_v2';

async function ensureZipBinary() {
  return new Promise((resolve, reject) => {
    const proc = spawn('zip', ['-h']);
    proc.on('error', (error) => {
      reject(new Error(`zip binary not available: ${error.message}`));
    });
    proc.on('exit', (code) => {
      if (code === 0 || code === 1) {
        resolve();
      } else {
        reject(new Error('zip binary exited with code ' + code));
      }
    });
  });
}

async function copySourceTo(targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function zipDirectory(source, destination) {
  await fs.rm(destination, { force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await new Promise((resolve, reject) => {
    const proc = spawn('zip', ['-r', destination, '.'], { cwd: source, stdio: 'inherit' });
    proc.on('error', (error) => reject(error));
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`zip exited with code ${code}`));
    });
  });
}

async function main() {
  await ensureZipBinary();
  const stagingRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'stageport-zip-'));
  const target = path.join(stagingRoot, stagingRootName);
  try {
    await copySourceTo(target);
    await zipDirectory(target, outputZip);
    console.log(`Created StagePort deliverable zip at: ${outputZip}`);
  } finally {
    await fs.rm(stagingRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
