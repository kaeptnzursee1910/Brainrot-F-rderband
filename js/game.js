"use strict";

/* =========================================================
   DATEN
   ========================================================= */
const $ = id => document.getElementById(id);

const RARITIES = [
  { id: "common",    name: "Gewöhnlich",    w: 60 },
  { id: "rare",      name: "Selten",        w: 25 },
  { id: "epic",      name: "Episch",        w: 10 },
  { id: "legendary", name: "Legendär",      w: 4 },
  { id: "mythic",    name: "Mythisch",      w: 0.9 },
  { id: "secret",    name: "Sowjet-Geheim", w: 0.09 },
  { id: "god",       name: "Brainrot-Gott", w: 0.012 }
];

const SPECIES = [
  { id: "piccione",    name: "Piccione Pizzanini",     body: "🐦", acc: "🍕", r: 0, price: 25,     inc: 1 },
  { id: "gattino",     name: "Gattino Spaghettino",    body: "🐱", acc: "🍝", r: 0, price: 60,     inc: 2 },
  { id: "ranocchio",   name: "Ranocchio Toastolino",   body: "🐸", acc: "🍞", r: 0, price: 120,    inc: 4 },
  { id: "trippi",      name: "Trippi Troppi",          body: "🐱", acc: "🦐", r: 1, price: 400,    inc: 10 },
  { id: "chimpanzini", name: "Chimpanzini Bananini",   body: "🐒", acc: "🍌", r: 1, price: 900,    inc: 20 },
  { id: "camelini",    name: "Camelini Cactusini",     body: "🐫", acc: "🌵", r: 1, price: 1800,   inc: 36 },
  { id: "ballerina",   name: "Ballerina Cappuccina",   body: "☕", acc: "🩰", r: 2, price: 5000,   inc: 90 },
  { id: "assassino",   name: "Cappuccino Assassino",   body: "🥷", acc: "☕", r: 2, price: 9000,   inc: 150 },
  { id: "leone",       name: "Leone Saponetto",        body: "🦁", acc: "🧼", r: 2, price: 16000,  inc: 250 },
  { id: "gusini",      name: "Bombombini Gusini",      body: "🦆", acc: "✈️", r: 3, price: 40000,  inc: 550 },
  { id: "tralalero",   name: "Tralalero Tralala",      body: "🦈", acc: "👟", r: 3, price: 80000,  inc: 1000 },
  { id: "pinguino",    name: "Pinguino Gelatino",      body: "🐧", acc: "🍦", r: 3, price: 140000, inc: 1600 },
  { id: "bombardiro",  name: "Bombardiro Crocodilo",   body: "🐊", acc: "✈️", r: 4, price: 250000, inc: 2800 },
  { id: "tung",        name: "Tung Tung Tung Sahur",   body: "🪵", acc: "🏏", r: 4, price: 600000, inc: 6000,
    say: "Tung tung tung tung tung tung tung tung tung sahur" },
  { id: "reaktor",     name: "Genosse Reaktorschwimmer", body: "🏊", acc: "☢️", r: 5, price: 2e6, inc: 18000,
    say: "Товарищ реакторный пловец", lang: "ru-RU" },
  { id: "kosmonaut",   name: "Kantinen-Kosmonaut",     body: "🧑‍🚀", acc: "🥣", r: 5, price: 5e6, inc: 40000,
    say: "Космонавт из столовой", lang: "ru-RU" },
  { id: "spaghettosauro", name: "Spaghettosauro Supremo", body: "🦖", acc: "👑", r: 6, price: 2e7, inc: 150000 }
];
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));

// Reihenfolge = aufsteigender Wert (wichtig für Math.max bei Fusion)
const MUTATIONS = [
  { id: "normal",  name: "",           mult: 1,  priceMult: 1,   chance: 0 },
  { id: "gold",    name: "Gold",       mult: 2,  priceMult: 1.5, chance: 0.07 },
  { id: "diamond", name: "Diamant",    mult: 4,  priceMult: 3,   chance: 0.02 },
  { id: "rainbow", name: "Regenbogen", mult: 10, priceMult: 6,   chance: 0.004 }
];

const LEVEL_MULT = [1, 2.5, 6, 15, 40];
const MAX_LVL = 5;
const BASE_SLOTS = 8;
const OFFLINE_MAX_S = 7200;

const UPGRADES = {
  luck:  { name: "🍀 Glück",            max: 10, cost: l => Math.round(500 * Math.pow(3, l)),
           desc: l => `Seltene Brainrots häufiger (Faktor ${(1 + 0.12 * l).toFixed(2)} je Stufe)` },
  slots: { name: "🏠 Mehr Plätze",      max: 12, cost: l => Math.round(300 * Math.pow(2.2, l)),
           desc: l => `${BASE_SLOTS + l} → ${BASE_SLOTS + l + 1} Plätze` },
  tempo: { name: "⚙️ Fließband-Turbo",  max: 8,  cost: l => Math.round(200 * Math.pow(2.6, l)),
           desc: l => `Neuer Brainrot alle ${spawnIntervalBase(l).toFixed(2).replace(".", ",")} s` },
  alarm: { name: "🚨 Alarmanlage",      max: 4,  cost: l => Math.round(1500 * Math.pow(5, l)),
           desc: l => `Dieb: ${Math.max(1, 5 - l)} Klicks nötig, ${(6 + 1.5 * l).toFixed(1).replace(".", ",")} s Zeit` }
};

const EVENTS = {
  goldrain: { name: "🌟 Goldregen: Mutationen ×3", dur: 30000, start() { say("Pioggia d'oro!"); } },
  turbo:    { name: "🥁 Tung-Tung-Turbo: Einkommen ×2", dur: 25000, start() { SFX.tung(); say("Tung tung tung sahur", 0.7); } },
  rush:     { name: "🦈 Tralalero-Ansturm: Fließband ×2", dur: 20000, start() { say("Tralalero tralala"); } }
};

/* =========================================================
   ZUSTAND
   ========================================================= */
