// Quokkaroo — quiet upgrades to the lower page. Five small, clean touches:
//  1. Process steps become a scroll-lit timeline with real durations.
//  2. Story quotes gain an origin ✈ destination route line.
//  3. Australia-gallery captions open the matching city dossier.
//  4. A live "down under right now" clock strip in the dark finale.
//  5. A slim sticky CTA bar on phones.
// All decoration happens here — no markup edits, so it degrades gracefully.
import { CITIES } from './cities.js';
import { openCity } from './citypanel.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. process timeline ---------- */
function processTimeline() {
  const steps = document.querySelectorAll('.process .step');
  if (!steps.length) return;
  const DURATIONS = ['Weeks 0–2', 'Weeks 2–6', 'Months 1–4', 'Months 4–8', 'Your first year'];
  steps.forEach((li, i) => {
    if (li.querySelector('.step__time') || !DURATIONS[i]) return;
    const t = document.createElement('span');
    t.className = 'step__time';
    t.textContent = DURATIONS[i];
    li.insertBefore(t, li.firstChild);
  });

  const list = document.querySelector('.process .steps');
  list.classList.add('steps--timeline');
  function onScroll() {
    const r = list.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 → 1 as the steps cross the middle band of the screen
    const k = Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (vh * 0.6)));
    list.style.setProperty('--steps-k', k.toFixed(3));
    steps.forEach((li, i) => {
      li.classList.toggle('is-lit', k >= (i + 0.6) / steps.length);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- 2. story route lines ---------- */
function storyRoutes() {
  document.querySelectorAll('.stories .quote figcaption').forEach((cap) => {
    const m = cap.textContent.match(/^(.+?)\s+—\s+(.+?)\s*(?:→|->)\s*(.+)$/);
    if (!m) return;
    const route = document.createElement('span');
    route.className = 'quote__route';
    route.innerHTML =
      '<em>' + m[2].trim() + '</em>' +
      '<svg viewBox="0 0 64 14" aria-hidden="true"><path d="M2 12 Q32 -6 62 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"/><circle cx="2" cy="12" r="2" fill="currentColor"/><circle cx="62" cy="12" r="2.6" fill="currentColor"/></svg>' +
      '<em>' + m[3].trim() + '</em>';
    cap.insertAdjacentElement('afterend', route);
  });
}

/* ---------- 3. gallery → city dossiers ---------- */
function galleryHandoffs() {
  const MAP = {
    sydney: 'sydney', melbourne: 'melbourne', perth: 'perth',
    'gold coast': 'goldcoast', bondi: 'sydney', rottnest: 'perth',
    'barrier reef': 'cairns',
  };
  document.querySelectorAll('.gallery__row figure').forEach((fig) => {
    const cap = fig.querySelector('figcaption');
    if (!cap) return;
    const text = cap.textContent.toLowerCase();
    const key = Object.keys(MAP).find((k) => text.includes(k));
    if (!key) return;
    const city = CITIES.find((c) => c.key === MAP[key]);
    if (!city) return;
    fig.classList.add('gallery__fig--link');
    cap.innerHTML += '<span class="gallery__go">Explore &rarr;</span>';
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('aria-label', 'Explore ' + city.name);
    fig.addEventListener('click', () => openCity(city));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCity(city); }
    });
  });
}

