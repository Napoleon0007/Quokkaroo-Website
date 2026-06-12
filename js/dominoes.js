// Quokkaroo — the domino cascade (phone hero background).
// Real ivory dominoes with black pips wind down the hero in a lazy S-curve.
// The pip values count DOWN the line (6|6 … 1|1) — a countdown to departure —
// and the final tile is ochre with the quokka mark: the last domino to fall
// is you, landing with Quokkaroo. The line tips in sequence, rests fallen,
// then gracefully stands back up and goes again. Phones only (portrait);
// desktop keeps the flight-path world map. Fades out as Sectors arrives.
import * as THREE from 'three';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPortrait = () => window.innerHeight > window.innerWidth * 1.15;

const wrap = document.createElement('div');
wrap.className = 'dominoes';
wrap.setAttribute('aria-hidden', 'true');
document.body.appendChild(wrap);

let renderer = null, scene = null, camera = null;
let tiles = [];                  // { pivot, baseYaw }
let failed = false, built = false;

// classic pip layouts on a 3x3 grid (cell coords, x right / y down)
const PIPS = {
  0: [],
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

// the run of tiles: counting down to the move, quokka tile lands last
const VALUES = [
  [6, 6], [6, 5], [5, 5], [5, 4], [4, 4], [4, 3],
  [3, 3], [3, 2], [2, 2], [2, 1], [1, 1], 'quokka',
];

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// the big face of a domino: ivory, soft rounded border, divider, pips
function faceTexture(top, bottom, opts = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 460;
  const g = c.getContext('2d');
  const ivory = opts.ochre ? '#C96F2E' : '#FAF6EE';
  const pip = opts.ochre ? '#FFF6EC' : '#1A1714';
  g.fillStyle = ivory;
  g.fillRect(0, 0, 256, 460);
  // soft inner shading so the tile reads as a moulded object
  const sh = g.createLinearGradient(0, 0, 0, 460);
  sh.addColorStop(0, 'rgba(255,255,255,0.5)');
  sh.addColorStop(0.2, 'rgba(255,255,255,0)');
  sh.addColorStop(0.85, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,0.14)');
  g.fillStyle = sh;
  g.fillRect(0, 0, 256, 460);
  g.strokeStyle = opts.ochre ? 'rgba(120,50,10,0.5)' : 'rgba(20,18,16,0.18)';
  g.lineWidth = 5;
  roundRect(g, 7, 7, 242, 446, 26);
  g.stroke();
  // divider bar
  g.fillStyle = opts.ochre ? 'rgba(255,246,236,0.7)' : 'rgba(201,111,46,0.85)';
  g.fillRect(34, 226, 188, 7);

  const drawHalf = (v, oy) => {
    const cell = 56, x0 = 128 - cell, y0 = oy + 110 - cell;
    for (const [cx, cy] of PIPS[v] || []) {
      g.beginPath();
      g.arc(x0 + cx * cell, y0 + cy * cell, 19, 0, Math.PI * 2);
      g.fillStyle = pip;
      g.fill();
      // tiny highlight so pips look drilled + lacquered
      g.beginPath();
      g.arc(x0 + cx * cell - 6, y0 + cy * cell - 6, 5, 0, Math.PI * 2);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fill();
    }
  };
  drawHalf(top, 10);
  drawHalf(bottom, 240);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  if (opts.quokka) {            // the brand mark lands once the image loads
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, 58, 90, 140, 140 * (img.height / img.width));
      tex.needsUpdate = true;
    };
    img.src = 'assets/brand/quokka-mark-cream.png';
  }
  return tex;
}

function tileMaterials(spec) {
  const face = spec === 'quokka'
    ? faceTexture(0, 0, { ochre: true, quokka: true })
    : faceTexture(spec[0], spec[1]);
  const sideColor = spec === 'quokka' ? 0xb05f24 : 0xEFE9DD;
  const side = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.55 });
  const faceMat = new THREE.MeshStandardMaterial({ map: face, roughness: 0.42 });
  // box faces: +x, -x, +y, -y, +z(front), -z(back)
  return [side, side, side, side, faceMat, faceMat];
}

// soft contact shadow so the tiles sit on the white page, not float in it
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(20,18,16,0.30)');
  grad.addColorStop(1, 'rgba(20,18,16,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function build() {
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (e) {
    failed = true;
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  wrap.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0.9, 6.8);
  camera.lookAt(0, -0.15, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(2.5, 6, 4);
  scene.add(key);
  const warm = new THREE.DirectionalLight(0xc96f2e, 0.35);
  warm.position.set(-4, 2, -2);
  scene.add(warm);

  // the winding path the line of dominoes follows down the hero
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.85, 1.45, -1.6),
    new THREE.Vector3(0.65, 0.95, -1.05),
    new THREE.Vector3(-0.55, 0.35, -0.45),
    new THREE.Vector3(0.5, -0.45, 0.1),
    new THREE.Vector3(-0.35, -1.0, 0.55),
  ]);

  const geo = new THREE.BoxGeometry(0.38, 0.68, 0.085);
  geo.translate(0, 0.34, 0);                 // pivot at the base edge
  const shadowGeo = new THREE.PlaneGeometry(0.66, 0.34);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85,
  });

  const N = VALUES.length;
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1);
    const pos = curve.getPoint(k);
    const tan = curve.getTangent(k);
    const yaw = Math.atan2(tan.x, tan.z);

    const seat = new THREE.Group();          // sits on the path, faces along it
    seat.position.copy(pos);
    seat.rotation.y = yaw;

    const pivot = new THREE.Group();         // tips forward around the base
    pivot.add(new THREE.Mesh(geo, tileMaterials(VALUES[i])));
    seat.add(pivot);

    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    seat.add(shadow);

    scene.add(seat);
    tiles.push({ pivot });
  }
  return true;
}

function size() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ease = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// the show: tease → tip in sequence → rest fallen → rise → breathe → again
function pose(t) {
  const CYCLE = 13;
  const c = ((t / CYCLE) % 1 + 1) % 1;
  const N = tiles.length;
  for (let i = 0; i < N; i++) {
    const start = 0.10 + 0.42 * (i / N);     // staggered tipping
    const fall = ease((c - start) / 0.055);
    const rise = ease((c - 0.80) / 0.13);    // everyone stands back up together
    const tip = Math.max(0, fall - rise);
    const maxTip = i === N - 1 ? 1.52 : 1.18; // the quokka tile falls flat
    let a = tip * maxTip;
    if (i === 0 && c < 0.10) a = Math.sin(t * 2.6) * 0.045 + 0.045; // the tease
    tiles[i].pivot.rotation.x = a;
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
    if (reduced) {                            // still pose: mid-cascade
      pose(0.42 * 13);
      renderer.render(scene, camera);
    }
  }
  wrap.style.display = '';

  // solid 3D tiles behind body copy hurt reading — unlike the faint map,
  // the cascade belongs to the hero only: gone before About's text arrives
  const sy = window.scrollY / window.innerHeight;
  const op = Math.max(0, Math.min(1, (0.85 - sy) / 0.35));
  wrap.style.opacity = op.toFixed(3);
  if (op <= 0.01 || reduced) return;

  pose(ms / 1000);
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  if (built && isPortrait()) {
    size();
    if (reduced) { pose(0.42 * 13); renderer.render(scene, camera); }
  }
});
