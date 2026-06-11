// Quokkaroo — "the people make the map" (Three.js)
// Portrait tiles (the people we help) hang above the hero, then drop down and
// settle into the OUTLINE of Australia as you scroll — the word sits in the
// open middle. Placeholder avatars for now; drop real consented client photos
// into assets/img/people/ and swap them into PHOTOS below.
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AUS = [
  [114, -22], [114, -26], [115, -31], [115.2, -34], [120, -34], [124, -33.6],
  [129, -32], [132, -31.6], [134.5, -33], [136, -35], [137.8, -35], [138.6, -35],
  [140, -38], [143, -39], [146.5, -39], [148, -37.6], [150, -37], [150.2, -35.5],
  [151.6, -33], [153, -31], [153.5, -28], [153, -25], [151.5, -23.5], [149.5, -21.5],
  [147, -19.5], [146, -18.5], [145.5, -16.5], [143.5, -13.5], [142.3, -11], [141, -13],
  [140, -17], [137.5, -16], [136.5, -12.5], [133, -11], [130.5, -12], [129, -15],
  [126.5, -14], [122, -18], [120, -20], [116.5, -21], [114, -22],
];
const TAS = { lon: 146.6, lat: -42, rx: 1.6, ry: 2.0 };

// sample a closed lon/lat ring into evenly arc-spaced points
function sampleRing(ring, step) {
  const pts = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(d / step));
    for (let s = 0; s < n; s++) {
      const tt = s / n;
      pts.push([x1 + (x2 - x1) * tt, y1 + (y2 - y1) * tt]);
    }
  }
  return pts;
}

// ---- placeholder portrait tile: a round "photo" of a person, varied tones ----
function makeSprite(draw, res) {
  const c = document.createElement('canvas'); c.width = c.height = res || 128;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function avatar(bg, fg) {
  return (g) => {
    g.save();
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.fillStyle = bg; g.fill();
    g.clip();
    g.beginPath(); g.arc(64, 55, 17, 0, Math.PI * 2); g.fillStyle = fg; g.fill();        // head
    g.beginPath(); g.moveTo(34, 100); g.quadraticCurveTo(34, 74, 64, 74);
    g.quadraticCurveTo(94, 74, 94, 100); g.closePath(); g.fillStyle = fg; g.fill();       // shoulders
    g.restore();
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.lineWidth = 5;
    g.strokeStyle = '#ffffff'; g.stroke();                                               // white frame
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.lineWidth = 1.5;
    g.strokeStyle = 'rgba(20,18,16,0.18)'; g.stroke();
  };
}
// real-photo path takes over automatically if you list files in PHOTOS
const PHOTOS = []; // e.g. ['assets/img/people/p1.jpg', ...] — round-cropped, consented
const TONES = [
  ['#caa07a', '#6f4d31'], ['#e6c8a6', '#9a6940'], ['#9fb0b8', '#44515a'],
  ['#daccba', '#6a5e4d'], ['#b98c6a', '#6a472c'], ['#aebfa9', '#49563f'],
  ['#d7b38c', '#7c5532'], ['#c4b2a0', '#5d5142'],
];

const VERT = `
attribute float aScale, aAppear;
uniform float uSize, uHeightK, uK;
varying float vFade;
void main() {
  float f = smoothstep(aAppear, aAppear + 0.20, uK);
  vFade = f;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (uSize * aScale * uHeightK) / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
precision mediump float;
uniform sampler2D uMap;
varying float vFade;
void main() {
  if (vFade < 0.02) discard;
  vec4 c = texture2D(uMap, gl_PointCoord);
  if (c.a < 0.4) discard;
  gl_FragColor = vec4(c.rgb, c.a * vFade);
}`;

function roundPhotoTexture(src) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d'); g.clearRect(0, 0, 128, 128);
    g.save(); g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.clip();
    const s = Math.max(92 / img.width, 92 / img.height);
    g.drawImage(img, 64 - img.width * s / 2, 64 - img.height * s / 2, img.width * s, img.height * s);
    g.restore();
    g.beginPath(); g.arc(64, 64, 46, 0, Math.PI * 2); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke();
    tex.needsUpdate = true;
  };
  img.src = encodeURI(src);
  return tex;
}

