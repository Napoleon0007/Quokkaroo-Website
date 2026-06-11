// Quokkaroo — 3D interactive sector cards.
// Each sector card tilts toward the cursor in real perspective, with a soft
// glare that tracks the pointer and a gentle in-frame image parallax. Restrained
// and professional; touch / reduced-motion devices keep the simple CSS hover.
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduced || coarse) return;

  var cards = document.querySelectorAll('.sectors .card');
  if (!cards.length) return;

  var MAX = 8.5;   // max tilt in degrees

  cards.forEach(function (card) {
    var glare = document.createElement('span');
    glare.className = 'card__glare';
    card.appendChild(glare);
    var img = card.querySelector('.card__img img');

    var raf = null, rx = 0, ry = 0, gx = 50, gy = 50, active = false;

    function render() {
      raf = null;
      card.style.transform =
        'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) +
        'deg) translateY(-8px) scale(1.02)';
      glare.style.setProperty('--gx', gx + '%');
      glare.style.setProperty('--gy', gy + '%');
      if (img) img.style.transform = 'scale(1.09) translate(' + (-ry * 0.7) + 'px,' + (rx * 0.7) + 'px)';
    }

    card.addEventListener('pointerenter', function () {
      active = true;
      card.classList.add('is-tilt');
    });
    card.addEventListener('pointermove', function (e) {
      if (!active) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;     // 0..1 across
      var py = (e.clientY - r.top) / r.height;     // 0..1 down
      ry = (px - 0.5) * 2 * MAX;                    // rotateY follows X
      rx = -(py - 0.5) * 2 * MAX;                   // rotateX follows Y
      gx = px * 100; gy = py * 100;
      glare.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(render);
    });
    card.addEventListener('pointerleave', function () {
      active = false;
      card.classList.remove('is-tilt');            // restores the smooth CSS transition
      card.style.transform = '';
      glare.style.opacity = '0';
      if (img) img.style.transform = '';
    });
  });
})();
