// Quokkaroo — "Check your occupation", flagship edition.
// A demand ticker, a 3D deck of Australia's most-wanted occupations, popular
// chips, and photo-dossier results: each verdict arrives as an image card with
// a rubber-stamp verdict and a demand meter. Pure client-side.
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // status: 'core' = on the national skilled lists (strong pathway)
  //         'special' = DAMA / industry labour agreement / state streams
  //         'limited' = not generally listed — needs a tailored strategy
  // demand: 'severe' | 'high' | 'steady' (indicative shortage level)
  // img: assets/img/occupations/<img>.jpg (falls back to the sector photo)
  var OCCS = [
    // --- Health & Hospitals ---
    { n: 'Registered Nurse', img: 'nurse', demand: 'severe', s: ['nurse', 'rn', 'icu nurse', 'theatre nurse', 'mental health nurse', 'maternity nurse', 'midwife', 'nurse practitioner', 'aged care nurse'], sec: 'Health & Hospitals', st: 'core', note: 'Every RN specialty is in national shortage — one of the strongest pathways there is.' },
    { n: 'General Practitioner', img: 'doctor', demand: 'severe', s: ['gp', 'doctor', 'medical practitioner', 'physician'], sec: 'Health & Hospitals', st: 'core', note: 'Doctors are prioritised nationally, with extra incentives outside the big cities.' },
    { n: 'Psychiatrist', img: 'doctor', demand: 'severe', s: ['psychiatry'], sec: 'Health & Hospitals', st: 'core', note: 'Acute shortage — hospitals sponsor readily.' },
    { n: 'Surgeon', img: 'doctor', demand: 'high', s: ['orthopaedic surgeon', 'general surgeon'], sec: 'Health & Hospitals', st: 'core', note: 'Specialists are in demand across the public and private systems.' },
    { n: 'Anaesthetist', img: 'doctor', demand: 'high', s: ['anesthetist'], sec: 'Health & Hospitals', st: 'core', note: 'Listed and recruited nationally.' },
    { n: 'Hospital Manager', img: 'nurse', demand: 'high', s: ['health manager', 'nursing unit manager', 'num', 'anum', 'health administrator'], sec: 'Health & Hospitals', st: 'core', note: 'Health and welfare services managers are on the skilled lists.' },
    { n: 'Medical Radiation Therapist', img: 'scientist', demand: 'high', s: ['radiographer', 'sonographer', 'medical imaging'], sec: 'Health & Hospitals', st: 'core', note: 'Imaging professionals are listed and short-staffed.' },
    { n: 'Pharmacist', img: 'scientist', demand: 'high', s: ['hospital pharmacist', 'retail pharmacist'], sec: 'Health & Hospitals', st: 'core', note: 'Listed — hospital and community roles both recruit.' },
    { n: 'Dentist', img: 'doctor', demand: 'high', s: ['dental'], sec: 'Health & Hospitals', st: 'core', note: 'Listed, with strong regional demand.' },
    { n: 'Paramedic', img: 'nurse', demand: 'high', s: ['ambulance'], sec: 'Health & Hospitals', st: 'core', note: 'State ambulance services run international intakes.' },

    // --- Aged & Disability Care ---
    { n: 'Aged or Disabled Carer', img: 'carer', demand: 'severe', s: ['carer', 'aged care worker', 'care worker', 'disability support worker', 'support worker', 'personal care assistant', 'pca', 'caregiver'], sec: 'Aged & Disability Care', st: 'special', note: 'Carers move through the Aged Care Industry Labour Agreement and DAMAs rather than the standard lists — a real pathway, with employer sponsorship. Cert III/IV helps.' },
    { n: 'Enrolled Nurse', img: 'nurse', demand: 'severe', s: ['en'], sec: 'Aged & Disability Care', st: 'core', note: 'Listed — aged-care facilities recruit constantly.' },
    { n: 'Welfare Worker', img: 'carer', demand: 'high', s: ['community worker', 'social worker', 'youth worker'], sec: 'Aged & Disability Care', st: 'core', note: 'Social and welfare professionals are on the lists.' },

    // --- Veterinary ---
    { n: 'Veterinarian', img: 'vet', demand: 'severe', s: ['vet', 'veterinary surgeon'], sec: 'Veterinary', st: 'core', note: 'National shortage — rural and mixed practices sponsor readily.' },
    { n: 'Veterinary Nurse', img: 'vet', demand: 'high', s: ['vet nurse', 'veterinary technician'], sec: 'Veterinary', st: 'core', note: 'On the expanded skilled list — demand across companion and rural practice.' },

    // --- Mining & Resources ---
    { n: 'Mining Engineer', img: 'engineer', demand: 'high', s: ['mine engineer'], sec: 'Mining & Resources', st: 'core', note: 'Listed — WA and QLD projects recruit internationally.' },
    { n: 'Geologist', img: 'scientist', demand: 'high', s: ['geophysicist', 'geoscientist'], sec: 'Mining & Resources', st: 'core', note: 'Listed and in demand on exploration and production sites.' },
    { n: 'Diesel Motor Mechanic', img: 'mechanic', demand: 'severe', s: ['diesel mechanic', 'heavy vehicle mechanic', 'plant mechanic'], sec: 'Mining & Resources', st: 'core', note: 'Chronic shortage — mine fleets compete for qualified mechanics.' },
    { n: 'Electrician', img: 'electrician', demand: 'severe', s: ['sparky', 'electrical tradesperson'], sec: 'Mining & Resources', st: 'core', note: 'Listed — licensing transfers are part of the journey; demand is everywhere.' },
    { n: 'Fitter', img: 'mechanic', demand: 'high', s: ['fitter and turner', 'mechanical fitter'], sec: 'Mining & Resources', st: 'core', note: 'Metal trades are listed and heavily recruited.' },
    { n: 'Land Surveyor', img: 'engineer', demand: 'high', s: ['surveyor'], sec: 'Mining & Resources', st: 'core', note: 'Listed — mining and construction both bid for surveyors.' },
    { n: 'Health & Safety Advisor', img: 'engineer', demand: 'high', s: ['hse advisor', 'ohs', 'whs', 'safety officer'], sec: 'Mining & Resources', st: 'core', note: 'OHS professionals are on the skilled lists.' },
    { n: 'Metallurgist', img: 'scientist', demand: 'steady', s: [], sec: 'Mining & Resources', st: 'core', note: 'Listed — processing plants recruit internationally.' },
    { n: 'Boilermaker / Welder', img: 'mechanic', demand: 'severe', s: ['welder', 'boilermaker', 'fabricator'], sec: 'Mining & Resources', st: 'core', note: 'Fabrication trades are listed with strong FIFO demand.' },
    { n: 'Truck Driver', img: 'mechanic', demand: 'high', s: ['hgv driver', 'haul truck operator', 'lorry driver'], sec: 'Mining & Resources', st: 'special', note: 'Not on the national lists — but several regional DAMAs cover drivers. Needs the right employer and region.' },

    // --- ICT ---
    { n: 'Software Engineer', img: 'developer', demand: 'high', s: ['software developer', 'developer', 'programmer', 'full stack developer', 'backend developer', 'frontend developer', 'web developer'], sec: 'ICT', st: 'core', note: 'Australia’s most in-demand ICT occupation, listed nationally.' },
    { n: 'Cyber Security Specialist', img: 'developer', demand: 'severe', s: ['cyber security', 'security analyst', 'penetration tester', 'security engineer'], sec: 'ICT', st: 'core', note: 'Cyber roles were added to the lists — demand is intense, especially in Canberra.' },
    { n: 'ICT Business Analyst', img: 'developer', demand: 'high', s: ['business analyst', 'ba'], sec: 'ICT', st: 'core', note: 'Listed — a well-worn pathway with points-tested and sponsored options.' },
    { n: 'DevOps Engineer', img: 'developer', demand: 'high', s: ['devops', 'site reliability engineer', 'sre', 'cloud engineer'], sec: 'ICT', st: 'core', note: 'Listed under the expanded ICT occupations.' },
    { n: 'Data Scientist', img: 'scientist', demand: 'high', s: ['data analyst', 'data engineer', 'machine learning engineer', 'ai engineer'], sec: 'ICT', st: 'core', note: 'Data roles are listed and recruited across every capital.' },
    { n: 'Network Engineer', img: 'developer', demand: 'steady', s: ['network administrator', 'network analyst'], sec: 'ICT', st: 'core', note: 'Listed — infrastructure demand keeps growing.' },
    { n: 'Systems Administrator', img: 'developer', demand: 'steady', s: ['sysadmin', 'it support engineer', 'ict support'], sec: 'ICT', st: 'core', note: 'Listed — support and infrastructure roles in every state.' },
    { n: 'ICT Project Manager', img: 'developer', demand: 'high', s: ['it project manager', 'delivery manager', 'scrum master'], sec: 'ICT', st: 'core', note: 'Listed — experience plus certifications travel well.' },

    // --- Allied Health ---
    { n: 'Physiotherapist', img: 'physio', demand: 'high', s: ['physio'], sec: 'Allied Health', st: 'core', note: 'Listed — hospitals, sport and private practice all recruit.' },
    { n: 'Occupational Therapist', img: 'physio', demand: 'severe', s: ['ot'], sec: 'Allied Health', st: 'core', note: 'Listed — the NDIS has multiplied demand.' },
    { n: 'Psychologist', img: 'carer', demand: 'severe', s: ['clinical psychologist', 'counsellor'], sec: 'Allied Health', st: 'core', note: 'Listed — mental-health demand far outstrips supply.' },
    { n: 'Speech Pathologist', img: 'physio', demand: 'high', s: ['speech therapist'], sec: 'Allied Health', st: 'core', note: 'Listed, with long waitlists nationwide.' },
    { n: 'Podiatrist', img: 'physio', demand: 'steady', s: [], sec: 'Allied Health', st: 'core', note: 'Listed — steady demand, especially regionally.' },
    { n: 'Optometrist', img: 'doctor', demand: 'steady', s: [], sec: 'Allied Health', st: 'core', note: 'Listed and recruited nationally.' },
    { n: 'Dietitian', img: 'scientist', demand: 'steady', s: ['nutritionist'], sec: 'Allied Health', st: 'core', note: 'Listed — clinical and aged-care settings recruit.' },

    // --- FMCG / business / other ---
    { n: 'Production Manager (Manufacturing)', img: 'engineer', demand: 'high', s: ['production manager', 'manufacturing manager', 'operations manager fmcg'], sec: 'FMCG', st: 'core', note: 'Manufacturing leadership is listed — FMCG plants sponsor.' },
    { n: 'Supply Chain / Logistics Manager', img: 'engineer', demand: 'steady', s: ['supply chain', 'logistics manager', 'warehouse manager'], sec: 'FMCG', st: 'special', note: 'Pathways vary by role and state — often via nomination or sponsorship. Worth a strategy chat.' },
    { n: 'Food Technologist', img: 'scientist', demand: 'steady', s: ['food scientist'], sec: 'FMCG', st: 'core', note: 'Listed — quality and product development roles recruit.' },
    { n: 'Chef', img: 'chef', demand: 'severe', s: ['cook', 'head chef', 'sous chef'], sec: 'FMCG', st: 'core', note: 'Chefs are listed — hospitality shortage is national.' },
    { n: 'Accountant', img: 'developer', demand: 'steady', s: ['chartered accountant', 'auditor', 'finance manager'], sec: 'FMCG', st: 'core', note: 'Listed — points competition is real, but the pathway is well-trodden.' },
    { n: 'Civil Engineer', img: 'engineer', demand: 'severe', s: ['structural engineer'], sec: 'Mining & Resources', st: 'core', note: 'All major engineering disciplines are listed — infrastructure boom demand.' },
    { n: 'Mechanical Engineer', img: 'engineer', demand: 'high', s: [], sec: 'Mining & Resources', st: 'core', note: 'Listed — mining, manufacturing and energy all recruit.' },
    { n: 'Electrical Engineer', img: 'engineer', demand: 'high', s: ['power engineer'], sec: 'Mining & Resources', st: 'core', note: 'Listed — the energy transition is hungry for them.' },
    { n: 'Secondary School Teacher', img: 'teacher', demand: 'severe', s: ['teacher', 'high school teacher', 'maths teacher', 'science teacher'], sec: 'Other', st: 'core', note: 'Teachers (especially STEM) are listed and actively recruited by states.' },
    { n: 'Early Childhood Teacher', img: 'teacher', demand: 'severe', s: ['preschool teacher', 'kindergarten teacher', 'ece'], sec: 'Other', st: 'core', note: 'Listed — one of the fastest-moving teaching pathways.' },
    { n: 'Carpenter', img: 'engineer', demand: 'severe', s: ['joiner', 'cabinetmaker', 'chippy'], sec: 'Other', st: 'core', note: 'Construction trades are listed — the housing push needs them.' },
    { n: 'Plumber', img: 'electrician', demand: 'severe', s: ['gasfitter', 'drainer'], sec: 'Other', st: 'core', note: 'Listed — licensing is state-based; demand is everywhere.' },
    { n: 'Motor Mechanic', img: 'mechanic', demand: 'high', s: ['automotive technician', 'auto electrician', 'mechanic'], sec: 'Other', st: 'core', note: 'Listed — workshops sponsor across the country.' },
    { n: 'Bricklayer', img: 'engineer', demand: 'high', s: ['blocklayer'], sec: 'Other', st: 'core', note: 'Listed construction trade.' },
    { n: 'Hairdresser', img: 'chef', demand: 'steady', s: ['barber'], sec: 'Other', st: 'special', note: 'On some lists and DAMAs — region and employer matter. Worth a strategy chat.' },
    { n: 'Café or Restaurant Manager', img: 'chef', demand: 'high', s: ['restaurant manager', 'hospitality manager', 'hotel manager'], sec: 'Other', st: 'special', note: 'Hospitality management moves via sponsorship and regional streams.' },
    { n: 'Marketing Specialist', img: 'developer', demand: 'steady', s: ['marketing manager', 'digital marketer'], sec: 'Other', st: 'special', note: 'Limited general listing — usually needs sponsorship plus the right state stream.' },
    { n: 'Human Resources', img: 'developer', demand: 'steady', s: ['hr manager', 'recruiter', 'hr advisor'], sec: 'Other', st: 'limited', note: 'Rarely listed — pathways exist but need a tailored strategy.' },
    { n: 'Sales Representative', img: 'developer', demand: 'steady', s: ['sales manager', 'account manager'], sec: 'Other', st: 'limited', note: 'Generally not listed — but adjacent listed roles often fit. Bring your CV to a consult.' },
    { n: 'Admin / Office Manager', img: 'developer', demand: 'steady', s: ['administrator', 'receptionist', 'office manager', 'personal assistant'], sec: 'Other', st: 'limited', note: 'Not on the skilled lists — partner skills, study or adjacent roles may open a door.' },
  ];

  var SECTOR_IMG = {
    'Health & Hospitals': 'assets/img/sectors/health.jpg',
    'Aged & Disability Care': 'assets/img/sectors/aged-care.jpg',
    'Veterinary': 'assets/img/sectors/vet.jpg',
    'Mining & Resources': 'assets/img/sectors/mining.jpg',
    'ICT': 'assets/img/sectors/ict.jpg',
    'Allied Health': 'assets/img/sectors/allied.jpg',
    'FMCG': 'assets/img/jobs-photo-1.jpg',
    'Other': 'assets/img/jobs-photo-2.jpg',
  };
  function occImg(o) {
    return o.img ? 'assets/img/occupations/' + o.img + '.jpg' : SECTOR_IMG[o.sec];
  }

  var STATUS = {
    core: { label: 'In demand — on the skilled lists', stamp: 'IN DEMAND', cls: 'is-core' },
    special: { label: 'Special pathway — DAMA / sponsorship', stamp: 'SPECIAL PATHWAY', cls: 'is-special' },
    limited: { label: 'Needs a tailored strategy', stamp: 'TALK TO US', cls: 'is-limited' },
  };
  var DEMAND = { severe: ['Severe shortage', 0.95], high: ['High demand', 0.74], steady: ['Steady demand', 0.52] };

  var TICKER = [
    ['Registered nurses', 'severe'], ['Electricians', 'severe'], ['Aged-care workers', 'severe'],
    ['Software engineers', 'high'], ['Veterinarians', 'severe'], ['Civil engineers', 'severe'],
    ['Chefs', 'severe'], ['Diesel mechanics', 'severe'], ['Teachers', 'severe'],
    ['Physiotherapists', 'high'], ['Psychologists', 'severe'], ['Plumbers', 'severe'],
    ['Cyber security specialists', 'severe'], ['Carpenters', 'severe'],
  ];

  var DECK = ['Registered Nurse', 'Software Engineer', 'Electrician', 'Aged or Disabled Carer',
    'Veterinarian', 'General Practitioner', 'Physiotherapist', 'Chef', 'Civil Engineer', 'Diesel Motor Mechanic'];

  var CHIPS = ['Nurse', 'Electrician', 'Software developer', 'Chef', 'Teacher', 'Vet', 'Physio', 'Accountant'];

  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function search(q) {
    q = norm(q);
    if (q.length < 2) return null;
    var best = null, bestScore = 0;
    for (var i = 0; i < OCCS.length; i++) {
      var o = OCCS[i];
      var names = [o.n].concat(o.s);
      for (var j = 0; j < names.length; j++) {
        var cand = norm(names[j]);
        var score = 0;
        if (cand === q) score = 100;
        // short codes ("rn", "gp", "ot") only ever match exactly — substring
        // matching on them produces nonsense hits
        else if (cand.length >= 4 && (cand.indexOf(q) === 0 || q.indexOf(cand) === 0)) score = 80;
        else if (cand.length >= 4 && q.length >= 4 &&
                 (cand.indexOf(q) > -1 || q.indexOf(cand) > -1)) score = 60;
        else {
          var qw = q.split(' '), cw = cand.split(' '), hit = 0;
          for (var k = 0; k < qw.length; k++) if (qw[k].length > 3 && cw.indexOf(qw[k]) > -1) hit++;
          if (hit) score = 30 + hit * 12;
        }
        if (score > bestScore) { bestScore = score; best = o; }
      }
    }
    return bestScore >= 42 ? best : null;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  /* ---------- demand ticker ---------- */
  function buildTicker() {
    var mountT = document.getElementById('occTicker');
    if (!mountT) return;
    var items = TICKER.map(function (t) {
      return '<span class="occx__tick ' + (t[1] === 'severe' ? 'is-severe' : '') + '">' +
        t[0] + ' <b>&#9656; ' + (t[1] === 'severe' ? 'severe shortage' : 'high demand') + '</b></span>';
    }).join('<span class="occx__tickdot">&bull;</span>');
    mountT.innerHTML =
      '<span class="occx__ticklabel">Australia needs</span>' +
      '<div class="occx__tickwin"><div class="occx__tickrun">' + items +
      '<span class="occx__tickdot">&bull;</span>' + items + '</div></div>';
  }

  /* ---------- 3D most-wanted deck ---------- */
  function buildDeck(runSearch) {
    var mountD = document.getElementById('occDeck');
    if (!mountD) return;
    var row = el('div', 'occx__deckrow');
    DECK.forEach(function (name, i) {
      var o = OCCS.find(function (x) { return x.n === name; });
      if (!o) return;
      var card = el('button', 'occx__card');
      card.type = 'button';
      card.style.setProperty('--i', i - (DECK.length - 1) / 2);
      var d = DEMAND[o.demand] || DEMAND.high;
      card.innerHTML =
        '<img src="' + occImg(o) + '" alt="" loading="lazy" onerror="this.src=\'' + SECTOR_IMG[o.sec] + '\'">' +
        '<span class="occx__cardshade"></span>' +
        '<span class="occx__cardbadge ' + (o.demand === 'severe' ? 'is-severe' : '') + '">' + d[0] + '</span>' +
        '<span class="occx__cardname">' + o.n + '</span>';
      card.setAttribute('aria-label', 'Check ' + o.n);
      card.addEventListener('click', function () { runSearch(o.n); });
      row.appendChild(card);
    });
    mountD.innerHTML = '<p class="occx__decklead">Most wanted right now &mdash; tap a card</p>';
    mountD.appendChild(row);
  }

  /* ---------- result ---------- */
  function renderResult(result, hit, rawQ) {
    if (!hit) {
      result.className = 'occ__result is-on is-miss';
      result.innerHTML =
        '<div class="occx__body">' +
        '<span class="occ__badge">Not finding it</span>' +
        '<h3>&ldquo;' + rawQ.replace(/[<>&]/g, '') + '&rdquo;</h3>' +
        '<p>No direct match in our quick list — but that does <strong>not</strong> mean there&rsquo;s no pathway. Hundreds of occupations qualify, plus DAMAs and state streams this checker can&rsquo;t see.</p>' +
        '<div class="occ__cta">' +
          '<a class="btn btn--dark" href="mailto:migration@quokkaroo.com?subject=' + encodeURIComponent('Occupation check — ' + rawQ) + '"><span>Ask us directly</span></a>' +
        '</div></div>';
      return;
    }

    try { localStorage.setItem('qk_occ', JSON.stringify({ n: hit.n, sec: hit.sec, st: hit.st, when: Date.now() })); } catch (e) {}
    var score = null;
    try { score = JSON.parse(localStorage.getItem('qk_score') || 'null'); } catch (e) {}
    var planLine = score && typeof score.base === 'number'
      ? '<p class="occ__plan">Paired with your points estimate of <strong>' + score.base +
        '</strong> — open the points calculator to see your combined Quokkaroo plan.</p>'
      : '';

    var st = STATUS[hit.st];
    var d = DEMAND[hit.demand] || DEMAND.high;
    result.className = 'occ__result is-on ' + st.cls;
    result.innerHTML =
      '<div class="occx__hero">' +
        '<img src="' + occImg(hit) + '" alt="" onerror="this.src=\'' + SECTOR_IMG[hit.sec] + '\'">' +
        '<span class="occx__heroshade"></span>' +
        '<span class="occx__stamp">' + st.stamp + '</span>' +
        '<div class="occx__herotext"><p class="occ__sector">' + hit.sec + '</p><h3>' + hit.n + '</h3></div>' +
      '</div>' +
      '<div class="occx__body">' +
        '<span class="occ__badge">' + st.label + '</span>' +
        '<div class="occx__meter"><i>Demand level</i>' +
          '<div class="occx__meterbar"><span style="--d:' + d[1] + '"></span></div><b>' + d[0] + '</b></div>' +
        '<p>' + hit.note + '</p>' +
        '<div class="occ__cta">' +
          '<a class="btn btn--dark js-open-points" href="#points"><span>Check your points</span></a>' +
          '<a class="btn btn--outline2" href="https://quokkaroo.mmportal.cloud" target="_blank" rel="noopener"><span>Register your interest</span></a>' +
        '</div>' +
        planLine +
        '<p class="occ__fine">Indicative only — the occupation lists change. Your consult confirms your exact pathway.</p>' +
      '</div>';
  }

  /* ---------- boot ---------- */
  function boot() {
    var mount = document.getElementById('occCheck');
    if (!mount) return;
    mount.innerHTML =
      '<div class="occ__bar">' +
        '<input type="text" id="occInput" placeholder="Try “nurse”, “electrician”, “software developer”…" aria-label="Your occupation">' +
        '<button type="button" id="occBtn">Check</button>' +
      '</div>' +
      '<div class="occx__chips" aria-label="Popular occupations">' +
        CHIPS.map(function (c) { return '<button type="button" class="occx__chip">' + c + '</button>'; }).join('') +
      '</div>' +
      '<div class="occ__result" id="occResult" aria-live="polite"></div>';

    var input = document.getElementById('occInput');
    var result = document.getElementById('occResult');

    function show() {
      var q = input.value;
      if (norm(q).length < 2) { result.innerHTML = ''; result.className = 'occ__result'; return; }
      renderResult(result, search(q), q);
      if (!reduced) {
        var stamp = result.querySelector('.occx__stamp');
        if (stamp) stamp.classList.add('is-in');
      } else {
        var s2 = result.querySelector('.occx__stamp');
        if (s2) { s2.classList.add('is-in'); s2.style.animation = 'none'; }
      }
    }
    function runSearch(text) {
      input.value = text;
      show();
      result.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    }

    var t;
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(show, 250); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') show(); });
    document.getElementById('occBtn').addEventListener('click', show);
    mount.querySelectorAll('.occx__chip').forEach(function (chip) {
      chip.addEventListener('click', function () { runSearch(chip.textContent); });
    });

    buildTicker();
    buildDeck(runSearch);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
