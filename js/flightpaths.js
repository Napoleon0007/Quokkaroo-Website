// Quokkaroo — migration flight paths over breathing terrain (hero background).
// Two quiet layers behind the hero: ultra-faint topographic contour lines that
// drift and breathe like an architect's terrain map, and a faint dotted world
// map (NASA-sampled land dots) with ochre arcs flying home to Australia —
// each with a travelling dot like a live flight tracker. Confined to the
// hero; fades out as you scroll past. 2D canvas — light and quiet.
import { LAND_DOTS } from './landdots.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ORIGINS = [
  [28.0, -26.2],   // Johannesburg
  [18.4, -33.9],   // Cape Town
  [-0.1, 51.5],    // London
  [72.9, 19.1],    // Mumbai
  [121.0, 14.6],   // Manila
  [-46.6, -23.6],  // São Paulo
  [55.3, 25.2],    // Dubai
  [-6.3, 53.3],    // Dublin
];
const DESTS = [
  [115.86, -31.95], // Perth
  [151.21, -33.87], // Sydney
  [153.03, -27.47], // Brisbane
  [144.96, -37.81], // Melbourne
  [138.6, -34.93],  // Adelaide
];

function inAustralia(lat, lon) {
  return (lat > -39.5 && lat < -10.5 && lon > 112 && lon < 154.5) ||
         (lat > -44 && lat < -40 && lon > 144 && lon < 149);  // Tasmania
}

const wrap = document.createElement('div');
wrap.className = 'flightpaths';
wrap.setAttribute('aria-hidden', 'true');
const canvas = document.createElement('canvas');
wrap.appendChild(canvas);
document.body.appendChild(wrap);
const ctx = canvas.getContext('2d');

let W = 0, H = 0, DPR = 1, mapLayer = null, portrait = false;
let mapX = 0, mapY = 0, mapW = 0, mapH = 0;
let cLon0 = 12, cLat0 = 58, cSLon = 1, cSLat = 1;   // portrait corridor scales

// portrait corridor: Africa → Asia → Australia fills the WHOLE screen,
// edge to edge (far-west origins fly in from off-screen)
const C_LON0 = 12, C_LON1 = 158, C_LAT0 = 58, C_LAT1 = -47;

function project(lon, lat) {
  if (portrait) {
    return [mapX + (lon - cLon0) * cSLon, (cLat0 - lat) * cSLat];
  }
  return [mapX + ((lon + 180) / 360) * mapW, mapY + ((90 - lat) / 180) * mapH];
}

// pre-render the dotted world once; redrawn only on resize.
// Landscape: one proportional world map, centred.
// Portrait: a full-bleed Africa→Asia→Australia corridor covers the whole
// screen — gently taller than true scale so the continents reach top to
// bottom; Australia sits lower-right at full strength.
function buildMap() {
  portrait = H > W * 1.15;

  if (portrait) {
    cLon0 = C_LON0; cLat0 = C_LAT0;
    cSLon = (W + 8) / (C_LON1 - C_LON0);
    cSLat = Math.min(H / (C_LAT0 - C_LAT1), cSLon * 2.2);
    mapX = -4;
  } else {
    mapW = W * 1.04;               // tiny overscan so the seam sits offscreen
    mapH = mapW / 2;
    mapX = (W - mapW) / 2;
    mapY = (H - mapH) / 2 - H * 0.02;
  }

  mapLayer = document.createElement('canvas');
  mapLayer.width = W * DPR;
  mapLayer.height = H * DPR;
  const g = mapLayer.getContext('2d');
  g.scale(DPR, DPR);

  // the corridor is stretched vertically — draw its dots taller so the
  // landmasses stay dense instead of going stripey
  const stretch = portrait ? cSLat / cSLon : 1;
  const shW = portrait ? 5.4 : 4.5, shH = portrait ? Math.min(5.4 * stretch, 11) : 4.5;
  const dotW = portrait ? 2.1 : 1.8, dotH = portrait ? Math.min(2.1 * stretch, 4.4) : 1.8;

  // shading pass: oversized soft blobs merge into filled landmasses, so the
  // continents read as shapes — the crisp dots then sit on top as texture
  const inkShade = portrait ? 'rgba(20, 18, 16, 0.04)' : 'rgba(20, 18, 16, 0.05)';
  const ochreShade = 'rgba(201, 111, 46, 0.10)';
  for (let i = 0; i < LAND_DOTS.length; i += 2) {
    const lat = LAND_DOTS[i], lon = LAND_DOTS[i + 1];
    if (portrait && lat < -50) continue;          // no Antarctica in the corridor
    const [x, y] = project(lon, lat);
    if (y < -6 || y > H + 6 || x < -8 || x > W + 8) continue;
    g.fillStyle = inAustralia(lat, lon) ? ochreShade : inkShade;
    g.fillRect(x - shW * 0.3, y - shH * 0.3, shW, shH);
  }

  const ink = portrait ? 'rgba(20, 18, 16, 0.15)' : 'rgba(20, 18, 16, 0.20)';
  const ochre = 'rgba(201, 111, 46, 0.55)';
  for (let i = 0; i < LAND_DOTS.length; i += 2) {
    const lat = LAND_DOTS[i], lon = LAND_DOTS[i + 1];
    if (portrait && lat < -50) continue;
    const [x, y] = project(lon, lat);
    if (y < -4 || y > H + 4 || x < -4 || x > W + 4) continue;
    g.fillStyle = inAustralia(lat, lon) ? ochre : ink;
    g.fillRect(x, y, dotW, dotH);
  }
}

