// Profile hero stage. Deterministic: render.ts calls window.renderAt(t) per frame, so the loop is seamless.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const LOOP = 6;
const W = 1200;
const H = 520;
const DPR = Number(new URLSearchParams(location.search).get('dpr') ?? 1.5);
const TEAL = new THREE.Color('#2DD4BF');
const MINT = new THREE.Color('#99F6E4');
const INDIGO = new THREE.Color('#8B93F8');
const STAGE = new THREE.Vector3(3.1, 0, 0);

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(DPR);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
// No tone mapping: ACES pulled the skin toward teal; glow comes from bloom on values above 1 instead.
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const backdrop = new THREE.Mesh(
  new THREE.PlaneGeometry(34, 15),
  new THREE.ShaderMaterial({
    uniforms: { uPhase: { value: 0 }, uTeal: { value: TEAL }, uIndigo: { value: INDIGO } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uPhase; uniform vec3 uTeal; uniform vec3 uIndigo; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
      // Studio backdrop: one soft spotlight behind the head, an indigo bounce low right, a faint grid only near the portrait.
      void main(){
        vec2 p = vUv * vec2(34.0, 15.0);
        float n = fbm(p * 0.16 + vec2(cos(uPhase), sin(uPhase)) * 0.25);
        vec3 col = vec3(0.016, 0.04, 0.047);
        float d = distance(p, vec2(21.3, 8.8));
        float breathe = 0.92 + 0.08 * sin(uPhase);
        col += uTeal * exp(-d * d / 26.0) * 0.20 * breathe;
        col += mix(uTeal, vec3(1.0), 0.35) * exp(-d * d / 5.0) * 0.07 * breathe;
        col += uIndigo * exp(-pow(distance(p, vec2(25.0, 2.0)), 2.0) / 20.0) * 0.15;
        vec2 g = abs(fract(p * 1.15) - 0.5);
        float line = 1.0 - smoothstep(0.0, 0.025, min(g.x, g.y));
        col += uTeal * line * exp(-d * d / 45.0) * 0.06;
        col += vec3(0.01, 0.025, 0.028) * n;
        float sheen = exp(-pow((p.x - p.y * 1.35) - 9.5 - sin(uPhase) * 0.6, 2.0) / 3.5);
        col += mix(uTeal, uIndigo, 0.4) * sheen * 0.045;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    depthWrite: false,
  }),
);
backdrop.position.set(0, 0, -5);
scene.add(backdrop);


const portraitMat = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: null }, uTeal: { value: TEAL }, uIndigo: { value: INDIGO }, uTexel: { value: 1 / 920 } },
  transparent: true,
  depthWrite: false,
  // A soft ellipsoid bulge around head and shoulders: with the camera sway it reads as a slight head turn.
  vertexShader: `varying vec2 vUv;
    void main(){
      vUv = uv;
      vec3 p = position;
      vec2 q = (uv - vec2(0.5, 0.62)) / vec2(0.34, 0.5);
      p.z += 0.55 * max(0.0, 1.0 - dot(q, q));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D uMap; uniform vec3 uTeal; uniform vec3 uIndigo; uniform float uTexel; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(uMap, vUv);
      float d = uTexel * 4.0;
      float aL = texture2D(uMap, vUv - vec2(d, 0.0)).a, aR = texture2D(uMap, vUv + vec2(d, 0.0)).a;
      float aD = texture2D(uMap, vUv - vec2(0.0, d)).a, aU = texture2D(uMap, vUv + vec2(0.0, d)).a;
      vec2 outward = -vec2(aR - aL, aU - aD);
      float edge = clamp(length(outward) * 1.2, 0.0, 1.0) * c.a;
      float side = smoothstep(-0.1, 0.4, outward.x) * 0.9 + smoothstep(0.1, -0.4, outward.x) * 0.35;
      vec3 rim = mix(uIndigo, uTeal, smoothstep(-0.2, 0.2, outward.x)) * edge * side * 0.75;
      vec3 col = c.rgb * 1.04 + rim;
      float fade = smoothstep(0.0, 0.04, vUv.y);
      gl_FragColor = vec4(col, c.a * fade);
      #include <colorspace_fragment>
    }`,
});
const portrait = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 5.3, 96, 96), portraitMat);
portrait.position.set(STAGE.x, -0.45, 0);
scene.add(portrait);

