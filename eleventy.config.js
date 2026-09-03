const fs = require("fs");
const path = require("path");
const eleventyImg = require("@11ty/eleventy-img");
const Image = eleventyImg.default;

// Matches a plain <img src="..."> tag the way it appears in the site's
// existing post markup (Webflow-exported richtext figures). Only local,
// relative image paths are touched -- anything starting with http(s):// is
// left completely alone (this is how existing Google Drive image links in
// older posts are preserved untouched, per project instructions).
const IMG_TAG = /<img src="([^"]+)"([^>]*)>/g;

// Broader match used only for discovering which raw image files need to be
// passthrough-copied -- catches every <img ...> tag regardless of attribute
// order (e.g. the "post-image" thumbnail cards hand-typed into ~30 country
// TOC pages and the Excursion pages, which put class/sizes before src and so
// never match IMG_TAG above).
const IMG_TAG_ANY = /<img\b[^>]*>/g;

// Same idea as IMG_TAG_ANY, but for local video files referenced via
// <video><source src="..."></video> -- these are never touched by the
// image optimizer (it only matches <img> tags), so they need the same raw
// passthrough-copy treatment as everything below.
const SOURCE_TAG_ANY = /<source\b[^>]*>/g;

// A real Webflow export includes a *set* of pre-generated derivative files
// for each photo (e.g. "DSCF8590comp-p-800x534.jpeg"), referenced from the
// srcset attribute, not just the one file named in src -- these are genuine
// files on disk, not fake/placeholder names. Missing this (only scanning
// src=, not srcset=) is what broke the About page photo and every Excursion
// page's inline thumbnails: their base file copied fine, but every srcset
// candidate 404'd, and per the HTML spec a browser ignores src entirely once
// srcset has width descriptors -- so the whole image failed to render, or a
// browser lucky enough to still have some cached candidate showed a
// smaller-than-intended one.
function localImagePathsInTag(tag) {
  const paths = [];
  const srcMatch = tag.match(/\bsrc="([^"]+)"/);
  if (srcMatch) paths.push(srcMatch[1]);
  const srcsetMatch = tag.match(/\bsrcset="([^"]+)"/);
  if (srcsetMatch) {
    for (const candidate of srcsetMatch[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) paths.push(url);
    }
  }
  return paths.filter((p) => !/^https?:\/\//i.test(p));
}

// Scans every content file for local images that need a raw passthrough
// copy: a front-matter cardImage, or any src/srcset file referenced by an
// <img> tag that the build-time optimizer below won't itself rewrite. The
// optimizer only rewrites the exact `<img src="...">` shape (src as the very
// first attribute) inside asia/americas/europe post files -- everything else
// (root pages' own images, the ~30 hand-typed country TOC pages, and the
// Excursion pages' inline thumbnails) still needs its source files shipped
// as-is. This intentionally does NOT copy whole image folders (that was the
// earlier approach and is what pushed the deploy over GitHub Pages' 1GB
// artifact limit) -- only the specific files a page actually references.
function findLocalImagePaths(dir) {
  const found = new Set();
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "_includes") continue;
        walk(full);
      } else if (/\.(html|njk)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");

        const cardMatch = content.match(/^cardImage: "([^"]+)"/m);
        if (cardMatch) found.add(cardMatch[1]);

        const relDir = path.relative("src", path.dirname(full)).replace(/\\/g, "/");
        const isOptimizedDir = /^(asia|americas|europe)(\/|$)/.test(relDir);
        for (const m of content.matchAll(IMG_TAG_ANY)) {
          const tag = m[0];
          const isOptimizerTag = tag.startsWith('<img src="');
          if (isOptimizedDir && isOptimizerTag) continue; // handled by optimizeLocalImages instead
          for (const src of localImagePathsInTag(tag)) {
            const abs = "/" + path.posix.normalize(path.posix.join(relDir, src));
            found.add(abs);
          }
        }
        for (const m of content.matchAll(SOURCE_TAG_ANY)) {
          for (const src of localImagePathsInTag(m[0])) {
            const abs = "/" + path.posix.normalize(path.posix.join(relDir, src));
            found.add(abs);
          }
        }
      }
    }
  }
  walk(dir);
  return [...found];
}

// Only individual trip posts (under asia/, americas/, europe/) go through
// build-time image optimization for now. Root pages (home, snapped, at, ...)
// still use their existing card-thumbnail markup untouched -- that gets its
// own proper pass once those pages are driven by a shared card template
// (planned for the batch when the rest of the posts are migrated), rather
// than risk repeating the sizing bug on a second, different code path today.
//
// inputPath's exact format (leading "./", slash direction) varies between
// `eleventy --serve` and a plain one-shot `eleventy` build, so normalize
// with path.normalize() rather than matching the raw string directly --
// matching the raw string silently passed in --serve but silently failed
// on a plain build (which is what the deploy workflow actually runs),
// meaning this check never matched in production and every image shipped
// unoptimized.
const POST_DIR = /^src[\\/](asia|americas|europe)[\\/]/;

