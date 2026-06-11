// Quokkaroo — "Is my occupation in demand?" checker.
// Type a job title → instant verdict: on Australia's skilled lists, a special
// pathway (DAMA / labour agreement / state nomination), or talk-to-us.
// Indicative only — the lists shift; the consult confirms. Mounts into #occCheck.
(function () {
  'use strict';

  // status: 'core' = on the national skilled lists (strong pathway)
  //         'special' = DAMA / industry labour agreement / state streams
  //         'limited' = not generally listed — needs a tailored strategy
  var OCCS = [
    // --- Health & Hospitals ---
    { n: 'Registered Nurse', s: ['nurse', 'rn', 'icu nurse', 'theatre nurse', 'mental health nurse', 'maternity nurse', 'midwife', 'nurse practitioner', 'aged care nurse'], sec: 'Health & Hospitals', st: 'core', note: 'Every RN specialty is in national shortage — one of the strongest pathways there is.' },
    { n: 'General Practitioner', s: ['gp', 'doctor', 'medical practitioner', 'physician'], sec: 'Health & Hospitals', st: 'core', note: 'Doctors are prioritised nationally, with extra incentives outside the big cities.' },
    { n: 'Psychiatrist', s: ['psychiatry'], sec: 'Health & Hospitals', st: 'core', note: 'Acute shortage — hospitals sponsor readily.' },
    { n: 'Surgeon', s: ['orthopaedic surgeon', 'general surgeon'], sec: 'Health & Hospitals', st: 'core', note: 'Specialists are in demand across the public and private systems.' },
    { n: 'Anaesthetist', s: ['anesthetist'], sec: 'Health & Hospitals', st: 'core', note: 'Listed and recruited nationally.' },
    { n: 'Hospital Manager', s: ['health manager', 'nursing unit manager', 'num', 'anum', 'health administrator'], sec: 'Health & Hospitals', st: 'core', note: 'Health and welfare services managers are on the skilled lists.' },
    { n: 'Medical Radiation Therapist', s: ['radiographer', 'sonographer', 'medical imaging'], sec: 'Health & Hospitals', st: 'core', note: 'Imaging professionals are listed and short-staffed.' },
    { n: 'Pharmacist', s: ['hospital pharmacist', 'retail pharmacist'], sec: 'Health & Hospitals', st: 'core', note: 'Listed — hospital and community roles both recruit.' },
    { n: 'Dentist', s: ['dental'], sec: 'Health & Hospitals', st: 'core', note: 'Listed, with strong regional demand.' },
    { n: 'Paramedic', s: ['ambulance'], sec: 'Health & Hospitals', st: 'core', note: 'State ambulance services run international intakes.' },

    // --- Aged & Disability Care ---
    { n: 'Aged or Disabled Carer', s: ['carer', 'aged care worker', 'care worker', 'disability support worker', 'support worker', 'personal care assistant', 'pca', 'caregiver'], sec: 'Aged & Disability Care', st: 'special', note: 'Carers move through the Aged Care Industry Labour Agreement and DAMAs rather than the standard lists — a real pathway, with employer sponsorship. Cert III/IV helps.' },
    { n: 'Enrolled Nurse', s: ['en'], sec: 'Aged & Disability Care', st: 'core', note: 'Listed — aged-care facilities recruit constantly.' },
    { n: 'Welfare Worker', s: ['community worker', 'social worker', 'youth worker'], sec: 'Aged & Disability Care', st: 'core', note: 'Social and welfare professionals are on the lists.' },

    // --- Veterinary ---
    { n: 'Veterinarian', s: ['vet', 'veterinary surgeon'], sec: 'Veterinary', st: 'core', note: 'National shortage — rural and mixed practices sponsor readily.' },
    { n: 'Veterinary Nurse', s: ['vet nurse', 'veterinary technician'], sec: 'Veterinary', st: 'core', note: 'On the expanded skilled list — demand across companion and rural practice.' },

    // --- Mining & Resources ---
    { n: 'Mining Engineer', s: ['mine engineer'], sec: 'Mining & Resources', st: 'core', note: 'Listed — WA and QLD projects recruit internationally.' },
    { n: 'Geologist', s: ['geophysicist', 'geoscientist'], sec: 'Mining & Resources', st: 'core', note: 'Listed and in demand on exploration and production sites.' },
    { n: 'Diesel Motor Mechanic', s: ['diesel mechanic', 'heavy vehicle mechanic', 'plant mechanic'], sec: 'Mining & Resources', st: 'core', note: 'Chronic shortage — mine fleets compete for qualified mechanics.' },
    { n: 'Electrician', s: ['sparky', 'electrical tradesperson'], sec: 'Mining & Resources', st: 'core', note: 'Listed — licensing transfers are part of the journey; demand is everywhere.' },
    { n: 'Fitter', s: ['fitter and turner', 'mechanical fitter'], sec: 'Mining & Resources', st: 'core', note: 'Metal trades are listed and heavily recruited.' },
    { n: 'Land Surveyor', s: ['surveyor'], sec: 'Mining & Resources', st: 'core', note: 'Listed — mining and construction both bid for surveyors.' },
    { n: 'Health & Safety Advisor', s: ['hse advisor', 'ohs', 'whs', 'safety officer'], sec: 'Mining & Resources', st: 'core', note: 'OHS professionals are on the skilled lists.' },
    { n: 'Metallurgist', s: [], sec: 'Mining & Resources', st: 'core', note: 'Listed — processing plants recruit internationally.' },
    { n: 'Boilermaker / Welder', s: ['welder', 'boilermaker', 'fabricator'], sec: 'Mining & Resources', st: 'core', note: 'Fabrication trades are listed with strong FIFO demand.' },
    { n: 'Truck Driver', s: ['hgv driver', 'haul truck operator', 'lorry driver'], sec: 'Mining & Resources', st: 'special', note: 'Not on the national lists — but several regional DAMAs cover drivers. Needs the right employer and region.' },

    // --- ICT ---
    { n: 'Software Engineer', s: ['software developer', 'developer', 'programmer', 'full stack developer', 'backend developer', 'frontend developer', 'web developer'], sec: 'ICT', st: 'core', note: 'Australia’s most in-demand ICT occupation, listed nationally.' },
    { n: 'Cyber Security Specialist', s: ['cyber security', 'security analyst', 'penetration tester', 'security engineer'], sec: 'ICT', st: 'core', note: 'Cyber roles were added to the lists — demand is intense, especially in Canberra.' },
    { n: 'ICT Business Analyst', s: ['business analyst', 'ba'], sec: 'ICT', st: 'core', note: 'Listed — a well-worn pathway with points-tested and sponsored options.' },
    { n: 'DevOps Engineer', s: ['devops', 'site reliability engineer', 'sre', 'cloud engineer'], sec: 'ICT', st: 'core', note: 'Listed under the expanded ICT occupations.' },
    { n: 'Data Scientist', s: ['data analyst', 'data engineer', 'machine learning engineer', 'ai engineer'], sec: 'ICT', st: 'core', note: 'Data roles are listed and recruited across every capital.' },
    { n: 'Network Engineer', s: ['network administrator', 'network analyst'], sec: 'ICT', st: 'core', note: 'Listed — infrastructure demand keeps growing.' },
    { n: 'Systems Administrator', s: ['sysadmin', 'it support engineer', 'ict support'], sec: 'ICT', st: 'core', note: 'Listed — support and infrastructure roles in every state.' },
    { n: 'ICT Project Manager', s: ['it project manager', 'delivery manager', 'scrum master'], sec: 'ICT', st: 'core', note: 'Listed — experience plus certifications travel well.' },

    // --- Allied Health ---
    { n: 'Physiotherapist', s: ['physio'], sec: 'Allied Health', st: 'core', note: 'Listed — hospitals, sport and private practice all recruit.' },
    { n: 'Occupational Therapist', s: ['ot'], sec: 'Allied Health', st: 'core', note: 'Listed — the NDIS has multiplied demand.' },
    { n: 'Psychologist', s: ['clinical psychologist', 'counsellor'], sec: 'Allied Health', st: 'core', note: 'Listed — mental-health demand far outstrips supply.' },
    { n: 'Speech Pathologist', s: ['speech therapist'], sec: 'Allied Health', st: 'core', note: 'Listed, with long waitlists nationwide.' },
    { n: 'Podiatrist', s: [], sec: 'Allied Health', st: 'core', note: 'Listed — steady demand, especially regionally.' },
    { n: 'Optometrist', s: [], sec: 'Allied Health', st: 'core', note: 'Listed and recruited nationally.' },
    { n: 'Dietitian', s: ['nutritionist'], sec: 'Allied Health', st: 'core', note: 'Listed — clinical and aged-care settings recruit.' },

    // --- FMCG / business / other common asks ---
    { n: 'Production Manager (Manufacturing)', s: ['production manager', 'manufacturing manager', 'operations manager fmcg'], sec: 'FMCG', st: 'core', note: 'Manufacturing leadership is listed — FMCG plants sponsor.' },
    { n: 'Supply Chain / Logistics Manager', s: ['supply chain', 'logistics manager', 'warehouse manager'], sec: 'FMCG', st: 'special', note: 'Pathways vary by role and state — often via nomination or sponsorship. Worth a strategy chat.' },
    { n: 'Food Technologist', s: ['food scientist'], sec: 'FMCG', st: 'core', note: 'Listed — quality and product development roles recruit.' },
    { n: 'Chef', s: ['cook', 'head chef', 'sous chef'], sec: 'FMCG', st: 'core', note: 'Chefs are listed — hospitality shortage is national.' },
    { n: 'Accountant', s: ['chartered accountant', 'auditor', 'finance manager'], sec: 'FMCG', st: 'core', note: 'Listed — points competition is real, but the pathway is well-trodden.' },
    { n: 'Civil Engineer', s: ['structural engineer'], sec: 'Mining & Resources', st: 'core', note: 'All major engineering disciplines are listed — infrastructure boom demand.' },
    { n: 'Mechanical Engineer', s: [], sec: 'Mining & Resources', st: 'core', note: 'Listed — mining, manufacturing and energy all recruit.' },
    { n: 'Electrical Engineer', s: ['power engineer'], sec: 'Mining & Resources', st: 'core', note: 'Listed — the energy transition is hungry for them.' },
    { n: 'Secondary School Teacher', s: ['teacher', 'high school teacher', 'maths teacher', 'science teacher'], sec: 'Other', st: 'core', note: 'Teachers (especially STEM) are listed and actively recruited by states.' },
    { n: 'Early Childhood Teacher', s: ['preschool teacher', 'kindergarten teacher', 'ece'], sec: 'Other', st: 'core', note: 'Listed — one of the fastest-moving teaching pathways.' },
    { n: 'Carpenter', s: ['joiner', 'cabinetmaker', 'chippy'], sec: 'Other', st: 'core', note: 'Construction trades are listed — the housing push needs them.' },
    { n: 'Plumber', s: ['gasfitter', 'drainer'], sec: 'Other', st: 'core', note: 'Listed — licensing is state-based; demand is everywhere.' },
    { n: 'Motor Mechanic', s: ['automotive technician', 'auto electrician', 'mechanic'], sec: 'Other', st: 'core', note: 'Listed — workshops sponsor across the country.' },
    { n: 'Bricklayer', s: ['blocklayer'], sec: 'Other', st: 'core', note: 'Listed construction trade.' },
    { n: 'Hairdresser', s: ['barber'], sec: 'Other', st: 'special', note: 'On some lists and DAMAs — region and employer matter. Worth a strategy chat.' },
    { n: 'Café or Restaurant Manager', s: ['restaurant manager', 'hospitality manager', 'hotel manager'], sec: 'Other', st: 'special', note: 'Hospitality management moves via sponsorship and regional streams.' },
    { n: 'Marketing Specialist', s: ['marketing manager', 'digital marketer'], sec: 'Other', st: 'special', note: 'Limited general listing — usually needs sponsorship plus the right state stream.' },
    { n: 'Human Resources', s: ['hr manager', 'recruiter', 'hr advisor'], sec: 'Other', st: 'limited', note: 'Rarely listed — pathways exist but need a tailored strategy.' },
    { n: 'Sales Representative', s: ['sales manager', 'account manager'], sec: 'Other', st: 'limited', note: 'Generally not listed — but adjacent listed roles often fit. Bring your CV to a consult.' },
    { n: 'Admin / Office Manager', s: ['administrator', 'receptionist', 'office manager', 'personal assistant'], sec: 'Other', st: 'limited', note: 'Not on the skilled lists — partner skills, study or adjacent roles may open a door.' },
  ];

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
          // whole-word overlap only
          var qw = q.split(' '), cw = cand.split(' '), hit = 0;
          for (var k = 0; k < qw.length; k++) if (qw[k].length > 3 && cw.indexOf(qw[k]) > -1) hit++;
          if (hit) score = 30 + hit * 12;
        }
        if (score > bestScore) { bestScore = score; best = o; }
      }
    }
    return bestScore >= 42 ? best : null;
  }

  var STATUS = {
    core: { label: 'In demand — on the skilled lists', cls: 'is-core' },
    special: { label: 'Special pathway — DAMA / sponsorship', cls: 'is-special' },
    limited: { label: 'Needs a tailored strategy', cls: 'is-limited' },
  };

  function boot() {
    var mount = document.getElementById('occCheck');
    if (!mount) return;
    mount.innerHTML =
      '<div class="occ__bar">' +
        '<input type="text" id="occInput" placeholder="Try “nurse”, “electrician”, “software developer”…" aria-label="Your occupation">' +
        '<button type="button" id="occBtn">Check</button>' +
      '</div>' +
      '<div class="occ__result" id="occResult" aria-live="polite"></div>';

    var input = document.getElementById('occInput');
    var result = document.getElementById('occResult');

    function show() {
      var q = input.value;
      if (norm(q).length < 2) { result.innerHTML = ''; result.className = 'occ__result'; return; }
      var hit = search(q);
      if (hit) {
        try { localStorage.setItem('qk_occ', JSON.stringify({ n: hit.n, sec: hit.sec, st: hit.st, when: Date.now() })); } catch (e) {}
        var score = null;
        try { score = JSON.parse(localStorage.getItem('qk_score') || 'null'); } catch (e) {}
        var planLine = score && typeof score.base === 'number'
          ? '<p class="occ__plan">Paired with your points estimate of <strong>' + score.base +
            '</strong> — open the points calculator to see your combined Quokkaroo plan.</p>'
          : '';
        var st = STATUS[hit.st];
        result.className = 'occ__result is-on ' + st.cls;
        result.innerHTML =
          '<span class="occ__badge">' + st.label + '</span>' +
          '<h3>' + hit.n + '</h3>' +
          '<p class="occ__sector">Sector: ' + hit.sec + '</p>' +
          '<p>' + hit.note + '</p>' +
          '<div class="occ__cta">' +
            '<a class="btn btn--dark" href="#points"><span>Check your points</span></a>' +
            '<a class="btn btn--outline2" href="https://quokkaroo.mmportal.cloud" target="_blank" rel="noopener"><span>Register your interest</span></a>' +
          '</div>' +
          planLine +
          '<p class="occ__fine">Indicative only — the occupation lists change. Your consult confirms your exact pathway.</p>';
      } else {
        result.className = 'occ__result is-on is-miss';
        result.innerHTML =
          '<span class="occ__badge">Not finding it</span>' +
          '<h3>&ldquo;' + q.replace(/[<>&]/g, '') + '&rdquo;</h3>' +
          '<p>No direct match in our quick list — but that does <strong>not</strong> mean there&rsquo;s no pathway. Hundreds of occupations qualify, plus DAMAs and state streams that this checker can&rsquo;t see.</p>' +
          '<div class="occ__cta">' +
            '<a class="btn btn--dark" href="mailto:migration@quokkaroo.com?subject=' + encodeURIComponent('Occupation check — ' + q) + '"><span>Ask us directly</span></a>' +
          '</div>';
      }
    }

    var t;
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(show, 250); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') show(); });
    document.getElementById('occBtn').addEventListener('click', show);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