const SAVE_KEY = "brainrot-fliessband-v1";

function defaultState() {
  return {
    money: 100,
    slots: Array(BASE_SLOTS).fill(null),
    upg: { luck: 0, slots: 0, tempo: 0, alarm: 0 },
    rebirths: 0,
    index: {},
    stats: { bought: 0, merged: 0, stolen: 0, defended: 0, sold: 0 },
    sound: true,
    voice: true,
    savedAt: Date.now()
  };
}
let S = defaultState();

let belt = [], itemSeq = 0, spawnAcc = 0, uiAcc = 0, saveAcc = 0;
let last = performance.now();
let thief = null, nextThiefAt = performance.now() + 60000;
let ev = { type: null, until: 0 }, nextEventAt = performance.now() + 90000 + Math.random() * 60000;
let lockUntil = 0, lockCdUntil = 0;
let beltAnimDur = 0;
let dragFrom = null, pendingRender = false;
let selected = null;           // per Antippen ausgewählter Platz
let modalOpen = false;
let baseIncome = 0;
const logLines = [];

const beltEl = $("belt");
const baseEl = $("base");
const isTouch = window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0;

/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */
function rand(a, b) { return a + Math.random() * (b - a); }

function fmt(n) {
  n = Number(n) || 0;
  if (n < 1000) return (n < 10 && n % 1) ? n.toFixed(1).replace(".", ",") : String(Math.floor(n));
  const U = [[1e15, "Brd."], [1e12, "Bio."], [1e9, "Mrd."], [1e6, "Mio."], [1e3, "Tsd."]];
  for (const [v, u] of U) {
    if (n >= v) {
      const x = n / v;
      return x.toLocaleString("de-DE", { maximumFractionDigits: x < 10 ? 2 : (x < 100 ? 1 : 0) }) + " " + u;
    }
  }
  return String(n);
}
function fmtMult(x) { return x.toLocaleString("de-DE", { maximumFractionDigits: 2 }); }

function slotCount() { return BASE_SLOTS + S.upg.slots; }
function incomeOf(b) { return b ? SP[b.id].inc * MUTATIONS[b.mut].mult * LEVEL_MULT[b.lvl - 1] : 0; }
function sellValue(b) { return Math.round(0.5 * SP[b.id].price * Math.pow(2, b.lvl - 1) * MUTATIONS[b.mut].priceMult); }
function discoveredCount() { return SPECIES.filter(s => S.index[s.id] && S.index[s.id].some(Boolean)).length; }
function permMult() { return (1 + 0.5 * S.rebirths) * (1 + 0.02 * discoveredCount()); }
function eventMult() { return ev.type === "turbo" ? 2 : 1; }
function recalc() { baseIncome = S.slots.reduce((s, b) => s + incomeOf(b), 0); }
function totalIncome() { return baseIncome * permMult() * eventMult(); }

function spawnIntervalBase(l) { return 2.0 * Math.pow(0.88, l); }
function spawnInterval() { return spawnIntervalBase(S.upg.tempo) / (ev.type === "rush" ? 2 : 1); }
function travelTime() { return 14 * Math.pow(0.9, S.upg.tempo) / (ev.type === "rush" ? 1.6 : 1); }
function itemWidth() { return parseFloat(getComputedStyle(beltEl).getPropertyValue("--bw")) || 126; }

function creatureHTML(sp, mut, cls, delayIdx) {
  const delay = -((delayIdx === undefined ? Math.random() * 7 : delayIdx) * 0.17 % 1.4).toFixed(2);
  return `<div class="creature ${cls || ""} mut-${MUTATIONS[mut].id}" style="animation-delay:${delay}s">` +
         `<span class="body emoji">${sp.body}</span><span class="acc emoji">${sp.acc}</span></div>`;
}

function discover(id, mut) {
  if (!Array.isArray(S.index[id])) S.index[id] = [false, false, false, false];
  const isNew = !S.index[id].some(Boolean);
  S.index[id][mut] = true;
  return isNew;
}

function buzz(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* nicht unterstützt */ }
}

/* =========================================================
   SOUND & STIMME
   ========================================================= */
let actx = null;
function audio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
  }
  if (actx && actx.state === "suspended") actx.resume();
  return actx;
}
function tone(freq, dur, type = "square", vol = 0.08, delay = 0, slideTo = null) {
  if (!S.sound) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
const SFX = {
  buy()   { tone(660, 0.08); tone(990, 0.12, "square", 0.08, 0.08); },
  deny()  { tone(160, 0.2, "sawtooth", 0.06); },
  pick()  { tone(520, 0.05, "triangle", 0.07); },
  merge() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "triangle", 0.1, i * 0.07)); },
  sell()  { tone(880, 0.12, "triangle", 0.08, 0, 440); },
  alarm() { for (let i = 0; i < 4; i++) { tone(900, 0.12, "sawtooth", 0.05, i * 0.25); tone(600, 0.12, "sawtooth", 0.05, i * 0.25 + 0.12); } },
  hit()   { tone(220, 0.07, "square", 0.1, 0, 110); },
  steal() { tone(400, 0.6, "sawtooth", 0.08, 0, 60); },
  lock()  { tone(300, 0.3, "sine", 0.12, 0, 900); },
  tung()  { for (let i = 0; i < 3; i++) tone(140, 0.15, "sine", 0.3, i * 0.18, 70); },
  legendary() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, "square", 0.06, i * 0.09)); }
};

function findVoice(lang) {
  if (!("speechSynthesis" in window)) return null;
  const p = lang.slice(0, 2).toLowerCase();
  return speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(p)) || null;
}
if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
function say(text, pitch = 1, rate = 1, lang = "it-IT") {
  if (!S.voice || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = findVoice(lang);
    if (v) u.voice = v;
    u.pitch = pitch;
    u.rate = rate;
    u.volume = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* Sprachausgabe nicht verfügbar */ }
}
function sayName(sp, pitch = 1, rate = 1) { say(sp.say || sp.name, pitch, rate, sp.lang || "it-IT"); }

