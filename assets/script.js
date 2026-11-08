/**
 * MBI - Media Bias in Italy, questionario a confronti
 *
 * Una sola pagina (survey.html) con cinque schermate: consenso, confronti,
 * domande finali, fine con email. Il gruppo (studenti o colleghi) arriva dal
 * link: survey.html?g=studenti oppure survey.html?g=colleghi.
 *
 * Due Google Form, configurati in CONFIG (istruzioni in GOOGLE_FORMS_SETUP.md):
 *  - RISPOSTE: una riga per ogni confronto risposto, piu' una riga finale
 *    (sezione = "fine") con le domande finali. Se il rispondente torna indietro
 *    e cambia risposta parte una nuova riga: in analisi si tiene l'ultima per
 *    interview_id + confronto.
 *  - EMAIL: una riga per ogni questionario completo in cui il rispondente lascia
 *    l'email. Contando le righe per email si ottengono le partecipazioni.
 *    interview_id e respondent_id collegano le due tabelle: si puo' controllare
 *    come ha risposto chi partecipa all'estrazione.
 *
 * Tempi: ogni riga di confronto ha ms_risposta (millisecondi fra la comparsa
 * della coppia e la risposta); la riga finale ha l'ora di inizio, la durata
 * totale e la durata "attiva" (somma dei tempi di risposta, senza le pause).
 *
 * Finche' i codici dei form non sono configurati, lo script non invia niente e
 * scrive nella console del browser le righe che avrebbe inviato.
 */

'use strict';

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

const CONFIG = {
  // Form 1: risposte. Sostituire ID_FORM_RISPOSTE e gli entry.XXXX.
  RISPOSTE_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfptPxbIl2pvvJxyLY0lmo6A1RVUXO48onzvmA_Op4I1rnX-A/formResponse',
  RISPOSTE: {
    respondent_id: 'entry.1679972644',
    interview_id:  'entry.932935965',
    gruppo:        'entry.513445717',
    direzione:     'entry.404410007',
    sezione:       'entry.1484110475',
    confronto:     'entry.265452301',
    outlet_a:      'entry.562222780',
    outlet_b:      'entry.182689568',
    risposta:      'entry.401432635',
    sicurezza:     'entry.491505873',
    freq_tg:       'entry.2128348510',
    freq_talk:     'entry.1852585603',
    freq_web:      'entry.201842349',
    timestamp:     'entry.715894263',
    ms_risposta:   'entry.455160610',
    inizio:        'entry.1132708696',
    durata_sec:    'entry.98289760',
    durata_attiva_sec: 'entry.1902027220'
  },

  // Form 2: email per l'estrazione. Sostituire ID_FORM_EMAIL e gli entry.XXXX.
  EMAIL_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSc5mDW3hPknLis0J_lnsRkjbLCgF_dQKO05qidEZecv-OABFg/formResponse',
  EMAIL: {
    email:        'entry.254877118',
    gruppo:       'entry.1786130453',
    interview_id: 'entry.1744133089',
    timestamp:    'entry.1465504810',
    respondent_id: 'entry.955464814'
  },

  // Sezioni nell'ordine in cui compaiono, con il numero di confronti
  SECTIONS: [
    { type: 'tg',    title: 'Telegiornali',                    n: 5 },
    { type: 'talk',  title: 'Programmi di approfondimento',    n: 12 },
    { type: 'press', title: 'Giornali e siti di informazione', n: 13 },
    { type: 'mixed', title: 'Confronti fra mezzi diversi',     n: 8,
      note: 'Da qui in poi le coppie mescolano telegiornali, programmi e giornali.' }
  ],

  GROUPS: {
    studenti: { prize: "Lascia la tua email per partecipare all'estrazione di tre buoni caffè per il bar del Campus Luigi Einaudi. Ogni questionario completo vale una partecipazione." },
    colleghi: { prize: "Lascia la tua email per partecipare all'estrazione di tre buoni Amazon da 50 euro. Ogni questionario completo vale una partecipazione." },
    altro:    { prize: "Lascia la tua email per partecipare all'estrazione dei premi. Ogni questionario completo vale una partecipazione." }
  },

  CSV_PATH: 'data/outlets.csv',
  AUTO_ADVANCE_MS: 280
};

