// Quokkaroo — the kinetic "Australia needs ___" line (phone hero).
(function () {
  'use strict';
  var el = document.getElementById('needsWord');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var WORDS = ['nurses', 'doctors', 'engineers', 'electricians', 'carers', 'vets', 'teachers', 'you.'];
  var i = 0;
  setInterval(function () {
    el.classList.add('is-flip');
    setTimeout(function () {
      i = (i + 1) % WORDS.length;
      el.textContent = WORDS[i];
      el.classList.remove('is-flip');
    }, 300);
  }, 2100);
})();
