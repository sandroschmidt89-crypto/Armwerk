'use strict';
/* Armwerk – App-Logik (ohne Abhängigkeiten) */

const KEY = 'armwerk.v1', DRAFT = 'armwerk.draft';
const UNI = { row: true, wrist: true };
const H48 = 48 * 3600 * 1000;
const $app = document.getElementById('app');
const $tabs = document.getElementById('tabbar');

/* ---------- Speicher ---------- */
const defaults = () => ({ v: 1, sessions: [], level: 1, levelProg: 0, body: [], startTs: null, intro: false, prefs: { sound: true, vibrate: true } });
let S = load();
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && Array.isArray(r.sessions)) return Object.assign(defaults(), r, { prefs: Object.assign(defaults().prefs, r.prefs || {}) });
  } catch (e) {}
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Speichern nicht möglich (Browser-Speicher voll oder gesperrt)'); } }
function saveDraft() { try { if (W) localStorage.setItem(DRAFT, JSON.stringify(W)); else localStorage.removeItem(DRAFT); } catch (e) {} }
function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT)); } catch (e) { return null; } }

/* ---------- Helfer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const fmtD = ts => new Date(ts).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDT = ts => new Date(ts).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtKg = n => (Math.round(n * 10) / 10).toString().replace('.', ',') + ' kg';
const num = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const mmss = ms => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lvl = () => LEVELS[Math.min(S.level, 4) - 1];
const repsOf = (ex, L = lvl()) => ex.reps || L.reps;
const setsOf = (ex, L = lvl()) => ex.cap ? Math.min(ex.cap, L.sets) : L.sets;
const weekKey = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  log: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
};

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function modal({ title, body, actions }) {
  const o = document.createElement('div'); o.className = 'overlay';
  o.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2 style="margin-top:0">${esc(title)}</h2><div>${body || ''}</div><div class="actions"></div></div>`;
  const box = $('.actions', o);
  (actions || [{ label: 'OK', primary: true }]).forEach(a => {
    const b = document.createElement('button');
    b.className = a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : '';
    b.textContent = a.label;
    b.onclick = () => { o.remove(); if (a.fn) a.fn(); };
    box.appendChild(b);
  });
  o.addEventListener('click', e => { if (e.target === o) o.remove(); });
  document.body.appendChild(o);
  const f = $('button', box); if (f) f.focus();
  return o;
}

/* ---------- Auswertung / Plan ---------- */
const sessionsDone = () => S.sessions.filter(s => s.completed);
function lastSession() { const d = sessionsDone(); return d[d.length - 1] || null; }
function nextType() { const l = lastSession(); return !l ? 'A' : l.type === 'A' ? 'B' : 'A'; }
function lastEntries(exId) {
  const d = sessionsDone();
  for (let i = d.length - 1; i >= 0; i--) {
    const es = d[i].entries.filter(e => e.ex === exId);
    if (es.length) return { session: d[i], entries: es };
  }
  return null;
}
function suggestWeight(exId) {
  const ex = EX[exId]; if (ex.bw) return { w: 0, note: '' };
  const l = lastEntries(exId);
  if (!l) return { w: ex.startWeight, note: 'Startgewicht – lieber zu leicht als zu schwer.' };
  const top = Math.max(...l.entries.map(e => e.weight));
  const reps = repsOf(ex);
  const allTop = l.entries.every(e => e.reps >= reps[1]);
  const hard = l.entries.some(e => e.effort === 'hart');
  const tol = l.session.tolerance;
  if (tol === 'stark' || tol === 'schmerz') return { w: Math.max(ex.startWeight, top - ex.step), note: 'Nach starkem Muskelkater bewusst etwas leichter.' };
  if (allTop && !hard && tol === 'gut') return { w: top + ex.step, note: 'Alle Wiederholungen geschafft und gut vertragen – kleine Steigerung möglich.' };
  return { w: top, note: 'Gewicht beibehalten.' };
}
function estMinutes(type, L = lvl()) {
  let s = 120; // Aufwärmen
  const ids = TRAININGS[type].ex;
  ids.forEach((id, i) => {
    const ex = EX[id], n = setsOf(ex, L);
    for (let k = 0; k < n; k++) {
      s += UNI[id] ? 80 : 40;
      const last = i === ids.length - 1 && k === n - 1;
      if (!last) s += ex.rest;
    }
  });
  return Math.round(s / 60);
}
function weekInfo() {
  if (!S.startTs) return 1;
  return Math.min(8, Math.floor((Date.now() - S.startTs) / (7 * 864e5)) + 1);
}