const FINAL_QUESTIONS = {
  sicurezza: [['1', 'Per niente'], ['2', 'Poco'], ['3', 'Abbastanza'], ['4', 'Molto'], ['5', 'Del tutto']],
  freq: [['giorno', 'Ogni giorno'], ['settimana', 'Qualche volta a settimana'],
         ['mese', 'Qualche volta al mese'], ['raramente', 'Più raramente'], ['mai', 'Mai']]
};

// ============================================================================
// UTILITA'
// ============================================================================

// Il browser puo' bloccare lo storage (navigazione privata, cookie bloccati):
// ogni accesso e' protetto e il questionario funziona anche senza.
const store = {
  get(area, key) { try { return window[area].getItem(key); } catch (e) { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch (e) { /* niente */ } },
  remove(area, key) { try { window[area].removeItem(key); } catch (e) { /* niente */ } }
};

function newId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      console.warn('Riga del CSV ignorata:', line);
      return null;
    }
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i]; });
    return row;
  }).filter(Boolean);
}

// "Otto e Mezzo (La7)" -> nome "Otto e Mezzo", rete "La7"
function splitName(name) {
  const m = name.match(/^(.*)\s\(([^)]+)\)$/);
  return m ? { main: m[1], net: m[2] } : { main: name, net: '' };
}

function $(id) { return document.getElementById(id); }

function show(screenId) {
  ['screen-consent', 'screen-loading', 'screen-error', 'screen-survey', 'screen-final', 'screen-end']
    .forEach(id => $(id).classList.toggle('hidden', id !== screenId));
  window.scrollTo(0, 0);
}

// ============================================================================
// INVIO AI GOOGLE FORM
// ============================================================================

function isPlaceholder(entry) { return entry.includes('XXXX') || entry.includes('YYYY'); }

// Invia solo i campi configurati: un campo con il segnaposto (entry.XXXX..) viene
// saltato, cosi' il form funziona anche se manca ancora qualche domanda. Se manca
// l'ID del form non parte niente.
function send(url, fields, data) {
  if (url.includes('ID_FORM')) {
    console.info('[MBI, form non configurato] riga non inviata:', data);
    return;
  }
  const missing = Object.keys(fields).filter(k => isPlaceholder(fields[k]));
  if (missing.length) console.warn('[MBI] campi non ancora collegati al form, non inviati:', missing.join(', '));
  const body = new URLSearchParams();
  Object.keys(fields).forEach(k => {
    if (!isPlaceholder(fields[k])) body.append(fields[k], data[k] == null ? '' : String(data[k]));
  });
  // no-cors: Google Forms non risponde in modo leggibile, ma registra la riga.
  // keepalive: la riga parte anche se la pagina viene chiusa subito dopo.
  fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true,
               headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
               body: body.toString() })
    .catch(err => console.error('[MBI] invio non riuscito:', err));
}

function sendAnswer(pair, value, ms) {
  send(CONFIG.RISPOSTE_URL, CONFIG.RISPOSTE, {
    respondent_id: app.respondentId,
    interview_id: app.interview.id,
    gruppo: app.group,
    direzione: app.interview.direzione,
    sezione: pair.section,
    confronto: pair.id,
    outlet_a: pair.a,
    outlet_b: pair.b,
    risposta: value,
    ms_risposta: ms,
    timestamp: new Date().toISOString()
  });
}

