#!/usr/bin/env node

import icongen from "icon-gen";
import {
  existsSync,
  readdirSync,
  copyFileSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const SOURCE_DIR = resolve(projectRoot, "assets/icon-source");
const OUTPUT_DIR = resolve(projectRoot, "assets/icons");

async function generateIcons() {
  // Find source files in source directory
  if (!existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.log("   Create the directory and add your icon.svg file.");
    process.exit(1);
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = readdirSync(SOURCE_DIR);
  const svgFile = files.find((f) => f.endsWith(".svg"));
  const pngFile = files.find((f) => f.endsWith(".png"));

  if (!svgFile) {
    console.error(`❌ No SVG file found in ${SOURCE_DIR}`);
    console.log("   Add your icon SVG file to assets/icon-source/");
    process.exit(1);
  }

  const inputPath = resolve(SOURCE_DIR, svgFile);

  // Copy SVG file to output directory as icon.svg
  const svgDest = resolve(OUTPUT_DIR, "icon.svg");
  copyFileSync(inputPath, svgDest);
  console.log(`📋 Copied SVG: ${svgFile} → icon.svg`);

  // Copy PNG file to output directory as icon.png if it exists
  if (pngFile) {
    const pngSource = resolve(SOURCE_DIR, pngFile);
    const pngDest = resolve(OUTPUT_DIR, "icon.png");
    copyFileSync(pngSource, pngDest);
    console.log(`📋 Copied PNG: ${pngFile} → icon.png`);
  }

  console.log(`🎨 Generating icons from: ${svgFile}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  try {
    const results = await icongen(inputPath, OUTPUT_DIR, {
      report: true,
      ico: {
        name: "icon",
        sizes: [16, 24, 32, 48, 64, 128, 256],
      },
      icns: {
        name: "icon",
        sizes: [16, 32, 64, 128, 256, 512, 1024],
      },
    });

    // Generate PNG for Linux (512px)
    const pngDest = resolve(OUTPUT_DIR, "icon.png");
    try {
      await icongen(inputPath, OUTPUT_DIR, {
        report: false,
        favicon: {
          name: "favicon-",
          pngSizes: [512],
          icoSizes: [],
        },
      });
    } catch {
      // icon-gen throws when cleaning up non-existent favicon.ico, ignore it
    }
    // Rename the generated PNG to icon.png
    const generatedPng = resolve(OUTPUT_DIR, "favicon-512.png");
    if (existsSync(generatedPng)) {
      copyFileSync(generatedPng, pngDest);
      unlinkSync(generatedPng);
    }

    console.log("\n✅ Icons generated successfully:");
    results.forEach((result) => {
      console.log(`   - ${result}`);
    });
    console.log(`   - ${pngDest}`);

    // Clean up source files
    for (const file of files) {
      const filePath = resolve(SOURCE_DIR, file);
      unlinkSync(filePath);
    }
    console.log("\n🧹 Cleaned up source files from assets/icon-source/");
  } catch (error) {
    console.error("❌ Failed to generate icons:", error.message);
    process.exit(1);
  }
}

generateIcons();