/* ---------- Navigation ---------- */
let V = { name: 'home', arg: null }, W = null, tick = null, wake = null;
function nav(name, arg) { V = { name, arg: arg || null }; render(); window.scrollTo(0, 0); }
function render() {
  const inWo = V.name === 'workout';
  $app.className = inWo ? 'workout' : '';
  $tabs.classList.toggle('hide', inWo);
  const fn = VIEWS[V.name] || VIEWS.home;
  $app.innerHTML = fn(V.arg);
  const tab = ({ home: 'home', exlist: 'exlist', exdetail: 'exlist', log: 'log', progress: 'progress', more: 'more', nutrition: 'more', settings: 'more', safety: 'more', plan: 'more' })[V.name];
  $tabs.querySelectorAll('.tab').forEach(b => b.getAttribute('data-v') === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  if (inWo) startTick();
}
$tabs.innerHTML = '<div class="tabbar-inner">' + [['home', 'Start', ICON.home], ['exlist', 'Übungen', ICON.list], ['log', 'Verlauf', ICON.log], ['progress', 'Fortschritt', ICON.chart], ['more', 'Mehr', ICON.more]]
  .map(([v, l, i]) => `<button class="tab" data-a="tab" data-v="${v}">${i}<span>${l}</span></button>`).join('') + '</div>';

/* ---------- Views ---------- */
const VIEWS = {};

VIEWS.home = () => {
  const done = sessionsDone(), nt = nextType(), L = lvl(), last = lastSession(), draft = loadDraft();
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend';
  let out = `<h1>${greet}, Sandro</h1><p class="muted">Armwerk · Stufe ${L.n}: ${L.title}</p>`;
  if (draft) out += `<div class="card accent"><h3>Training läuft noch</h3><p class="muted">${esc(TRAININGS[draft.type].name)} wurde nicht beendet.</p><div class="grid2"><button class="btn-primary" data-a="resume">Fortsetzen</button><button data-a="discard">Verwerfen</button></div></div>`;
  if (last && !last.tolerance) {
    out += `<div class="card warn"><h3>Wie hast du ${esc(TRAININGS[last.type].name)} vom ${fmtD(last.ts)} vertragen?</h3><p class="muted small">Muskelkater zeigt sich oft erst nach 1–2 Tagen. Deine Antwort bestimmt, ob die Belastung steigt.</p><div class="stack">` +
      Object.entries(TOLERANCE).map(([k, t]) => `<button class="btn-block" data-a="tol" data-k="${k}"><span><b>${t.label}</b><br><span class="muted small">${t.sub}</span></span></button>`).join('') + '</div></div>';
  }
  if (last && last.tolerance === 'schmerz') {
    out += `<div class="card danger"><h3>Schmerzen ernst nehmen</h3><p>Trainiere nicht weiter, solange du Schmerzen hast. Gib dir Ruhe, und lass anhaltende oder starke Beschwerden ärztlich abklären. Armwerk stellt keine Diagnosen.</p></div>`;
  } else if (last && last.tolerance === 'stark') {
    out += `<div class="card warn"><h3>Starker Muskelkater</h3><p>Die Stufe bleibt gleich und die Gewichte werden leichter vorgeschlagen. Starte erst, wenn der Muskelkater weitgehend weg ist.</p></div>`;
  }
  const avail = last ? last.ts + H48 : 0, wait = Date.now() < avail;
  out += `<div class="card accent"><div class="row between"><div><div class="muted small">Nächste Einheit</div><h2 style="margin:2px 0">${esc(TRAININGS[nt].name)}</h2><div class="muted">${esc(TRAININGS[nt].focus)}</div></div><span class="pill green">ca. ${estMinutes(nt)} Min</span></div>`;
  if (wait) out += `<p class="muted small" style="margin-top:10px">Erholung: frühestens ab ${fmtDT(avail)} sinnvoll (mind. 48 Std. Abstand).</p>`;
  out += `<div style="margin-top:14px"><button class="btn-primary btn-big" data-a="start" data-t="${nt}">${esc(TRAININGS[nt].name)} starten</button></div></div>`;
  const other = nt === 'A' ? 'B' : 'A';
  out += `<div class="grid2"><button data-a="start" data-t="A">Training A starten</button><button data-a="start" data-t="B">Training B starten</button></div>`;
  const wk = weekKey(Date.now()), thisWeek = done.filter(s => weekKey(s.ts) >= wk).length;
  const pct = Math.min(100, Math.round(S.levelProg / 4 * 100));
  out += `<h2>Fortschritt</h2><div class="card"><div class="grid2"><div class="stat"><b>${done.length}</b><span>Einheiten gesamt</span></div><div class="stat"><b>${thisWeek}/2</b><span>diese Woche</span></div></div>
  <div style="margin-top:16px"><div class="row between small muted"><span>Stufe ${L.n} von 4 · ${L.weeks}</span><span>${S.level >= 4 && S.levelProg >= 4 ? 'Ziel erreicht' : S.levelProg + '/4 gut vertragen'}</span></div><div class="progress" style="margin-top:6px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div>
  <p class="small muted" style="margin:12px 0 0">${esc(L.note)}</p></div>`;
  return out;
};

VIEWS.exlist = () => {
  const grp = t => `<div class="card"><h3>${TRAININGS[t].name}</h3><p class="muted small">${esc(TRAININGS[t].focus)}</p><ul class="list">` +
    TRAININGS[t].ex.map(id => `<li><button class="item" data-a="ex" data-id="${id}"><span><b>${esc(EX[id].name)}</b><br><span class="muted small">${esc(EX[id].muscles.main.join(', '))}</span></span><span class="chev">›</span></button></li>`).join('') + '</ul></div>';
  return `<h1>Übungen</h1><p class="muted">Alle Übungen funktionieren ohne Bank und Geräte.</p>${grp('A')}${grp('B')}`;
};

function exDetailHtml(id) {
  const e = EX[id], L = lvl(), r = repsOf(e), n = setsOf(e), sg = suggestWeight(id);
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(e.video);
  const li = a => '<ul class="bul">' + a.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
  return `<h1>${esc(e.name)}</h1>
  <div class="row" style="flex-wrap:wrap;gap:6px"><span class="pill green">${esc(e.muscles.main.join(' · '))}</span>${e.muscles.assist.map(m => `<span class="pill">${esc(m)}</span>`).join('')}</div>
  <div class="card"><h3>Kurz erklärt</h3>${li(e.quick)}
  <a class="btn btn-block" href="${url}" target="_blank" rel="noopener noreferrer">▶ Videos zur Übung ansehen (YouTube-Suche)</a>
  <p class="small muted" style="margin:8px 0 0">Die komplette Anleitung steht unten in der App. Das Video ist nur eine Ergänzung und braucht Internet.</p></div>
  <div class="card"><h3>Ausgangsposition</h3><p>${esc(e.setup)}</p></div>
  <div class="card"><h3>Schritt für Schritt</h3><ol class="steps">${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
  <div class="card"><h3>Atmung</h3><p>${esc(e.breathing)}</p><h3>Bewegungsausführung</h3><p>${esc(e.execution)}</p></div>
  <div class="card"><h3>Typische Fehler</h3>${li(e.mistakes)}</div>
  <div class="card warn"><h3>Verletzungsvermeidung</h3>${li(e.safety)}<p class="small" style="margin:0">Bei Schmerzen: sofort aufhören. Nicht „durchbeißen“.</p></div>
  <div class="card"><h3>Sätze, Wiederholungen, Pause</h3><dl class="kv"><dt>Aktuell</dt><dd>${n} Satz${n > 1 ? 'e' : ''} × ${r[0]}–${r[1]} Wdh.${UNI[id] ? ' (je Seite)' : ''}</dd><dt>Pause</dt><dd>ca. ${e.rest} Sekunden</dd><dt>Gewicht</dt><dd>${e.bw ? 'Körpergewicht' : 'Vorschlag: ' + fmtKg(sg.w)}</dd></dl><p class="small muted" style="margin:10px 0 0">${esc(e.weightGuide)}</p></div>`;
}
VIEWS.exdetail = id => `<button class="back" data-a="go" data-v="exlist">‹ Übungen</button>${exDetailHtml(id)}`;

VIEWS.log = () => {
  const d = [...S.sessions].reverse();
  if (!d.length) return '<h1>Verlauf</h1><div class="card"><p class="muted">Noch kein Training gespeichert. Nach deiner ersten Einheit erscheint sie hier.</p></div>';
  return '<h1>Verlauf</h1>' + d.map(s => {
    const by = {}; s.entries.forEach(e => (by[e.ex] = by[e.ex] || []).push(e));
    const dur = s.durationSec ? Math.max(1, Math.round(s.durationSec / 60)) + ' Min' : '';
    return `<div class="card"><div class="row between"><div><b>${esc(TRAININGS[s.type].name)}</b><div class="muted small">${fmtDT(s.ts)}${dur ? ' · ' + dur : ''}${s.completed ? '' : ' · abgebrochen'}</div></div>${s.tolerance ? `<span class="pill">${esc(TOLERANCE[s.tolerance].label)}</span>` : ''}</div>
    <ul class="list" style="margin-top:10px">${Object.entries(by).map(([id, es]) => `<li style="padding:9px 0"><b>${esc(EX[id].name)}</b><br><span class="muted small">${es.map(e => (EX[id].bw ? '' : num(e.weight) + ' kg × ') + e.reps + (e.effort ? ' (' + e.effort + ')' : '')).join(' · ')}</span></li>`).join('')}</ul>
    <button class="btn-ghost small" data-a="delsess" data-id="${s.id}" style="min-height:44px">Eintrag löschen</button></div>`;
  }).join('');
};

function lineChart(pts, unit) {
  if (pts.length < 1) return '<p class="muted small" style="padding:10px">Noch keine Daten.</p>';
  const w = 320, h = 150, p = { l: 38, r: 12, t: 12, b: 22 };
  let ys = pts.map(q => q.y), mn = Math.min(...ys), mx = Math.max(...ys);
  if (mn === mx) { mn -= 1; mx += 1; }
  const pad = (mx - mn) * 0.15; mn -= pad; mx += pad;
  const X = i => p.l + (pts.length === 1 ? (w - p.l - p.r) / 2 : i * (w - p.l - p.r) / (pts.length - 1));
  const Y = v => p.t + (1 - (v - mn) / (mx - mn)) * (h - p.t - p.b);
  let g = '';
  for (let i = 0; i < 3; i++) { const v = mn + (mx - mn) * i / 2, y = Y(v); g += `<line class="gridl" x1="${p.l}" x2="${w - p.r}" y1="${y}" y2="${y}"/><text x="${p.l - 6}" y="${y + 4}" text-anchor="end">${num(v)}</text>`; }
  const path = pts.map((q, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(q.y).toFixed(1)).join(' ');
  const first = pts[0].x, last = pts[pts.length - 1].x;
  return `<div class="diagram"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Verlauf in ${unit}">${g}<path class="ln" d="${path}"/>${pts.map((q, i) => `<circle class="dot" cx="${X(i).toFixed(1)}" cy="${Y(q.y).toFixed(1)}" r="4"/>`).join('')}<text x="${p.l}" y="${h - 4}">${first}</text><text x="${w - p.r}" y="${h - 4}" text-anchor="end">${pts.length > 1 ? last : ''}</text></svg></div>`;
}
function weekBars() {
  const done = sessionsDone(), now = weekKey(Date.now()), weeks = [];
  for (let i = 7; i >= 0; i--) weeks.push(now - i * 7 * 864e5);
  const cnt = weeks.map(w => done.filter(s => weekKey(s.ts) === w).length);
  const w = 320, h = 130, bw = 24, gap = (w - 24 - 8 * bw) / 7, mx = Math.max(2, ...cnt);
  const bars = cnt.map((c, i) => { const x = 12 + i * (bw + gap), bh = c / mx * (h - 40); return `<rect class="bar" x="${x}" y="${h - 22 - bh}" width="${bw}" height="${Math.max(bh, c ? 3 : 0)}" rx="5"/><text x="${x + bw / 2}" y="${h - 6}" text-anchor="middle">${new Date(weeks[i]).getDate()}.${new Date(weeks[i]).getMonth() + 1}.</text>${c ? `<text x="${x + bw / 2}" y="${h - 26 - bh}" text-anchor="middle" style="fill:var(--text)">${c}</text>` : ''}`; }).join('');
  return `<div class="diagram"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Einheiten pro Woche">${bars}</svg></div>`;
}
let progEx = 'curl';
VIEWS.progress = () => {
  const done = sessionsDone();
  const ex = EX[progEx];
  const per = done.map(s => ({ s, es: s.entries.filter(e => e.ex === progEx) })).filter(q => q.es.length);
  const wPts = per.map(q => ({ x: fmtD(q.s.ts).slice(4, 10), y: Math.max(...q.es.map(e => e.weight)) }));
  const rPts = per.map(q => ({ x: fmtD(q.s.ts).slice(4, 10), y: q.es.reduce((a, e) => a + e.reps, 0) / q.es.length }));
  const body = [...S.body].sort((a, b) => a.ts - b.ts).map(b => ({ x: fmtD(b.ts).slice(4, 10), y: b.kg }));
  const opts = Object.keys(EX).map(id => `<option value="${id}" ${id === progEx ? 'selected' : ''}>${esc(EX[id].name)}</option>`).join('');
  const wk = weekKey(Date.now()), recent = done.filter(s => s.ts >= wk - 21 * 864e5).length;
  return `<h1>Fortschritt</h1>
  <div class="card"><div class="grid2"><div class="stat"><b>${done.length}</b><span>Einheiten</span></div><div class="stat"><b>${num(recent / 4)}</b><span>pro Woche (4 Wochen)</span></div></div></div>
  <h2>Einheiten pro Woche</h2>${weekBars()}
  <h2>Übung</h2><label class="sr" for="pe">Übung wählen</label><select id="pe" data-a="progex">${opts}</select>
  ${ex.bw ? '' : `<h3 style="margin-top:16px">Gewicht (kg, höchstes pro Einheit)</h3>${lineChart(wPts, 'kg')}`}
  <h3 style="margin-top:16px">Wiederholungen (Ø pro Satz)</h3>${lineChart(rPts, 'Wiederholungen')}
  <h2>Körpergewicht (optional)</h2>${lineChart(body, 'kg')}
  <div class="card"><div class="row"><input id="bw" type="text" inputmode="decimal" placeholder="z. B. 90,3" aria-label="Körpergewicht in kg"><button class="btn-primary" data-a="addbody">Speichern</button></div>
  ${S.body.length ? `<p class="small muted" style="margin:10px 0 0">Letzter Wert: ${fmtKg(S.body[S.body.length - 1].kg)} (${fmtD(S.body[S.body.length - 1].ts)}) · <a href="#" data-a="delbody">letzten Eintrag löschen</a></p>` : ''}</div>`;
};

VIEWS.more = () => `<h1>Mehr</h1><div class="card"><ul class="list">
${[['plan', '8-Wochen-Plan', 'Wie die Belastung langsam steigt'], ['nutrition', 'Ernährung & Regeneration', 'Protein, Kohlenhydrate, Schlaf'], ['safety', 'Sicherheit', 'Schmerzen, Aufwärmen, Hinweise'], ['settings', 'Einstellungen & Daten', 'Ton, Export, Import']]
  .map(([v, t, s]) => `<li><button class="item" data-a="go" data-v="${v}"><span><b>${t}</b><br><span class="muted small">${s}</span></span><span class="chev">›</span></button></li>`).join('')}</ul></div>`;

VIEWS.plan = () => {
  const wk = weekInfo();
  const rows = LEVELS.map(L => `<div class="wk ${L.n === S.level ? 'now' : ''}"><div><b>${L.weeks}</b><br><span class="muted small">Stufe ${L.n}</span></div><div><b>${L.title}</b> · ${L.sets} Satz${L.sets > 1 ? 'e' : ''} × ${L.reps[0]}–${L.reps[1]}<br><span class="small muted">${esc(L.note)}</span></div></div>`).join('');
  return `<button class="back" data-a="go" data-v="more">‹ Mehr</button><h1>8-Wochen-Plan</h1>
  <p class="muted">Du trainierst 2× pro Woche (z. B. Mo und Do), abwechselnd A und B, mit mindestens 48 Stunden Pause. ${S.startTs ? `Du bist in Woche ${wk}.` : ''}</p>
  <div class="weekgrid">${rows}</div>
  <div class="card"><h3>So steigt die Belastung</h3><ul class="bul"><li>Nach jeder Einheit gibst du am nächsten Trainingstag an, wie du sie vertragen hast.</li><li>Nur nach vier gut vertragenen Einheiten geht es zur nächsten Stufe.</li><li>Bei deutlichem Muskelkater bleibt die Stufe gleich, bei starkem Muskelkater oder Schmerzen gibt es leichtere Gewichte und eine Pause.</li><li>Gewichte steigen nur in kleinen Schritten (0,5 kg) und nur, wenn alle Wiederholungen sauber waren.</li><li>Die Stufen dienen als Orientierung. Wenn du länger Pause machen musst, bleibst du einfach auf deiner Stufe.</li></ul></div>
  <div class="card"><h3>Dein Einstieg</h3><p>Nach deinem früheren Versuch mit vier Tagen Muskelkater startest du mit sehr leichten Gewichten, nur einem Satz und bewusst weit weg vom Muskelversagen. Das ist Absicht.</p></div>
  <div class="grid2"><div class="card"><h3>Training A</h3><ul class="bul">${TRAININGS.A.ex.map(i => `<li>${esc(EX[i].name)}</li>`).join('')}</ul></div><div class="card"><h3>Training B</h3><ul class="bul">${TRAININGS.B.ex.map(i => `<li>${esc(EX[i].name)}</li>`).join('')}</ul></div></div>`;
};

VIEWS.nutrition = () => `<button class="back" data-a="go" data-v="more">‹ Mehr</button><h1>Ernährung & Regeneration</h1>
<div class="card accent"><div class="row between"><div><div class="muted small">Dein Orientierungswert</div><div style="font-size:34px;font-weight:700">≈ 150 g Protein</div><div class="muted small">pro Tag · Spanne 145–180 g (bei 90,3 kg)</div></div></div></div>
<div class="card"><h3>Warum Protein?</h3><p>Muskeln wachsen aus dem Training, dem Reiz und genügend Baustoffen. Protein liefert die Aminosäuren für Reparatur und Aufbau. Als Richtwert gelten etwa 1,6–2,0 g pro kg Körpergewicht.</p></div>
<div class="card"><h3>Das Tagesprotein zählt</h3><p>Das Gesamtprotein über den Tag ist wichtiger als ein enges „Anabolic Window“. Verteile es auf 3–4 Mahlzeiten mit je etwa 30–45 g, dann klappt es einfach.</p></div>
<div class="card"><h3>Kohlenhydrate</h3><p>Kohlenhydrate sind der schnelle Treibstoff für Training. Bei deinen kurzen, leichten Einheiten brauchst du nicht viel. Du musst sie nicht komplett meiden. Gemüse, Obst, Hülsenfrüchte und Vollkorn in kleinen Mengen passen gut zu deinem Ansatz.</p></div>
<div class="card"><h3>Vor dem Training</h3><p>Ein leichter Snack ein bis zwei Stunden vorher, zum Beispiel Joghurt oder Quark mit Obst oder eine Banane. Nicht mit sehr vollem Magen trainieren. Dazu ein Glas Wasser.</p></div>
<div class="card"><h3>Nach dem Training</h3><p>Eine proteinreiche Mahlzeit innerhalb der nächsten paar Stunden, etwa Eier, Fleisch, Fisch, Skyr oder Quark, dazu Gemüse und bei Bedarf eine Portion Kohlenhydrate.</p></div>
<div class="card"><h3>Schlaf & Regeneration</h3><p>Muskeln wachsen in der Erholung, nicht beim Training. Plane 7–9 Stunden Schlaf ein, halte die 48 Stunden Pause ein und bewege dich an freien Tagen locker, etwa mit Spazierengehen. Das hilft auch gegen die vielen Sitzstunden im Büro.</p></div>
<p class="small muted">Allgemeine Hinweise, keine individuelle Ernährungsberatung. Bei Vorerkrankungen (z. B. Nieren) sprich Mengen vorher mit einer Ärztin oder einem Arzt ab.</p>`;

VIEWS.safety = () => `<button class="back" data-a="go" data-v="more">‹ Mehr</button><h1>Sicherheit</h1>
<div class="card danger"><h3>Bei Schmerzen: aufhören</h3><p>Brich bei stechenden Schmerzen, Schmerzen in Gelenken oder Rücken, Schwindel oder Taubheit sofort ab. Armwerk fordert dich dann nie zum Weitermachen auf. Lass anhaltende Beschwerden ärztlich abklären.</p></div>
<div class="card"><h3>Dein Rücken und dein Knie</h3><ul class="bul"><li>Alle Übungen laufen im Sitzen oder abgestützt – keine Kniebeugen, Ausfallschritte oder Kreuzheben.</li><li>Immer Rücken an der Lehne oder gerade, kein Hohlkreuz.</li><li>Beim Rudern und bei der Reverse-Fly höher abstützen bzw. aufrechter sitzen, wenn der untere Rücken zieht.</li></ul></div>
<div class="card"><h3>Grundregeln</h3><ul class="bul"><li>Kontrolliert und ohne Schwung bewegen.</li><li>Kein Muskelversagen: Am Satzende bleiben noch einige Wiederholungen übrig.</li><li>Atme gleichmäßig, halte nicht die Luft an.</li><li>Stabile Sitzgelegenheit und rutschfester Untergrund.</li><li>Erhöhe das Gewicht nur in kleinen Schritten.</li></ul></div>
<p class="small muted">Armwerk ersetzt keine ärztliche oder physiotherapeutische Beratung und stellt keine Diagnosen. Besprich neue Trainingsprogramme bei bekannten Beschwerden im Zweifel mit deiner Ärztin oder deinem Arzt.</p>`;

VIEWS.settings = () => `<button class="back" data-a="go" data-v="more">‹ Mehr</button><h1>Einstellungen</h1>
<div class="card"><label class="sw"><span>Signalton bei Pausenende</span><input type="checkbox" data-a="pref" data-k="sound" ${S.prefs.sound ? 'checked' : ''}></label>
<label class="sw"><span>Vibration (falls unterstützt)</span><input type="checkbox" data-a="pref" data-k="vibrate" ${S.prefs.vibrate ? 'checked' : ''}></label>
<button class="btn-block" data-a="testsound">Signal testen</button>
<p class="small muted" style="margin:10px 0 0">Hinweis iPhone: Der Ton ist aus, wenn der Stumm-Schalter aktiv ist. Safari auf dem iPhone unterstützt keine Vibration, dort hilft der Ton.</p></div>
<h2>Daten</h2><div class="card"><p class="muted small">Alle Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig als Datei.</p>
<div class="stack"><button class="btn-block" data-a="export">Daten exportieren (JSON)</button><button class="btn-block" data-a="import">Daten importieren (JSON)</button><input id="file" type="file" accept="application/json,.json" class="hide"><button class="btn-danger btn-block" data-a="reset">Alle Daten löschen</button></div></div>
<p class="small muted">Armwerk 1.0 · ${S.sessions.length} gespeicherte Einheiten</p>`;

/* ---------- Training ---------- */
function buildSteps(type) {
  const L = lvl(), st = [];
  TRAININGS[type].ex.forEach(id => { const n = setsOf(EX[id], L); for (let k = 1; k <= n; k++) st.push({ ex: id, set: k, of: n }); });
  return st;
}
function startWorkout(type) {
  if (W) return;
  S.startTs = S.startTs || Date.now(); save();
  W = { type, level: S.level, startTs: Date.now(), steps: buildSteps(type), idx: 0, phase: 'warmup', entries: [], cur: null, rest: null };
  saveDraft(); requestWake(); nav('workout');
}
function prepCur() {
  const st = W.steps[W.idx], ex = EX[st.ex], r = repsOf(ex, LEVELS[W.level - 1]);
  W.cur = { weight: suggestWeight(st.ex).w, reps: r[1] };
  W.curNote = suggestWeight(st.ex).note;
}
VIEWS.workout = () => {
  if (!W) return VIEWS.home();
  const total = W.steps.length;
  const head = (cancel = true) => `<div class="wo-head"><span class="wo-top">${esc(TRAININGS[W.type].name)} · ${Math.min(W.idx + 1, total)}/${total}</span>${cancel ? '<button data-a="abort" class="btn-danger" style="min-height:46px;padding:8px 14px">Schmerzen / Abbrechen</button>' : ''}</div><div class="progress" style="margin:10px 0 14px"><i style="width:${Math.round(W.idx / total * 100)}%"></i></div>`;
  if (W.phase === 'warmup') return head() + `<h1>Aufwärmen</h1><p class="muted">Etwa 2 Minuten. Das macht Gelenke und Muskeln bereit, besonders im Büroalltag.</p><div class="card"><ol class="steps">${WARMUP.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div><div class="stack"><button class="btn-primary btn-big" data-a="warmdone">Aufwärmen fertig</button><button class="btn-block btn-ghost" data-a="warmdone">Überspringen</button></div>`;
  if (W.phase === 'ex') {
    const st = W.steps[W.idx], ex = EX[st.ex], r = repsOf(ex, LEVELS[W.level - 1]), last = lastEntries(st.ex);
    const lastTxt = last ? 'Letztes Mal: ' + (ex.bw ? '' : last.entries.map(e => num(e.weight)).filter((v, i, a) => a.indexOf(v) === i).join('/') + ' kg · ') + last.entries.map(e => e.reps).join('/') + ' Wdh. (' + fmtD(last.session.ts).slice(4, 10) + ')' : 'Erste Durchführung';
    return head() + `<div class="muted small">Übung ${TRAININGS[W.type].ex.indexOf(st.ex) + 1}/${TRAININGS[W.type].ex.length} · Satz ${st.set}/${st.of}${UNI[st.ex] ? ' · je Seite' : ''}</div><h1>${esc(ex.name)}</h1>
    <div class="card target"><div class="muted small">Ziel</div><div class="big">${r[0]}–${r[1]} Wdh.${ex.bw ? '' : ' · ' + num(W.cur.weight) + ' kg'}</div><div class="muted small">${esc(lastTxt)}${W.curNote ? '<br>' + esc(W.curNote) : ''}</div></div>
    <div class="card"><div class="stepper" style="margin-bottom:12px"><button data-a="reps" data-d="-1" aria-label="Eine Wiederholung weniger">−</button><div class="val"><b id="repv">${W.cur.reps}</b><span>Wiederholungen geschafft</span></div><button data-a="reps" data-d="1" aria-label="Eine Wiederholung mehr">+</button></div>
    ${ex.bw ? '' : `<div class="stepper"><button data-a="wt" data-d="-1" aria-label="Gewicht verringern">−</button><div class="val"><b id="wtv">${num(W.cur.weight)}</b><span>kg pro Hand</span></div><button data-a="wt" data-d="1" aria-label="Gewicht erhöhen">+</button></div>`}</div>
    <button class="btn-primary btn-big" data-a="setdone">Satz abgeschlossen ✓</button>
    <div class="card"><h3>Kurz erklärt</h3><ul class="bul" style="margin:0">${ex.quick.map(q => `<li>${esc(q)}</li>`).join('')}</ul><button class="btn-block btn-ghost" data-a="wdetail" style="margin-top:8px">Komplette Anleitung</button></div>
    <div class="row between" style="margin-top:4px"><button class="btn-ghost" data-a="skipex">Übung überspringen</button><span class="muted small">Pause danach: ${ex.rest} s</span></div>`;
  }
  if (W.phase === 'rest') {
    const nx = W.steps[W.idx], nex = EX[nx.ex], le = W.entries[W.entries.length - 1];
    return head() + `<h1 style="text-align:center">Pause</h1>
    <div class="ring" aria-live="off"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="ringfg" cx="50" cy="50" r="44" stroke-dasharray="276.46" stroke-dashoffset="0"/></svg><div class="time"><b id="tm">--:--</b><span id="tmsub">läuft</span></div></div>
    <div class="grid2" style="margin-bottom:12px"><button data-a="rtoggle" id="rtoggle">Pause</button><button data-a="rreset">Zurücksetzen</button></div>
    <div class="grid2"><button data-a="radd">+15 s</button><button data-a="rskip">Pause beenden</button></div>
    <div class="card" style="margin-top:14px"><div class="muted small">Anstrengung des letzten Satzes (optional)</div><div class="chips" style="margin-top:8px">${[['leicht', 'Leicht'], ['passend', 'Passend'], ['hart', 'Sehr hart']].map(([k, l]) => `<button class="chip" data-a="effort" data-k="${k}" aria-pressed="${le && le.effort === k}">${l}</button>`).join('')}</div></div>
    <div class="card"><div class="muted small">Als Nächstes</div><b>${esc(nex.name)}</b> · Satz ${nx.set}/${nx.of}</div>`;
  }
  if (W.phase === 'done') {
    const dur = Math.round((Date.now() - W.startTs) / 60000);
    return `<h1>Geschafft! 💪</h1><p class="muted">${esc(TRAININGS[W.type].name)} abgeschlossen.</p><div class="card"><div class="grid2"><div class="stat"><b>${Math.max(1, dur)}</b><span>Minuten</span></div><div class="stat"><b>${W.entries.length}</b><span>Sätze</span></div></div></div>
    <div class="card"><h3>Körpergewicht heute (optional)</h3><input id="bw" type="text" inputmode="decimal" placeholder="z. B. 90,3" aria-label="Körpergewicht in kg"></div>
    <div class="card"><h3>Danach</h3><p class="muted" style="margin:0">Trinke etwas und iss in den nächsten Stunden eine proteinreiche Mahlzeit. Beim nächsten Start fragt Armwerk, wie du die Einheit vertragen hast.</p></div>
    <button class="btn-primary btn-big" data-a="finish">Speichern & Fertig</button>`;
  }
};

/* Timer */
function restLeft() { const r = W.rest; return r.running ? Math.max(0, r.end - Date.now()) : r.left; }
function startRest(sec) { W.rest = { base: sec * 1000, total: sec * 1000, end: Date.now() + sec * 1000, left: sec * 1000, running: true }; W.phase = 'rest'; saveDraft(); render(); }
function startTick() { if (tick) return; tick = setInterval(onTick, 250); onTick(); }
function onTick() {
  if (!W || W.phase !== 'rest' || !W.rest) return;
  const left = restLeft(), tm = $('#tm'); if (!tm) return;
  tm.textContent = mmss(left);
  const fg = $('#ringfg'); if (fg) fg.setAttribute('stroke-dashoffset', (276.46 * (1 - left / W.rest.total)).toFixed(1));
  const sub = $('#tmsub'); if (sub) sub.textContent = W.rest.running ? 'läuft' : 'angehalten';
  const b = $('#rtoggle'); if (b) b.textContent = W.rest.running ? 'Pause' : 'Weiter';
  if (W.rest.running && left <= 0) endRest(true);
}
function endRest(signal) {
  if (!W || W.phase !== 'rest') return;
  if (signal) { beep(); buzz(); }
  W.rest = null; W.phase = 'ex'; prepCur(); saveDraft(); render(); window.scrollTo(0, 0);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { onTick(); if (W) requestWake(); } });

/* Ton & Vibration */
let AC = null;
function unlockAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
function beep() {
  if (!S.prefs.sound) return; unlockAudio(); if (!AC) return;
  [0, .28, .56].forEach((t, i) => {
    const o = AC.createOscillator(), g = AC.createGain(), n = AC.currentTime + t;
    o.type = 'sine'; o.frequency.value = i === 2 ? 1175 : 880;
    g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.4, n + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.22);
    o.connect(g); g.connect(AC.destination); o.start(n); o.stop(n + 0.25);
  });
}
function buzz() { if (S.prefs.vibrate && navigator.vibrate) try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (e) {} }
async function requestWake() { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { wake = null; } }
function releaseWake() { try { if (wake) wake.release(); } catch (e) {} wake = null; }

