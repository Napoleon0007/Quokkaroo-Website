// Quokkaroo — Australian skilled-migration points calculator.
// A stepped quiz over the official General Skilled Migration points test
// (subclasses 189 / 190 / 491). Pure client-side; mounts into #pointsCalc.
// It is an ESTIMATE — every screen and the result say so.

const THRESHOLD = 65;   // minimum to submit an EOI (invitations usually need more)

// Each question maps directly to a points line on the Department of Home Affairs
// table. Single-select unless `multi`. Points are the official values.
const QUESTIONS = [
  {
    key: 'age', kicker: 'Your age', q: 'How old are you?',
    help: 'Measured at the time you would be invited to apply.',
    options: [
      { label: '18–24', points: 25 },
      { label: '25–32', sub: 'the sweet spot', points: 30 },
      { label: '33–39', points: 25 },
      { label: '40–44', points: 15 },
      { label: '45 or over', sub: 'generally not eligible for points visas', points: 0 },
    ],
  },
  {
    key: 'english', kicker: 'English', q: 'What is your English level?',
    help: 'Via IELTS, PTE Academic, OET, TOEFL iBT or Cambridge.',
    options: [
      { label: 'Superior', sub: 'IELTS 8 / PTE 79 each band', points: 20 },
      { label: 'Proficient', sub: 'IELTS 7 / PTE 65 each band', points: 10 },
      { label: 'Competent', sub: 'IELTS 6 / PTE 50 — the minimum', points: 0 },
      { label: 'Below competent / not sure', sub: 'competent is required to qualify', points: 0 },
    ],
  },
  {
    key: 'overseasExp', kicker: 'Experience — overseas', q: 'Skilled work experience outside Australia?',
    help: 'In your nominated (or closely related) occupation, in the last 10 years.',
    options: [
      { label: 'Less than 3 years', points: 0 },
      { label: '3 to 5 years', points: 5 },
      { label: '5 to 8 years', points: 10 },
      { label: '8 years or more', points: 15 },
    ],
  },
  {
    key: 'ausExp', kicker: 'Experience — in Australia', q: 'Skilled work experience inside Australia?',
    help: 'In your nominated occupation, in the last 10 years. (Combined work points are capped at 20.)',
    options: [
      { label: 'None / under 1 year', points: 0 },
      { label: '1 to 3 years', points: 5 },
      { label: '3 to 5 years', points: 10 },
      { label: '5 to 8 years', points: 15 },
      { label: '8 years or more', points: 20 },
    ],
  },
  {
    key: 'qualification', kicker: 'Qualifications', q: 'Your highest qualification?',
    help: 'It must be recognised by the assessing authority for your occupation.',
    options: [
      { label: 'Doctorate (PhD)', points: 20 },
      { label: 'Bachelor or Master’s degree', points: 15 },
      { label: 'Diploma or trade qualification', points: 10 },
      { label: 'Recognised by my assessing authority', sub: 'award/qualification only', points: 10 },
      { label: 'None of these', points: 0 },
    ],
  },
  {
    key: 'ausStudy', kicker: 'Australian study', q: 'Did you study in Australia?',
    help: 'At least one degree, diploma or trade qualification from ~2 academic years of study in Australia.',
    options: [
      { label: 'Yes', sub: 'meets the Australian study requirement', points: 5 },
      { label: 'No', points: 0 },
    ],
  },
  {
    key: 'partner', kicker: 'Partner', q: 'Your partner situation?',
    help: 'Partner points depend on your partner’s skills, English and status.',
    options: [
      { label: 'Single / applying on my own', points: 10 },
      { label: 'Partner is an Australian citizen or PR', points: 10 },
      { label: 'Partner is skilled', sub: 'under 45, competent English, positive skills assessment', points: 10 },
      { label: 'Partner has competent English only', points: 5 },
      { label: 'Partner — none of the above', points: 0 },
    ],
  },
  {
    key: 'bonus', kicker: 'Bonus points', q: 'Any of these apply? (Choose all that fit)', multi: true,
    help: 'Each adds points on top of the rest.',
    options: [
      { label: 'NAATI community-language credential', points: 5 },
      { label: 'Professional Year in Australia', sub: 'completed in the last 4 years', points: 5 },
      { label: 'Studied in regional Australia', points: 5 },
      { label: 'STEM Master’s by research or PhD in Australia', points: 10 },
    ],
  },
];

