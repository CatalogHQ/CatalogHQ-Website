import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const outDir = path.join(
  appRoot,
  "public",
  "images",
  "cataloghq-logos",
);
const logoPath = path.join(outDir, "cataloghq-full-logo-no-bg.png");
const outPath = path.join(outDir, "cataloghq-social-og-1200x630.png");

const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = "#f3f4f6";
const LOGO_MAX_WIDTH = 560;

const logo = sharp(logoPath).resize({
  width: LOGO_MAX_WIDTH,
  fit: "inside",
  withoutEnlargement: false,
});

const { data: logoBuffer, info: logoInfo } = await logo
  .png()
  .toBuffer({ resolveWithObject: true });

const logoLeft = Math.round((WIDTH - logoInfo.width) / 2);
const logoTop = 72;

const textSvg = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="600" y="392" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#111827">One link. Paid checkout.</text>
  <text x="600" y="448" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="28" font-weight="400" fill="#4b5563">For Nigerian vendors on WhatsApp, Instagram, Facebook, and X.</text>
</svg>`);

await mkdir(outDir, { recursive: true });

await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 4,
    background: BACKGROUND,
  },
})
  .composite([
    { input: logoBuffer, left: logoLeft, top: logoTop },
    { input: textSvg, left: 0, top: 0 },
  ])
  .png()
  .toFile(outPath);

console.log(`Wrote ${outPath}`);
