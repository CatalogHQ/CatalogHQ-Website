import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, "../public/images");

const HERO_SOURCES = [
  "hero-feed-slide-1.png",
  "hero-feed-slide-2.png",
  "hero-feed-slide-3.png",
];

async function convertHeroImage(filename) {
  const inputPath = path.join(imagesDir, filename);
  const outputName = filename.replace(/\.png$/i, ".webp");
  const outputPath = path.join(imagesDir, outputName);

  const inputStat = await stat(inputPath);
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  await image
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);

  const outputStat = await stat(outputPath);
  const saved = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);

  console.log(
    `${filename} (${metadata.width}x${metadata.height}) -> ${outputName}: ${(inputStat.size / 1024).toFixed(0)}KB -> ${(outputStat.size / 1024).toFixed(0)}KB (${saved}% smaller)`,
  );
}

const entries = await readdir(imagesDir);
const sources = HERO_SOURCES.filter((name) => entries.includes(name));

if (sources.length === 0) {
  console.error("No hero PNG sources found in", imagesDir);
  process.exit(1);
}

for (const source of sources) {
  await convertHeroImage(source);
}

console.log(`Converted ${sources.length} hero image(s) to WebP.`);
