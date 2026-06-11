// QuokkaBot — Quokkaroo's migration mate.
// A fully client-side chatbot: a weighted-keyword retrieval brain over a
// hand-built Australian-migration knowledge base (every current visa subclass,
// points test, skills assessments, thresholds, plus everything Quokkaroo).
// No backend, no keys — ships anywhere the static site does.
// City questions hook straight into the globe's city dossier panels.
import { CITIES } from './cities.js';
import { openCity } from './citypanel.js';

/* =====================  KNOWLEDGE BASE  ===================== */
// kw: [term, weight] — multi-word terms match as phrases, single words as tokens.
// Figures are guides only; the bot always says so where money/thresholds appear.

const GUIDE = '<em class="qb-fine">Figures are a guide only — government fees and thresholds are indexed every year. Your consult comes with exact, current numbers.</em>';
const CONSULT = '<strong>Want it mapped to your case?</strong> Book a 45-minute consult with Dr Chamonix Terblanche (MARN 2318272) — $420 incl. GST, with a written summary and fact sheets afterwards.';

const KB = [
  {
    id: 'visa-overview',
    title: 'Which visa do I need?',
    kw: [['which visa', 6], ['what visa', 6], ['visa options', 5], ['options', 2], ['visas', 3], ['visa', 2], ['overview', 3], ['pathway', 3], ['pathways', 3], ['migrate', 2], ['move to australia', 4], ['get to australia', 4]],
    answer: `Australian visas fall into a few big families:<ul>
      <li><strong>Employer-sponsored</strong> — Skills in Demand <strong>482</strong> (temporary, PR pathway), <strong>186</strong> ENS (permanent), <strong>494</strong> regional (provisional → PR via 191).</li>
      <li><strong>Points-tested skilled</strong> — <strong>189</strong> independent, <strong>190</strong> state-nominated, <strong>491</strong> regional (both add points).</li>
      <li><strong>Graduate &amp; student</strong> — <strong>500</strong> student, <strong>485</strong> temporary graduate.</li>
      <li><strong>Family</strong> — partner <strong>820/801</strong> &amp; <strong>309/100</strong>, parent visas, child visas.</li>
      <li><strong>Talent &amp; niche</strong> — <strong>858</strong> National Innovation visa, DAMAs, working holiday <strong>417/462</strong>.</li></ul>
      The right one depends on your occupation, age, English and whether an employer wants you. That's exactly what a Quokkaroo consult works out. ${CONSULT}`,
    related: ['visa-482', 'visa-189-190', 'points-test', 'consult'],
  },
  {
    id: 'visa-482',
    title: 'Skills in Demand (482)',
    kw: [['482', 10], ['skills in demand', 8], ['sid', 6], ['tss', 6], ['temporary skill shortage', 7], ['employer sponsored', 4], ['sponsorship', 4], ['sponsor', 4], ['work visa', 4]],
    answer: `The <strong>subclass 482 — Skills in Demand (SID)</strong> visa (it replaced the old TSS in December 2024) is Australia's main employer-sponsored work visa. Three streams:<ul>
      <li><strong>Specialist Skills</strong> — high earners (roughly AUD $140k+ a year), any occupation except trades/machinery/labourers, fast processing.</li>
      <li><strong>Core Skills</strong> — occupations on the Core Skills Occupation List (CSOL) earning at least the Core Skills Income Threshold (roughly AUD $76,500, indexed).</li>
      <li><strong>Essential Skills / labour agreement</strong> — lower-paid critical roles under agreements such as DAMAs.</li></ul>
      You need a sponsoring employer, usually at least 1 year of relevant experience, and you can stay up to 4 years. The big prize: after 2 years you can be nominated for <strong>permanent residence via the 186 (TRT stream)</strong>. ${GUIDE} ${CONSULT}`,
    related: ['visa-186', 'csol', 'income-thresholds', 'get-hired'],
  },
  {
    id: 'visa-186',
    title: 'Employer Nomination Scheme (186)',
    kw: [['186', 10], ['ens', 7], ['employer nomination', 7], ['direct entry', 5], ['trt', 6], ['transition to residence', 5], ['permanent employer', 4]],
    answer: `The <strong>subclass 186 (ENS)</strong> is a <strong>permanent</strong> employer-sponsored visa. Two main streams:<ul>
      <li><strong>Temporary Residence Transition (TRT)</strong> — for 482 holders who've worked with their sponsor for 2 years. The well-trodden 482 → 186 PR route.</li>
      <li><strong>Direct Entry</strong> — straight to PR with a positive skills assessment and (usually) 3 years' experience, occupation on the list.</li></ul>
      Generally you need to be under 45 (exemptions exist — high earners, regional medical, certain TRT cases). It's PR from day one: Medicare, schools, and a 4-year runway to citizenship. ${CONSULT}`,
    related: ['visa-482', 'age-limit', 'citizenship'],
  },
  {
    id: 'visa-189-190',
    title: 'Skilled Independent (189) & Nominated (190)',
    kw: [['189', 10], ['190', 10], ['skilled independent', 7], ['state nomination', 6], ['state nominated', 6], ['skilled nominated', 7], ['points visa', 5], ['skillselect', 5], ['eoi', 5], ['expression of interest', 6]],
    answer: `The points-tested permanent skilled visas:<ul>
      <li><strong>189 Skilled Independent</strong> — no employer, no state, pure points. Lodge an Expression of Interest in SkillSelect and wait for an invitation. Highly competitive — invitations typically go well above the 65-point floor.</li>
      <li><strong>190 Skilled Nominated</strong> — a state or territory nominates you (worth <strong>+5 points</strong>). Each state runs its own occupation lists and criteria; in return you commit to living there for around 2 years.</li></ul>
      Both need: occupation on the relevant list, positive skills assessment, competent English, under 45 at invitation, and a 65+ points score (in practice, more). ${CONSULT}`,
    related: ['points-test', 'visa-491', 'skills-assessment', 'age-limit'],
  },
  {
    id: 'visa-491',
    title: 'Skilled Work Regional (491) & 494/191',
    kw: [['491', 10], ['494', 10], ['191', 8], ['regional visa', 7], ['regional', 4], ['provisional', 4], ['skilled work regional', 8]],
    answer: `Regional Australia is the smart back door — and "regional" includes Perth, Adelaide, the Gold Coast, Canberra, Newcastle, Hobart, Darwin and Cairns, basically everywhere except Sydney, Melbourne and Brisbane.<ul>
      <li><strong>491 Skilled Work Regional</strong> — points-tested, state or family sponsored, worth <strong>+15 points</strong>. 5-year provisional visa; live and work regionally.</li>
      <li><strong>494</strong> — the employer-sponsored regional equivalent (5 years).</li>
      <li><strong>191</strong> — the permanent landing: after 3 years on a 491/494 with the income requirement met, you convert to PR.</li></ul>
      Spin the globe above — most of the city beacons on it are regional-classified, with all these advantages. ${CONSULT}`,
    related: ['points-test', 'cities', 'dama'],
  },
  {
    id: 'visa-485',
    title: 'Temporary Graduate (485)',
    kw: [['485', 10], ['graduate visa', 8], ['temporary graduate', 8], ['after study', 5], ['post study', 6], ['graduate', 4]],
    answer: `The <strong>subclass 485 (Temporary Graduate)</strong> lets international students stay and work full-time after finishing an Australian qualification. The <strong>Post-Higher-Education Work stream</strong> generally gives 2–3 years depending on your degree level (longer for some regional graduates via the second 485). Age limit is now generally under 35. It's the classic bridge: study → 485 work experience → skilled or employer-sponsored PR. ${CONSULT}`,
    related: ['visa-500', 'visa-189-190', 'visa-482'],
  },
  {
    id: 'visa-500',
    title: 'Student visa (500)',
    kw: [['500', 9], ['student visa', 9], ['study', 4], ['student', 5], ['university', 3], ['course', 3]],
    answer: `The <strong>subclass 500 (Student)</strong> visa covers the length of your enrolled course (CoE), with work rights of <strong>48 hours per fortnight</strong> during term (unlimited in breaks). You'll need a Genuine Student requirement, health insurance (OSHC), and evidence of funds. Studying in Australia also banks points later — <strong>+5</strong> for Australian study, <strong>+5</strong> more if you studied regionally. ${CONSULT}`,
    related: ['visa-485', 'points-test'],
  },
  {
    id: 'visa-partner',
    title: 'Partner visas (820/801, 309/100, 300)',
    kw: [['partner visa', 9], ['820', 9], ['801', 9], ['309', 9], ['100', 6], ['300', 7], ['spouse', 7], ['de facto', 7], ['married', 5], ['fiance', 6], ['prospective marriage', 7], ['partner', 5]],
    answer: `Partner visas come as a two-stage package:<ul>
      <li><strong>820 → 801</strong> — applying inside Australia (temporary, then permanent usually assessed ~2 years after lodgement).</li>
      <li><strong>309 → 100</strong> — the same pathway applied from outside Australia.</li>
      <li><strong>300 Prospective Marriage</strong> — the "fiancé visa": enter, marry within 9 months, then move onto 820/801.</li></ul>
      You'll evidence a genuine, continuing relationship (finances, household, social, commitment). It's one of the more expensive applications (government charges around AUD $9,000), so getting it right the first time matters. ${GUIDE} ${CONSULT}`,
    related: ['visa-parent', 'consult'],
  },
  {
    id: 'visa-parent',
    title: 'Parent visas (103, 143, 870)',
    kw: [['parent visa', 9], ['103', 8], ['143', 9], ['864', 7], ['870', 9], ['parents', 6], ['parent', 5], ['mother', 4], ['father', 4]],
    answer: `Bringing the folks over has three realistic routes:<ul>
      <li><strong>143 Contributory Parent</strong> (permanent) — large contribution (roughly AUD $48k+ per parent) but a "fast" queue that still runs many years.</li>
      <li><strong>103 Parent</strong> — far cheaper, but the queue is measured in decades. Genuinely.</li>
      <li><strong>870 Sponsored Parent (Temporary)</strong> — 3 or 5 years at a time, up to 10 years total, no PR but a practical way to have parents close.</li></ul>
      All require the Balance of Family test (except 870) and an Australian sponsor child. ${GUIDE} ${CONSULT}`,
    related: ['visa-partner'],
  },
  {
    id: 'visa-whv',
    title: 'Working Holiday (417/462)',
    kw: [['417', 9], ['462', 9], ['working holiday', 9], ['whv', 7], ['backpacker', 6], ['holiday visa', 5]],
    answer: `The <strong>417 / 462 Working Holiday</strong> visas suit 18–30s (35 for some passports, including the UK) for 12 months of work-and-travel. Doing <strong>specified work</strong> (farms, regional hospitality, mining) earns a second and third year. South Africa isn't a WHV partner country — but the UK, most of Europe, and many Asian and American countries are. A great taste-test of Aussie life before a skilled pathway. ${CONSULT}`,
    related: ['visa-overview', 'visa-482'],
  },
  {
    id: 'visa-858',
    title: 'National Innovation visa (858)',
    kw: [['858', 9], ['national innovation', 8], ['global talent', 8], ['gti', 6], ['talent visa', 6], ['distinguished', 4]],
    answer: `The <strong>subclass 858 National Innovation visa</strong> (it replaced the Global Talent program in December 2024) is a permanent visa for people with an <strong>internationally recognised record of exceptional achievement</strong> — top researchers, athletes, creatives, and entrepreneurs. Invitation-only via an Expression of Interest, usually with a prominent Australian nominator. If you're outstanding in your field, it's the most direct PR there is. ${CONSULT}`,
    related: ['visa-overview'],
  },
  {
    id: 'visa-nz',
    title: 'New Zealanders (444) & NZ options',
    kw: [['444', 8], ['new zealand', 8], ['new zealander', 8], ['kiwi', 6], ['nz', 5]],
    answer: `New Zealand citizens get the <strong>subclass 444</strong> automatically on arrival — live and work indefinitely. Since July 2023, most NZ citizens who've lived in Australia 4+ years can apply <strong>directly for Australian citizenship</strong> without a PR step. And yes — Quokkaroo helps with migration to New Zealand too; the Aussie/NZ door swings both ways. ${CONSULT}`,
    related: ['citizenship', 'about'],
  },
  {
    id: 'visa-visitor',
    title: 'Visitor visas (600/601/651)',
    kw: [['600', 8], ['601', 8], ['651', 8], ['visitor', 7], ['tourist', 7], ['holiday', 4], ['visit', 5], ['evisitor', 6], ['eta', 5]],
    answer: `For a look-see trip: the <strong>651 eVisitor</strong> (free, European passports), <strong>601 ETA</strong> (app-based, ~AUD $20, many passports), or the <strong>600 Visitor</strong> visa (everyone else, including South Africans — typically 3, 6 or 12 months). Visitor visas don't allow work, but they're a smart way to scout cities before committing. Tap the beacons on the globe above to scout from your couch first. ${GUIDE}`,
    related: ['cities', 'visa-overview'],
  },
  {
    id: 'visa-legacy',
    title: 'Closed / legacy visas (457, 187, 188, 401…)',
    kw: [['457', 9], ['187', 9], ['188', 9], ['888', 8], ['401', 9], ['402', 8], ['rsms', 6], ['business innovation', 6], ['legacy', 4], ['closed', 3], ['investor visa', 6]],
    answer: `A few famous subclass numbers are no longer with us:<ul>
      <li><strong>457</strong> — the old workhorse, replaced by the TSS in 2018, now the <strong>482 Skills in Demand</strong>.</li>
      <li><strong>187 RSMS</strong> — closed; its regional job is done by the <strong>494/191</strong>.</li>
      <li><strong>188/888 Business Innovation &amp; Investment</strong> — closed to new applications in 2024.</li>
      <li><strong>401/402</strong> — old temporary work/training visas, long since folded into the <strong>400, 407 and 408</strong>.</li></ul>
      If you were quoted one of these, the strategy needs updating — exactly what a consult sorts out. ${CONSULT}`,
    related: ['visa-482', 'visa-491', 'consult'],
  },
  {
    id: 'points-test',
    title: 'The points test',
    kw: [['points test', 10], ['points', 7], ['65 points', 8], ['how many points', 8], ['score', 4], ['point', 4]],
    answer: `Points visas (189/190/491) need <strong>65 points minimum</strong> — competitive invitations usually need more. The big earners:<ul>
      <li><strong>Age</strong> — 25–32 is the sweet spot (30 pts); 18–24 and 33–39 get 25.</li>
      <li><strong>English</strong> — Proficient +10, Superior +20.</li>
      <li><strong>Experience</strong> — up to 15 pts overseas (8+ yrs), up to 20 pts in Australia.</li>
      <li><strong>Qualifications</strong> — degree 15, PhD 20, trade/diploma 10.</li>
      <li><strong>Boosters</strong> — Australian study +5, regional study +5, NAATI community language +5, Professional Year +5, partner skills up to +10, single applicants +10.</li>
      <li><strong>Nomination</strong> — state 190 <strong>+5</strong>, regional 491 <strong>+15</strong>.</li></ul>
      ${CONSULT}`,
    related: ['visa-189-190', 'visa-491', 'english-tests'],
  },
  {
    id: 'skills-assessment',
    title: 'Skills assessments',
    kw: [['skills assessment', 10], ['skill assessment', 9], ['vetassess', 8], ['acs', 7], ['anmac', 8], ['ahpra', 8], ['engineers australia', 8], ['aitsl', 7], ['avbc', 7], ['trades recognition', 7], ['tra', 5], ['assessment', 4], ['anzsco', 7], ['occupation code', 6]],
    answer: `Almost every skilled visa starts with a <strong>positive skills assessment</strong> for your ANZSCO occupation, from the assessing authority that owns it:<ul>
      <li><strong>Nurses/midwives</strong> — ANMAC (then AHPRA registration)</li>
      <li><strong>Doctors</strong> — AMC / specialist colleges + AHPRA</li>
      <li><strong>ICT</strong> — ACS</li>
      <li><strong>Engineers</strong> — Engineers Australia</li>
      <li><strong>Trades</strong> — Trades Recognition Australia</li>
      <li><strong>Vets</strong> — AVBC; <strong>teachers</strong> — AITSL; <strong>most professional/management roles</strong> — VETASSESS.</li></ul>
      Each has its own evidence rules, timelines (weeks to months) and English requirements — start this early; it's the long pole in the tent. ${CONSULT}`,
    related: ['english-tests', 'points-test', 'csol'],
  },
  {
    id: 'english-tests',
    title: 'English tests (IELTS / PTE / OET)',
    kw: [['ielts', 9], ['pte', 9], ['oet', 9], ['english test', 9], ['english requirement', 8], ['toefl', 7], ['english', 4], ['language', 4]],
    answer: `Visa English comes in levels — via IELTS, PTE Academic, OET (health professions), TOEFL iBT or Cambridge:<ul>
      <li><strong>Competent</strong> — IELTS 6.0 each band (the floor for most skilled visas, 0 points)</li>
      <li><strong>Proficient</strong> — IELTS 7.0 each band (+10 points)</li>
      <li><strong>Superior</strong> — IELTS 8.0 each band (+20 points)</li></ul>
      Many registrations (nursing via AHPRA, for example) set their own, higher bar — typically IELTS 7 / OET B across the board. Native-English passport holders (UK, Ireland, US, Canada, NZ) are exempt at Competent level but still sit tests to claim points. ${CONSULT}`,
    related: ['points-test', 'skills-assessment'],
  },
  {
    id: 'csol',
    title: 'Occupation lists (CSOL & friends)',
    kw: [['csol', 9], ['occupation list', 9], ['core skills occupation list', 9], ['mltssl', 7], ['stsol', 7], ['occupation', 5], ['my occupation', 6], ['on the list', 6]],
    answer: `Whether your job is "on a list" decides which visas you can use:<ul>
      <li><strong>CSOL (Core Skills Occupation List)</strong> — a single list of ~450 occupations for the 482 Core Skills stream and 186 (introduced December 2024).</li>
      <li><strong>MLTSSL / STSOL / ROL</strong> — the legacy lists still steering the points visas (189/190/491).</li>
      <li><strong>State lists</strong> — every state nominates from its own subset with extra criteria.</li></ul>
      Healthcare, trades, engineering, ICT and veterinary roles — Quokkaroo's home turf — are all over these lists. Tell me your occupation in a consult and we'll map every door it opens. ${CONSULT}`,
    related: ['visa-482', 'visa-189-190', 'skills-assessment'],
  },
  {
    id: 'income-thresholds',
    title: 'Salary thresholds (CSIT / SSIT)',
    kw: [['csit', 9], ['ssit', 9], ['tsmit', 8], ['salary threshold', 9], ['income threshold', 9], ['minimum salary', 8], ['how much must i earn', 8], ['salary', 4]],
    answer: `Sponsored work visas have salary floors, indexed every July:<ul>
      <li><strong>CSIT (Core Skills Income Threshold)</strong> — roughly <strong>AUD $76,500</strong>: the minimum for the 482 Core Skills stream.</li>
      <li><strong>SSIT (Specialist Skills Income Threshold)</strong> — roughly <strong>AUD $141,000</strong>: the fast-lane stream.</li></ul>
      Your salary must also match what an equivalent Australian would earn (the "annual market salary rate"). ${GUIDE} ${CONSULT}`,
    related: ['visa-482', 'get-hired'],
  },
  {
    id: 'costs',
    title: 'What does it all cost?',
    kw: [['cost', 7], ['costs', 7], ['fees', 7], ['how much', 7], ['price', 6], ['expensive', 5], ['fee', 5], ['charges', 5]],
    answer: `Honest answer: it varies a lot by visa. As a rough guide to <strong>government application charges</strong>: skilled PR visas (189/190/491) run around AUD $4,800 for the main applicant; a 482 is in the low thousands plus sponsor levies (paid by the employer); partner visas are around AUD $9,000. On top sit skills assessments, English tests, health checks and police certificates. Quokkaroo's consult is a flat <strong>$420 incl. GST</strong> and includes realistic government-fee estimates for your pathway, in writing. ${GUIDE}`,
    related: ['consult', 'visa-overview'],
  },
  {
    id: 'timeline',
    title: 'How long does it take?',
    kw: [['how long', 8], ['timeline', 7], ['processing time', 9], ['wait', 4], ['months', 3], ['fast', 3], ['quick', 4], ['time', 3]],
    answer: `Typical end-to-end journeys (skills assessment → visa grant):<ul>
      <li><strong>Employer-sponsored 482</strong> — often the fastest: a few weeks to a few months once nominated (Specialist Skills stream is processed in days-to-weeks).</li>
      <li><strong>Points visas (189/190/491)</strong> — commonly 12–24 months including EOI waiting.</li>
      <li><strong>Partner visas</strong> — one to two-plus years.</li></ul>
      The single biggest accelerator is having a job offer — which is the Quokkaroo model: get hired first, let the employer's need drive the visa. ${CONSULT}`,
    related: ['get-hired', 'visa-482', 'consult'],
  },
  {
    id: 'age-limit',
    title: 'Age limits',
    kw: [['age limit', 9], ['too old', 8], ['45', 7], ['age', 5], ['over 45', 8], ['old', 3]],
    answer: `The headline rule: <strong>under 45</strong> at invitation/application for the permanent skilled visas (189/190/491/186). But it's not the end of the story past 45:<ul>
      <li>The <strong>482 Skills in Demand has no age limit</strong> — you can work for years, and some 186 TRT exemptions exist (notably high earners and regional medical practitioners).</li>
      <li><strong>DAMA</strong> agreements often include age concessions up to 55.</li>
      <li>Family and investor-style routes aren't age-tested the same way.</li></ul>
      ${CONSULT}`,
    related: ['dama', 'visa-482', 'visa-186'],
  },
  {
    id: 'dama',
    title: 'DAMAs (Designated Area Migration Agreements)',
    kw: [['dama', 10], ['designated area', 8], ['labour agreement', 7], ['concessions', 5]],
    answer: `A <strong>DAMA (Designated Area Migration Agreement)</strong> is a deal between a region and the federal government that unlocks <strong>concessions on age (often up to 55), English and salary</strong> for occupations that region desperately needs — often jobs that aren't on any national list. There are a dozen-plus DAMAs: the Northern Territory, South Australia, regional WA, Far North Queensland, Townsville and more. If you're "close but not quite" on the standard rules, a DAMA region is often the answer. ${CONSULT}`,
    related: ['visa-491', 'cities', 'age-limit'],
  },
  {
    id: 'health-character',
    title: 'Health & character checks',
    kw: [['health check', 8], ['medical', 7], ['police clearance', 8], ['character', 6], ['police certificate', 8], ['criminal record', 7], ['health insurance', 6], ['8501', 7]],
    answer: `Every substantive visa runs two gates:<ul>
      <li><strong>Health</strong> — panel-doctor medicals for the family; conditions are assessed on likely health-system cost. Temporary visas usually carry condition <strong>8501</strong> (hold health insurance).</li>
      <li><strong>Character</strong> — police certificates from every country you've lived in 12+ months over the last 10 years. Minor history isn't automatically fatal — but disclose everything, always.</li></ul>
      ${CONSULT}`,
    related: ['costs', 'timeline'],
  },
  {
    id: 'citizenship',
    title: 'Citizenship',
    kw: [['citizenship', 9], ['citizen', 7], ['passport', 6], ['australian passport', 8], ['naturalise', 6]],
    answer: `The full journey ends with the maroon passport: generally <strong>4 years living lawfully in Australia, the last 12 months as a PR</strong>, plus the citizenship test (English + civics). Kids born in Australia to a PR or citizen are citizens from birth. Australia allows <strong>dual citizenship</strong> — South Africans should note SA requires permission to retain theirs before taking another nationality. ${CONSULT}`,
    related: ['visa-186', 'visa-189-190'],
  },
  {
    id: 'family-included',
    title: 'Bringing family (and pets)',
    kw: [['family', 6], ['kids', 7], ['children', 7], ['wife', 5], ['husband', 5], ['pets', 8], ['dog', 6], ['cat', 6], ['fur babies', 8], ['dependants', 7]],
    answer: `Partners and dependent children join almost every skilled visa as <strong>secondary applicants</strong> — same visa, same rights (and on most 482s, full work rights for your partner). School-age kids slot into public schools; on PR they're funded like locals.<br><br>
      As for the <strong>fur babies</strong> — yes, they can come (Quokkaroo literally lists this in its relocation support). Budget realistically: import permit, rabies titre testing months in advance, and 10+ days of quarantine in Melbourne — often AUD $5–10k per pet from South Africa. ${GUIDE} ${CONSULT}`,
    related: ['relocation', 'visa-partner'],
  },
  {
    id: 'medicare-settling',
    title: 'Medicare, tax & setting up',
    kw: [['medicare', 9], ['tax', 6], ['tfn', 7], ['superannuation', 7], ['super', 5], ['bank account', 7], ['settle', 4], ['settling', 5], ['arriving', 5], ['first weeks', 6]],
    answer: `Your first-fortnight checklist Down Under:<ul>
      <li><strong>TFN</strong> (tax file number) — free, online, do it day one.</li>
      <li><strong>Bank account</strong> — openable before you even land.</li>
      <li><strong>Medicare</strong> — PR holders and many visa classes enrol on arrival; temporary workers usually carry private insurance instead (often a visa condition).</li>
      <li><strong>Superannuation</strong> — your employer pays ~12% on top of salary into your super fund; pick your own fund or default in.</li></ul>
      Quokkaroo's resettlement support and 10,000-strong migrant community exist exactly for this phase. ${CONSULT}`,
    related: ['relocation', 'cities'],
  },
  {
    id: 'get-hired',
    title: 'Getting hired from overseas',
    kw: [['get hired', 8], ['find a job', 8], ['job offer', 8], ['employer', 5], ['recruitment', 6], ['jobs', 5], ['job', 4], ['hire', 5], ['work', 3]],
    answer: `This is Quokkaroo's superpower — it's a <strong>recruiter and a migration practice in one</strong>. Rather than visa-first, Quokkaroo matches your skills to Australian employers with acute shortages (hospitals, aged care, mines, vet clinics, ICT), and the employer's need then powers the visa. Sectors recruited: health &amp; hospitals, aged &amp; disability care, mining &amp; resources, veterinary, ICT, allied health and FMCG. Upskilling via accredited courses is part of the toolkit when it closes a gap. <strong>Register your interest</strong> with the puzzle-piece button and your CV starts the matching. ${CONSULT}`,
    related: ['visa-482', 'about', 'consult'],
  },
  {
    id: 'relocation',
    title: 'Relocation support',
    kw: [['relocation', 8], ['relocate', 7], ['moving', 5], ['shipping', 6], ['flights', 5], ['move', 4]],
    answer: `Once the visa's granted, Quokkaroo's relocation support covers the unglamorous bits: flights, paperwork, shipping decisions, school enrolments, first housing — <strong>even the fur babies</strong>. Then resettlement support plus a 10,000-strong migrant community make the first year feel like home, not exile. ${CONSULT}`,
    related: ['family-included', 'medicare-settling', 'cities'],
  },
  {
    id: 'about',
    title: 'About Quokkaroo',
    kw: [['quokkaroo', 7], ['about', 4], ['who are you', 7], ['who is', 5], ['company', 4], ['chamonix', 8], ['terblanche', 8], ['ian hamer', 8], ['marn', 7], ['team', 4], ['legit', 5], ['trust', 4]],
    answer: `<strong>Quokkaroo</strong> (founded 2022, Spring Hill QLD, ABN 81 664 017 949) is an Australian skilled-migration and recruitment business: it finds you a job, gets the visa right, and helps you settle — one firm, the whole bridge. The principals:<ul>
      <li><strong>Dr Chamonix Terblanche</strong> — South African-born Australian, PhD in filling national skills gaps, Postgraduate Diploma in Migration Law, <strong>Registered Migration Agent MARN 2318272</strong>.</li>
      <li><strong>Ian Hamer</strong> — lawyer and MBA (London Business School), ex-investment banker, decade as a healthcare executive.</li></ul>
      50 years of combined experience, 140+ migration stories told on YouTube, 10,000+ community members. And yes — a quokka is a real animal: the world's happiest. That's the energy.`,
    related: ['consult', 'stories', 'get-hired'],
  },
  {
    id: 'consult',
    title: 'Booking a consultation',
    kw: [['consult', 9], ['consultation', 9], ['book', 6], ['appointment', 7], ['talk to someone', 7], ['speak to', 5], ['contact', 5], ['email', 5], ['420', 7]],
    answer: `A Quokkaroo consultation is <strong>45 minutes with Dr Chamonix Terblanche</strong> (Registered Migration Agent, MARN 2318272) for a flat <strong>$420 incl. GST</strong> — your eligibility, realistic visa strategy and government-fee estimates, followed up <strong>in writing</strong> with fact sheets. Email <a href="mailto:migration@quokkaroo.com?subject=Migration%20consultation">migration@quokkaroo.com</a> to book, or hit the puzzle-piece <strong>Register your interest</strong> button to start with the job-matching side. General contact: <a href="mailto:hello@quokkaroo.com">hello@quokkaroo.com</a>.`,
    related: ['costs', 'get-hired', 'about'],
  },
  {
    id: 'stories',
    title: 'Migration stories',
    kw: [['stories', 7], ['story', 5], ['from the horse', 8], ['youtube', 6], ['episodes', 6], ['interviews', 6], ['podcast', 5]],
    answer: `<strong>"From the Horse's Mouth"</strong> is Quokkaroo's interview series — <strong>140+ episodes</strong> with people who've actually made the move: nurses, vets, miners, families; the real costs, the homesickness, the wins. Browse the full series on <a href="https://www.youtube.com/chamonixtv" target="_blank" rel="noopener">YouTube (chamonixtv)</a>.`,
    related: ['about', 'cities'],
  },
  {
    id: 'cities',
    title: 'Where should I live?',
    kw: [['where should i live', 9], ['which city', 9], ['best city', 8], ['cities', 6], ['city', 4], ['live', 4], ['weather', 4], ['cheapest', 5], ['lifestyle', 4]],
    answer: `That's the fun part — and this site is built for it. <strong>Spin the globe and tap any glowing beacon</strong> for a full dossier: lifestyle, jobs, climate, and each city's visa angle. Quick cheat-sheet:<ul>
      <li><strong>Biggest job markets</strong> — Sydney, Melbourne, Brisbane.</li>
      <li><strong>Regional-visa advantages + big-city life</strong> — Perth, Adelaide, Gold Coast, Canberra, Newcastle.</li>
      <li><strong>Fastest doors (DAMA country)</strong> — Darwin, Cairns, Townsville, Hobart.</li></ul>
      Or ask me about any city by name and I'll open its dossier for you.`,
    related: ['visa-491', 'dama', 'relocation'],
  },
];