/* =========================================================
   UI-HELFER
   ========================================================= */
function log(msg) {
  logLines.unshift(msg);
  if (logLines.length > 12) logLines.pop();
  const el = $("log");
  el.innerHTML = "";
  for (const l of logLines) {
    const d = document.createElement("div");
    d.textContent = l;
    el.appendChild(d);
  }
}

let announceTimer = null;
function announce(text, cls = "") {
  const a = $("announce");
  a.textContent = text;
  a.className = "announce show " + cls;
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { a.className = "announce"; }, 3000);
}

function floatText(text, x, y, cls = "") {
  const d = document.createElement("div");
  d.className = "float " + cls;
  d.textContent = text;
  d.style.left = x + "px";
  d.style.top = y + "px";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1000);
}

function openModal(html) {
  $("modalBody").innerHTML = html;
  $("modal").classList.remove("hidden");
  modalOpen = true;
}
function closeModal() {
  $("modal").classList.add("hidden");
  modalOpen = false;
}

function updateToggles() {
  $("btnSound").textContent = S.sound ? "🔊" : "🔇";
  $("btnVoice").textContent = S.voice ? "🗣️" : "🤐";
}

/* =========================================================
   FLIESSBAND
   ========================================================= */
function rollRarity() {
  const f = 1 + 0.12 * S.upg.luck;
  const ws = RARITIES.map((r, i) => r.w * Math.pow(f, i));
  const total = ws.reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (let i = 0; i < ws.length; i++) {
    x -= ws[i];
    if (x < 0) return i;
  }
  return 0;
}

function rollMutation() {
  const f = ev.type === "goldrain" ? 3 : 1;
  const r = Math.random();
  let acc = 0;
  for (let i = MUTATIONS.length - 1; i >= 1; i--) {
    acc += MUTATIONS[i].chance * f;
    if (r < acc) return i;
  }
  return 0;
}

function spawnBeltItem(x = null, quiet = false) {
  if (x === null) x = -(itemWidth() + 4);
  const r = rollRarity();
  const pool = SPECIES.filter(s => s.r === r);
  const sp = pool[Math.floor(Math.random() * pool.length)];
  const mut = rollMutation();
  const m = MUTATIONS[mut];
  const price = Math.round(sp.price * m.priceMult);
  const rar = RARITIES[r];

  const el = document.createElement("div");
  el.className = "bitem r-" + rar.id;
  el.dataset.id = String(++itemSeq);
  el.title = `${sp.name} – ${rar.name}${m.name ? " · " + m.name : ""}`;
  el.innerHTML =
    `<div class="rtag">${rar.name}${m.name ? " · " + m.name : ""}</div>` +
    creatureHTML(sp, mut) +
    `<div class="bname">${sp.name}</div>` +
    `<div class="bprice">₤ ${fmt(price)}</div>` +
    `<div class="binc">+${fmt(sp.inc * m.mult * permMult())}/s</div>`;
  el.style.transform = `translateX(${x}px)`;
  if (S.money < price) el.classList.add("cant");
  beltEl.appendChild(el);

  belt.push({ id: itemSeq, sp, mut, price, x, el });

  if (!quiet && (r >= 3 || mut >= 2)) {
    announce(`⚠️ ${rar.name.toUpperCase()}${m.name ? " (" + m.name + ")" : ""}: ${sp.name} auf dem Fließband!`, "event");
    SFX.legendary();
    buzz([40, 40, 40]);
    sayName(sp, 0.6, 0.85);
  }
}

function updateBelt(dt) {
  const W = beltEl.clientWidth;
  const speed = W / travelTime();
  for (let i = belt.length - 1; i >= 0; i--) {
    const it = belt[i];
    it.x += speed * dt;
    if (it.x > W + 10) {
      it.el.remove();
      belt.splice(i, 1);
      continue;
    }
    it.el.style.transform = `translateX(${it.x}px)`;
  }
  spawnAcc += dt;
  const newest = belt[belt.length - 1];
  if (spawnAcc >= spawnInterval() && (!newest || newest.x > 15)) {
    spawnAcc = 0;
    spawnBeltItem();
  }
  const dur = 80 / Math.max(speed, 1);
  if (Math.abs(dur - beltAnimDur) > 0.02) {
    beltAnimDur = dur;
    beltEl.style.animationDuration = dur.toFixed(3) + "s";
  }
}

function buy(it, e) {
  const free = S.slots.indexOf(null);
  if (free < 0) { deny("Basis voll! Verkaufen oder fusionieren.", it, e); return; }
  if (S.money < it.price) { deny("Zu teuer!", it, e); return; }

  S.money -= it.price;
  S.slots[free] = { id: it.sp.id, mut: it.mut, lvl: 1 };
  S.stats.bought++;
  const isNew = discover(it.sp.id, it.mut);

  it.el.remove();
  belt.splice(belt.indexOf(it), 1);

  SFX.buy();
  buzz(15);
  sayName(it.sp);
  floatText("-₤ " + fmt(it.price), e.clientX, e.clientY, "bad");
  log(`🛒 ${it.sp.name}${MUTATIONS[it.mut].name ? " (" + MUTATIONS[it.mut].name + ")" : ""} gekauft.`);
  if (isNew) {
    announce(`📖 NEU im Index: ${it.sp.name}! (+2 % Einkommen)`, "good");
    log(`📖 Neu entdeckt: ${it.sp.name}`);
  }
  renderBase();
}

function deny(msg, it, e) {
  SFX.deny();
  floatText(msg, e.clientX, e.clientY, "bad");
  it.el.classList.remove("shake");
  void it.el.offsetWidth;
  it.el.classList.add("shake");
}

/* =========================================================
   BASIS
   ========================================================= */