function endWorkout() { W = null; saveDraft(); releaseWake(); if (tick) { clearInterval(tick); tick = null; } }
function storeSession(completed) {
  if (!W.entries.length) return null;
  const s = { id: 's' + Date.now(), ts: W.startTs, type: W.type, level: W.level, durationSec: Math.round((Date.now() - W.startTs) / 1000), completed, tolerance: null, entries: W.entries };
  S.sessions.push(s); save(); return s;
}
function afterLastSet() {
  W.idx++;
  if (W.idx >= W.steps.length) { W.phase = 'done'; W.rest = null; saveDraft(); render(); return; }
  startRest(EX[W.steps[W.idx - 1].ex].rest);
}

/* ---------- Aktionen ---------- */
const A = {
  tab: d => nav(d.v),
  go: d => nav(d.v),
  ex: d => nav('exdetail', d.id),
  start: d => {
    unlockAudio();
    const last = lastSession(), go = () => startWorkout(d.t);
    if (loadDraft()) return toast('Es läuft noch ein Training. Bitte erst fortsetzen oder verwerfen.');
    if (last && last.tolerance === 'schmerz') return modal({ title: 'Lieber noch nicht', body: '<p>Du hast Schmerzen angegeben. Trainiere erst wieder, wenn die Schmerzen weg sind. Lass sie bei Bedarf ärztlich abklären.</p>', actions: [{ label: 'Verstanden', primary: true }, { label: 'Ich bin beschwerdefrei – trotzdem starten', fn: go }] });
    if (last && !last.tolerance) return modal({ title: 'Erst kurz beantworten', body: '<p>Bitte gib oben an, wie du das letzte Training vertragen hast. So kann die Belastung sicher angepasst werden.</p>', actions: [{ label: 'OK', primary: true }] });
    if (last && Date.now() < last.ts + H48) return modal({ title: 'Noch nicht erholt', body: `<p>Zwischen zwei Einheiten sollten mindestens 48 Stunden liegen. Besser ab ${fmtDT(last.ts + H48)}.</p>`, actions: [{ label: 'Warten', primary: true }, { label: 'Trotzdem starten', fn: go }] });
    go();
  },
  resume: () => { const d = loadDraft(); if (!d) return; W = d; unlockAudio(); requestWake(); if (W.phase === 'ex' && !W.cur) prepCur(); nav('workout'); },
  discard: () => modal({ title: 'Training verwerfen?', body: '<p>Die bisherigen Sätze dieser Einheit gehen verloren.</p>', actions: [{ label: 'Verwerfen', danger: true, fn: () => { W = null; saveDraft(); nav('home'); } }, { label: 'Abbrechen' }] }),
  tol: d => {
    const s = lastSession(); if (!s) return;
    s.tolerance = d.k;
    if (d.k === 'gut') S.levelProg++; else if (d.k === 'stark' || d.k === 'schmerz') S.levelProg = 0;
    let up = false;
    if (S.levelProg >= 4 && S.level < 4) { S.level++; S.levelProg = 0; up = true; }
    save(); render();
    toast(up ? 'Neue Stufe: ' + lvl().title : d.k === 'schmerz' ? 'Gute Besserung – gönn dir Ruhe.' : 'Danke, gespeichert.');
  },
  warmdone: () => { unlockAudio(); W.phase = 'ex'; prepCur(); saveDraft(); render(); },
  reps: d => { W.cur.reps = Math.max(0, Math.min(40, W.cur.reps + +d.d)); $('#repv').textContent = W.cur.reps; saveDraft(); },
  wt: d => { const ex = EX[W.steps[W.idx].ex], st = ex.step || .5; W.cur.weight = Math.max(0, Math.round((W.cur.weight + d.d * st) * 10) / 10); $('#wtv').textContent = num(W.cur.weight); saveDraft(); },
  wdetail: () => modal({ title: EX[W.steps[W.idx].ex].name, body: exDetailHtml(EX[W.steps[W.idx].ex].id).replace(/^<h1>.*?<\/h1>/, ''), actions: [{ label: 'Schließen', primary: true }] }),
  setdone: () => {
    unlockAudio();
    const st = W.steps[W.idx];
    W.entries.push({ ex: st.ex, set: st.set, weight: W.cur.weight, reps: W.cur.reps, effort: null, ts: Date.now() });
    afterLastSet();
  },
  skipex: () => {
    const st = W.steps[W.idx], ex = st.ex;
    while (W.idx < W.steps.length && W.steps[W.idx].ex === ex) W.idx++;
    if (W.idx >= W.steps.length) { W.phase = 'done'; saveDraft(); return render(); }
    prepCur(); saveDraft(); render();
  },
  effort: d => { const e = W.entries[W.entries.length - 1]; if (!e) return; e.effort = e.effort === d.k ? null : d.k; saveDraft(); render(); },
  rtoggle: () => { const r = W.rest; if (r.running) { r.left = Math.max(0, r.end - Date.now()); r.running = false; } else { r.end = Date.now() + r.left; r.running = true; } saveDraft(); onTick(); },
  rreset: () => { const r = W.rest; r.total = r.base || r.total; r.end = Date.now() + r.total; r.left = r.total; r.running = true; saveDraft(); onTick(); },
  radd: () => { const r = W.rest; r.total += 15000; if (r.running) r.end += 15000; else r.left += 15000; saveDraft(); onTick(); },
  rskip: () => endRest(false),
  abort: () => modal({
    title: 'Training beenden?',
    body: '<p>Bei Schmerzen: bitte aufhören und dich ausruhen. Lass anhaltende Beschwerden ärztlich abklären. Du solltest nicht weitermachen.</p>',
    actions: [{ label: 'Beenden und speichern', primary: true, fn: () => { const s = storeSession(false); endWorkout(); if (s) { s.tolerance = null; save(); } nav('home'); } }, { label: 'Beenden ohne Speichern', danger: true, fn: () => { endWorkout(); nav('home'); } }, { label: 'Zurück zum Training' }]
  }),
  finish: () => {
    const v = parseFloat(((($('#bw') || {}).value) || '').replace(',', '.'));
    const s = storeSession(true);
    if (v >= 30 && v <= 300) { S.body.push({ ts: Date.now(), kg: Math.round(v * 10) / 10 }); save(); }
    endWorkout(); nav('home'); toast(s ? 'Training gespeichert' : 'Keine Sätze zum Speichern');
  },
  delsess: d => modal({ title: 'Eintrag löschen?', body: '<p>Diese Einheit wird endgültig aus dem Verlauf entfernt.</p>', actions: [{ label: 'Löschen', danger: true, fn: () => { S.sessions = S.sessions.filter(s => s.id !== d.id); save(); render(); } }, { label: 'Abbrechen' }] }),
  progex: (d, e) => { progEx = e.target.value; render(); },
  addbody: () => {
    const v = parseFloat(($('#bw').value || '').replace(',', '.'));
    if (!(v >= 30 && v <= 300)) return toast('Bitte ein gültiges Gewicht eingeben');
    S.body.push({ ts: Date.now(), kg: Math.round(v * 10) / 10 }); save(); render();
  },
  delbody: (d, e) => { e.preventDefault(); S.body.pop(); save(); render(); },
  pref: (d, e) => { S.prefs[d.k] = e.target.checked; save(); if (d.k === 'sound' && e.target.checked) { unlockAudio(); beep(); } },
  testsound: () => { unlockAudio(); beep(); buzz(); toast(S.prefs.sound ? 'Signal gespielt' : 'Ton ist ausgeschaltet'); },
  export: () => {
    const data = JSON.stringify({ app: 'armwerk', exportedAt: new Date().toISOString(), data: S }, null, 2);
    const name = 'armwerk-' + new Date().toISOString().slice(0, 10) + '.json';
    const blob = new Blob([data], { type: 'application/json' });
    try {
      const f = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad/.test(navigator.userAgent)) { navigator.share({ files: [f], title: 'Armwerk Daten' }).catch(() => {}); return; }
    } catch (e) {}
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Export erstellt');
  },
  import: () => $('#file').click(),
  reset: () => modal({ title: 'Alle Daten löschen?', body: '<p>Alle Einheiten, Gewichte und Einstellungen werden von diesem Gerät entfernt. Das lässt sich nicht rückgängig machen. Exportiere vorher eine Sicherung.</p>', actions: [{ label: 'Alles löschen', danger: true, fn: () => { S = defaults(); W = null; save(); saveDraft(); toast('Daten gelöscht'); nav('home'); } }, { label: 'Abbrechen', primary: true }] })
};
document.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.tagName === 'SELECT' || t.type === 'checkbox') return; const f = A[t.dataset.a]; if (f) f(t.dataset, e); });
document.addEventListener('change', e => { const t = e.target.closest('[data-a]'); if (t && (t.tagName === 'SELECT' || t.type === 'checkbox')) A[t.dataset.a](t.dataset, e); });
document.addEventListener('change', e => {
  if (e.target.id !== 'file') return;
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result), d = j.data || j;
      if (!d || !Array.isArray(d.sessions)) throw new Error('Format');
      d.sessions.forEach(s => { if (!s.entries || !s.type || !TRAININGS[s.type]) throw new Error('Format'); s.entries = s.entries.filter(x => EX[x.ex]); });
      modal({ title: 'Daten importieren?', body: `<p>${d.sessions.length} Einheiten gefunden. Die aktuellen Daten auf diesem Gerät werden ersetzt.</p>`, actions: [{ label: 'Importieren', primary: true, fn: () => { S = Object.assign(defaults(), d, { prefs: Object.assign(defaults().prefs, d.prefs || {}) }); save(); toast('Import abgeschlossen'); nav('home'); } }, { label: 'Abbrechen' }] });
    } catch (err) { modal({ title: 'Import fehlgeschlagen', body: '<p>Die Datei ist keine gültige Armwerk-Sicherung.</p>' }); }
    e.target.value = '';
  };
  r.readAsText(f);
});

/* ---------- Start ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
const d0 = loadDraft(); if (d0) { /* Entwurf wird auf der Startseite angeboten */ }
render();
if (!S.intro) {
  modal({ title: 'Willkommen bei Armwerk', body: '<p>Dein Training für Arme und Schultern, zu Hause, in 20 Minuten. Alle Daten bleiben auf deinem Gerät.</p><p><b>Wichtig:</b> Bei Schmerzen sofort aufhören. Armwerk stellt keine Diagnosen und ersetzt keine ärztliche Beratung.</p>', actions: [{ label: 'Verstanden, los geht’s', primary: true, fn: () => { S.intro = true; save(); } }] });
}