const state = { step: 0, answers: {} };

let mount = null;

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function expPoints(a) {
  // skilled-employment points (Australian + overseas) are capped at 20 combined
  return Math.min(20, (a.overseasExp || 0) + (a.ausExp || 0));
}

function baseScore(a) {
  return (a.age || 0) + (a.english || 0) + expPoints(a) +
    (a.qualification || 0) + (a.ausStudy || 0) + (a.partner || 0) + (a.bonus || 0);
}

/* ---------------- quiz rendering ---------------- */

function renderProgress() {
  const wrap = el('div', 'pc__progress');
  const done = state.step / QUESTIONS.length;
  const bar = el('div', 'pc__progressbar');
  const fill = el('span');
  fill.style.transform = 'scaleX(' + done + ')';
  bar.appendChild(fill);
  wrap.appendChild(bar);
  wrap.appendChild(el('span', 'pc__progresslabel',
    'Question ' + (state.step + 1) + ' of ' + QUESTIONS.length));
  return wrap;
}

function renderQuestion() {
  const Q = QUESTIONS[state.step];
  mount.innerHTML = '';
  const card = el('div', 'pc__card');
  card.appendChild(renderProgress());

  card.appendChild(el('p', 'pc__kicker', Q.kicker));
  card.appendChild(el('h3', 'pc__q', Q.q));
  if (Q.help) card.appendChild(el('p', 'pc__help', Q.help));

  const opts = el('div', 'pc__opts');
  const current = Q.multi ? (state.answers[Q.key + '_set'] || []) : state.answers[Q.key + '_i'];

  Q.options.forEach((opt, i) => {
    const b = el('button', 'pc__opt');
    b.type = 'button';
    const picked = Q.multi ? current.includes(i) : current === i;
    if (picked) b.classList.add('is-on');
    b.innerHTML =
      '<span class="pc__optlabel">' + opt.label +
      (opt.sub ? '<small>' + opt.sub + '</small>' : '') + '</span>' +
      '<span class="pc__optpts">+' + opt.points + '</span>';
    b.addEventListener('click', () => pick(Q, i));
    opts.appendChild(b);
  });
  card.appendChild(opts);

  const nav = el('div', 'pc__nav');
  if (state.step > 0) {
    const back = el('button', 'pc__back', '&larr; Back');
    back.type = 'button';
    back.addEventListener('click', () => { state.step--; renderQuestion(); });
    nav.appendChild(back);
  } else {
    nav.appendChild(el('span'));
  }
  if (Q.multi) {
    const next = el('button', 'pc__next', 'See my score &rarr;');
    next.type = 'button';
    next.addEventListener('click', advance);
    nav.appendChild(next);
  } else {
    nav.appendChild(el('span', 'pc__hint', 'Pick one to continue'));
  }
  card.appendChild(nav);

  mount.appendChild(card);
}

function pick(Q, i) {
  if (Q.multi) {
    const setKey = Q.key + '_set';
    const set = state.answers[setKey] ? state.answers[setKey].slice() : [];
    const at = set.indexOf(i);
    if (at > -1) set.splice(at, 1); else set.push(i);
    state.answers[setKey] = set;
    state.answers[Q.key] = set.reduce((s, idx) => s + Q.options[idx].points, 0);
    renderQuestion();         // multi: stay, update; advance via the button
  } else {
    state.answers[Q.key + '_i'] = i;
    state.answers[Q.key] = Q.options[i].points;
    advance();
  }
}

