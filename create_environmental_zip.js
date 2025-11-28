#!/usr/bin/env node
/**
 * AGON Environmental Staging Packer
 *
 * - Auto-generates thumbnails (if ffmpeg / convert are available)
 * - Computes sha256 + size
 * - Writes manifest.json
 * - Builds AGON_Environmental_Staging.zip
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import archiver from 'archiver';

const ROOT = process.cwd();
const THUMBS_DIR = path.join(ROOT, 'thumbs');
const OUT_ZIP = path.join(ROOT, 'AGON_Environmental_Staging.zip');

function hasBin(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_FFMPEG = hasBin('ffmpeg');
const HAS_CONVERT = hasBin('convert'); // ImageMagick

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'thumbs' || f === 'node_modules') continue;
    const full = path.join(dir, f);
    const rel = path.relative(ROOT, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, fileList);
    } else {
      fileList.push({ full, rel, stat });
    }
  }
  return fileList;
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function extOf(p) {
  return p.split('.').pop().toLowerCase();
}

function isImageExt(ext) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
}
function isVideoExt(ext) {
  return ['mp4', 'm4v', 'webm', 'mov'].includes(ext);
}

function ensureThumbsDir() {
  if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
  }
}

function makeThumbForVideo(file) {
  if (!HAS_FFMPEG) return null;
  ensureThumbsDir();
  const base = path.basename(file.full, path.extname(file.full));
  const thumbPath = path.join(THUMBS_DIR, `${base}.jpg`);
  if (fs.existsSync(thumbPath)) return thumbPath;

  const cmd = `ffmpeg -y -ss 0.8 -i "${file.full}" -vframes 1 -vf "scale=640:-1" "${thumbPath}"`;
  console.log('[ffmpeg]', cmd);
  try {
    execSync(cmd, { stdio: 'ignore' });
    return thumbPath;
  } catch (e) {
    console.warn('ffmpeg failed for', file.rel, e.message);
    return null;
  }
}

function makeThumbForImage(file) {
  if (!HAS_CONVERT) return null;
  ensureThumbsDir();
  const base = path.basename(file.full, path.extname(file.full));
  const thumbPath = path.join(THUMBS_DIR, `${base}.jpg`);
  if (fs.existsSync(thumbPath)) return thumbPath;

  const cmd = `convert "${file.full}" -resize 640x -strip "${thumbPath}"`;
  console.log('[convert]', cmd);
  try {
    execSync(cmd, { stdio: 'ignore' });
    return thumbPath;
  } catch (e) {
    console.warn('convert failed for', file.rel, e.message);
    return null;
  }
}

function buildManifest(files) {
  const manifest = [];

  for (const f of files) {
    const ext = extOf(f.rel);
    const entry = {
      path: f.rel.replace(/\\/g, '/'),
      size: f.stat.size,
      sha256: sha256(f.full),
    };

    if (/lut|fold|pressure|somatic|chronosomic/i.test(f.rel)) {
      entry.tags = (entry.tags || []).concat('somatic');
    }

    if (isVideoExt(ext)) {
      const thumbFull = makeThumbForVideo(f);
      if (thumbFull) {
        entry.thumbnail = path.relative(ROOT, thumbFull).replace(/\\/g, '/');
      }
    } else if (isImageExt(ext)) {
      const thumbFull = makeThumbForImage(f);
      if (thumbFull) {
        entry.thumbnail = path.relative(ROOT, thumbFull).replace(/\\/g, '/');
      }
    }

    manifest.push(entry);
  }

  fs.writeFileSync(
    path.join(ROOT, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log('✓ manifest.json written with', manifest.length, 'entries');
}

function zipAll() {
  if (fs.existsSync(OUT_ZIP)) fs.unlinkSync(OUT_ZIP);
  const output = fs.createWriteStream(OUT_ZIP);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('✓ ZIP created:', OUT_ZIP, '-', archive.pointer(), 'bytes');
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(ROOT, false);
  archive.finalize();
}

function main() {
  console.log('AGON Environmental Staging — Auto packer');
  console.log('ffmpeg:', HAS_FFMPEG ? 'yes' : 'no', '| convert:', HAS_CONVERT ? 'yes' : 'no');

  const files = walk(ROOT);
  buildManifest(files);
  zipAll();
}

main();
