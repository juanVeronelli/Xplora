import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('src/public/logos');
const SKIP_DIR = /(_files)$/i;
const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const VECTOR = new Set(['.svg']);
const USED_SVG = new Set([
  'fardo.svg',
  'squadventures.svg',
  'zettios-logo.svg',
  'comet-logo-dark.svg',
]);

const dirs = ['partners', 'partners-png', 'startup-day'];

async function walk(dir, acc = []) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.test(e.name) || e.name.endsWith('_files')) continue;
      await walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function outPath(file) {
  return file.replace(/\.(png|jpe?g|webp|avif|svg)$/i, '.webp');
}

async function convert(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (ext === '.html') return;
  if (VECTOR.has(ext) && !USED_SVG.has(base)) return;
  if (!RASTER.has(ext) && !VECTOR.has(ext)) return;

  const dest = outPath(file);
  const img = sharp(file, { density: 192, animated: false });
  const meta = await img.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const max = 480;
  const pipeline =
    w > max || h > max
      ? img.resize({
          width: max,
          height: max,
          fit: 'inside',
          withoutEnlargement: true,
        })
      : img;

  await pipeline.webp({ quality: 80, alphaQuality: 82, effort: 5 }).toFile(dest + '.tmp.webp');
  const { size: srcSize } = await stat(file);
  const { size: dstSize } = await stat(dest + '.tmp.webp');
  const { rename, rm } = await import('node:fs/promises');
  await rename(dest + '.tmp.webp', dest);
  const same = path.resolve(file) === path.resolve(dest);
  if (!same && RASTER.has(ext) && ext !== '.webp') {
    // keep original as source; webp is what the site will serve
  }
  console.log(
    `${path.relative(ROOT, file)}  ${srcSize} → ${path.basename(dest)} ${dstSize}${w && h ? ` (${w}x${h})` : ''}`,
  );
}

const files = [];
for (const d of dirs) {
  await walk(path.join(ROOT, d), files);
}

for (const f of files) {
  try {
    await convert(f);
  } catch (err) {
    console.error('FAIL', f, err.message);
  }
}