function renderBase() {
  recalc();
  if (selected !== null && (!S.slots[selected] || selected >= S.slots.length || (thief && thief.slot === selected))) selected = null;
  if (dragFrom !== null) { pendingRender = true; return; }
  const pm = permMult();
  const sel = selected !== null ? S.slots[selected] : null;
  baseEl.innerHTML = S.slots.map((b, i) => {
    if (!b) return `<div class="slot empty${sel ? " target" : ""}" data-i="${i}"><span>${sel ? "hierher" : "frei"}</span></div>`;
    const sp = SP[b.id], r = RARITIES[sp.r], m = MUTATIONS[b.mut];
    const robbed = thief && thief.slot === i;
    const cls = (i === selected ? " selected" : "") + (sel && i !== selected && canMerge(sel, b) ? " can-merge" : "");
    return `<div class="slot r-${r.id}${cls}" data-i="${i}" ` +
      `title="${sp.name} – ${r.name}${m.name ? " · " + m.name : ""} · Stufe ${b.lvl} · Verkaufswert ₤ ${fmt(sellValue(b))}">` +
      `<button class="sell-btn" data-sell="${i}" title="Verkaufen für ₤ ${fmt(sellValue(b))}">💰</button>` +
      creatureHTML(sp, b.mut, "small", i) +
      `<div class="sname">${sp.name}</div>` +
      `<div class="slvl">${"★".repeat(b.lvl)}${"☆".repeat(MAX_LVL - b.lvl)}</div>` +
      `<div class="sinc">+${fmt(incomeOf(b) * pm)}/s</div>` +
      (robbed ? `<div class="thief"><div class="thief-face emoji">🦹</div><div class="thief-txt">${isTouch ? "Tipp" : "Klick"}! ×${thief.clicks}</div><div class="thief-bar"><i></i></div></div>` : "") +
      `</div>`;
  }).join("");
  $("slotInfo").textContent = `${S.slots.filter(Boolean).length}/${S.slots.length}`;
  $("income").textContent = fmt(totalIncome()) + "/s";
  renderHint();
}

function renderHint() {
  const h = $("hint");
  if (selected !== null && S.slots[selected]) {
    const sp = SP[S.slots[selected].id];
    h.innerHTML = `Ausgewählt: <b>${sp.name}</b> – tippe auf einen gleichen (leuchtend) zum Fusionieren, auf einen anderen Platz zum Tauschen oder nochmal auf ihn zum Abwählen.`;
  } else {
    h.textContent = isTouch
      ? "Tipp: Brainrot antippen und dann einen gleichen mit gleicher Stufe antippen – oder einfach aufeinander ziehen – zum Fusionieren (max. ★★★★★)."
      : "Tipp: Ziehe zwei gleiche Brainrots mit gleicher Stufe aufeinander (oder klicke nacheinander), um sie zu fusionieren (max. ★★★★★).";
  }
}

function canMerge(a, b) { return a && b && a.id === b.id && a.lvl === b.lvl && a.lvl < MAX_LVL; }

function mergeInto(target, source) {
  const a = S.slots[source], b = S.slots[target];
  S.slots[target] = { id: a.id, mut: Math.max(a.mut, b.mut), lvl: a.lvl + 1 };
  S.slots[source] = null;
  S.stats.merged++;
  return S.slots[target];
}

function dropOn(from, to) {
  const A = S.slots[from], B = S.slots[to];
  if (from === to || !A) { renderBase(); return; }
  if (thief && (thief.slot === from || thief.slot === to)) {
    SFX.deny();
    announce("🦹 Erst den Dieb verjagen!", "bad");
    renderBase();
    return;
  }
  if (canMerge(A, B)) {
    const res = mergeInto(to, from);
    const sp = SP[res.id];
    SFX.merge();
    buzz(30);
    sayName(sp, 1.4, 1.1);
    log(`✨ Fusion: ${sp.name} → Stufe ${res.lvl}`);
    if (res.lvl === MAX_LVL) announce(`🌟 MAX-STUFE: ${sp.name} ★★★★★`, "good");
  } else {
    S.slots[from] = B;
    S.slots[to] = A;
  }
  renderBase();
}

function autoMerge() {
  let merged = 0, again = true;
  while (again) {
    again = false;
    outer:
    for (let i = 0; i < S.slots.length; i++) {
      if (!S.slots[i] || S.slots[i].lvl >= MAX_LVL) continue;
      for (let j = i + 1; j < S.slots.length; j++) {
        if (thief && thief.slot === j) continue;
        if (canMerge(S.slots[i], S.slots[j])) {
          mergeInto(i, j);
          merged++;
          again = true;
          break outer;
        }
      }
    }
  }
  if (merged) {
    SFX.merge();
    buzz(30);
    log(`⚡ Auto-Fusion: ${merged}× fusioniert.`);
    selected = null;
    renderBase();
  } else {
    SFX.deny();
    log("⚡ Keine passenden Paare zum Fusionieren.");
  }
}

function sell(i) {
  const b = S.slots[i];
  if (!b) return;
  if (thief && thief.slot === i) { SFX.deny(); return; }
  const sp = SP[b.id];
  const v = sellValue(b);
  if (sp.r >= 3 && !confirm(`${sp.name} wirklich für ₤ ${fmt(v)} verkaufen?`)) return;
  S.money += v;
  S.slots[i] = null;
  S.stats.sold++;
  if (selected === i) selected = null;
  SFX.sell();
  log(`💰 ${sp.name} verkauft: +₤ ${fmt(v)}`);
  renderBase();
}

/* =========================================================
   ANTIPPEN & ZIEHEN (Maus, Finger, Stift)
   ========================================================= */
let press = null;   // { i, x, y, id }
let ghost = null;

function tapSlot(i) {
  const b = S.slots[i];
  if (selected === null) {
    if (b && !(thief && thief.slot === i)) {
      selected = i;
      SFX.pick();
      renderBase();
    }
    return;
  }
  if (selected === i) { selected = null; renderBase(); return; }
  const from = selected;
  selected = null;
  dropOn(from, i);
}

