import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, getPixel) {
  // getPixel(x, y) returns [r, g, b, a]
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // Build PNG chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // CRC calculation
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Pre-computed CRC32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderDarkWoodsIcon(x, y, w, h) {
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: dark midnight forest
  let r = Math.floor(10 + (1 - dist) * 20);
  let g = Math.floor(14 + (1 - dist) * 25);
  let b = Math.floor(24 + (1 - dist) * 35);

  // Zombie eyes / red targeting reticle
  const eye1Dist = Math.hypot(nx - (-0.25), ny - (-0.1));
  const eye2Dist = Math.hypot(nx - (0.25), ny - (-0.1));

  if (eye1Dist < 0.12 || eye2Dist < 0.12) {
    const minEye = Math.min(eye1Dist, eye2Dist);
    if (minEye < 0.04) {
      return [255, 255, 255, 255];
    }
    const glow = Math.max(0, 1 - minEye / 0.12);
    r = Math.min(255, Math.floor(r + glow * 240));
    g = Math.min(255, Math.floor(g + glow * 30));
    b = Math.min(255, Math.floor(b + glow * 40));
  }

  // Crosshair ring
  if (Math.abs(dist - 0.6) < 0.02) {
    r = Math.min(255, r + 180);
    g = Math.min(255, g + 40);
    b = Math.min(255, b + 40);
  }

  return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)), 255];
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, renderDarkWoodsIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, renderDarkWoodsIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, renderDarkWoodsIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, renderDarkWoodsIcon));
console.log('Successfully generated all PWA icons!');