// Glass panels carry real developer text; drawn on canvas after fonts load so the type is crisp.
// Both panels sit behind the portrait and beside the head, clear of the face and shoulders.
const PANELS = [
  { at: [STAGE.x - 2.0, 1.05, -0.6], rot: 0.22, w: 218, lines: [[['$ ', '#2DD4BF'], ['php artisan test', '#E8F5F2']], [['✓ ', '#2DD4BF'], ['all tests passed', '#A9C4BF']]] },
  { at: [STAGE.x + 2.2, 0.15, -0.6], rot: -0.22, w: 206, lines: [[['deploy ', '#8B93F8'], ['main → live', '#E8F5F2']], [['✓ ', '#2DD4BF'], ['live check passed', '#A9C4BF']]] },
];
const panels = [];

// Stack logos on small glass tiles at different depths; positions keep clear of the face and shoulders.
const LOGO_TILES = [
  { slug: 'laravel', at: [STAGE.x - 1.3, 2.05, -1.2] },
  { slug: 'react', at: [STAGE.x + 1.4, 1.9, -1.0] },
  { slug: 'typescript', at: [STAGE.x - 2.5, -0.45, -0.8] },
  { slug: 'vuedotjs', at: [STAGE.x + 2.55, -0.95, -0.7] },
  { slug: 'tailwindcss', at: [STAGE.x - 0.55, 2.45, -2.0] },
];

function logoTile(path, at) {
  const px = 220;
  const c = document.createElement('canvas');
  c.width = px;
  c.height = px;
  const g = c.getContext('2d');
  g.beginPath();
  g.roundRect(4, 4, px - 8, px - 8, 46);
  const fill = g.createLinearGradient(0, 0, px, px);
  fill.addColorStop(0, 'rgba(36, 92, 98, 0.78)');
  fill.addColorStop(1, 'rgba(10, 30, 36, 0.66)');
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = 'rgba(45, 212, 191, 0.5)';
  g.stroke();
  g.save();
  g.translate(px * 0.27, px * 0.27);
  g.scale((px * 0.46) / 24, (px * 0.46) / 24);
  g.fillStyle = '#DFF7F2';
  g.fill(new Path2D(path));
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  mesh.position.set(...at);
  mesh.renderOrder = -1;
  scene.add(mesh);
  return { mesh, at };
}
const tiles = [];

