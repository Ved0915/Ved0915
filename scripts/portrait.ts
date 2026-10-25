// One-off: cuts the portrait off its plain studio background and smooths it. Usage: node scripts/portrait.ts <input> <output.png>
import { execFileSync } from 'node:child_process';

const SIZE = 920;
const TOLERANCE = 34;

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/portrait.ts <input> <output.png>');

// Edge-preserving smoothing gives the clean "studio render" skin; upscaling first keeps it from looking blocky.
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', input, '-vf', `scale=${SIZE}:${SIZE}:flags=lanczos,bilateral=sigmaS=6:sigmaR=0.06,unsharp=5:5:0.4`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
const px = (i: number): [number, number, number] => [raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]];

const border: number[] = [];
for (let i = 0; i < SIZE; i++) border.push(i, (SIZE - 1) * SIZE + i, i * SIZE, i * SIZE + SIZE - 1);
const median = (k: number) => border.map((i) => px(i)[k]).sort((a, b) => a - b)[border.length >> 1];
const bg: [number, number, number] = [median(0), median(1), median(2)];
const dist = (c: [number, number, number]) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]);

// Flood fill from the edges: only background connected to the frame is removed, so light shirt buttons stay.
const isBg = new Uint8Array(SIZE * SIZE);
const queue = border.filter((i) => dist(px(i)) < TOLERANCE);
queue.forEach((i) => (isBg[i] = 1));
while (queue.length) {
  const i = queue.pop() as number;
  const x = i % SIZE;
  for (const j of [i - SIZE, i + SIZE, x > 0 ? i - 1 : -1, x < SIZE - 1 ? i + 1 : -1]) {
    if (j >= 0 && j < SIZE * SIZE && !isBg[j] && dist(px(j)) < TOLERANCE) {
      isBg[j] = 1;
      queue.push(j);
    }
  }
}

function boxBlur(src: Float32Array, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let s = 0;
      let c = 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < SIZE) {
          s += src[y * SIZE + xx];
          c++;
        }
      }
      tmp[y * SIZE + x] = s / c;
    }
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let s = 0;
      let c = 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < SIZE) {
          s += tmp[yy * SIZE + x];
          c++;
        }
      }
      out[y * SIZE + x] = s / c;
    }
  }
  return out;
}

const hard = new Float32Array(SIZE * SIZE).map((_, i) => (isBg[i] ? 0 : 1));
const eroded = boxBlur(hard, 2).map((v) => (v > 0.99 ? 1 : 0));
const alpha = boxBlur(eroded, 2);

const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let i = 0; i < SIZE * SIZE; i++) {
  const a = alpha[i];
  const c = px(i);
  for (let k = 0; k < 3; k++) {
    // Remove the grey background bleeding into soft edges so no halo shows on a dark backdrop.
    const clean = a > 0.05 ? (c[k] - (1 - a) * bg[k]) / a : c[k];
    rgba[i * 4 + k] = Math.max(0, Math.min(255, Math.round(clean)));
  }
  rgba[i * 4 + 3] = Math.round(a * 255);
}

execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${SIZE}x${SIZE}`, '-i', '-', output], { input: rgba });
console.log(`wrote ${output} (background ${bg.join(',')})`);