function startDrag(i, e) {
  const src = baseEl.querySelector(`.slot[data-i="${i}"]`);
  if (!src) return;
  selected = null;
  dragFrom = i;
  ghost = src.cloneNode(true);
  ghost.classList.remove("selected", "can-merge");
  ghost.classList.add("drag-ghost");
  const sb = ghost.querySelector(".sell-btn");
  if (sb) sb.remove();
  ghost.style.width = src.offsetWidth + "px";
  ghost.style.height = src.offsetHeight + "px";
  document.body.appendChild(ghost);
  src.classList.add("dragging");
  const a = S.slots[i];
  baseEl.querySelectorAll(".slot").forEach(el => {
    const j = Number(el.dataset.i);
    el.classList.remove("selected", "can-merge", "target");
    if (j !== i && canMerge(a, S.slots[j])) el.classList.add("can-merge");
  });
  SFX.pick();
  moveDrag(e);
}

function dropTargetAt(x, y) {
  const t = document.elementFromPoint(x, y);
  if (!t) return null;
  if (t.closest("#sellZone")) return { sell: true };
  const s = t.closest("#base .slot");
  return s ? { slot: Number(s.dataset.i), el: s } : null;
}

function moveDrag(e) {
  if (!ghost) return;
  ghost.style.left = e.clientX + "px";
  ghost.style.top = e.clientY + "px";
  const tgt = dropTargetAt(e.clientX, e.clientY);
  $("sellZone").classList.toggle("over", !!(tgt && tgt.sell));
  baseEl.querySelectorAll(".slot.over").forEach(el => { if (!tgt || el !== tgt.el) el.classList.remove("over"); });
  if (tgt && tgt.el && tgt.slot !== dragFrom) tgt.el.classList.add("over");
}

function cleanupDrag() {
  if (ghost) { ghost.remove(); ghost = null; }
  dragFrom = null;
  $("sellZone").classList.remove("over");
  baseEl.querySelectorAll(".slot").forEach(el => el.classList.remove("dragging", "over", "can-merge"));
  if (pendingRender) { pendingRender = false; renderBase(); }
}

function finishDrag(e) {
  const from = dragFrom;
  const tgt = dropTargetAt(e.clientX, e.clientY);
  cleanupDrag();
  if (!tgt) { renderBase(); return; }
  if (tgt.sell) sell(from);
  else dropOn(from, tgt.slot);
}

baseEl.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest(".thief")) { e.preventDefault(); hitThief(e); return; }
  if (e.target.closest(".sell-btn")) return;
  const s = e.target.closest(".slot");
  if (!s || press) return;
  press = { i: Number(s.dataset.i), x: e.clientX, y: e.clientY, id: e.pointerId };
});

document.addEventListener("pointermove", e => {
  if (!press || e.pointerId !== press.id) return;
  if (dragFrom === null) {
    if (!S.slots[press.i] || (thief && thief.slot === press.i)) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 10) return;
    startDrag(press.i, e);
  } else {
    moveDrag(e);
  }
  if (dragFrom !== null) e.preventDefault();
}, { passive: false });

document.addEventListener("pointerup", e => {
  if (!press || e.pointerId !== press.id) return;
  const p = press;
  press = null;
  if (dragFrom !== null) finishDrag(e);
  else tapSlot(p.i);
});

document.addEventListener("pointercancel", e => {
  if (!press || e.pointerId !== press.id) return;
  press = null;
  if (dragFrom !== null) cleanupDrag();
});

baseEl.addEventListener("click", e => {
  const sb = e.target.closest(".sell-btn");
  if (sb) sell(Number(sb.dataset.sell));
});

// Lange Fingerdrücke sollen kein Kontextmenü öffnen
["contextmenu", "selectstart", "dragstart"].forEach(t => {
  baseEl.addEventListener(t, e => e.preventDefault());
  beltEl.addEventListener(t, e => e.preventDefault());
});

/* =========================================================
   DIEBE & SPERRE
   ========================================================= */
