// Quokkaroo — cinematic 3D sector tiles.
// Injects a sector glyph badge (matching the map's icons) + a light-sweep into
// each card, then tilts the tile in real perspective with layered parallax on
// the photo, number and badge. Touch / reduced-motion keep the static CSS look.
(function () {
  'use strict';

  // glyphs in DOM/card order: Health, Aged care, Mining, Vet, ICT, Allied & FMCG
  var GLYPHS = [
    '<path d="M0 -6.2V6.2M-6.2 0H6.2"/>',
    '<path d="M0 5.2C-5 1.4 -6.4 -3.6 -2.7 -5.1C-1 -5.8 0 -4.2 0 -3.1C0 -4.2 1 -5.8 2.7 -5.1C6.4 -3.6 5 1.4 0 5.2Z"/>',
    '<path d="M-7.2 3H7.2"/><path d="M-5.4 3C-5.4 -2.2 -2.9 -4.7 0 -4.7C2.9 -4.7 5.4 -2.2 5.4 3"/><path d="M-1.6 -4.5Q0 -5.6 1.6 -4.5"/>',
    '<circle cx="-3.4" cy="-1.2" r="1.5"/><circle cx="0" cy="-2.7" r="1.5"/><circle cx="3.4" cy="-1.2" r="1.5"/><ellipse cx="0" cy="3.2" rx="3.3" ry="2.6"/>',
    '<path d="M-6.4 -5.2H6.4V2.2H-6.4Z"/><path d="M0 2.2V4.8M-3.4 5H3.4"/>',
    '<path d="M-7 -3.4H-4.2L-2.2 2.8H4.2L6.4 -2.2H-3"/><circle cx="-1.8" cy="4.6" r="1.2"/><circle cx="3.8" cy="4.6" r="1.2"/>'
  ];

  var cards = document.querySelectorAll('.sectors .card');
  if (!cards.length) return;

  // badge + glare go on every card (visible on all devices)
  cards.forEach(function (card, i) {
    if (!card.querySelector('.card__glyph')) {
      var g = document.createElement('span');
      g.className = 'card__glyph';
      g.innerHTML = '<svg viewBox="-10 -10 20 20" aria-hidden="true">' + (GLYPHS[i] || GLYPHS[0]) + '</svg>';
      card.appendChild(g);
    }
    if (!card.querySelector('.card__glare')) {
      var glare = document.createElement('span');
      glare.className = 'card__glare';
      card.appendChild(glare);
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduced || coarse) return;   // no live tilt on touch / reduced-motion

  var MAX = 9;   // max tilt in degrees

  cards.forEach(function (card) {
    var glare = card.querySelector('.card__glare');
    var img = card.querySelector('.card__img img');
    var num = card.querySelector('.card__num');
    var badge = card.querySelector('.card__glyph');
    var raf = null, rx = 0, ry = 0, gx = 50, gy = 50, active = false;

    function render() {
      raf = null;
      card.style.transform =
        'perspective(1200px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) +
        'deg) translateY(-10px) scale(1.025)';
      glare.style.setProperty('--gx', gx + '%');
      glare.style.setProperty('--gy', gy + '%');
      if (img) img.style.transform = 'scale(1.13) translate(' + (-ry * 1.0).toFixed(1) + 'px,' + (rx * 1.0).toFixed(1) + 'px)';
      if (num) num.style.transform = 'translate(' + (-ry * 1.9).toFixed(1) + 'px,' + (rx * 1.9).toFixed(1) + 'px)';
      if (badge) badge.style.transform = 'translate(' + (-ry * 1.6).toFixed(1) + 'px,' + (rx * 1.6).toFixed(1) + 'px)';
    }

    card.addEventListener('pointerenter', function () { active = true; card.classList.add('is-tilt'); });
    card.addEventListener('pointermove', function (e) {
      if (!active) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * 2 * MAX;
      rx = -(py - 0.5) * 2 * MAX;
      gx = px * 100; gy = py * 100;
      glare.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(render);
    });
    card.addEventListener('pointerleave', function () {
      active = false; card.classList.remove('is-tilt');
      card.style.transform = '';
      glare.style.opacity = '0';
      if (img) img.style.transform = '';
      if (num) num.style.transform = '';
      if (badge) badge.style.transform = '';
    });
  });
})();
