import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'extension', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create an SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="micGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
  </defs>
  <!-- Background Rounded Rect -->
  <rect width="128" height="128" rx="28" fill="url(#bgGrad)" />
  
  <!-- Outer glowing rings -->
  <circle cx="64" cy="54" r="38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.25" />
  <circle cx="64" cy="54" r="44" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.15" />
  
  <!-- Microphone Capsule -->
  <rect x="52" y="30" width="24" height="42" rx="12" fill="url(#micGrad)" />
  
  <!-- Microphone Arc -->
  <path d="M40,54 C40,68 50,78 64,78 C78,78 88,68 88,54" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
  
  <!-- Stem & Base -->
  <line x1="64" y1="78" x2="64" y2="94" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
  <line x1="48" y1="94" x2="80" y2="94" stroke="#ffffff" stroke-width="5" stroke-linecap="round" />
  
  <!-- Small Dual Language badges (Bangla & English) -->
  <circle cx="28" cy="100" r="14" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5" />
  <text x="28" y="105" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">বাং</text>

  <circle cx="100" cy="100" r="14" fill="#0f766e" stroke="#2dd4bf" stroke-width="1.5" />
  <text x="100" y="104" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">EN</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

// Helper to create minimal valid RGBA PNG buffer in pure JS
function createMinimalPng(width, height) {
  // We can write a 1x1 or sized PNG with zlib deflate
  import('zlib').then(zlib => {
    // Generate simple raw RGBA
    const buffer = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
      const rowStart = y * (1 + width * 4);
      buffer[rowStart] = 0; // Filter type 0 (None)
      for (let x = 0; x < width; x++) {
        const pixelStart = rowStart + 1 + x * 4;
        // Dark blue circle / gradient
        const dx = x - width / 2;
        const dy = y - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = width / 2;
        if (dist <= radius) {
          buffer[pixelStart] = 2;     // R
          buffer[pixelStart + 1] = 132; // G
          buffer[pixelStart + 2] = 199; // B
          buffer[pixelStart + 3] = 255; // A
        } else {
          buffer[pixelStart] = 0;
          buffer[pixelStart + 1] = 0;
          buffer[pixelStart + 2] = 0;
          buffer[pixelStart + 3] = 0;
        }
      }
    }

    const compressed = zlib.deflateSync(buffer);

    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    // IHDR
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // Length
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr[16] = 8; // Bit depth
    ihdr[17] = 6; // Color type 6 (RGBA)
    ihdr[18] = 0; // Compression
    ihdr[19] = 0; // Filter
    ihdr[20] = 0; // Interlace
    const ihdrCrc = crc32(ihdr.slice(4, 21));
    ihdr.writeInt32BE(ihdrCrc, 21);

    // IDAT
    const idatHeader = Buffer.alloc(8);
    idatHeader.writeUInt32BE(compressed.length, 0);
    idatHeader.write('IDAT', 4);
    const idatCrcVal = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
    const idatFooter = Buffer.alloc(4);
    idatFooter.writeInt32BE(idatCrcVal, 0);

    // IEND
    const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

    const png = Buffer.concat([signature, ihdr, idatHeader, compressed, idatFooter, iend]);
    fs.writeFileSync(path.join(iconsDir, `icon${width}.png`), png);
    console.log(`Generated icon${width}.png`);
  });
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

createMinimalPng(16, 16);
createMinimalPng(48, 48);
createMinimalPng(128, 128);