function advance() {
  if (state.step < QUESTIONS.length - 1) {
    state.step++;
    renderQuestion();
  } else {
    renderResult();
  }
}

/* ---------------- result ---------------- */

function buildTips(a) {
  const tips = [];
  const engGap = 20 - (a.english || 0);
  if (engGap > 0) tips.push({ pts: engGap, text: 'Reach <strong>Superior English</strong> (IELTS 8 / PTE 79)' });

  const partnerIdx = a.partner_i;
  if (partnerIdx === 3) tips.push({ pts: 5, text: 'A <strong>skilled-partner</strong> skills assessment (up to +10)' });
  else if (partnerIdx === 4) tips.push({ pts: 10, text: '<strong>Partner skills</strong> — a skills assessment, or claim single-applicant points if applicable' });

  if (!a.ausStudy) tips.push({ pts: 5, text: 'Eligible <strong>Australian study</strong> (and +5 more if studied regionally)' });

  const bonusSet = a.bonus_set || [];
  if (!bonusSet.includes(0)) tips.push({ pts: 5, text: 'A <strong>NAATI</strong> community-language credential' });

  // regional nomination is almost always the biggest single lift
  tips.push({ pts: 15, text: 'A <strong>regional (491)</strong> nomination — often the fastest path' });

  return tips.sort((x, y) => y.pts - x.pts).slice(0, 3);
}

function pathwayRow(name, code, score, note) {
  const ok = score >= THRESHOLD;
  const row = el('div', 'pc__path' + (ok ? ' is-ok' : ''));
  row.innerHTML =
    '<span class="pc__pathname">' + name + ' <em>' + code + '</em></span>' +
    '<span class="pc__pathscore">' + score + '</span>' +
    '<span class="pc__pathtag">' + (ok ? 'meets the 65 minimum' : (THRESHOLD - score) + ' below minimum') + '</span>' +
    '<span class="pc__pathnote">' + note + '</span>';
  return row;
}

