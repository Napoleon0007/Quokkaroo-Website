// Quokkaroo — the tumbling boomerang (phone hero background).
// One carved-timber boomerang spins end-over-end in slow motion across the
// hero, drifts off one side and returns from the other; a small distant mate
// crosses the other way. Warm studio lighting on the cream page. Phones only
// (portrait) — desktop keeps the flight-path world map. Fades out as the
// Sectors section arrives, exactly like the flightpaths layer.
import * as THREE from 'three';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPortrait = () => window.innerHeight > window.innerWidth * 1.15;

const wrap = document.createElement('div');
wrap.className = 'boomerang';
wrap.setAttribute('aria-hidden', 'true');
document.body.appendChild(wrap);

let renderer = null, scene = null, camera = null;
let hero = null, heroSpin = null, mate = null, mateSpin = null;
let failed = false;

// procedural timber: warped grain stripes on warm brown
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7a4e27';
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) {
    const y0 = Math.random() * 256;
    const amp = 4 + Math.random() * 10;
    const tone = Math.random();
    g.strokeStyle = tone < 0.5
      ? `rgba(70, 40, 16, ${0.10 + Math.random() * 0.18})`
      : `rgba(160, 110, 60, ${0.08 + Math.random() * 0.16})`;
    g.lineWidth = 0.8 + Math.random() * 2.4;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = y0 + Math.sin(x * 0.012 + i) * amp + Math.sin(x * 0.05 + i * 2) * 2;
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.45, 0.45);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// classic bent-wing silhouette: fat smooth crescent with rounded tips
function boomerangGeometry() {
  const s = new THREE.Shape();
  const tipR = 0.17;
  // outer sweep tipA -> tipB, inner sweep back, round caps at both tips
  s.moveTo(-1.2, 0.62 + tipR);
  s.quadraticCurveTo(-1.42, 0.62, -1.2, 0.62 - tipR * 0.6);
  s.quadraticCurveTo(0, -1.0, 1.2, 0.62 - tipR * 0.6);
  s.quadraticCurveTo(1.42, 0.62, 1.2, 0.62 + tipR);
  s.quadraticCurveTo(0, -0.18, -1.2, 0.62 + tipR);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.085, bevelEnabled: true,
    bevelThickness: 0.05, bevelSize: 0.055, bevelSegments: 4, curveSegments: 48,
  });
  geo.center();
  return geo;
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
  wrap.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  scene.add(new THREE.AmbientLight(0xfff1e0, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff6ec, 0.55);
  fill.position.set(-2, -3, 5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc96f2e, 0.8);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  const geo = boomerangGeometry();
  const mat = new THREE.MeshStandardMaterial({
    map: woodTexture(), roughness: 0.5, metalness: 0.04,
  });

  // the hero boomerang: an inner group spins it like a thrown boomerang,
  // the outer group carries it across the screen and wobbles its plane
  heroSpin = new THREE.Group();
  heroSpin.add(new THREE.Mesh(geo, mat));
  hero = new THREE.Group();
  hero.scale.setScalar(0.44);
  hero.add(heroSpin);
  scene.add(hero);

  // a small mate far behind, crossing the other way — depth and life
  mateSpin = new THREE.Group();
  const mateMat = mat.clone();
  mateMat.color = new THREE.Color(0xb89070);
  mateSpin.add(new THREE.Mesh(geo, mateMat));
  mate = new THREE.Group();
  mate.scale.setScalar(0.34);
  mate.add(mateSpin);
  scene.add(mate);

  return true;
}

function size() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function pose(t) {
  // a true return flight: the boomerang circles the wordmark on a lazy
  // ellipse — never gone, always coming back — swinging nearer at the
  // front of the loop and away at the back
  const a = t * 0.42;
  hero.position.set(
    Math.cos(a) * 0.45,
    0.2 + Math.sin(a) * 1.05,
    -Math.sin(a) * 0.85
  );
  heroSpin.rotation.z = t * 3.4;                       // the throw spin
  hero.rotation.x = 1.0 + Math.sin(t * 0.23) * 0.16;   // plane tilt breathes
  hero.rotation.y = Math.sin(t * 0.31) * 0.4;          // lazy precession

  // the mate circles the other way, far behind and high
  const a2 = -t * 0.3 + 2.1;
  mate.position.set(Math.cos(a2) * 1.05, 1.15 + Math.sin(a2) * 0.45, -2.2);
  mateSpin.rotation.z = -t * 2.6;
  mate.rotation.x = 1.1;
  mate.rotation.y = Math.sin(t * 0.4 + 2) * 0.3;
}

let raf = 0, built = false;
const sectors = document.getElementById('sectors');

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
    if (reduced) {                       // a single, well-lit still pose
      pose(2.6);
      renderer.render(scene, camera);
    }
  }
  wrap.style.display = '';

  // hand the page to Sectors exactly as it arrives (same curve as flightpaths)
  let op = 1;
  if (sectors) {
    const top = sectors.getBoundingClientRect().top;
    const vh = window.innerHeight;
    op = Math.max(0, Math.min(1, (top - vh * 0.3) / (vh * 0.55)));
  }
  wrap.style.opacity = op.toFixed(3);
  if (op <= 0.01 || reduced) return;

  pose(ms / 1000);
  renderer.render(scene, camera);
}
raf = requestAnimationFrame(frame);

window.addEventListener('resize', () => {
  if (built && isPortrait()) {
    size();
    if (reduced) { pose(2.6); renderer.render(scene, camera); }
  }
});