function sendFinal() {
  const f = app.interview.final;
  const times = app.interview.times || {};
  const active = Object.values(times).reduce((a, b) => a + b, 0);
  send(CONFIG.RISPOSTE_URL, CONFIG.RISPOSTE, {
    respondent_id: app.respondentId,
    interview_id: app.interview.id,
    gruppo: app.group,
    direzione: app.interview.direzione,
    sezione: 'fine',
    confronto: 'fine',
    risposta: 'completato',
    sicurezza: f.sicurezza || '',
    freq_tg: f.freq_tg || '',
    freq_talk: f.freq_talk || '',
    freq_web: f.freq_web || '',
    inizio: app.interview.started,
    durata_sec: Math.round((Date.now() - Date.parse(app.interview.started)) / 1000),
    durata_attiva_sec: Math.round(active / 1000),
    timestamp: new Date().toISOString()
  });
}

function sendEmail(email) {
  send(CONFIG.EMAIL_URL, CONFIG.EMAIL, {
    email: email,
    gruppo: app.group,
    interview_id: app.interview.id,
    respondent_id: app.respondentId,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// GENERAZIONE DELLE COPPIE
// ============================================================================
// Dentro una sezione ogni outlet compare una volta prima che un altro compaia
// due volte: le coppie si formano scorrendo una permutazione casuale, e solo
// quando la permutazione e' esaurita se ne apre un'altra. Nessuna coppia si
// ripete nello stesso questionario. Fra questionari diversi le permutazioni
// cambiano, quindi ogni outlet compare con la stessa frequenza attesa e il grafo
// dei confronti resta connesso. Nella sezione mista i due outlet di una coppia
// sono sempre di tipo diverso.

function makePairs(items, n, compatible) {
  const pairs = [];
  const used = new Set();
  let pool = [];
  let guard = 0;
  while (pairs.length < n && guard < 500) {
    guard++;
    if (pool.length < 2) pool = pool.concat(shuffle(items));
    const a = pool.shift();
    const idx = pool.findIndex(b => b.codename !== a.codename && compatible(a, b) &&
                                    !used.has([a.codename, b.codename].sort().join('|')));
    if (idx < 0) continue;
    const b = pool.splice(idx, 1)[0];
    used.add([a.codename, b.codename].sort().join('|'));
    // posizione a schermo casuale
    pairs.push(Math.random() < 0.5 ? [a, b] : [b, a]);
  }
  return pairs;
}

function generatePairs(outlets) {
  const all = [];
  CONFIG.SECTIONS.forEach(section => {
    const items = section.type === 'mixed'
      ? outlets.filter(o => o.mixed === '1')
      : outlets.filter(o => o.type === section.type);
    const compatible = section.type === 'mixed' ? (a, b) => a.type !== b.type : () => true;
    makePairs(items, section.n, compatible).forEach((p, i) => {
      all.push({ section: section.type, id: section.type + '-' + (i + 1), a: p[0].codename, b: p[1].codename });
    });
  });
  return all;
}

// ============================================================================
// STATO
// ============================================================================

const app = {
  group: 'altro',
  respondentId: null,
  outlets: [],
  byCode: {},
  interview: null,
  advanceTimer: null,
  shownAt: 0
};

function newInterview() {
  return {
    id: newId(),
    direzione: Math.random() < 0.5 ? 'sinistra' : 'destra',
    group: app.group,
    pairs: [],
    answers: {},
    index: 0,
    final: {},
    times: {},
    started: null
  };
}

function saveInterview() {
  store.set('sessionStorage', 'mbi_intervista', JSON.stringify(app.interview));
}

function loadInterview() {
  const saved = store.get('sessionStorage', 'mbi_intervista');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return parsed.group === app.group && parsed.pairs && parsed.pairs.length ? parsed : null;
  } catch (e) { return null; }
}

async function loadOutlets() {
  if (app.outlets.length) return true;
  try {
    const res = await fetch(CONFIG.CSV_PATH, { cache: 'no-cache' });
    if (!res.ok) throw new Error('CSV non trovato');
    app.outlets = parseCSV(await res.text());
    app.outlets.forEach(o => { app.byCode[o.codename] = o; });
    return app.outlets.length > 0;
  } catch (e) {
    console.error('[MBI] errore nel caricare gli outlet:', e);
    return false;
  }
}

// ============================================================================
// SCHERMATA DEI CONFRONTI
// ============================================================================

function directionText() {
  return 'più orientato a ' + app.interview.direzione;
}

function currentPair() { return app.interview.pairs[app.interview.index]; }

function sectionInfo(type) { return CONFIG.SECTIONS.find(s => s.type === type); }

function outletButton(code, side) {
  const o = app.byCode[code];
  const n = splitName(o.name);
  const btn = document.createElement('button');
  btn.className = 'outlet';
  btn.dataset.code = code;
  btn.dataset.side = side;
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = (o.pic ? '<img alt="" src="' + o.pic + '">' : '') +
    '<span class="outlet-name"></span>' + (n.net ? '<span class="outlet-net"></span>' : '');
  btn.querySelector('.outlet-name').textContent = n.main;
  if (n.net) btn.querySelector('.outlet-net').textContent = n.net;
  btn.addEventListener('click', () => answer(code));
  return btn;
}

function renderComparison() {
  const iv = app.interview;
  const pair = currentPair();
  const section = sectionInfo(pair.section);
  const inSection = iv.pairs.filter(p => p.section === pair.section);
  const position = inSection.findIndex(p => p.id === pair.id) + 1;

  $('progress-bar').style.width = (100 * iv.index / iv.pairs.length) + '%';
  $('section-title').textContent = section.title;
  $('comparison-counter').textContent = 'Confronto ' + (iv.index + 1) + ' di ' + iv.pairs.length;
  $('section-note').textContent = section.note || '';
  $('section-note').classList.toggle('hidden', !(section.note && position === 1));

  $('question').innerHTML = 'Quale dei due è <strong></strong>?';
  $('question').querySelector('strong').textContent = directionText();

  const box = $('pair');
  box.innerHTML = '';
  box.appendChild(outletButton(pair.a, 'a'));
  box.appendChild(outletButton(pair.b, 'b'));

  markSelection();
  $('prev-btn').disabled = iv.index === 0;
  app.shownAt = performance.now();
}

function markSelection() {
  const value = app.interview.answers[currentPair().id];
  document.querySelectorAll('.outlet').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.code === value)));
  $('eq-btn').setAttribute('aria-pressed', String(value === 'uguali'));
  $('dk-btn').setAttribute('aria-pressed', String(value === 'nonso'));
  $('next-btn').classList.toggle('hidden', value == null);
}

