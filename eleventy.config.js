const path = require("path");
const eleventyImg = require("@11ty/eleventy-img");
const Image = eleventyImg.default;

// Matches a plain <img src="..."> tag the way it appears in the site's
// existing post markup (Webflow-exported richtext figures). Only local,
// relative image paths are touched -- anything starting with http(s):// is
// left completely alone (this is how existing Google Drive image links in
// older posts are preserved untouched, per project instructions).
const IMG_TAG = /<img src="([^"]+)"([^>]*)>/g;

// Only individual trip posts (under asia/, americas/, europe/) go through
// build-time image optimization for now. Root pages (home, snapped, at, ...)
// still use their existing card-thumbnail markup untouched -- that gets its
// own proper pass once those pages are driven by a shared card template
// (planned for the batch when the rest of the posts are migrated), rather
// than risk repeating the sizing bug on a second, different code path today.
const POST_DIR = /^src[\\/](asia|americas|europe)[\\/]/;

async function optimizeLocalImages(content, outputPath) {
  if (!outputPath || !outputPath.endsWith(".html")) return content;
  if (!this.page || !this.page.inputPath) return content;
  if (!POST_DIR.test(this.page.inputPath)) return content;

  const sourceDir = path.dirname(this.page.inputPath);
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
        widths: [400, 800, 1200, 1600, 2400],
        formats: ["jpeg"],
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

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy("src/*.ico");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.svg");
  eleventyConfig.addPassthroughCopy("src/*.json");
  eleventyConfig.addPassthroughCopy("src/*.xml");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  // Un-optimized card-thumbnail images (root images/ folder, and per-post
  // images/ folders for posts not yet migrated) get copied through as-is.
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy("src/asia/**/images/**");
  eleventyConfig.addPassthroughCopy("src/americas/**/images/**");
  eleventyConfig.addPassthroughCopy("src/europe/**/images/**");

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