const FALLBACK = `Good question — that one's beyond my pouch. I cover Australian visas (482, 186, 189/190/491, partner, parent, student and the rest), the points test, skills assessments, costs, timelines, the cities, and everything Quokkaroo. Try one of the buttons below — or for a definitive answer on your case, email <a href="mailto:migration@quokkaroo.com">migration@quokkaroo.com</a> for a consult with Dr Chamonix Terblanche (MARN 2318272).`;

const GREETING = `G'day! I'm <strong>QuokkaBot</strong> — Quokkaroo's migration mate. Ask me anything about moving to Australia: visas (482, 186, 189, 491, partner…), the points test, costs, timelines, the best cities, or what Quokkaroo does. <em class="qb-fine">I give general information, not migration advice — that's what Dr Terblanche (MARN 2318272) is for.</em>`;

/* =====================  RETRIEVAL BRAIN  ===================== */

function normalise(s) {
  return ' ' + s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
}

function scoreEntry(entry, text) {
  let score = 0;
  for (const [term, w] of entry.kw) {
    if (text.includes(' ' + term + ' ')) score += w;
  }
  return score;
}

function findCity(text) {
  return CITIES.find((c) => text.includes(' ' + c.name.toLowerCase() + ' ')) || null;
}

function answer(raw) {
  const text = normalise(raw);
  const city = findCity(text);

  let best = null, bestScore = 0;
  for (const e of KB) {
    const s = scoreEntry(e, text);
    if (s > bestScore) { best = e; bestScore = s; }
  }

  // a named city beats a weak generic match
  if (city && bestScore < 8) {
    return {
      html: `<strong>${city.name}, ${city.state}</strong> — ${city.tagline}<br><br>${city.intro}<br><br><em class="qb-fine">${city.migration}</em>`,
      city, related: ['cities', 'visa-491', 'consult'],
    };
  }
  if (best && bestScore >= 4) {
    return { html: best.answer, city, related: best.related || [] };
  }
  return { html: FALLBACK, city: null, related: ['visa-overview', 'points-test', 'cities', 'consult'] };
}

