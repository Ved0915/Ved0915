// 3D contribution skyline: one bar per day, height from the real count, slow camera sway over a seamless loop.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const LOOP = 8;

export function mountSkyline(canvas, weeks, dpr) {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(26, W / H, 0.1, 100);

  const CELL = 0.24;
  const GAP = 0.06;
  const STEP = CELL + GAP;
  const cols = weeks.length;
  const max = Math.max(1, ...weeks.flat().map((d) => d.count));
  const days = weeks.flatMap((w, wi) => w.map((d) => ({ ...d, wi })));

  const palette = [new THREE.Color('#163a41'), new THREE.Color('#1f7a72'), new THREE.Color('#25a596'), new THREE.Color('#2dd4bf'), new THREE.Color('#8b93f8')];
  const geo = new THREE.BoxGeometry(CELL, 1, CELL);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.15 });
  const bars = new THREE.InstancedMesh(geo, mat, days.length);
  const m = new THREE.Matrix4();
  days.forEach((d, i) => {
    const h = d.count > 0 ? 0.12 + (Math.log1p(d.count) / Math.log1p(max)) * 2.4 : 0.04;
    m.makeScale(1, h, 1).setPosition((d.wi - cols / 2) * STEP, 0, (d.weekday - 3) * STEP);
    bars.setMatrixAt(i, m);
    const c = palette[d.level].clone();
    if (d.level === 4) c.multiplyScalar(1.6);
    bars.setColorAt(i, c);
  });
  scene.add(bars);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(cols * STEP + 0.5, 0.12, 7 * STEP + 0.5),
    new THREE.MeshStandardMaterial({ color: '#0b2228', roughness: 0.5, metalness: 0.3 }),
  );
  plate.position.y = -0.06;
  scene.add(plate);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color('#2dd4bf').multiplyScalar(1.4), toneMapped: false }));
  edge.position.copy(plate.position);
  scene.add(edge);

  scene.add(new THREE.AmbientLight('#9fe7dc', 0.35));
  const key = new THREE.DirectionalLight('#e6fffa', 2.2);
  key.position.set(4, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#8b93f8', 1.1);
  fill.position.set(-6, 3, -4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#2dd4bf', 1.4);
  rim.position.set(0, 2, -8);
  scene.add(rim);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.45, 0.95));
  composer.addPass(new OutputPass());

  return (t) => {
    const phase = (t / LOOP) * Math.PI * 2;
    const a = -0.3 + Math.sin(phase) * 0.12;
    camera.position.set(Math.sin(a) * 22, 8.5 + Math.cos(phase) * 0.3, Math.cos(a) * 22);
    camera.lookAt(0.6, 0.6, 0);
    composer.render();
  };
}