async function optimizeLocalImages(content, outputPath) {
  if (!outputPath || !outputPath.endsWith(".html")) return content;
  if (!this.page || !this.page.inputPath) return content;
  const normalizedInput = path.normalize(this.page.inputPath);
  if (!POST_DIR.test(normalizedInput)) return content;

  const sourceDir = path.dirname(normalizedInput);
  const matches = [...content.matchAll(IMG_TAG)];
  if (matches.length === 0) return content;

  let result = content;
  for (const match of matches) {
    const [fullTag, src] = match;
    if (/^https?:\/\//i.test(src)) continue; // leave remote (e.g. Google Drive) images untouched

    const sourcePath = path.join(sourceDir, src);
    let metadata;
    try {
      metadata = await Image(sourcePath, {
        widths: [800, 1800],
        formats: ["jpeg"],
        sharpJpegOptions: { quality: 65 },
        outputDir: "_site/img/",
        urlPath: "/img/",
        filenameFormat: (id, src, width, format) => {
          const name = path.basename(src, path.extname(src));
          return `${name}-${width}w-${id}.${format}`;
        },
      });
    } catch (err) {
      // Source image genuinely missing on disk -- leave the original tag as-is
      // rather than breaking the build, and surface it so it can be checked.
      console.warn(`[image] could not process ${sourcePath}: ${err.message}`);
      continue;
    }

    // Deliberately a single plain <img> with just src/srcset/sizes added --
    // no width/height attributes and no <picture>/<source> wrapper. The
    // site's CSS sizes these images itself (max-width: 100% on a
    // shrink-to-fit inline-block container) and was never written to expect
    // an img with a declared intrinsic size box; adding one fought that CSS
    // and produced a stretched/pixelated result. This keeps the exact same
    // markup shape as the original bare <img>, just with real responsive
    // sources instead of one oversized file.
    const variants = metadata.jpeg;
    const srcset = variants.map((v) => `${v.url} ${v.width}w`).join(", ");
    const fallback = variants[variants.length - 1].url;
    const generatedTag = `<img src="${fallback}" srcset="${srcset}" sizes="(max-width: 940px) 100vw, 940px" loading="lazy">`;

    result = result.replace(fullTag, generatedTag);
  }
  return result;
}

module.exports = function (eleventyConfig) {
  // Post content files are plain HTML pass-through (front matter is still
  // read, but the body itself is never run through a template language) --
  // this guarantees migrated post prose renders exactly as written, with no
  // risk of stray "{{ }}"-looking text being misinterpreted. Layout files
  // (.njk) are unaffected and still process normally.
  eleventyConfig.htmlTemplateEngine = false;

  // Computed once per build, so the footer's copyright year rolls forward
  // on its own every time the site is rebuilt and deployed.
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy("src/*.ico");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.svg");
  eleventyConfig.addPassthroughCopy("src/*.json");
  eleventyConfig.addPassthroughCopy("src/*.xml");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  // Raw passthrough for every locally-referenced image the build-time
  // optimizer won't itself generate a derivative for (card thumbnails, root
  // pages' own images, and country TOC page thumbnails) -- see
  // findLocalImagePaths above for why this can't just be a whole-folder
  // copy.
  for (const imagePath of findLocalImagePaths("src")) {
    eleventyConfig.addPassthroughCopy({ [`src${imagePath}`]: imagePath.slice(1) });
  }

  // Keep every page's published path identical to what it is today
  // (e.g. src/asia/china/kaiping.html -> /asia/china/kaiping.html),
  // so existing links and bookmarks keep working unchanged.
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => `${data.page.filePathStem}.html`,
  });

  eleventyConfig.addTransform("optimize-local-images", optimizeLocalImages);

  // Drives the homepage feed and the full archive: only posts that carry
  // card data (date/cardTitle/cardDate/cardImage, extracted from the
  // original wrapped.html) show up here -- matching exactly which posts
  // appear in the archive today. Individual sub-day posts that were never
  // in the main feed (e.g. kyoto2.html) stay excluded, same as now.
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getAll()
      .filter((item) => item.data.cardImage)
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("recentPosts", (collectionApi) =>
    collectionApi.getAll()
      .filter((item) => item.data.cardImage)
      .sort((a, b) => b.date - a.date)
      .slice(0, 9)
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
};