// one arc per origin, landing across the Australian cities
const arcs = ORIGINS.map((o, i) => ({
  from: o,
  to: DESTS[i % DESTS.length],
  offset: i / ORIGINS.length,
}));

function arcPoint(a, t) {
  const [x1, y1] = project(a.from[0], a.from[1]);
  const [x2, y2] = project(a.to[0], a.to[1]);
  let mx = (x1 + x2) / 2;
  let my = (y1 + y2) / 2;
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (portrait) {
    // flights dive down the screen — bow each arc sideways (alternating)
    // so they fan out instead of stacking on one line
    const side = (a.offset * 8) % 2 < 1 ? 1 : -1;
    mx += ((y2 - y1) / (d || 1)) * d * 0.18 * side;
    my -= ((x2 - x1) / (d || 1)) * d * 0.18 * side;
  } else {
    my -= d * 0.22;                                  // lift the midpoint
  }
  const u = 1 - t;
  return [
    u * u * x1 + 2 * u * t * mx + t * t * x2,
    u * u * y1 + 2 * u * t * my + t * t * y2,
  ];
}

function drawArc(a, grow, alpha) {
  if (grow <= 0 || alpha <= 0) return;
  ctx.beginPath();
  const steps = Math.max(8, (48 * grow) | 0);
  for (let s = 0; s <= steps; s++) {
    const [x, y] = arcPoint(a, (s / steps) * grow);
    s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(201, 111, 46, ' + (0.5 * alpha).toFixed(3) + ')';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // the travelling "plane"
  if (grow < 1) {
    const [hx, hy] = arcPoint(a, grow);
    ctx.beginPath();
    ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 111, 46, ' + alpha.toFixed(3) + ')';
    ctx.fill();
  }
}

function drawCities(t) {
  for (const [lon, lat] of ORIGINS) {
    const [x, y] = project(lon, lat);
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 18, 16, 0.45)';
    ctx.fill();
  }
  const dr = portrait ? 3.6 : 2.6, pulse = portrait ? 16 : 11;
  for (let i = 0; i < DESTS.length; i++) {
    const [x, y] = project(DESTS[i][0], DESTS[i][1]);
    ctx.beginPath();
    ctx.arc(x, y, dr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(201, 111, 46, 0.85)';
    ctx.fill();
    // soft pulse ring inviting the eye to Australia
    const k = (t * 0.45 + i * 0.2) % 1;
    ctx.beginPath();
    ctx.arc(x, y, dr + 0.5 + k * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201, 111, 46, ' + (0.35 * (1 - k)).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// topographic layer: nested, gently-distorted rings around a few "peaks",
// breathing very slowly — pure mood, sits beneath everything else
const PEAKS = [
  { x: 0.78, y: 0.62, rings: 9, base: 0.05, wob: [3, 0.9], ochre: true },
  { x: 0.16, y: 0.28, rings: 7, base: 0.045, wob: [4, 1.3], ochre: false },
  { x: 0.45, y: 0.85, rings: 6, base: 0.05, wob: [5, 0.7], ochre: false },
];
function drawContours(t) {
  for (const p of PEAKS) {
    const cx = p.x * W, cy = p.y * H;
    for (let r = 1; r <= p.rings; r++) {
      const base = r * Math.min(W, H) * p.base;
      const phase = t * 0.10 + r * 0.55;
      ctx.beginPath();
      for (let s = 0; s <= 84; s++) {
        const a = (s / 84) * Math.PI * 2;
        const wob = Math.sin(a * p.wob[0] + phase) * base * 0.09 +
                    Math.sin(a * p.wob[1] * 2 + phase * 1.6) * base * 0.05;
        const rad = base + wob;
        const x = cx + Math.cos(a) * rad * 1.25;   // slightly elliptical, like land
        const y = cy + Math.sin(a) * rad;
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = (p.ochre && r === 4)
        ? 'rgba(201, 111, 46, 0.13)'
        : 'rgba(20, 18, 16, 0.055)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildMap();
}
window.addEventListener('resize', resize);
resize();

function render(t) {
  ctx.clearRect(0, 0, W, H);
  if (!portrait) drawContours(reduced ? 0 : t);   // phones: clean two-map story, less clutter + battery
  ctx.drawImage(mapLayer, 0, 0, W, H);
  for (const a of arcs) {
    if (reduced) {
      drawArc(a, 1, 0.8);
      continue;
    }
    // each flight: grow across the world, hold on arrival, fade, go again
    const cycle = (t * 0.055 + a.offset) % 1;
    if (cycle < 0.62) drawArc(a, cycle / 0.62, 1);
    else if (cycle < 0.82) drawArc(a, 1, 1);
    else drawArc(a, 1, 1 - (cycle - 0.82) / 0.18);
  }
  drawCities(t);
}

if (reduced) {
  render(0);
  window.addEventListener('resize', () => render(0));
} else {
  // alive behind the hero, About and the stats strip; hands over to the
  // Sectors section exactly as it arrives (position-based, any screen size)
  const sectors = document.getElementById('sectors');
  let raf;
  function frame(ms) {
    const t = ms / 1000;
    let op = 1;
    if (sectors) {
      const top = sectors.getBoundingClientRect().top;
      const vh = window.innerHeight;
      // full strength until Sectors nears the viewport, gone by the time
      // it reaches the upper third
      op = Math.max(0, Math.min(1, (top - vh * 0.3) / (vh * 0.55)));
    } else {
      const sy = window.scrollY / window.innerHeight;
      op = Math.max(0, 1.15 - 0.95 * Math.max(0, sy - 1.05));
    }
    wrap.style.opacity = op.toFixed(3);
    if (op > 0.01) render(t);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}
