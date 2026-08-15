#!/usr/bin/env node
// Downsizes photos to a sane max dimension before they go into the repo.
// The site's build never generates anything wider than 2400px, so shrinking
// source photos to ~2600px (a little headroom above that) has zero visual
// effect on the live site while keeping the repo from growing unnecessarily.
//
// Usage:
//   node scripts/resize-photos.js <folder>        (defaults to src/ if omitted)
//   node scripts/resize-photos.js src/asia/japan/images
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAX_DIMENSION = 2600;
const target = process.argv[2] || "src";
const root = path.resolve(process.cwd(), target);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "_site") continue;
      walk(full, files);
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

(async () => {
  const files = walk(root);
  let resized = 0,
    skipped = 0,
    savedBytes = 0;

  for (const file of files) {
    const before = fs.statSync(file).size;
    // Read fully into memory first -- writing back to the same path while
    // sharp still has an open handle on it fails on Windows.
    const inputBuffer = fs.readFileSync(file);
    const metadata = await sharp(inputBuffer).metadata();

    if (Math.max(metadata.width, metadata.height) <= MAX_DIMENSION) {
      skipped++;
      continue;
    }

    const outputBuffer = await sharp(inputBuffer)
      .rotate() // bake in EXIF orientation before resizing/writing back out
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    fs.writeFileSync(file, outputBuffer);
    const after = fs.statSync(file).size;
    savedBytes += before - after;
    resized++;
    console.log(`resized ${path.relative(process.cwd(), file)}  ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB`);
  }

  console.log(`\n${resized} resized, ${skipped} already small enough, saved ${(savedBytes / 1024 / 1024 / 1024).toFixed(2)}GB`);
})();