function answer(value) {
  const iv = app.interview;
  const pair = currentPair();
  const ms = Math.round(performance.now() - app.shownAt);
  iv.answers[pair.id] = value;
  iv.times = iv.times || {};
  iv.times[pair.id] = ms;
  saveInterview();
  sendAnswer(pair, value, ms);
  markSelection();
  clearTimeout(app.advanceTimer);
  const indexAtClick = iv.index;
  app.advanceTimer = setTimeout(() => { if (iv.index === indexAtClick) goNext(); }, CONFIG.AUTO_ADVANCE_MS);
}

function goNext() {
  const iv = app.interview;
  if (iv.answers[currentPair().id] == null) return;
  if (iv.index < iv.pairs.length - 1) {
    iv.index++;
    saveInterview();
    renderComparison();
  } else {
    showFinal();
  }
}

function goPrevious() {
  clearTimeout(app.advanceTimer);
  if (app.interview.index > 0) {
    app.interview.index--;
    saveInterview();
    renderComparison();
  }
}

function onKey(e) {
  if ($('screen-survey').classList.contains('hidden')) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const pair = currentPair();
  if (e.key === 'ArrowLeft') { e.preventDefault(); answer(pair.a); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); answer(pair.b); }
  else if (e.key === 'u' || e.key === 'U') { answer('uguali'); }
  else if (e.key === 'n' || e.key === 'N') { answer('nonso'); }
}

// ============================================================================
// DOMANDE FINALI E FINE
// ============================================================================

