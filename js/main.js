// Quokkaroo — UI choreography: preloader, reveals, header, parallax,
// stat counters, story carousel, gallery drift.
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- preloader ---------- */
  var preloader = document.getElementById('preloader');
  var bar = document.getElementById('preloaderBar');
  var count = document.getElementById('preloaderCount');
  var progress = 0;
  var loaded = document.readyState === 'complete';

  window.addEventListener('load', function () { loaded = true; });

  // time-based so a busy main thread can't stall it: creep toward 90,
  // then sprint to 100 once the window has loaded
  var t0 = performance.now();
  var lastTs = t0;
  var loadTimer = setInterval(function () {
    var now = performance.now();
    var dt = now - lastTs;
    lastTs = now;
    var goal = loaded ? 100 : 90;
    progress = Math.min(goal, progress + dt / 16 + (goal - progress) * dt * 0.004);
    bar.style.transform = 'scaleX(' + progress / 100 + ')';
    count.textContent = Math.round(progress);
    if (progress >= 99.5 || (loaded && now - t0 > 2500)) {
      clearInterval(loadTimer);
      bar.style.transform = 'scaleX(1)';
      count.textContent = '100';
      setTimeout(function () { preloader.classList.add('is-done'); }, 200);
    }
  }, 40);
  // hard fallback so the page is never stuck behind the preloader
  setTimeout(function () { preloader.classList.add('is-done'); }, 4000);

  /* ---------- header state ---------- */
  var header = document.getElementById('header');
  function onScrollHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal, .imgbreak');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(function (el) { io.observe(el); });

  /* ---------- hero letter parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  function onScrollParallax() {
    if (reduced) return;
    var y = window.scrollY;
    parallaxEls.forEach(function (el) {
      el.style.transform = 'translateY(' + y * parseFloat(el.dataset.parallax) * -1 + 'px)';
    });
  }
  window.addEventListener('scroll', onScrollParallax, { passive: true });

  /* ---------- stat counters ---------- */
  function animateCount(el) {
    var raw = el.dataset.count;
    if (!raw) return;
    var target = parseInt(raw, 10);
    var suffix = el.textContent.indexOf('+') > -1 ? '+' : '';
    var isYear = target > 1900 && target < 2100;
    var t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / 1400);
      var eased = 1 - Math.pow(1 - k, 3);
      var val = Math.round(target * (isYear ? 1 : eased));
      if (isYear) val = Math.round(1980 + (target - 1980) * eased);
      el.textContent = (val >= 10000 ? val.toLocaleString('en-AU') : val) + suffix;
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var statIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stats__num').forEach(animateCount);
        statIo.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  var statsList = document.querySelector('.stats');
  if (statsList && !reduced) statIo.observe(statsList);

  /* ---------- story carousel ---------- */
  var track = document.getElementById('carouselTrack');
  var prev = document.getElementById('carouselPrev');
  var next = document.getElementById('carouselNext');
  var indexEl = document.getElementById('carouselIndex');
  var slides = track ? track.children.length : 0;
  var idx = 0;

  function goTo(i) {
    idx = (i + slides) % slides;
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    indexEl.textContent = idx + 1;
  }
  if (track) {
    // gentle auto-advance until the user takes over, paused while hovering
    var hover = false;
    var auto = null;
    track.parentElement.addEventListener('mouseenter', function () { hover = true; });
    track.parentElement.addEventListener('mouseleave', function () { hover = false; });
    if (!reduced) {
      auto = setInterval(function () { if (!hover) goTo(idx + 1); }, 7000);
    }
    function manual(step) {
      if (auto) { clearInterval(auto); auto = null; }
      goTo(idx + step);
    }
    prev.addEventListener('click', function () { manual(-1); });
    next.addEventListener('click', function () { manual(1); });
  }

  /* ---------- gallery rows drift sideways on scroll ---------- */
  var rows = Array.prototype.slice.call(document.querySelectorAll('.gallery__row'));
  function onScrollGallery() {
    if (reduced || !rows.length) return;
    var vh = window.innerHeight;
    rows.forEach(function (row) {
      var r = row.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var t = (vh - r.top) / (vh + r.height); // 0..1 through viewport
      var drift = parseFloat(row.dataset.drift) * (t - 0.5) * 120;
      row.style.transform = 'translateX(' + drift + 'px)';
    });
  }
  window.addEventListener('scroll', onScrollGallery, { passive: true });
  onScrollGallery();

  /* ---------- custom cursor (desktop pointer devices) ---------- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduced) {
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('cursor-on');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    }, { passive: true });

    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(ringLoop);
    })();

    var hoverSel = 'a, button, .card, input, [role="button"]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverSel)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSel)) ring.classList.remove('is-hover');
    });
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '1'; ring.style.opacity = '1';
    });
  }
})();
