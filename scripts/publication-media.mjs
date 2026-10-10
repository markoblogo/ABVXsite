import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

export function safePublicationTarget(root, relative) {
  let current = root;
  if (lstatSync(root).isSymbolicLink()) throw new Error('Checkout root must not be a symlink');
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`Symlink target refused: ${relative}`);
  }
  return path.join(root, relative);
}

export function planApprovedMedia(referenced, descriptors, root) {
  const media = [];
  const targets = new Set();
  for (const asset of descriptors || []) {
    if (!referenced.has(asset.target) || targets.has(asset.target)) throw new Error('Unreferenced or duplicate media destination');
    if (!/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/.test(asset.target)) throw new Error('Unsafe image path');
    if (!path.isAbsolute(asset.source)) throw new Error('Media source must be an absolute local path');
    const bytes = readFileSync(asset.source);
    if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error('Approved media hash mismatch');
    const image = bytes.subarray(0, 12);
    const recognized = asset.target.endsWith('.png') ? image.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : /\.jpe?g$/.test(asset.target) ? image[0] === 255 && image[1] === 216 && image[2] === 255
      : image.subarray(0, 4).toString() === 'RIFF' && image.subarray(8, 12).toString() === 'WEBP';
    if (!recognized) throw new Error('Media bytes do not match the declared image type');
    const target = safePublicationTarget(root, `public${asset.target}`);
    if (existsSync(target) && !readFileSync(target).equals(bytes)) throw new Error('Media destination contains different bytes');
    media.push({ target, bytes, reused: existsSync(target) });
    targets.add(asset.target);
  }
  for (const src of referenced) if (!targets.has(src)) throw new Error(`Missing approved media: ${src}`);
  return media;
}

export function applyPublication(plan) {
  const created = [];
  try {
    for (const asset of plan.media.filter(asset => !asset.reused)) {
      mkdirSync(path.dirname(asset.target), { recursive: true });
      writeFileSync(asset.target, asset.bytes, { flag: 'wx' });
      created.push(asset.target);
    }
    mkdirSync(path.dirname(plan.targetFile), { recursive: true });
    writeFileSync(plan.targetFile, plan.source, { flag: 'wx' });
    created.push(plan.targetFile);
  } catch (error) {
    for (const file of created.reverse()) unlinkSync(file);
    throw error;
  }
}
