'use strict';
/* Armwerk – schlichte Strichfiguren-Animation (SVG, offline, ohne Abhängigkeiten).
   Winkel: 0° = nach unten, 90° = nach vorn (rechts), 180° = nach oben, negativ = nach hinten. */

const rad = a => a * Math.PI / 180;
const dirA = a => [Math.sin(rad(a)), Math.cos(rad(a))];
const add = (p, a, l) => { const d = dirA(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
const f1 = n => n.toFixed(1);
const C_BODY = 'var(--muted)', C_ARM = 'var(--accent)', C_DB = 'var(--text)', C_FURN = 'var(--line)';
const UA = 26, FA = 24;

function ln(a, b, c, w, o) { return `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${o ? ` opacity="${o}"` : ''}/>`; }
function circ(p, r, fill, stroke, w) { return `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="${w || 0}"/>`; }
/* Kurzhantel: kind 'end' = von der Seite (Achse zeigt zum Betrachter) oder 'bar' mit Achsenwinkel */
function dumbbell(p, kind, axis) {
  if (kind === 'end') return circ(p, 7, C_DB);
  const d = [Math.cos(rad(axis)), Math.sin(rad(axis))];
  const q = (l) => [p[0] + d[0] * l, p[1] + d[1] * l];
  return ln(q(-7), q(7), C_DB, 3.5) + ln(q(-10), q(-6), C_DB, 9) + ln(q(6), q(10), C_DB, 9);
}
function arm(S, ua, fa) {
  const E = add(S, ua, UA), H = add(E, fa, FA);
  return { E, H, svg: ln(S, E, C_ARM, 6) + ln(E, H, C_ARM, 6) };
}

/* ---------- Szenen ---------- */
const HIP = [64, 116];
function sitStatic(t) {
  const sh = [HIP[0] + 44 * Math.sin(rad(t)), HIP[1] - 44 * Math.cos(rad(t))];
  const hd = [sh[0] + 15 * Math.sin(rad(t)), sh[1] - 15 * Math.cos(rad(t))];
  const knee = [104, 116], ank = [108, 152];
  const furn = ln([50, 56], [50, 120], C_FURN, 5) + ln([50, 120], [114, 120], C_FURN, 5) + ln([54, 124], [54, 156], C_FURN, 4) + ln([110, 124], [110, 156], C_FURN, 4) + ln([20, 158], [180, 158], C_FURN, 2);
  const body = ln(HIP, knee, C_BODY, 7) + ln(knee, ank, C_BODY, 7) + ln(ank, [ank[0] + 12, ank[1]], C_BODY, 6) + ln(HIP, sh, C_BODY, 8) + circ(hd, 9, 'none', C_BODY, 4);
  return { sh, svg: furn + body };
}
function sitMoving(p, o) {
  const st = sitStatic(p.t || 0), a = arm(st.sh, p.ua, p.fa);
  return a.svg + dumbbell(a.H, o.db, o.axis);
}

function frontStatic(back) {
  const shY = back ? 88 : 72, headY = back ? 79 : 57;
  const furn = ln([72, 120], [128, 120], C_FURN, 5) + ln([76, 124], [76, 156], C_FURN, 4) + ln([124, 124], [124, 156], C_FURN, 4) + ln([20, 158], [180, 158], C_FURN, 2);
  const body = ln([92, 116], [92, 154], C_BODY, 7) + ln([108, 116], [108, 154], C_BODY, 7) + ln([100, 116], [100, shY], C_BODY, 9) + ln([83, shY], [117, shY], C_BODY, 7) + circ([100, headY], 9, back ? 'var(--card)' : 'none', C_BODY, 4);
  return { shY, svg: furn + body };
}
function frontMoving(p, o) {
  const shY = o.back ? 88 : 72;
  const mk = (sx, sgn) => {
    const E = [sx + sgn * UA * Math.sin(rad(p.ua)), shY + UA * Math.cos(rad(p.ua))];
    const H = [E[0] + sgn * FA * Math.sin(rad(p.fa)), E[1] + FA * Math.cos(rad(p.fa))];
    return ln([sx, shY], E, C_ARM, 6) + ln(E, H, C_ARM, 6) + circ(H, 6.5, C_DB);
  };
  return mk(83, -1) + mk(117, 1);
}

/* Rudern: stehend, abgestützt, Hüfte nach hinten */
const ROW = { hip: [60, 108], lean: 45, table: 122 };
function rowGeo() {
  const sh = [ROW.hip[0] + 44 * Math.sin(rad(ROW.lean)), ROW.hip[1] - 44 * Math.cos(rad(ROW.lean))];
  return { sh, hd: [sh[0] + 15 * Math.sin(rad(ROW.lean)), sh[1] - 15 * Math.cos(rad(ROW.lean))] };
}
function rowStatic() {
  const g = rowGeo(), knee = [66, 132], ank = [58, 156], hand = [g.sh[0] + 22, ROW.table - 3];
  const furn = ln([108, ROW.table], [172, ROW.table], C_FURN, 6) + ln([166, ROW.table], [166, 156], C_FURN, 5) + ln([20, 158], [180, 158], C_FURN, 2);
  const body = ln(ROW.hip, knee, C_BODY, 7) + ln(knee, ank, C_BODY, 7) + ln(ank, [ank[0] + 12, ank[1]], C_BODY, 6) + ln(ROW.hip, g.sh, C_BODY, 8) + circ(g.hd, 9, 'none', C_BODY, 4) + ln(g.sh, hand, C_BODY, 6);
  return furn + body;
}
function rowMoving(p, o) { const a = arm(rowGeo().sh, p.ua, p.fa); return a.svg + dumbbell(a.H, 'bar', 0); }

/* Schräg-Liegestütz: Körper dreht sich um die Füße, Arm per Zwei-Knochen-IK */
const PUSH = { foot: [14, 140], L: 136, hand: [140, 94], table: 94 };
function pushSolve(d) {
  let best = null;
  for (let th = 15; th <= 85; th += 0.05) {
    const s = [PUSH.foot[0] + PUSH.L * Math.cos(rad(th)), PUSH.foot[1] - PUSH.L * Math.sin(rad(th))];
    const dist = Math.hypot(s[0] - PUSH.hand[0], s[1] - PUSH.hand[1]);
    const err = Math.abs(dist - d) + (s[1] < PUSH.hand[1] ? 0 : 1000); // Schulter oberhalb der Hand
    if (!best || err < best.err) best = { err, th, s };
  }
  return best;
}
function pushFig(p) {
  const { s, th } = pushSolve(p.d), H = PUSH.hand, d = Math.hypot(H[0] - s[0], H[1] - s[1]);
  const a = (UA * UA - FA * FA + d * d) / (2 * d), h = Math.sqrt(Math.max(0, UA * UA - a * a));
  const ux = (H[0] - s[0]) / d, uy = (H[1] - s[1]) / d, base = [s[0] + ux * a, s[1] + uy * a];
  const c1 = [base[0] - uy * h, base[1] + ux * h], c2 = [base[0] + uy * h, base[1] - ux * h];
  const E = c1[0] < c2[0] ? c1 : c2;
  const dirB = [Math.cos(rad(th)), -Math.sin(rad(th))];
  const hd = [s[0] + dirB[0] * 15, s[1] + dirB[1] * 15];
  return { s, th, E, hd, arm: ln(s, E, C_ARM, 6) + ln(E, H, C_ARM, 6) };
}
function pushStatic() {
  return ln([112, PUSH.table], [176, PUSH.table], C_FURN, 6) + ln([170, PUSH.table], [170, 156], C_FURN, 5) + ln([6, 158], [180, 158], C_FURN, 2);
}
function pushMoving(p, o, full) {
  const f = pushFig(p);
  const body = ln(PUSH.foot, f.s, C_BODY, 8) + circ(f.hd, 9, 'none', C_BODY, 4);
  return (full ? body : '') + f.arm;
}

/* Handgelenk-Beugen: Unterarm liegt auf dem Oberschenkel */
function wristStatic() {
  const t = 40, sh = [HIP[0] + 44 * Math.sin(rad(t)), HIP[1] - 44 * Math.cos(rad(t))], hd = [sh[0] + 15 * Math.sin(rad(t)), sh[1] - 15 * Math.cos(rad(t))];
  const knee = [104, 116], ank = [108, 152];
  const furn = ln([50, 56], [50, 120], C_FURN, 5) + ln([50, 120], [114, 120], C_FURN, 5) + ln([54, 124], [54, 156], C_FURN, 4) + ln([110, 124], [110, 156], C_FURN, 4) + ln([20, 158], [180, 158], C_FURN, 2);
  const body = ln(HIP, knee, C_BODY, 7) + ln(knee, ank, C_BODY, 7) + ln(ank, [ank[0] + 12, ank[1]], C_BODY, 6) + ln(HIP, sh, C_BODY, 8) + circ(hd, 9, 'none', C_BODY, 4);
  return { sh, svg: furn + body };
}
function wristMoving(p) {
  const st = wristStatic(), E = add(st.sh, 8, UA), W = [E[0] + FA, E[1]], H = add(W, p.ha, 12);
  return ln(st.sh, E, C_ARM, 6) + ln(E, W, C_ARM, 6) + ln(W, H, C_ARM, 6) + circ(H, 7, C_DB);
}

/* ---------- Definitionen je Übung ---------- */
const ANIM = {
  curl:  { view: 'Seitenansicht', kind: 'sit', db: 'end', A: { t: 0, ua: 4, fa: 4 }, B: { t: 0, ua: 6, fa: 150 }, tempo: [2, 1, 3, 0.5], names: ['Anheben', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  ham:   { view: 'Seitenansicht', kind: 'sit', db: 'bar', axis: 0, A: { t: 0, ua: 4, fa: 4 }, B: { t: 0, ua: 6, fa: 150 }, tempo: [2, 1, 3, 0.5], names: ['Anheben', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  tri:   { view: 'Seitenansicht', kind: 'sit', db: 'bar', axis: 90, A: { t: 0, ua: 178, fa: 178 }, B: { t: 0, ua: 172, fa: 320 }, tempo: [3, 0.5, 2, 1], names: ['Absenken', 'Halten', 'Strecken', 'Pause'], swap: true, br: ['ein', 'ein', 'aus', 'aus'] },
  press: { view: 'Seitenansicht', kind: 'sit', db: 'end', A: { t: 0, ua: 35, fa: 178 }, B: { t: 0, ua: 176, fa: 178 }, tempo: [2, 0.5, 3, 0.5], names: ['Hochdrücken', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  lat:   { view: 'Frontansicht', kind: 'front', A: { ua: 6, fa: 4 }, B: { ua: 82, fa: 70 }, tempo: [2, 1, 3, 0.5], names: ['Anheben', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  rfly:  { view: 'Ansicht von hinten · Oberkörper vorgeneigt', kind: 'front', back: true, A: { ua: 4, fa: 4 }, B: { ua: 78, fa: 70 }, tempo: [2, 1, 3, 0.5], names: ['Öffnen', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  row:   { view: 'Seitenansicht · je Seite', kind: 'row', A: { ua: 0, fa: 0 }, B: { ua: -65, fa: -3 }, tempo: [2, 1, 3, 0.5], names: ['Heranziehen', 'Halten', 'Absenken', 'Pause'], br: ['aus', 'aus', 'ein', 'ein'] },
  push:  { view: 'Seitenansicht', kind: 'push', A: { d: 46 }, B: { d: 30 }, tempo: [3, 0.5, 2, 0.5], names: ['Absenken', 'Halten', 'Hochdrücken', 'Pause'], swap: true, br: ['ein', 'ein', 'aus', 'aus'] },
  wrist: { view: 'Seitenansicht · je Seite', kind: 'wrist', A: { ha: 40 }, B: { ha: 140 }, tempo: [2, 1, 3, 0.5], names: ['Anheben', 'Halten', 'Absenken', 'Pause'], br: null }
};

function lerpP(A, B, e) { const o = {}; for (const k in A) o[k] = A[k] + (B[k] - A[k]) * e; return o; }
function movingFor(def, p) {
  switch (def.kind) {
    case 'sit': return sitMoving(p, def);
    case 'front': return frontMoving(p, def);
    case 'row': return rowMoving(p, def);
    case 'push': return pushMoving(p, def, true);
    case 'wrist': return wristMoving(p);
  }
}
function staticFor(def) {
  switch (def.kind) {
    case 'sit': return sitStatic(0).svg;
    case 'front': return frontStatic(def.back).svg;
    case 'row': return rowStatic();
    case 'push': return pushStatic();
    case 'wrist': return wristStatic().svg;
  }
}
/* Geisterbild der Endlagen (nur der bewegte Teil, bei Liegestütz nur der Arm) */
function ghost(def, p) {
  const s = def.kind === 'push' ? pushMoving(p, def, false) : movingFor(def, p);
  return `<g opacity="0.22">${s}</g>`;
}
const ease = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
/* Zeitverlauf: [A→B, Halten, B→A, Pause]; liefert Fortschritt 0..1 (0 = A, 1 = B) und Phasenindex */
function phaseAt(def, tsec) {
  const T = def.tempo, total = T[0] + T[1] + T[2] + T[3];
  let t = tsec % total;
  if (t < T[0]) return { s: ease(t / T[0]), ph: 0 };
  t -= T[0]; if (t < T[1]) return { s: 1, ph: 1 };
  t -= T[1]; if (t < T[2]) return { s: 1 - ease(t / T[2]), ph: 2 };
  return { s: 0, ph: 3 };
}
/* Für „swap“-Übungen ist A die Ausgangslage (oben/gestreckt), die Reihenfolge der Phasen bleibt gleich. */
function sceneSvg(def, s, still) {
  const head = staticFor(def) + ghost(def, def.A) + ghost(def, def.B);
  return head + movingFor(def, lerpP(def.A, def.B, s));
}

function animHtml(id, h) {
  const d = ANIM[id]; if (!d) return '';
  return `<div class="anim" data-anim="${id}"><svg viewBox="4 8 190 157" style="height:${h || 190}px" role="img" aria-label="Animation: ${d.view}"></svg><div class="anim-cap"><span>${d.view}</span><b class="ph"></b></div><div class="breath" aria-live="off"><i></i><span></span></div></div>`;
}
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function mountAnims(root) {
  (root || document).querySelectorAll('[data-anim]:not([data-on])').forEach(el => {
    el.setAttribute('data-on', '1');
    const def = ANIM[el.dataset.anim], svg = el.querySelector('svg'), ph = el.querySelector('.ph'), bt = el.querySelector('.breath'), t0 = performance.now();
    const setBreath = k => { if (!bt) return; const sp = bt.querySelector('span'); bt.dataset.s = k || 'neutral'; sp.textContent = k === 'ein' ? 'Einatmen' : k === 'aus' ? 'Ausatmen' : 'Ruhig weiteratmen'; };
    if (!def) return;
    if (REDUCED) { svg.innerHTML = sceneSvg(def, 1); ph.textContent = 'Start blass · Ende kräftig'; setBreath(null); if (bt && def.br) { bt.querySelector('span').textContent = 'Ausatmen bei Anstrengung'; } return; }
    setBreath(def.br ? def.br[0] : null);
    let last = 0;
    const frame = ts => {
      if (!el.isConnected) return;
      if (ts - last >= 33) {
        last = ts;
        const r = phaseAt(def, (ts - t0) / 1000);
        svg.innerHTML = sceneSvg(def, r.s);
        const nm = def.names[r.ph], sec = r.ph < 3 ? def.tempo[r.ph] : 0;
        ph.textContent = r.ph === 1 || r.ph === 3 ? nm : nm + ' · ' + sec + ' s';
        const bk = def.br ? def.br[r.ph] : null; if (bt && bt.dataset.s !== (bk || 'neutral')) setBreath(bk);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