function panelMesh(spec) {
  const s = 3;
  const h = 40 + spec.lines.length * 24;
  const c = document.createElement('canvas');
  c.width = spec.w * s;
  c.height = h * s;
  const g = c.getContext('2d');
  g.scale(s, s);
  const r = 12;
  g.beginPath();
  g.roundRect(1, 1, spec.w - 2, h - 2, r);
  const fill = g.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, 'rgba(20, 58, 64, 0.82)');
  fill.addColorStop(1, 'rgba(9, 28, 34, 0.72)');
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 1.2;
  g.strokeStyle = 'rgba(45, 212, 191, 0.55)';
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.1)';
  g.fillRect(14, 1.5, spec.w - 28, 1);
  ['rgba(153,246,228,.55)', 'rgba(139,147,248,.55)', 'rgba(255,255,255,.22)'].forEach((col, i) => {
    g.beginPath();
    g.arc(16 + i * 13, 15, 3.6, 0, Math.PI * 2);
    g.fillStyle = col;
    g.fill();
  });
  g.font = '500 14.5px JBMono';
  g.textBaseline = 'alphabetic';
  spec.lines.forEach((tokens, li) => {
    let x = 15;
    tokens.forEach(([text, color]) => {
      g.fillStyle = color;
      g.fillText(text, x, 46 + li * 24);
      x += g.measureText(text).width;
    });
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(spec.w / 100, h / 100), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  mesh.position.set(...spec.at);
  mesh.rotation.y = spec.rot;
  mesh.renderOrder = -1;
  scene.add(mesh);
  return { mesh, spec };
}

const COUNT = 90;
const positions = new Float32Array(COUNT * 3);
const offsets = new Float32Array(COUNT);
const sizes = new Float32Array(COUNT);
const tints = new Float32Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  positions[i * 3] = STAGE.x - 3.4 + rand() * 7.2;
  positions[i * 3 + 1] = -2.8 + rand() * 5.8;
  positions[i * 3 + 2] = -3.5 + rand() * 5.5;
  offsets[i] = rand() * Math.PI * 2;
  sizes[i] = 1.5 + rand() * 3.5;
  tints[i] = rand();
}
const dust = new THREE.BufferGeometry();
dust.setAttribute('position', new THREE.BufferAttribute(positions, 3));
dust.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
dust.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
dust.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
const dustMat = new THREE.ShaderMaterial({
  uniforms: { uPhase: { value: 0 }, uDpr: { value: DPR }, uMint: { value: MINT }, uIndigo: { value: INDIGO } },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    uniform float uPhase; uniform float uDpr; attribute float aOffset; attribute float aSize; attribute float aTint; varying float vTint; varying float vFade;
    void main(){
      vec3 p = position;
      p.y += sin(uPhase + aOffset) * 0.18;
      p.x += cos(uPhase + aOffset * 1.7) * 0.08;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aSize * uDpr * (6.0 / -mv.z);
      vFade = 0.35 + 0.65 * (0.5 + 0.5 * sin(uPhase * 2.0 + aOffset * 3.0));
      vTint = aTint;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uMint; uniform vec3 uIndigo; varying float vTint; varying float vFade;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d) * vFade * 0.55;
      gl_FragColor = vec4(mix(uMint, uIndigo, step(0.62, vTint)), a);
      #include <colorspace_fragment>
    }`,
});
scene.add(new THREE.Points(dust, dustMat));

const composer = new EffectComposer(renderer);
composer.setPixelRatio(DPR);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.35, 0.5, 0.92));
composer.addPass(new OutputPass());

window.renderAt = (t) => {
  const phase = (t / LOOP) * Math.PI * 2;
  camera.position.set(Math.sin(phase) * 0.22, Math.cos(phase) * 0.08 + 0.05, 10);
  camera.lookAt(0.15, 0, 0);
  backdrop.material.uniforms.uPhase.value = phase;
  dustMat.uniforms.uPhase.value = phase;
  panels.forEach(({ mesh, spec }, i) => {
    mesh.position.y = spec.at[1] + Math.sin(phase + i * 2.1) * 0.09;
    mesh.rotation.y = spec.rot + Math.sin(phase + i * 1.3) * 0.05;
  });
  tiles.forEach(({ mesh, at }, i) => {
    mesh.position.y = at[1] + Math.sin(phase + i * 1.7) * 0.07;
    mesh.rotation.set(Math.sin(phase + i) * 0.12, Math.cos(phase + i * 0.8) * 0.18, 0);
  });
  composer.render();
};

window.LOOP = LOOP;
window.ready = Promise.all([
  document.fonts.load('500 14.5px JBMono').then(() => PANELS.forEach((spec) => panels.push(panelMesh(spec)))),
  fetch('/data/cards.json')
    .then((r) => r.json())
    .then((data) => {
      LOGO_TILES.forEach(({ slug, at }) => data.icons[slug] && tiles.push(logoTile(data.icons[slug].path, at)));
      const laravel = data.projects.filter((p) => p.stack.some((s) => s.startsWith('Laravel'))).length;
      document.getElementById('facts').innerHTML = `<span><b>${data.projects.length}</b> live projects</span><span><b>${laravel}</b> Laravel platforms</span>`;
    }),
  document.fonts.ready,
  new THREE.TextureLoader().loadAsync('/assets/portrait.png').then((tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    portraitMat.uniforms.uMap.value = tex;
  }),
]).then(() => {
  window.renderAt(0);
  return true;
});
