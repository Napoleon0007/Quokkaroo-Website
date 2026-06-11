// Quokkaroo — interactive recruitment globe
// A photo-real Earth (NASA-derived imagery + drifting clouds + atmosphere)
// floating in a deep field of glowing, twinkling stars.
// Drag to spin. Migration arcs fly from origin cities into Australia.
// Every Australian city beacon is clickable and opens its city dossier panel.
import * as THREE from 'three';
import { CITIES } from './cities.js';
import { openCity } from './citypanel.js';

const canvas = document.getElementById('globeCanvas');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
if (!webglAvailable()) {
  canvas.replaceWith(Object.assign(document.createElement('img'), {
    src: 'assets/img/australia/uluru.jpg',
    alt: 'Uluru at sunset',
    style: 'width:100%;height:100%;object-fit:cover;display:block',
  }));
} else {
  init();
}

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // filmic tone mapping — the difference between "texture on a ball" and a photo
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);

  // Frame the whole Earth (sphere + atmosphere halo) with a little air on every
  // screen: pull the camera back to whatever distance fits the framing radius in
  // the limiting axis. Vertical gets extra air so the fixed header never crowds
  // Earth on wide desktop; horizontal stays tight so it fills tall phones.
  const FIT_V = 4.7;    // vertical framing radius (a little extra room for the Moon)
  const FIT_H = 4.1;    // horizontal framing radius
  const CAM_TILT = 0.12;
  function fitCamera() {
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const D = Math.max(FIT_V / tanV, FIT_H / (tanV * camera.aspect));
    camera.position.set(0, D * Math.sin(CAM_TILT), D * Math.cos(CAM_TILT));
    camera.lookAt(0, 0, 0);
  }

  // sunlight + a whisper of fill so the night side reads, not vanishes
  scene.add(new THREE.AmbientLight(0xbfc8ff, 0.32));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(6, 2.5, 7);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xc96f2e, 0.35);
  rim.position.set(-6, 3, -4);
  scene.add(rim);

  const R = 3;
  const globe = new THREE.Group();
  scene.add(globe);

  // --- photo-real Earth: NASA-derived day map, terrain relief, ocean shine,
  //     city lights on the night side ---
  const texLoader = new THREE.TextureLoader();
  function srgb(path) {
    const t = texLoader.load(path);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  // custom shader: real day/night terminator, city lights waking up on the
  // dark side, sun glint on the oceans, blue Rayleigh scatter at the limb
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: srgb('assets/img/earth/daymap4k.jpg') },
      uNight: { value: srgb('assets/img/earth/nightmap.jpg') },
      uSpec: { value: texLoader.load('assets/img/earth/specular.jpg') },
      uClouds: { value: null },                 // set once the cloud texture exists
      uCloudOffset: { value: 0 },               // tracks the cloud layer's drift
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uDay, uNight, uSpec, uClouds;
      uniform float uCloudOffset;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 sun = normalize(uSunDir);
        vec3 viewDir = normalize(-vViewPos);

        float sunDot = dot(n, sun);
        float dayK = smoothstep(-0.10, 0.22, sunDot);          // soft terminator

        vec3 dayTex = texture2D(uDay, vUv).rgb;
        vec3 cityLights = texture2D(uNight, vUv).rgb;

        // lit day with a cool skylight ambient so shadowed terrain isn't dead black
        float diff = max(sunDot, 0.0);
        vec3 lit = dayTex * (0.09 + 1.25 * diff);
        lit += dayTex * vec3(0.16, 0.21, 0.32) * 0.18;

        // warm sunset band riding the terminator (Rayleigh reddening)
        float band = smoothstep(0.0, 0.16, sunDot) * (1.0 - smoothstep(0.16, 0.5, sunDot));
        lit += dayTex * vec3(0.60, 0.20, 0.06) * band;

        // soft shadows the drifting clouds cast onto the day surface below
        float cloudCov = texture2D(uClouds, vec2(vUv.x - uCloudOffset, vUv.y)).r;
        lit *= 1.0 - 0.42 * cloudCov;

        // night: a whisper of earth + warm, glowing city lights
        vec3 night = dayTex * 0.015 + cityLights * vec3(1.0, 0.80, 0.52) * 2.1;

        vec3 color = mix(night, lit, dayK);

        // sharp sun glint off the oceans (day side only)
        float specMask = texture2D(uSpec, vUv).r;
        vec3 halfDir = normalize(sun + viewDir);
        float glint = pow(max(dot(n, halfDir), 0.0), 90.0) * specMask;
        color += glint * vec3(1.0, 0.96, 0.86) * 1.15 * dayK;

        // blue atmospheric scatter brightening the day-side limb
        float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
        color += fresnel * vec3(0.28, 0.48, 1.0) * (0.06 + 0.60 * dayK);

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R - 0.02, 96, 96), earthMat);
  globe.add(earth);

  // real cloud layer drifting just above the surface
  const cloudsTex = srgb('assets/img/earth/clouds.jpg');
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 96, 96),
    new THREE.MeshLambertMaterial({
      map: cloudsTex, alphaMap: cloudsTex,
      transparent: true, opacity: 0.85, depthWrite: false,
    })
  );
  globe.add(clouds);
  earthMat.uniforms.uClouds.value = cloudsTex;   // feed the cloud layer to the surface shader

  // atmosphere: fresnel halo hugging the limb, brighter where the sun grazes it
  // — like Earth photographed from orbit, with a luminous day-side arc
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uSunDir: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      varying vec3 vNormal;
      void main() {
        vec3 n = normalize(vNormal);
        float rim = pow(max(0.70 - dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 3.2);
        float sunAmt = clamp(dot(n, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(vec3(0.10, 0.18, 0.44), vec3(0.42, 0.62, 1.0), sunAmt);
        gl_FragColor = vec4(col * 1.7, 1.0) * rim * (0.22 + 0.95 * sunAmt);
      }
    `,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 64, 64), atmoMat);
  globe.add(atmosphere);

  // --- the Moon: real lunar albedo, bump-shaded craters, lit by the same sun so
  //     its phase always matches Earth's. Orbits on its own inclined pivot. ---
  const moonTex = srgb('assets/img/moon/moon.jpg');
  const MOON_R = 0.42, MOON_DIST = 4.1;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_R, 64, 64),
    new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonTex, bumpScale: 0.012,     // craters bite at the terminator
      roughness: 1.0, metalness: 0.0,
      color: 0xc9c4ba,                          // lift the albedo a touch
    })
  );
  // the Moon circles around Earth roughly in the view plane, tilted so the top
  // of the orbit passes behind Earth and the bottom swings in front of it
  const moonOrbit = new THREE.Group();
  moonOrbit.rotation.x = THREE.MathUtils.degToRad(24);   // tip the orbit for occlusion
  moonOrbit.rotation.y = THREE.MathUtils.degToRad(-16);
  moonOrbit.add(moon);
  scene.add(moonOrbit);

  // --- starfield: a deep shell of glowing, gently twinkling stars (no galaxies) ---
  // soft round star sprite (bright core → transparent halo) so each star reads as
  // a point of light, not a square pixel
  function starSprite() {
    const S = 64, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0.0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.22, 'rgba(255,255,255,0.85)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    grd.addColorStop(1.0, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const STAR_N = 5200;
  const starPos = new Float32Array(STAR_N * 3);
  const starSize = new Float32Array(STAR_N);
  const starPhase = new Float32Array(STAR_N);
  const starColor = new Float32Array(STAR_N * 3);
  for (let i = 0; i < STAR_N; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(1 - u * u), dist = 70 + Math.random() * 130;
    starPos[i * 3] = dist * rr * Math.cos(th);
    starPos[i * 3 + 1] = dist * u;
    starPos[i * 3 + 2] = dist * rr * Math.sin(th);
    // mostly small, a scattered few bright and large
    const big = Math.random();
    starSize[i] = big > 0.975 ? 14 + Math.random() * 10
                : big > 0.86  ? 6.5 + Math.random() * 5
                :               3.0 + Math.random() * 3.6;
    starPhase[i] = Math.random() * Math.PI * 2;
    // subtle stellar colour: most white, some cool blue, a few warm
    const tint = Math.random();
    if (tint > 0.86)      { starColor[i*3]=0.72; starColor[i*3+1]=0.82; starColor[i*3+2]=1.0; }
    else if (tint < 0.10) { starColor[i*3]=1.0;  starColor[i*3+1]=0.87; starColor[i*3+2]=0.70; }
    else                  { starColor[i*3]=1.0;  starColor[i*3+1]=1.0;  starColor[i*3+2]=1.0; }
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhase, 1));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColor, 3));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTex: { value: starSprite() }, uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aColor;
      uniform float uTime;
      varying float vTw;
      varying vec3 vCol;
      void main() {
        vTw = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);   // twinkle
        vCol = aColor;
        gl_PointSize = aSize * (0.65 + 0.35 * vTw);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D uTex;
      varying float vTw;
      varying vec3 vCol;
      void main() {
        float a = texture2D(uTex, gl_PointCoord).a;
        gl_FragColor = vec4(vCol, 1.0) * a * (0.45 + 0.75 * vTw);
      }
    `,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // --- migration arcs into Australia ---
  const ORIGINS = [
    [-26.2, 28.0],   // Johannesburg
    [-33.9, 18.4],   // Cape Town
    [51.5, -0.1],    // London
    [19.1, 72.9],    // Mumbai
    [14.6, 121.0],   // Manila
    [-23.6, -46.6],  // São Paulo
    [52.4, 4.9],     // Amsterdam
    [25.2, 55.3],    // Dubai
  ];
  // arcs land on the major-city beacons (from the city knowledge base)
  const DESTS = CITIES.map((c) => [c.lat, c.lon]);

  const arcs = [];
  ORIGINS.forEach((o, i) => {
    const d = DESTS[i % DESTS.length];
    const a = latLonToVec3(o[0], o[1], R);
    const b = latLonToVec3(d[0], d[1], R);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize()
      .multiplyScalar(R + a.distanceTo(b) * 0.35);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(80);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0xff8c3a, transparent: true, opacity: 0.55,
    });
    const line = new THREE.Line(geo, mat);
    line.geometry.setDrawRange(0, 0);
    globe.add(line);

    // travelling spark on each arc
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc491 })
    );
    globe.add(spark);
    arcs.push({ curve, line, spark, offset: i / ORIGINS.length });
  });

  // destination beacons — one clickable beacon per Australian city
  const beacons = [];
  const hitTargets = [];
  CITIES.forEach((city) => {
    // sit just above the cloud layer so beacons never get hazed over
    const pos = latLonToVec3(city.lat, city.lon, R + 0.055);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffa75e })
    );
    beacon.position.copy(pos);
    globe.add(beacon);

    // halo ring that pulses to say "press me"
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff8c3a, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
      })
    );
    halo.position.copy(pos);
    halo.lookAt(pos.clone().multiplyScalar(2));
    globe.add(halo);

    // generous invisible hit sphere so fingers can actually tap it
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.copy(pos);
    hit.userData.city = city;
    globe.add(hit);

    beacons.push({ city, beacon, halo, hit, phase: Math.random() * Math.PI * 2 });
    hitTargets.push(hit);
  });

  // --- picking: hover labels + click to open the city dossier ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tip = document.createElement('div');
  tip.className = 'globe-tip';
  canvas.parentElement.appendChild(tip);
  let hovered = null;

  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitTargets, false);
    for (const h of hits) {
      // only the near side of the globe is clickable
      const world = h.object.getWorldPosition(new THREE.Vector3());
      if (world.dot(camera.position) > 0) return h.object.userData.city;
    }
    return null;
  }

  function labelFor(city) {
    const entry = beacons.find((b) => b.city === city);
    const world = entry.beacon.getWorldPosition(new THREE.Vector3());
    const proj = world.project(camera);
    const r = canvas.getBoundingClientRect();
    tip.style.left = ((proj.x + 1) / 2) * r.width + 'px';
    tip.style.top = ((1 - proj.y) / 2) * r.height + 'px';
    tip.textContent = city.name;
  }

  // start with Australia facing the camera
  globe.rotation.y = -2.0;

  // --- drag to spin with inertia ---
  let dragging = false, lastX = 0, lastY = 0;
  let velY = 0;
  let tiltX = 0.18, tiltTarget = 0.18;

  let downX = 0, downY = 0, downAt = 0;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    downX = e.clientX; downY = e.clientY; downAt = performance.now();
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) {
      // hover: light up city labels and the cursor over beacons
      hovered = pick(e.clientX, e.clientY);
      canvas.style.cursor = hovered ? 'pointer' : '';
      tip.classList.toggle('is-on', !!hovered);
      if (hovered) labelFor(hovered);
      return;
    }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    velY = dx * 0.005;
    globe.rotation.y += velY;
    tiltTarget = THREE.MathUtils.clamp(tiltTarget + dy * 0.002, -0.5, 0.7);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    canvas.addEventListener(ev, (e) => {
      const wasDragging = dragging;
      dragging = false;
      canvas.classList.remove('is-dragging');
      // a press that barely moved is a tap → open that city's dossier
      if (ev === 'pointerup' && wasDragging) {
        const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (moved < 8 && performance.now() - downAt < 700) {
          const city = pick(e.clientX, e.clientY);
          if (city) {
            velY = 0;
            tip.classList.remove('is-on');
            openCity(city);
          }
        }
      }
    })
  );

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fitCamera();
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // only render while on screen
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 })
    .observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;

    if (!dragging) {
      velY *= 0.95;                                  // inertia decay
      globe.rotation.y += velY + (reduced ? 0 : dt * 0.07); // gentle auto-spin
    }
    tiltX += (tiltTarget - tiltX) * 0.08;
    globe.rotation.x = tiltX;

    const t = clock.elapsedTime;

    // the living sky: clouds drift over the surface, the stars wheel + twinkle
    clouds.rotation.y += dt * 0.006;
    earthMat.uniforms.uCloudOffset.value = clouds.rotation.y / (2.0 * Math.PI);
    stars.rotation.y += dt * 0.0025;
    starMat.uniforms.uTime.value = t;

    // the Moon orbits Earth and keeps roughly one face turned toward it
    const moonAng = t * 0.10;
    moon.position.set(Math.cos(moonAng) * MOON_DIST, Math.sin(moonAng) * MOON_DIST, 0);
    moon.rotation.y = -moonAng + Math.PI;

    // REAL-TIME sun: light the Earth exactly as it is lit right now.
    // Subsolar point from the actual UTC clock (declination + solar-noon
    // longitude), anchored to the geography so it rides the globe as you spin.
    const rtNow = new Date();
    const utcH = rtNow.getUTCHours() + rtNow.getUTCMinutes() / 60 + rtNow.getUTCSeconds() / 3600;
    const doy = (Date.UTC(rtNow.getUTCFullYear(), rtNow.getUTCMonth(), rtNow.getUTCDate()) -
                 Date.UTC(rtNow.getUTCFullYear(), 0, 0)) / 86400000;
    const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (doy + 10));  // sun's latitude
    const subLon = (12 - utcH) * 15;                                   // solar-noon longitude
    earthMat.uniforms.uSunDir.value
      .copy(latLonToVec3(decl, subLon, 1))
      .transformDirection(globe.matrixWorld)
      .transformDirection(camera.matrixWorldInverse);
    atmoMat.uniforms.uSunDir.value.copy(earthMat.uniforms.uSunDir.value);
    // keep the scene light (cloud shading) on the same side as the real sun
    sun.position.copy(latLonToVec3(decl, subLon, 1))
      .transformDirection(globe.matrixWorld).multiplyScalar(10);

    // beacon halos pulse to invite a tap; keep the hover label pinned on
    beacons.forEach(({ halo, phase }) => {
      const k = 1 + Math.sin(t * 2.2 + phase) * 0.25;
      halo.scale.setScalar(k);
      halo.material.opacity = 0.35 + 0.3 * (1 + Math.sin(t * 2.2 + phase)) * 0.5;
    });
    if (hovered && !dragging) labelFor(hovered);

    arcs.forEach(({ curve, line, spark, offset }) => {
      const cycle = (t * 0.14 + offset) % 1;
      const grow = THREE.MathUtils.clamp(cycle * 1.6, 0, 1);
      line.geometry.setDrawRange(0, Math.floor(grow * 81));
      line.material.opacity = 0.55 * (1 - Math.max(0, cycle - 0.75) * 4);
      const p = curve.getPointAt(Math.min(grow, 0.999));
      spark.position.copy(p);
      spark.material.opacity = line.material.opacity + 0.2;
    });

    renderer.render(scene, camera);
  }
  tick();
}