function buildChoices() {
  document.querySelectorAll('#screen-final .choices').forEach(box => {
    const name = box.dataset.name;
    const options = name === 'sicurezza' ? FINAL_QUESTIONS.sicurezza : FINAL_QUESTIONS.freq;
    box.innerHTML = '';
    options.forEach(([value, label]) => {
      const l = document.createElement('label');
      l.innerHTML = '<input type="radio"><span></span>';
      const input = l.querySelector('input');
      input.name = name;
      input.value = value;
      l.querySelector('span').textContent = label;
      input.addEventListener('change', () => { app.interview.final[name] = value; saveInterview(); });
      box.appendChild(l);
    });
  });
}

function showFinal() {
  buildChoices();
  Object.entries(app.interview.final).forEach(([name, value]) => {
    const input = document.querySelector('#screen-final input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  });
  show('screen-final');
}

function finish() {
  sendFinal();
  const done = parseInt(store.get('localStorage', 'mbi_completati') || '0', 10) + 1;
  store.set('localStorage', 'mbi_completati', String(done));
  store.remove('sessionStorage', 'mbi_intervista');

  $('end-count').textContent = done === 1
    ? 'Da questo browser hai completato 1 questionario.'
    : 'Da questo browser hai completato ' + done + ' questionari.';
  $('prize-text').textContent = CONFIG.GROUPS[app.group].prize;
  $('email-input').value = store.get('localStorage', 'mbi_email') || '';
  $('email-block').classList.remove('hidden');
  $('email-done').classList.add('hidden');
  $('email-error').classList.add('hidden');
  show('screen-end');
}

function submitEmail() {
  const email = $('email-input').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    $('email-error').classList.remove('hidden');
    $('email-input').focus();
    return;
  }
  sendEmail(email);
  store.set('localStorage', 'mbi_email', email);
  $('email-block').classList.add('hidden');
  $('email-done').classList.remove('hidden');
}

// ============================================================================
// AVVIO
// ============================================================================

async function startInterview() {
  show('screen-loading');
  if (!(await loadOutlets())) { show('screen-error'); return; }
  if (!app.interview.pairs.length) app.interview.pairs = generatePairs(app.outlets);
  if (!app.interview.started) app.interview.started = new Date().toISOString();
  saveInterview();
  show('screen-survey');
  renderComparison();
}

function anotherInterview() {
  app.interview = newInterview();
  startInterview();
}

function init() {
  const g = new URLSearchParams(window.location.search).get('g');
  app.group = (g === 'studenti' || g === 'colleghi') ? g : 'altro';

  app.respondentId = store.get('localStorage', 'mbi_rispondente');
  if (!app.respondentId) {
    app.respondentId = newId();
    store.set('localStorage', 'mbi_rispondente', app.respondentId);
  }

  $('consent-check').addEventListener('change', e => { $('consent-btn').disabled = !e.target.checked; });
  $('consent-btn').addEventListener('click', () => {
    store.set('sessionStorage', 'mbi_consenso', '1');
    startInterview();
  });
  $('eq-btn').addEventListener('click', () => answer('uguali'));
  $('dk-btn').addEventListener('click', () => answer('nonso'));
  $('prev-btn').addEventListener('click', goPrevious);
  $('next-btn').addEventListener('click', goNext);
  $('final-back-btn').addEventListener('click', () => { show('screen-survey'); renderComparison(); });
  $('final-btn').addEventListener('click', finish);
  $('email-btn').addEventListener('click', submitEmail);
  $('email-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitEmail(); });
  $('again-btn').addEventListener('click', anotherInterview);
  document.addEventListener('keydown', onKey);

  // un questionario interrotto in questa scheda riprende da dove era rimasto
  const saved = loadInterview();
  if (saved) {
    app.interview = saved;
    startInterview();
    return;
  }

  app.interview = newInterview();
  if (store.get('sessionStorage', 'mbi_consenso') === '1') {
    startInterview();
  } else {
    $('consent-direction').textContent = directionText();
    show('screen-consent');
  }
}

document.addEventListener('DOMContentLoaded', init);