function renderResult() {
  const a = state.answers;
  const base = baseScore(a);
  mount.innerHTML = '';

  const card = el('div', 'pc__card pc__result');

  card.appendChild(el('p', 'pc__kicker', 'Your estimate'));

  const scoreWrap = el('div', 'pc__scorewrap');
  const big = el('div', 'pc__score', '0');
  scoreWrap.appendChild(big);
  scoreWrap.appendChild(el('span', 'pc__scoreunit', 'points'));
  card.appendChild(scoreWrap);

  // gauge vs the 65 threshold (capped visually at 100)
  const gauge = el('div', 'pc__gauge');
  const gfill = el('span');
  gauge.appendChild(gfill);
  const mark = el('i', 'pc__gaugemark');
  mark.style.left = Math.min(100, (THRESHOLD / 100) * 100) + '%';
  mark.setAttribute('data-label', '65 min');
  gauge.appendChild(mark);
  card.appendChild(gauge);

  // verdict
  let verdict;
  if (base >= 80) verdict = 'A <strong>strong score</strong> — competitive for many occupations. Your occupation’s cut-off and timing still decide the invitation.';
  else if (base >= THRESHOLD) verdict = 'You <strong>meet the 65-point minimum</strong> to submit an Expression of Interest. Invitations are competitive and often need more, depending on your occupation.';
  else verdict = 'You’re <strong>' + (THRESHOLD - base) + ' point' + (THRESHOLD - base === 1 ? '' : 's') + ' short</strong> of the 65 minimum right now — but there are clear ways to close the gap (below).';
  card.appendChild(el('p', 'pc__verdict', verdict));

  // pathways
  card.appendChild(el('p', 'pc__seclabel', 'Across the points-tested visas'));
  const paths = el('div', 'pc__paths');
  paths.appendChild(pathwayRow('Skilled Independent', '189', base, 'no sponsor — pure points'));
  paths.appendChild(pathwayRow('Skilled Nominated', '190', base + 5, 'state nomination adds +5'));
  paths.appendChild(pathwayRow('Skilled Work Regional', '491', base + 15, 'regional nomination adds +15'));
  card.appendChild(paths);

  // tips
  const tips = buildTips(a);
  if (tips.length) {
    card.appendChild(el('p', 'pc__seclabel', 'Your biggest opportunities to add points'));
    const ul = el('ul', 'pc__tips');
    tips.forEach((t) => {
      const li = el('li');
      li.innerHTML = '<span class="pc__tippts">+' + t.pts + '</span><span>' + t.text + '</span>';
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  // remember the score so the occupation checker can build the combined plan
  try { localStorage.setItem('qk_score', JSON.stringify({ base: base, when: Date.now() })); } catch (e) {}

  // "Your Quokkaroo plan" — if they've also run the occupation checker,
  // stitch both results into one takeaway card
  let occ = null;
  try { occ = JSON.parse(localStorage.getItem('qk_occ') || 'null'); } catch (e) {}
  if (occ && occ.n) {
    const route = base >= 80 ? 'Skilled Independent (189) / Nominated (190) — your score is competitive'
      : (base + 15 >= THRESHOLD ? 'Skilled Work Regional (491) — regional nomination lifts you to ' + (base + 15)
        : 'Employer-sponsored (482/186) — points aren’t the whole story');
    const plan = el('div', 'pc__plan');
    plan.innerHTML =
      '<p class="pc__seclabel">Your Quokkaroo plan</p>' +
      '<div class="pc__plangrid">' +
        '<div><i>Occupation</i><b>' + occ.n + '</b></div>' +
        '<div><i>Sector</i><b>' + occ.sec + '</b></div>' +
        '<div><i>Points estimate</i><b>' + base + '</b></div>' +
        '<div><i>Likeliest pathway</i><b>' + route + '</b></div>' +
      '</div>';
    const mail = el('a', 'pc__planmail', 'Email me this plan &rarr;');
    mail.href = 'mailto:?subject=' + encodeURIComponent('My Quokkaroo migration plan') +
      '&body=' + encodeURIComponent(
        'My Quokkaroo plan\n\nOccupation: ' + occ.n + '\nSector: ' + occ.sec +
        '\nPoints estimate: ' + base + '\nLikeliest pathway: ' + route.replace(/&[^;]+;/g, '') +
        '\n\nNext step: register at https://quokkaroo.mmportal.cloud or book a consult via migration@quokkaroo.com\n\n(Estimate only — confirmed in a Quokkaroo consultation.)');
    plan.appendChild(mail);
    card.appendChild(plan);
  } else {
    card.appendChild(el('p', 'pc__planhint',
      'Tip: run the <strong>occupation checker</strong> on the page too — together they build your full Quokkaroo plan.'));
  }

  // disclaimer + CTAs
  card.appendChild(el('p', 'pc__fine',
    'This is an estimate for guidance only, not migration advice. Your real score depends on your nominated occupation, a positive skills assessment and current government rules. Dr Chamonix Terblanche (MARN&nbsp;2318272) confirms the exact figure in your consultation.'));

  const cta = el('div', 'pc__cta');
  const reg = el('a', 'btn btn--light btn--puzzle', '<span>Register your interest</span>');
  reg.href = 'https://quokkaroo.mmportal.cloud';
  reg.target = '_blank'; reg.rel = 'noopener';
  const con = el('a', 'btn btn--ghost', '<span>Book a consultation</span>');
  con.href = 'mailto:migration@quokkaroo.com?subject=' +
    encodeURIComponent('Points assessment — my estimate is ' + base + ' points');
  cta.appendChild(reg);
  cta.appendChild(con);
  card.appendChild(cta);

  const restart = el('button', 'pc__restart', '&#8634; Start over');
  restart.type = 'button';
  restart.addEventListener('click', () => { state.step = 0; state.answers = {}; renderQuestion(); });
  card.appendChild(restart);

  mount.appendChild(card);

  // animate the score + gauge counting up
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    big.textContent = base;
    gfill.style.transform = 'scaleX(' + Math.min(1, base / 100) + ')';
  } else {
    const dur = 900;
    let t0 = null;
    const stepFn = (ts) => {
      if (!t0) t0 = ts;
      const k = Math.min(1, (ts - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      big.textContent = Math.round(base * eased);
      gfill.style.transform = 'scaleX(' + Math.min(1, (base * eased) / 100) + ')';
      if (k < 1) requestAnimationFrame(stepFn);
      else if (base >= THRESHOLD) celebrate(scoreWrap);
    };
    requestAnimationFrame(stepFn);
  }
}

// a brief, tasteful burst when the score clears the 65-point minimum
function celebrate(anchor) {
  const COLORS = ['#c96f2e', '#ffb37a', '#fff6ec', '#dda45f'];
  const r = anchor.getBoundingClientRect();
  for (let i = 0; i < 26; i++) {
    const bit = document.createElement('span');
    bit.className = 'pc-confetti';
    bit.style.background = COLORS[i % COLORS.length];
    bit.style.left = r.left + r.width / 2 + 'px';
    bit.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(bit);
    const ang = (i / 26) * Math.PI * 2 + (i % 3) * 0.3;
    const dist = 90 + (i % 5) * 36;
    bit.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: 'translate(' + (Math.cos(ang) * dist - 50) + '%, ' +
        (Math.sin(ang) * dist * 0.8 + 110) + '%) rotate(' + (300 + i * 25) + 'deg)', opacity: 0 },
    ], { duration: 950 + (i % 4) * 180, easing: 'cubic-bezier(0.16, 0.8, 0.4, 1)' })
      .onfinish = () => bit.remove();
  }
}

/* ---------------- boot: circular launcher + modal popup ---------------- */
// The inline "points" section was removed — the calculator now lives in a modal
// opened by the round green-tick launcher (and by any "Check your points" link).

let modal = null, built = false, lastFocus = null;

function buildModal() {
  modal = document.createElement('div');
  modal.className = 'pc-modal';
  modal.hidden = true;
  modal.innerHTML =
    '<div class="pc-modal__scrim"></div>' +
    '<div class="pc-modal__sheet" role="dialog" aria-modal="true" aria-label="Check your migration points">' +
      '<button type="button" class="pc-modal__close" aria-label="Close">&times;</button>' +
      '<div class="pc-modal__body" id="pointsCalc"></div>' +
    '</div>';
  document.body.appendChild(modal);
  mount = modal.querySelector('#pointsCalc');
  modal.querySelector('.pc-modal__scrim').addEventListener('click', closeModal);
  modal.querySelector('.pc-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });
}

function openModal() {
  if (!modal) buildModal();
  if (!built) { built = true; renderQuestion(); }
  lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
  document.documentElement.classList.add('pc-lock');
  modal.querySelector('.pc-modal__close').focus();
}

function closeModal() {
  if (!modal || modal.hidden) return;
  modal.classList.remove('is-open');
  document.documentElement.classList.remove('pc-lock');
  setTimeout(() => { modal.hidden = true; }, 360);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

// circular green-tick launcher — sits above the QuokkaBot launcher, bottom-right
function buildFab() {
  if (document.querySelector('.pc-fab')) return;
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'pc-fab';
  fab.setAttribute('aria-label', 'Check your points for Australia');
  fab.innerHTML =
    '<span class="pc-fab__label">Check your points for Australia</span>' +
    '<span class="pc-fab__circle">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M5 12.5l4.2 4.4L19 7"/></svg>' +
    '</span>';
  fab.addEventListener('click', openModal);
  document.body.appendChild(fab);
}

function boot() {
  buildFab();
  // any "Check your points" link anywhere on the page opens the popup
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a[href="#points"]');
    if (t) { e.preventDefault(); openModal(); }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