/* ---------- 4. live "down under right now" strip ---------- */
function timeStrip() {
  const intro = document.querySelector('.finale__intro');
  if (!intro || document.querySelector('.ozclock')) return;
  const ZONES = [
    { city: 'Sydney', tz: 'Australia/Sydney' },
    { city: 'Brisbane', tz: 'Australia/Brisbane' },
    { city: 'Adelaide', tz: 'Australia/Adelaide' },
    { city: 'Perth', tz: 'Australia/Perth' },
  ];
  const strip = document.createElement('div');
  strip.className = 'ozclock';
  strip.setAttribute('aria-label', 'Local time in Australia right now');
  strip.innerHTML =
    '<p class="ozclock__lead">Down under, right now</p>' +
    '<div class="ozclock__row">' +
    ZONES.map((z) => '<span class="ozclock__item"><b data-tz="' + z.tz + '">–:–</b><i>' + z.city + '</i></span>').join('') +
    '</div><p class="ozclock__season"></p>';
  intro.appendChild(strip);

  const season = strip.querySelector('.ozclock__season');
  function tick() {
    strip.querySelectorAll('b[data-tz]').forEach((b) => {
      b.textContent = new Intl.DateTimeFormat('en-AU', {
        hour: 'numeric', minute: '2-digit', timeZone: b.dataset.tz,
      }).format(new Date()).replace(/\s/g, '').toLowerCase();
    });
    const m = new Date().getMonth() + 1;
    const aus = (m >= 12 || m <= 2) ? 'summer' : m <= 5 ? 'autumn' : m <= 8 ? 'winter' : 'spring';
    season.textContent = 'It’s ' + aus + ' there — the seasons trade places when you cross the equator.';
  }
  tick();
  setInterval(tick, 30000);
}

/* ---------- 5. sticky mobile CTA bar ---------- */
function mobileBar() {
  if (document.querySelector('.ctabar')) return;
  const bar = document.createElement('div');
  bar.className = 'ctabar';
  bar.innerHTML =
    '<a class="ctabar__a" href="#points">Check your points</a>' +
    '<a class="ctabar__b" href="https://quokkaroo.mmportal.cloud" target="_blank" rel="noopener">Register</a>';
  document.body.appendChild(bar);
  function onScroll() {
    const show = window.innerWidth <= 720 && window.scrollY > window.innerHeight * 0.9;
    bar.classList.toggle('is-on', show);
    document.body.classList.toggle('has-ctabar', show);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

/* ---------- 6. WhatsApp contact ---------- */
// Set Quokkaroo's WhatsApp number here (international format, digits only,
// e.g. '61400000000') and the button appears beside the chatbot. Until then
// nothing renders — no broken UI.
const WHATSAPP_NUMBER = '';

function whatsappButton() {
  if (!WHATSAPP_NUMBER || document.querySelector('.wa-fab')) return;
  const a = document.createElement('a');
  a.className = 'wa-fab';
  a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
    encodeURIComponent('Hi Quokkaroo — I’d like to talk about migrating to Australia.');
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat with Quokkaroo on WhatsApp');
  a.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3.2-.5 0-.2 0-.4-.1-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z"/></svg>';
  document.body.appendChild(a);
}

/* ---------- 7. live AUD exchange-rate bar (very top of the page) ---------- */
function fxBar() {
  return;   // currency bar hidden for now (per Luke) — remove this line to bring it back
  if (document.querySelector('.fxbar')) return;
  const bar = document.createElement('div');
  bar.className = 'fxbar';
  bar.setAttribute('aria-label', 'Australian dollar exchange rates');
  document.body.appendChild(bar);
  document.documentElement.classList.add('has-fxbar');

  const SYM = { USD: '$', ZAR: 'R', GBP: '£', EUR: '€', INR: '₹' };
  // indicative fallbacks so the bar never shows empty (overwritten by live ECB rates)
  const FALLBACK = { USD: 0.66, ZAR: 11.9, GBP: 0.49, EUR: 0.57, INR: 55.2 };

  function render(rates, live, date) {
    const parts = Object.keys(SYM).map((c) => {
      const v = rates[c];
      if (v == null) return '';
      const str = v >= 10 ? v.toFixed(1) : v.toFixed(2);
      return '<span class="fxbar__item"><b>' + SYM[c] + str + '</b> ' + c + '</span>';
    }).join('');
    bar.innerHTML =
      '<span class="fxbar__lead">A$1 =</span>' + parts +
      '<span class="fxbar__src">' + (live ? 'ECB rates · ' + date : 'indicative') + '</span>';
  }
  render(FALLBACK, false);

  fetch('https://api.frankfurter.app/latest?from=AUD&to=USD,ZAR,GBP,EUR,INR')
    .then((r) => r.json())
    .then((d) => { if (d && d.rates) render(d.rates, true, d.date); })
    .catch(() => {});
}

function boot() {
  fxBar();
  processTimeline();
  storyRoutes();
  galleryHandoffs();
  timeStrip();
  mobileBar();
  whatsappButton();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
