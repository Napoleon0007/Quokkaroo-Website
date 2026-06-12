// Quokkaroo — the helix tower (phone hero background).
// The aircenter-style 3D centrepiece, rebuilt as original code: a column of
// thin white plates stacked top-to-bottom of the hero, each rotated a little
// further than the last so the stack twists like a ribbon of fanned floor
// plans. It leans through a lazy S-curve, turns perpetually, and answers
// scroll with extra twist. One ochre plate carries the brand. Phones only
// (portrait); desktop keeps the flight-path world map. Gone before About.
import * as THREE from 'three';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPortrait = () => window.innerHeight > window.innerWidth * 1.15;

const wrap = document.createElement('div');
wrap.className = 'helix';
wrap.setAttribute('aria-hidden', 'true');
document.body.appendChild(wrap);

let renderer = null, scene = null, camera = null;
let plates = [];
let failed = false, built = false;

const N = 84;                       // plates in the column
const SPAN = 5.0;                   // world height the column covers

function build() {
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    failed = true;
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  wrap.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  // soft studio light: white sky, grey floor — the plates shade themselves
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc9c1, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(2.5, 4, 3.5);
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xc96f2e, 0.12);
  warm.position.set(-3, -2, 2);
  scene.add(warm);

  const geo = new THREE.BoxGeometry(1.5, 0.04, 0.56);
  const white = new THREE.MeshStandardMaterial({ color: 0xfcfbf9, roughness: 0.6 });
  const ochre = new THREE.MeshStandardMaterial({ color: 0xc96f2e, roughness: 0.55 });
  const accent = Math.floor(N * 0.64);

  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(geo, i === accent ? ochre : white);
    scene.add(m);
    plates.push(m);
  }
  return true;
}

function size() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function pose(t, scrollK) {
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);                      // 0 bottom … 1 top
    const y = (k - 0.5) * SPAN;
    const p = plates[i];
    // the column snakes through a gentle S and breathes
    p.position.set(
      Math.sin(k * Math.PI * 1.7 + t * 0.16) * 0.42,
      y,
      Math.cos(k * Math.PI * 1.3 + t * 0.12) * 0.3 - 0.2
    );
    // progressive twist = the fanned ribbon; time turns it, scroll winds it
    p.rotation.y = i * 0.145 + t * 0.3 + scrollK * 2.4;
    // a whisper of tilt so edges catch the light like the reference
    p.rotation.z = Math.sin(k * Math.PI * 2 + t * 0.2) * 0.045;
  }
}

let raf = 0;

function frame(ms) {
  raf = requestAnimationFrame(frame);
  if (!isPortrait() || failed) {
    wrap.style.display = 'none';
    return;
  }
  if (!built) {
    if (!build()) return;
    built = true;
    size();
    if (reduced) {
      pose(2.0, 0);
      renderer.render(scene, camera);
    }
  }
  wrap.style.display = '';

  // the sculpture belongs to the hero — gone before About's text arrives
  const sy = window.scrollY / window.innerHeight;
  const op = Math.max(0, Math.min(1, (0.85 - sy) / 0.35));
  wrap.style.opacity = op.toFixed(3);
  if (op <= 0.01 || reduced) return;

  pose(ms / 1000, Math.min(sy, 1.5));
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  if (built && isPortrait()) {
    size();
    if (reduced) { pose(2.0, 0); renderer.render(scene, camera); }
  }
});
