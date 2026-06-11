// Quokkaroo — Sectors "Skills fill the map".
// As the Sectors section scrolls into view, a line-art map of Australia draws
// itself, then one glyph per sector flies in from the edges and settles as a
// glowing pin on the map. Pure SVG + CSS; no dependencies. Builds into #sectorsMap.
(function () {
  'use strict';
  var mount = document.getElementById('sectorsMap');
  if (!mount) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // simplified Australia outline (lon, lat) — same shape used by the hero scene
  var AUS = [
    [114, -22], [114, -26], [115, -31], [115.2, -34], [120, -34], [124, -33.6],
    [129, -32], [132, -31.6], [134.5, -33], [136, -35], [137.8, -35], [138.6, -35],
    [140, -38], [143, -39], [146.5, -39], [148, -37.6], [150, -37], [150.2, -35.5],
    [151.6, -33], [153, -31], [153.5, -28], [153, -25], [151.5, -23.5], [149.5, -21.5],
    [147, -19.5], [146, -18.5], [145.5, -16.5], [143.5, -13.5], [142.3, -11], [141, -13],
    [140, -17], [137.5, -16], [136.5, -12.5], [133, -11], [130.5, -12], [129, -15],
    [126.5, -14], [122, -18], [120, -20], [116.5, -21], [114, -22]
  ];
  var TAS = { lon: 146.6, lat: -42, rx: 1.5, ry: 1.9 };

  // monoline glyphs, authored around (0,0) within roughly ±8 units
  var GLYPH = {
    cross:   '<path d="M0 -6.2V6.2M-6.2 0H6.2"/>',
    heart:   '<path d="M0 5.2C-5 1.4 -6.4 -3.6 -2.7 -5.1C-1 -5.8 0 -4.2 0 -3.1C0 -4.2 1 -5.8 2.7 -5.1C6.4 -3.6 5 1.4 0 5.2Z"/>',
    helmet:  '<path d="M-7.2 3H7.2"/><path d="M-5.4 3C-5.4 -2.2 -2.9 -4.7 0 -4.7C2.9 -4.7 5.4 -2.2 5.4 3"/><path d="M-1.6 -4.5Q0 -5.6 1.6 -4.5"/>',
    paw:     '<circle cx="-3.4" cy="-1.2" r="1.5"/><circle cx="0" cy="-2.7" r="1.5"/><circle cx="3.4" cy="-1.2" r="1.5"/><ellipse cx="0" cy="3.2" rx="3.3" ry="2.6"/>',
    monitor: '<path d="M-6.4 -5.2H6.4V2.2H-6.4Z"/><path d="M0 2.2V4.8M-3.4 5H3.4"/>',
    cart:    '<path d="M-7 -3.4H-4.2L-2.2 2.8H4.2L6.4 -2.2H-3"/><circle cx="-1.8" cy="4.6" r="1.2"/><circle cx="3.8" cy="4.6" r="1.2"/>'
  };

  // one pin per sector, placed at a real-ish location so the map reads geographic
  var PINS = [
    { lon: 151.0, lat: -33.8, label: 'Health',        glyph: 'cross'   },
    { lon: 152.6, lat: -27.6, label: 'Veterinary',    glyph: 'paw'     },
    { lon: 145.2, lat: -37.7, label: 'ICT',           glyph: 'monitor' },
    { lon: 138.6, lat: -34.9, label: 'Aged care',     glyph: 'heart'   },
    { lon: 116.0, lat: -31.9, label: 'Allied & FMCG', glyph: 'cart'    },
    { lon: 118.6, lat: -22.2, label: 'Mining',        glyph: 'helmet'  }
  ];

  // --- projection: lon/lat -> SVG px (north at top) ---
  var lons = AUS.map(function (p) { return p[0]; }).concat([TAS.lon - TAS.rx, TAS.lon + TAS.rx]);
  var lats = AUS.map(function (p) { return p[1]; }).concat([TAS.lat - TAS.ry, TAS.lat + TAS.ry]);
  var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
  var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
  var W = 760, PAD = 80;
  var k = (W - 2 * PAD) / (maxLon - minLon);
  var H = (maxLat - minLat) * k + 2 * PAD;
  function X(lon) { return PAD + (lon - minLon) * k; }
  function Y(lat) { return PAD + (maxLat - lat) * k; }

  var d = AUS.map(function (p, i) {
    return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1);
  }).join(' ') + ' Z';

  var cx = X((minLon + maxLon) / 2), cy = Y((minLat + maxLat) / 2);

  // --- build the SVG ---
  var svg = '<svg class="smap" viewBox="0 0 ' + W.toFixed(0) + ' ' + Math.round(H) +
            '" role="img" aria-label="Map of Australia with the sectors Quokkaroo recruits for">';
  svg += '<path class="smap__outline" d="' + d + '"/>';
  svg += '<ellipse class="smap__tas" cx="' + X(TAS.lon).toFixed(1) + '" cy="' + Y(TAS.lat).toFixed(1) +
         '" rx="' + (TAS.rx * k).toFixed(1) + '" ry="' + (TAS.ry * k).toFixed(1) + '"/>';

  PINS.forEach(function (p, i) {
    var px = X(p.lon), py = Y(p.lat);
    var vx = px - cx, vy = py - cy, len = Math.hypot(vx, vy) || 1;
    var dx = (vx / len) * 230, dy = (vy / len) * 230;      // fly in from this pin's edge
    var delay = (0.95 + i * 0.13).toFixed(2);
    var style = '--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;--delay:' + delay + 's';
    svg += '<g class="smap__pin" style="' + style + '">';
    svg += '<circle class="smap__halo" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="17"/>';
    svg += '<circle class="smap__head" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="15"/>';
    svg += '<g class="smap__glyph" transform="translate(' + px.toFixed(1) + ' ' + py.toFixed(1) + ') scale(1.18)">' +
           GLYPH[p.glyph] + '</g>';
    svg += '<text class="smap__label" x="' + px.toFixed(1) + '" y="' + (py + 32).toFixed(1) +
           '" text-anchor="middle">' + p.label + '</text>';
    svg += '</g>';
  });
  svg += '</svg>';
  mount.innerHTML = svg;

  // prime the outline draw with its real length
  var outline = mount.querySelector('.smap__outline');
  var L = outline.getTotalLength();
  outline.style.strokeDasharray = L;
  outline.style.strokeDashoffset = L;

  function play() { mount.classList.add('is-drawn'); }

  if (reduced) { play(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { play(); io.disconnect(); }
    });
  }, { threshold: 0.35 });
  io.observe(mount);
})();
