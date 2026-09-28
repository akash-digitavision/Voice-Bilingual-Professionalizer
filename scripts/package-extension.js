import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const outputZipPath = path.join(rootDir, 'voice-bilingual-professionalizer-v1.0.0.zip');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const publicZipPath = path.join(publicDir, 'voice-bilingual-professionalizer-v1.0.0.zip');

async function packageExtension() {
  console.log('--- Starting Chrome Extension Packaging ---');
  const zip = new JSZip();

  // Recursively add extension files to zip
  function addDirectory(currentPath, zipFolder) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      // Security check: Never package .env, node_modules, or secret files
      if (entry.name === '.env' || entry.name === 'node_modules' || entry.name.endsWith('.key')) {
        console.warn(`[Security Alert] Skipping prohibited file: ${entry.name}`);
        continue;
      }

      if (entry.isDirectory()) {
        const subFolder = zipFolder.folder(entry.name);
        addDirectory(fullPath, subFolder);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, fileData);
      }
    }
  }

  addDirectory(extensionDir, zip);

  console.log('Generating ZIP buffer...');
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(outputZipPath, zipBuffer);
  fs.writeFileSync(publicZipPath, zipBuffer);

  const stats = fs.statSync(outputZipPath);
  console.log(`Successfully created ZIP: ${outputZipPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`Copied to public web distribution: ${publicZipPath}`);
}

packageExtension().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