function spawnThief(now) {
  nextThiefAt = now + rand(40000, 80000);
  const occ = [];
  S.slots.forEach((b, i) => { if (b) occ.push(i); });
  if (occ.length < 3) return;
  if (now < lockUntil) {
    S.stats.defended++;
    log("🔒 Ein Dieb ist am Kraftfeld abgeprallt.");
    return;
  }
  occ.sort((a, b) => incomeOf(S.slots[b]) - incomeOf(S.slots[a]));
  const target = occ[Math.floor(Math.random() * Math.min(3, occ.length))];
  if (dragFrom === target) cleanupDrag();
  thief = { slot: target, start: now, dur: 6000 + 1500 * S.upg.alarm, clicks: Math.max(1, 5 - S.upg.alarm) };
  SFX.alarm();
  buzz([200, 100, 200, 100, 200]);
  say("Ladro! Ladro!", 1.2, 1.2);
  announce(`🦹 DIEB! Er will ${SP[S.slots[target].id].name} klauen – ${isTouch ? "tipp" : "klick"} ihn weg!`, "bad");
  renderBase();
  const el = baseEl.querySelector(`.slot[data-i="${target}"]`);
  if (el && el.scrollIntoView) {
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function updateThief(now, dtMs) {
  if (modalOpen) {
    if (thief) thief.start += dtMs;
    nextThiefAt += dtMs;
    return;
  }
  if (thief) {
    if (!S.slots[thief.slot]) {
      thief = null;
      nextThiefAt = now + rand(40000, 80000);
      log("🦹 Der Dieb zieht enttäuscht ab.");
      renderBase();
      return;
    }
    const p = (now - thief.start) / thief.dur;
    const bar = baseEl.querySelector(".thief-bar i");
    if (bar) bar.style.width = Math.min(100, p * 100) + "%";
    if (p >= 1) {
      const b = S.slots[thief.slot];
      S.slots[thief.slot] = null;
      S.stats.stolen++;
      SFX.steal();
      buzz(400);
      announce(`😱 ${SP[b.id].name} wurde geklaut!`, "bad");
      log(`😱 Geklaut: ${SP[b.id].name} (Stufe ${b.lvl})`);
      thief = null;
      nextThiefAt = now + rand(40000, 80000);
      renderBase();
    }
  } else if (now >= nextThiefAt) {
    spawnThief(now);
  }
}

function hitThief(e) {
  if (!thief) return;
  thief.clicks--;
  SFX.hit();
  buzz(20);
  floatText("💥", e.clientX, e.clientY);
  if (thief.clicks <= 0) {
    const b = S.slots[thief.slot];
    const reward = Math.max(50, Math.round(incomeOf(b) * permMult() * 15));
    S.money += reward;
    S.stats.defended++;
    announce(`🛡️ Dieb verjagt! Belohnung +₤ ${fmt(reward)}`, "good");
    log(`🛡️ Dieb verjagt (+₤ ${fmt(reward)})`);
    thief = null;
    nextThiefAt = performance.now() + rand(40000, 80000);
    renderBase();
  } else {
    const t = baseEl.querySelector(".thief-txt");
    if (t) t.textContent = `${isTouch ? "Tipp" : "Klick"}! ×${thief.clicks}`;
  }
}

function lockBase() {
  const now = performance.now();
  if (now < lockCdUntil) { SFX.deny(); return; }
  lockUntil = now + 20000;
  lockCdUntil = now + 90000;
  SFX.lock();
  buzz(50);
  log("🔒 Basis für 20 s gesperrt.");
  if (thief) {
    thief = null;
    S.stats.defended++;
    nextThiefAt = now + rand(40000, 80000);
    announce("🛡️ Kraftfeld! Der Dieb prallt ab.", "good");
    renderBase();
  }
  uiTick(now);
}

/* =========================================================
   EREIGNISSE
   ========================================================= */
function updateEvents(now) {
  if (ev.type && now >= ev.until) {
    log(`⏹️ Ereignis vorbei: ${EVENTS[ev.type].name}`);
    ev = { type: null, until: 0 };
    nextEventAt = now + rand(120000, 200000);
  } else if (!ev.type && now >= nextEventAt) {
    const keys = Object.keys(EVENTS);
    const k = keys[Math.floor(Math.random() * keys.length)];
    ev = { type: k, until: now + EVENTS[k].dur };
    EVENTS[k].start();
    announce(EVENTS[k].name, "event");
    log(`🎉 Ereignis: ${EVENTS[k].name}`);
  }
}

/* =========================================================
   SHOP & REBIRTH
   ========================================================= */
function renderShop() {
  $("shop").innerHTML = Object.entries(UPGRADES).map(([k, u]) => {
    const l = S.upg[k], max = l >= u.max;
    return `<div class="up"><div><b>${u.name}</b> <span class="lvl">Stufe ${l}/${u.max}</span><br><small>${max ? "Maximal ausgebaut" : u.desc(l)}</small></div>` +
      `<button class="buybtn" data-up="${k}" ${max ? "disabled" : ""}>${max ? "MAX" : "₤ " + fmt(u.cost(l))}</button></div>`;
  }).join("");
  renderRebirth();
}

function buyUpgrade(k) {
  const u = UPGRADES[k], l = S.upg[k];
  if (!u || l >= u.max) return;
  const c = u.cost(l);
  if (S.money < c) { SFX.deny(); return; }
  S.money -= c;
  S.upg[k]++;
  if (k === "slots") S.slots.push(null);
  SFX.buy();
  log(`⬆️ ${u.name} → Stufe ${S.upg[k]}`);
  renderShop();
  renderBase();
}

function rebirthCost() { return 1e6 * Math.pow(8, S.rebirths); }

function renderRebirth() {
  const next = 1 + 0.5 * (S.rebirths + 1);
  $("rebirth").innerHTML =
    `<div class="up"><div><b>♻️ Rebirth ${S.rebirths + 1}</b><br><small>Setzt Lire, Basis und Upgrades zurück. ` +
    `Dauerhafter Bonus: x${fmtMult(next)} Einkommen. Index bleibt erhalten.</small></div>` +
    `<button class="buybtn" id="btnRebirth">₤ ${fmt(rebirthCost())}</button></div>`;
}

function doRebirth() {
  if (S.money < rebirthCost()) { SFX.deny(); return; }
  if (!confirm("Rebirth durchführen? Lire, Basis und Upgrades werden zurückgesetzt.")) return;
  const keep = { index: S.index, rebirths: S.rebirths + 1, stats: S.stats, sound: S.sound, voice: S.voice };
  S = Object.assign(defaultState(), keep);
  S.money = 100 * (1 + keep.rebirths);
  thief = null;
  selected = null;
  SFX.legendary();
  say("Rinascita!", 0.8, 0.9);
  announce(`♻️ REBIRTH ${S.rebirths}! Einkommen dauerhaft x${fmtMult(1 + 0.5 * S.rebirths)}`, "good");
  log(`♻️ Rebirth ${S.rebirths} abgeschlossen.`);
  renderShop();
  renderBase();
  save();
}

/* =========================================================
   MODALE FENSTER
   ========================================================= */
function openIndex() {
  const found = discoveredCount();
  let html = `<h2>📖 Brainrot-Index</h2><p>Entdeckt: <b>${found}/${SPECIES.length}</b> · Bonus: <b>+${found * 2} % Einkommen</b> · ` +
             `Punkte = Normal / Gold / Diamant / Regenbogen</p><div class="idx">`;
  for (const sp of SPECIES) {
    const e = S.index[sp.id];
    const r = RARITIES[sp.r];
    if (e && e.some(Boolean)) {
      html += `<div class="icard r-${r.id}">${creatureHTML(sp, 0)}<b>${sp.name}</b><small>${r.name} · ${fmt(sp.inc)}/s</small>` +
              `<div>${MUTATIONS.map((m, i) => `<span class="dot d-${m.id} ${e[i] ? "on" : ""}" title="${m.name || "Normal"}"></span>`).join("")}</div></div>`;
    } else {
      html += `<div class="icard unknown r-${r.id}"><div class="qmark">❓</div><b>???</b><small>${r.name}</small></div>`;
    }
  }
  html += `</div><p class="statsline">Gekauft: ${S.stats.bought} · Fusioniert: ${S.stats.merged} · Verkauft: ${S.stats.sold} · ` +
          `Diebe abgewehrt: ${S.stats.defended} · Geklaut: ${S.stats.stolen} · Rebirths: ${S.rebirths}</p>`;
  openModal(html);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function openHelp() {
  const install = isStandalone() ? "" : (isIOS()
    ? `<li><b>Als App installieren:</b> In Safari auf <b>Teilen</b> <span class="emoji">⬆️</span> → <b>„Zum Home-Bildschirm“</b> tippen. Dann startet das Spiel im Vollbild und funktioniert auch offline.</li>`
    : `<li><b>Als App installieren:</b> Im Browser-Menü <b>„App installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b> wählen (oder den 📲-Knopf oben). Danach läuft das Spiel auch offline.</li>`);
  openModal(`
    <h2>❓ So funktioniert Brainrot-Fließband</h2>
    <ul>
      <li><b>Fließband:</b> Brainrots fahren von links nach rechts. <b>Antippen/Klicken = kaufen</b> (grüner Preis = leistbar).</li>
      <li><b>Basis:</b> Jeder Brainrot verdient automatisch Lire pro Sekunde – auch offline (50 %, max. 2 h).</li>
      <li><b>Fusion:</b> Einen Brainrot antippen, dann einen gleichen mit gleicher Stufe antippen – oder aufeinander ziehen → nächste Stufe (bis ★★★★★). <b>⚡ Auto-Fusion</b> erledigt alles auf einmal.</li>
      <li><b>Verschieben:</b> Antippen und dann einen freien Platz antippen (oder ziehen).</li>
      <li><b>Verkaufen:</b> 💰-Knopf auf dem Platz oder auf „💰 Verkaufen“ ziehen (50 % Wert).</li>
      <li><b>Diebe 🦹:</b> Sie greifen deine besten Brainrots an. Schnell mehrfach antippen! Oder <b>🔒 Sperren</b>: 20 s Kraftfeld, 90 s Abklingzeit.</li>
      <li><b>Mutationen:</b> Gold ×2, Diamant ×4, Regenbogen ×10 Einkommen.</li>
      <li><b>Seltenheiten:</b> Gewöhnlich → Selten → Episch → Legendär → Mythisch → Sowjet-Geheim → Brainrot-Gott.</li>
      <li><b>Ereignisse:</b> Goldregen, Tung-Tung-Turbo und Tralalero-Ansturm tauchen zufällig auf.</li>
      <li><b>Index:</b> Jede neu entdeckte Art gibt dauerhaft +2 % Einkommen.</li>
      <li><b>Rebirth:</b> Neustart mit dauerhaft +50 % Einkommen.</li>
      ${install}
    </ul>
    <p><b>Tasten (Computer):</b> L = Sperre · F = Auto-Fusion · I = Index · M = Ton an/aus · Esc = Fenster schließen / Auswahl aufheben</p>
    <p class="statsline">Sprachausgabe: nutzt die auf dem Gerät verfügbaren Stimmen (auf iPhone/iPad und in Microsoft Edge sind italienische Stimmen meist vorhanden). Auf dem iPhone muss der Stumm-Schalter aus sein, damit Töne zu hören sind.</p>
    <p><button class="dangerbtn" id="btnReset">🗑️ Spielstand löschen</button></p>
  `);
}

function resetGame() {
  if (!confirm("Wirklich den kompletten Spielstand löschen? Das kann nicht rückgängig gemacht werden.")) return;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ }
  resetting = true;
  location.reload();
}

/* =========================================================
   SPEICHERN / LADEN
   ========================================================= */
let resetting = false;
function save() {
  if (resetting) return;
  S.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* Speicher nicht verfügbar */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    const def = defaultState();
    S = Object.assign(def, d);
    S.upg = Object.assign(defaultState().upg, d.upg || {});
    S.stats = Object.assign(defaultState().stats, d.stats || {});
    for (const k of Object.keys(UPGRADES)) {
      S.upg[k] = Math.min(UPGRADES[k].max, Math.max(0, Math.floor(Number(S.upg[k]) || 0)));
    }
    S.money = Number.isFinite(Number(S.money)) ? Number(S.money) : 100;
    S.rebirths = Math.max(0, Math.floor(Number(S.rebirths) || 0));
    if (typeof S.index !== "object" || !S.index) S.index = {};
    for (const k of Object.keys(S.index)) {
      if (!SP[k] || !Array.isArray(S.index[k])) delete S.index[k];
    }
    const n = slotCount();
    const slots = Array.isArray(d.slots) ? d.slots.slice(0, n) : [];
    while (slots.length < n) slots.push(null);
    S.slots = slots.map(b => (b && SP[b.id] && MUTATIONS[b.mut])
      ? { id: b.id, mut: b.mut, lvl: Math.min(MAX_LVL, Math.max(1, Math.floor(b.lvl) || 1)) }
      : null);
    return true;
  } catch (e) {
    S = defaultState();
    return false;
  }
}

/* =========================================================
   HAUPTSCHLEIFE
   ========================================================= */
function shiftTimers(gap, now) {
  if (thief) thief.start += gap;
  nextThiefAt += gap;
  nextEventAt += gap;
  if (ev.type) ev.until += gap;
  if (lockUntil > now - gap) lockUntil += gap;
  if (lockCdUntil > now - gap) lockCdUntil += gap;
}

function lockLabel(now) {
  if (now < lockUntil) return { t: `🛡️ ${Math.ceil((lockUntil - now) / 1000)} s`, d: true, locked: true };
  if (now < lockCdUntil) return { t: `⏳ ${Math.ceil((lockCdUntil - now) / 1000)} s`, d: true, locked: false };
  return { t: "🔒 Sperren", d: false, locked: false };
}

function uiTick(now) {
  $("income").textContent = fmt(totalIncome()) + "/s";
  $("mult").textContent = "x" + fmtMult(permMult() * eventMult());

  document.querySelectorAll("#shop .buybtn").forEach(b => {
    const k = b.dataset.up, u = UPGRADES[k];
    b.disabled = S.upg[k] >= u.max || S.money < u.cost(S.upg[k]);
  });
  const rb = $("btnRebirth");
  if (rb) rb.disabled = S.money < rebirthCost();

  for (const it of belt) it.el.classList.toggle("cant", S.money < it.price);

  const lb = $("btnLock"), st = lockLabel(now);
  if (lb.textContent !== st.t) lb.textContent = st.t;
  lb.disabled = st.d;
  baseEl.classList.toggle("locked", st.locked);

  const eb = $("eventBar");
  if (ev.type) {
    eb.classList.remove("hidden");
    eb.textContent = `${EVENTS[ev.type].name} – noch ${Math.max(0, Math.ceil((ev.until - now) / 1000))} s`;
  } else {
    eb.classList.add("hidden");
  }
}

function loop(now) {
  let dt = (now - last) / 1000;
  last = now;

  // App/Tab war im Hintergrund: Einkommen nachzahlen (max. 2 h), Timer verschieben
  if (dt > 2) {
    S.money += totalIncome() * Math.min(dt, OFFLINE_MAX_S);
    shiftTimers(dt * 1000, now);
    dt = 0;
  }

  S.money += totalIncome() * dt;
  updateBelt(dt);
  updateThief(now, dt * 1000);
  updateEvents(now);

  $("money").textContent = "₤ " + fmt(S.money);

  uiAcc += dt;
  if (uiAcc >= 0.25) { uiAcc = 0; uiTick(now); }
  saveAcc += dt;
  if (saveAcc >= 15) { saveAcc = 0; save(); }

  requestAnimationFrame(loop);
}

/* =========================================================
   EREIGNIS-HANDLER
   ========================================================= */
beltEl.addEventListener("click", e => {
  const el = e.target.closest(".bitem");
  if (!el) return;
  const it = belt.find(x => x.id === Number(el.dataset.id));
  if (it) buy(it, e);
});

$("shop").addEventListener("click", e => {
  const b = e.target.closest(".buybtn");
  if (b) buyUpgrade(b.dataset.up);
});
$("rebirth").addEventListener("click", e => { if (e.target.closest("#btnRebirth")) doRebirth(); });
$("btnLock").addEventListener("click", lockBase);
$("btnMerge").addEventListener("click", autoMerge);
$("btnIndex").addEventListener("click", openIndex);
$("btnHelp").addEventListener("click", openHelp);
$("btnSound").addEventListener("click", () => { S.sound = !S.sound; updateToggles(); save(); });
$("btnVoice").addEventListener("click", () => {
  S.voice = !S.voice;
  if (!S.voice && "speechSynthesis" in window) speechSynthesis.cancel();
  updateToggles();
  save();
});
$("modalClose").addEventListener("click", closeModal);
$("modal").addEventListener("click", e => {
  if (e.target.id === "modal") closeModal();
  if (e.target.closest("#btnReset")) resetGame();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
    if (selected !== null) { selected = null; renderBase(); }
    return;
  }
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const k = e.key.toLowerCase();
  if (k === "l") lockBase();
  else if (k === "f") autoMerge();
  else if (k === "i") { if (modalOpen) closeModal(); else openIndex(); }
  else if (k === "m") { S.sound = !S.sound; updateToggles(); }
});

