/* 아이콘 생성기 — 외부 의존 없이 PNG를 직접 인코딩한다.
 *
 *   node tools/make-icons.js
 *
 * 마인드맵 모티프(중심 노드 + 궤도 노드)를 그린다.
 * 안티에일리어싱은 4배 슈퍼샘플링으로 처리.
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const BG = [11, 15, 26];
const CENTER = [129, 140, 248];
const ORBIT = [45, 212, 191];
const ORBIT2 = [244, 114, 182];
const LINE = [148, 163, 184];

function mix(dst, src, a) {
  return [
    Math.round(dst[0] * (1 - a) + src[0] * a),
    Math.round(dst[1] * (1 - a) + src[1] * a),
    Math.round(dst[2] * (1 - a) + src[2] * a)
  ];
}

function render(size, opts) {
  const ss = 4;                       // 슈퍼샘플링 배율
  const n = size * ss;
  const acc = new Float64Array(n * n * 3);
  const R = n / 2;
  const cx = R, cy = R;

  const nodes = [];
  const orbitR = n * 0.30;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
    nodes.push({
      x: cx + Math.cos(a) * orbitR,
      y: cy + Math.sin(a) * orbitR,
      r: n * 0.062,
      c: i % 2 === 0 ? ORBIT : ORBIT2
    });
  }

  const pad = opts.maskable ? n * 0.10 : 0;   // 마스커블은 안전 영역을 더 남긴다
  const corner = n * 0.22;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let col = [12, 16, 28];

      // 배경 라운드 사각형
      const inX = Math.min(x - pad, n - pad - x);
      const inY = Math.min(y - pad, n - pad - y);
      let inside = inX > 0 && inY > 0;
      if (inside && inX < corner && inY < corner) {
        const dx = corner - inX, dy = corner - inY;
        inside = dx * dx + dy * dy <= corner * corner;
      }
      if (inside) col = BG;

      if (inside) {
        // 중심에서 뻗는 선
        for (const nd of nodes) {
          const vx = nd.x - cx, vy = nd.y - cy;
          const wx = x - cx, wy = y - cy;
          const len2 = vx * vx + vy * vy;
          let t = (wx * vx + wy * vy) / len2;
          t = Math.max(0, Math.min(1, t));
          const px = cx + vx * t, py = cy + vy * t;
          const d = Math.hypot(x - px, y - py);
          if (d < n * 0.012) col = mix(col, LINE, 0.38);
        }
        // 궤도 노드
        for (const nd of nodes) {
          if (Math.hypot(x - nd.x, y - nd.y) < nd.r) col = nd.c;
        }
        // 중심 노드
        const dc = Math.hypot(x - cx, y - cy);
        if (dc < n * 0.125) col = CENTER;
        else if (dc < n * 0.155) col = mix(col, CENTER, 0.30);
      }

      const i = (y * n + x) * 3;
      acc[i] = col[0]; acc[i + 1] = col[1]; acc[i + 2] = col[2];
    }
  }

  // 다운샘플 + 스캔라인 필터 바이트
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = (((y * ss + sy) * n) + (x * ss + sx)) * 3;
          r += acc[i]; g += acc[i + 1]; b += acc[i + 2];
        }
      }
      const c = ss * ss;
      raw[p++] = Math.round(r / c);
      raw[p++] = Math.round(g / c);
      raw[p++] = Math.round(b / c);
    }
  }
  return raw;
}

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 2;    // color type: truecolor
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, maskable: true },
  { file: 'icon-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false }
];

for (const t of targets) {
  const buf = png(t.size, render(t.size, { maskable: t.maskable }));
  fs.writeFileSync(path.join(out, t.file), buf);
  console.log(t.file, buf.length, 'bytes');
}
