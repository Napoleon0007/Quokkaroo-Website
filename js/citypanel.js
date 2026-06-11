// Quokkaroo — city dossier panel.
// openCity(city) builds and shows a full-screen branded panel for one city
// from the CITIES knowledge base. Pure DOM, no framework.

let panel = null;
let lastFocus = null;
let hideTimer = null;

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

// hide images that fail to load so a missing file never shows a broken frame
function safeImg(src, alt) {
  const img = el('img');
  img.src = src;
  img.alt = alt || '';
  img.loading = 'lazy';
  img.addEventListener('error', () => {
    const fig = img.closest('figure');
    (fig || img).remove();
  });
  return img;
}

function buildShell() {
  panel = el('div', 'citypanel');
  panel.setAttribute('hidden', '');

  const scrim = el('div', 'citypanel__scrim');
  scrim.addEventListener('click', closeCity);

  const sheet = el('article', 'citypanel__sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'City information');

  panel.appendChild(scrim);
  panel.appendChild(sheet);
  document.body.appendChild(panel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closeCity();
  });
}

function render(city) {
  const sheet = panel.querySelector('.citypanel__sheet');
  sheet.innerHTML = '';
  sheet.scrollTop = 0;

  /* ---- top bar: Quokkaroo brand + close ---- */
  const top = el('header', 'citypanel__top');
  const brand = el('div', 'citypanel__brand');
  brand.appendChild(safeImg('assets/brand/quokka-mark-cream.png', 'Quokkaroo'));
  brand.appendChild(el('span', 'citypanel__brandword', 'Quokkaroo'));
  const close = el('button', 'citypanel__close', '&times;');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close city information');
  close.addEventListener('click', closeCity);
  top.appendChild(brand);
  top.appendChild(close);
  sheet.appendChild(top);

  /* ---- hero ---- */
  const hero = el('div', 'citypanel__hero');
  const heroImg = city.images[0];
  if (heroImg) hero.appendChild(safeImg(heroImg.src, heroImg.caption));
  const title = el('div', 'citypanel__title');
  title.appendChild(el('p', 'citypanel__kicker', city.state));
  title.appendChild(el('h2', 'citypanel__name', city.name));
  title.appendChild(el('p', 'citypanel__tagline', city.tagline));
  hero.appendChild(title);
  sheet.appendChild(hero);

  const body = el('div', 'citypanel__body');
  sheet.appendChild(body);

  /* ---- intro + facts ---- */
  body.appendChild(el('p', 'citypanel__intro', city.intro));

  const facts = el('ul', 'citypanel__facts');
  facts.setAttribute('role', 'list');
  city.facts.forEach((f) => {
    const li = el('li');
    li.appendChild(el('span', 'citypanel__factval', f.value));
    li.appendChild(el('span', 'citypanel__factlabel', f.label));
    facts.appendChild(li);
  });
  body.appendChild(facts);

  /* ---- sections ---- */
  function section(kicker, html) {
    const s = el('section', 'citypanel__section');
    s.appendChild(el('p', 'citypanel__seckicker', kicker));
    s.appendChild(el('p', 'citypanel__sectext', html));
    return s;
  }
  body.appendChild(section('Life in ' + city.name, city.why));

  const work = section('Work & opportunity', city.work);
  const tags = el('div', 'citypanel__tags');
  city.sectors.forEach((s) => tags.appendChild(el('span', 'citypanel__tag', s)));
  work.appendChild(tags);
  body.appendChild(work);

  body.appendChild(section('Lifestyle', city.lifestyle));

  /* ---- migration angle callout ---- */
  const visa = el('aside', 'citypanel__visa');
  visa.appendChild(el('p', 'citypanel__seckicker', 'The migration angle'));
  visa.appendChild(el('p', 'citypanel__sectext', city.migration));
  body.appendChild(visa);

  /* ---- gallery ---- */
  const rest = city.images.slice(1);
  if (rest.length) {
    const gal = el('div', 'citypanel__gallery');
    rest.forEach((im) => {
      const fig = el('figure');
      fig.appendChild(safeImg(im.src, im.caption));
      fig.appendChild(el('figcaption', null, im.caption));
      gal.appendChild(fig);
    });
    body.appendChild(gal);
  }

  /* ---- CTA ---- */
  const cta = el('div', 'citypanel__cta');
  cta.appendChild(el('p', 'citypanel__ctaline',
    'Picture yourself in ' + city.name + '? We’ll help you get hired — and get there.'));
  const actions = el('div', 'citypanel__actions');
  const register = el('a', 'btn btn--light btn--puzzle', '<span>Register your interest</span>');
  register.href = 'https://quokkaroo.mmportal.cloud';
  register.target = '_blank';
  register.rel = 'noopener';
  const consult = el('a', 'btn btn--ghost', '<span>Book a consultation</span>');
  consult.href = 'mailto:migration@quokkaroo.com?subject=' +
    encodeURIComponent('Migration consultation — ' + city.name);
  actions.appendChild(register);
  actions.appendChild(consult);
  cta.appendChild(actions);
  body.appendChild(cta);

  body.appendChild(el('p', 'citypanel__fine',
    'Photography via Wikimedia Commons (see assets/img/cities/credits.json).'));
}

export function openCity(city) {
  if (!panel) buildShell();
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }  // cancel a pending close
  render(city);
  lastFocus = document.activeElement;
  panel.removeAttribute('hidden');
  // double rAF so the transition runs on first open
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-open')));
  document.documentElement.classList.add('citypanel-lock');
  panel.querySelector('.citypanel__close').focus();
}

export function closeCity() {
  if (!panel || panel.hasAttribute('hidden')) return;
  panel.classList.remove('is-open');
  document.documentElement.classList.remove('citypanel-lock');
  hideTimer = setTimeout(() => { panel.setAttribute('hidden', ''); hideTimer = null; }, 450);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
