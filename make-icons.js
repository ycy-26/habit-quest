// Generates icon-192.png and icon-512.png — an Aurora gradient tile with a white check.
// No dependencies; hand-encodes PNG (IHDR/IDAT/IEND) using Node's zlib. Run: node make-icons.js
const fs = require('fs'), zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    let c = (crc ^ buf[i]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function png(size) {
  const w = size, h = size, A = [0x8B, 0x7D, 0xFF], B = [0x22, 0xD3, 0xEE];
  const pts = [[0.30, 0.54], [0.44, 0.68], [0.72, 0.34]], th = size * 0.085;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    let off = y * (w * 4 + 1); raw[off++] = 0;
    for (let x = 0; x < w; x++) {
      const t = (x + y) / (w + h);
      let r = lerp(A[0], B[0], t), g = lerp(A[1], B[1], t), b = lerp(A[2], B[2], t);
      const d = Math.min(
        distSeg(x, y, pts[0][0] * w, pts[0][1] * h, pts[1][0] * w, pts[1][1] * h),
        distSeg(x, y, pts[1][0] * w, pts[1][1] * h, pts[2][0] * w, pts[2][1] * h)
      );
      if (d < th / 2) { r = g = b = 255; }
      else if (d < th / 2 + 1.5) { const f = (d - th / 2) / 1.5; r = lerp(255, r, f); g = lerp(255, g, f); b = lerp(255, b, f); }
      raw[off++] = r; raw[off++] = g; raw[off++] = b; raw[off++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync('icon-192.png', png(192));
fs.writeFileSync('icon-512.png', png(512));
console.log('Wrote icon-192.png and icon-512.png');
