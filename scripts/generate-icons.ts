import sharp from "sharp";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ICONS_DIR = join(import.meta.dir, "../src-tauri/icons");
const SOURCE_LOGO = join(import.meta.dir, "../public/logo.png");

// App icon sizes for macOS
const APP_ICON_SIZES = [16, 32, 64, 128, 256, 512, 1024];

async function generateAppIcons() {
  console.log("Generating app icons with proper padding from source logo...");

  // Read source logo
  const sourceImage = sharp(SOURCE_LOGO);
  const metadata = await sourceImage.metadata();
  console.log(`Source logo: ${metadata.width}x${metadata.height}`);

  // Generate each size with 10% padding (content at 80%)
  for (const size of APP_ICON_SIZES) {
    const contentSize = Math.round(size * 0.8); // 80% for content
    const padding = Math.round(size * 0.1); // 10% padding each side

    await sharp(SOURCE_LOGO)
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(ICONS_DIR, size === 1024 ? "icon.png" : `${size}x${size}.png`));

    console.log(`✓ ${size === 1024 ? "icon.png" : `${size}x${size}.png`} (${size}x${size})`);
  }

  // Create 128x128@2x (256px)
  const size2x = 256;
  const contentSize2x = Math.round(size2x * 0.8);
  const padding2x = Math.round(size2x * 0.1);

  await sharp(SOURCE_LOGO)
    .resize(contentSize2x, contentSize2x, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding2x,
      bottom: padding2x,
      left: padding2x,
      right: padding2x,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(ICONS_DIR, "128x128@2x.png"));

  console.log("✓ 128x128@2x.png (256x256)");
}

async function generateTrayIcon() {
  console.log("\nGenerating tray icon (template image - black)...");

  // For tray icons, we need black color for template images
  // macOS will automatically invert for dark mode

  for (const size of [16, 32]) {
    const contentSize = Math.round(size * 0.85); // Slightly larger for tray
    const padding = Math.round((size - contentSize) / 2);

    // Convert white to black by negating
    await sharp(SOURCE_LOGO)
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .negate({ alpha: false }) // Invert colors (white -> black)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(ICONS_DIR, size === 16 ? "tray-icon.png" : "tray-icon@2x.png"));

    console.log(`✓ ${size === 16 ? "tray-icon.png" : "tray-icon@2x.png"} (${size}x${size})`);
  }

  // Also update 32x32.png for the current tray icon usage
  const size = 32;
  const contentSize = Math.round(size * 0.85);
  const padding = Math.round((size - contentSize) / 2);

  await sharp(SOURCE_LOGO)
    .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .negate({ alpha: false })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(ICONS_DIR, "32x32.png"));

  console.log("✓ 32x32.png (tray template)");
}

async function generateWindowsIcons() {
  console.log("\nGenerating Windows icons...");

  const windowsSizes = [
    { name: "StoreLogo.png", size: 50 },
    { name: "Square30x30Logo.png", size: 30 },
    { name: "Square44x44Logo.png", size: 44 },
    { name: "Square71x71Logo.png", size: 71 },
    { name: "Square89x89Logo.png", size: 89 },
    { name: "Square107x107Logo.png", size: 107 },
    { name: "Square142x142Logo.png", size: 142 },
    { name: "Square150x150Logo.png", size: 150 },
    { name: "Square284x284Logo.png", size: 284 },
    { name: "Square310x310Logo.png", size: 310 },
  ];

  for (const { name, size } of windowsSizes) {
    const contentSize = Math.round(size * 0.8);
    const padding = Math.round(size * 0.1);

    await sharp(SOURCE_LOGO)
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(ICONS_DIR, name));

    console.log(`✓ ${name}`);
  }
}

async function generateMacOSIcns() {
  console.log("\nGenerating macOS .icns file...");

  const iconsetDir = join(ICONS_DIR, "icon.iconset");

  // Create iconset directory
  if (existsSync(iconsetDir)) {
    rmSync(iconsetDir, { recursive: true });
  }
  mkdirSync(iconsetDir);

  // macOS iconset requires specific sizes and naming
  const iconsetSizes = [
    { name: "icon_16x16.png", size: 16 },
    { name: "icon_16x16@2x.png", size: 32 },
    { name: "icon_32x32.png", size: 32 },
    { name: "icon_32x32@2x.png", size: 64 },
    { name: "icon_128x128.png", size: 128 },
    { name: "icon_128x128@2x.png", size: 256 },
    { name: "icon_256x256.png", size: 256 },
    { name: "icon_256x256@2x.png", size: 512 },
    { name: "icon_512x512.png", size: 512 },
    { name: "icon_512x512@2x.png", size: 1024 },
  ];

  for (const { name, size } of iconsetSizes) {
    const contentSize = Math.round(size * 0.8);
    const padding = Math.round(size * 0.1);

    await sharp(SOURCE_LOGO)
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(join(iconsetDir, name));
  }

  // Convert to .icns using iconutil
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${join(ICONS_DIR, "icon.icns")}"`, {
      stdio: "inherit",
    });
    console.log("✓ icon.icns");

    // Clean up iconset directory
    rmSync(iconsetDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create .icns file. Make sure iconutil is available.");
  }
}

async function main() {
  console.log("🎨 Generating icons from source logo\n");
  console.log(`Source: ${SOURCE_LOGO}`);
  console.log("Guidelines: 10% padding, content at 80% of canvas\n");

  await generateAppIcons();
  await generateTrayIcon();
  await generateWindowsIcons();
  await generateMacOSIcns();

  console.log("\n✅ All icons generated from your logo!");
}

main().catch(console.error);