/* =====================  WIDGET  ===================== */

const STARTER_CHIPS = ['Which visa do I need?', 'Tell me about the 482', 'How does the points test work?', 'Where should I live?'];

function build() {
  const root = document.createElement('div');
  root.className = 'qb';
  root.innerHTML = `
    <button type="button" class="qb__launch" aria-label="Chat with QuokkaBot">
      <span class="qb__launchtag">Ask QuokkaBot</span>
      <span class="qb__launchcircle"><img src="assets/brand/quokka-mark-cream.png" alt=""></span>
    </button>
    <section class="qb__win" role="dialog" aria-label="QuokkaBot migration chat" hidden>
      <header class="qb__head">
        <img src="assets/brand/quokka-mark-cream.png" alt="">
        <div>
          <p class="qb__name">QuokkaBot</p>
          <p class="qb__sub">Australian migration, answered &middot; Quokkaroo</p>
        </div>
        <button type="button" class="qb__close" aria-label="Close chat">&times;</button>
      </header>
      <div class="qb__msgs" aria-live="polite"></div>
      <div class="qb__chips"></div>
      <form class="qb__bar">
        <input type="text" placeholder="Ask about visas, points, cities…" aria-label="Your question" maxlength="300">
        <button type="submit" aria-label="Send">&rarr;</button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const win = root.querySelector('.qb__win');
  const launch = root.querySelector('.qb__launch');
  const msgs = root.querySelector('.qb__msgs');
  const chipsEl = root.querySelector('.qb__chips');
  const form = root.querySelector('.qb__bar');
  const input = form.querySelector('input');
  let greeted = false;

  function addMsg(side, html) {
    const m = document.createElement('div');
    m.className = 'qb__msg qb__msg--' + side;
    if (side === 'user') m.textContent = html;
    else m.innerHTML = html;
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function setChips(labels) {
    chipsEl.innerHTML = '';
    labels.slice(0, 4).forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => ask(label));
      chipsEl.appendChild(b);
    });
  }

  function relatedChips(ids) {
    const labels = ids.map((id) => (KB.find((e) => e.id === id) || {}).title).filter(Boolean);
    setChips(labels.length ? labels : STARTER_CHIPS);
  }

  function ask(q) {
    addMsg('user', q);
    setChips([]);
    const typing = addMsg('bot', '<span class="qb__dots"><i></i><i></i><i></i></span>');
    setTimeout(() => {
      const res = answer(q);
      typing.innerHTML = res.html;
      if (res.city) {
        const go = document.createElement('button');
        go.type = 'button';
        go.className = 'qb__citybtn';
        go.textContent = 'Open the ' + res.city.name + ' dossier →';
        go.addEventListener('click', () => openCity(res.city));
        typing.appendChild(go);
      }
      relatedChips(res.related);
      msgs.scrollTop = msgs.scrollHeight;
    }, 450 + Math.random() * 350);
  }

  function open() {
    win.removeAttribute('hidden');
    root.classList.add('qb--open');
    if (!greeted) {
      greeted = true;
      addMsg('bot', GREETING);
      setChips(STARTER_CHIPS);
    }
    input.focus();
  }
  function close() {
    win.setAttribute('hidden', '');
    root.classList.remove('qb--open');
  }

  launch.addEventListener('click', () => (win.hasAttribute('hidden') ? open() : close()));
  root.querySelector('.qb__close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !win.hasAttribute('hidden')) close();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', build);
} else {
  build();
}