function init() {
  const fxParam = new URLSearchParams(location.search).get('fx');
  let lowFx = fxParam === 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowFx, alpha: true });
  renderer.setPixelRatio(lowFx ? 1 : Math.min(window.devicePixelRatio, 1.75));
  function dropQuality() { if (!lowFx) { lowFx = true; renderer.setPixelRatio(1); resize(); } }

  const scene = new THREE.Scene();
  const FOV = 42;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  camera.position.set(0, 0, 16);

  const rng = mulberry32(7);

  // --- sample the Australia outline (coast + Tasmania) ---
  const tasRing = [];
  for (let a = 0; a <= 360; a += 30) {
    const r = a * Math.PI / 180;
    tasRing.push([TAS.lon + Math.cos(r) * TAS.rx, TAS.lat + Math.sin(r) * TAS.ry]);
  }
  const ll = sampleRing(AUS, 1.45).concat(sampleRing(tasRing, 1.2));

  let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
  for (const [lo, la] of ll) {
    minLon = Math.min(minLon, lo); maxLon = Math.max(maxLon, lo);
    minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
  }
  const cLon = (minLon + maxLon) / 2, cLat = (minLat + maxLat) / 2;
  const S = 12 / (maxLon - minLon);

  // one cloud per portrait variant (real photos if PHOTOS set, else avatars)
  const useReal = PHOTOS.length > 0;
  const V = useReal ? PHOTOS.length : TONES.length;
  const buckets = Array.from({ length: V }, () => ({ home: [], from: [], seed: [], appear: [] }));
  ll.forEach(([lo, la], i) => {
    const hx = (lo - cLon) * S, hy = (la - cLat) * S;
    const bk = buckets[i % V];
    bk.home.push(hx, hy, 0);
    // hang ABOVE the map, drift down into place as you scroll
    bk.from.push((rng() * 2 - 1) * 1.0, 5 + rng() * 4, -1 - rng() * 1.5);
    bk.seed.push(rng() * Math.PI * 2);
    bk.appear.push(rng() * 0.65);
  });

  const heightK = () => renderer.domElement.height / (2 * Math.tan((FOV * Math.PI / 180) / 2));
  const cloud = new THREE.Group();
  scene.add(cloud);
  const groups = [];
  const mats = [];
  for (let v = 0; v < V; v++) {
    const bk = buckets[v];
    if (!bk.home.length) continue;
    const home = new Float32Array(bk.home);
    const from = new Float32Array(bk.from);
    const seed = new Float32Array(bk.seed);
    const n = seed.length;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(home), 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    geo.setAttribute('aAppear', new THREE.BufferAttribute(new Float32Array(bk.appear), 1));
    const tex = useReal ? roundPhotoTexture(PHOTOS[v]) : makeSprite(avatar(TONES[v][0], TONES[v][1]), 128);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uSize: { value: 0.72 }, uHeightK: { value: heightK() }, uK: { value: 0 } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: true,
    });
    mats.push(mat);
    cloud.add(new THREE.Points(geo, mat));
    groups.push({ geo, home, from, seed, appear: bk.appear.slice(), arr: geo.attributes.position.array, n });
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const k = heightK();
    mats.forEach((m) => (m.uniforms.uHeightK.value = k));
  }
  window.addEventListener('resize', resize);
  resize();

  const smoothstep = (e0, e1, x) => {
    const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const clock = new THREE.Clock();
  let frames = 0, probeStart = performance.now(), probed = lowFx;

  function tick() {
    if (!probed) {
      frames++;
      const el = performance.now() - probeStart;
      if (el > 2500) { probed = true; if (frames / (el / 1000) < 24) dropQuality(); }
    }
    const t = clock.elapsedTime;
    const heroFrac = window.scrollY / window.innerHeight;
    const k = reduced ? 1 : smoothstep(0, 0.9, heroFrac);
    mats.forEach((m) => (m.uniforms.uK.value = k));

    for (const grp of groups) {
      const { arr, home, from, seed, appear, n } = grp;
      for (let i = 0; i < n; i++) {
        const o = i * 3;
        const f = smoothstep(appear[i], appear[i] + 0.2, k);
        const s = 1 - f;                          // drops down into place
        const bob = (1 - f) * 0.2 + 0.03;
        arr[o] = home[o] + from[o] * s + Math.sin(t * 0.5 + seed[i]) * bob;
        arr[o + 1] = home[o + 1] + from[o + 1] * s + Math.cos(t * 0.5 + seed[i]) * bob * 0.5;
        arr[o + 2] = home[o + 2] + from[o + 2] * s;
      }
      grp.geo.attributes.position.needsUpdate = true;
    }

    camera.position.x = Math.sin(t * 0.06) * 0.18;
    camera.lookAt(0, 0, 0);
    canvas.style.opacity = (1 - smoothstep(1.0, 1.45, heroFrac)).toFixed(3);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

// run after all declarations are initialised (avoids const TDZ)
if (!webglAvailable()) {
  canvas.style.display = 'none';
} else {
  init();
}