// Audio auf iOS/Android erst nach Nutzer-Geste möglich – bei jeder Berührung entsperren
document.addEventListener("pointerdown", () => { if (S.sound) audio(); }, { passive: true });

// Speichern, wenn die App in den Hintergrund geht (iOS feuert kein beforeunload)
window.addEventListener("beforeunload", save);
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    save();
    if (dragFrom !== null) { press = null; cleanupDrag(); }
  }
});

/* =========================================================
   PWA: Offline & Installation
   ========================================================= */
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  installPrompt = e;
  $("btnInstall").classList.remove("hidden");
});
$("btnInstall").addEventListener("click", async () => {
  if (!installPrompt) { openHelp(); return; }
  installPrompt.prompt();
  try { await installPrompt.userChoice; } catch (e) { /* abgebrochen */ }
  installPrompt = null;
  $("btnInstall").classList.add("hidden");
});
window.addEventListener("appinstalled", () => {
  $("btnInstall").classList.add("hidden");
  log("📲 Als App installiert!");
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline nicht verfügbar */ });
  });
}

/* =========================================================
   START
   ========================================================= */
(function init() {
  if (isTouch) document.querySelectorAll(".tapword").forEach(el => { el.textContent = "tippe"; });
  else document.querySelectorAll(".tapword").forEach(el => { el.textContent = "klicke"; });

  const hadSave = load();
  recalc();
  updateToggles();
  renderShop();
  renderBase();

  // Fließband vorbefüllen
  const W = beltEl.clientWidth || 1000;
  const bw = itemWidth();
  for (let x = W - bw - 24; x > -bw; x -= bw + 44) spawnBeltItem(x, true);

  if (hadSave) {
    const away = (Date.now() - (Number(S.savedAt) || Date.now())) / 1000;
    if (away > 30) {
      const gain = totalIncome() * Math.min(away, OFFLINE_MAX_S) * 0.5;
      if (gain > 0) {
        S.money += gain;
        announce(`👋 Willkommen zurück! Deine Brainrots haben ₤ ${fmt(gain)} verdient.`, "good");
        log(`💤 Offline-Einnahmen: +₤ ${fmt(gain)}`);
      }
    }
    log("💾 Spielstand geladen.");
  } else {
    log("🎬 Neues Spiel gestartet – kaufe deinen ersten Brainrot!");
    openHelp();
  }

  last = performance.now();
  requestAnimationFrame(loop);
})();
