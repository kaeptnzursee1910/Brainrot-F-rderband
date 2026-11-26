"use strict";
/* =========================================================
   ONLINE: Konto, Spielstand im Konto, Bestenliste (Supabase)
   Wird nach game.js geladen und nutzt dessen globale Funktionen.
   ========================================================= */

const CFG = window.BRAINROT_CONFIG || {};
const ONLINE_READY = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient);
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const MIN_PW_NEW = 8;            // neue Konten: mind. 8 Zeichen (Anmelden alter Konten geht weiter ab 6)
const CAPTCHA_KEY = CFG.turnstileSiteKey || "";

// Schimpfwort-Filter für Spielernamen (gleiche Liste wie in supabase/schema.sql)
const BAD_WORDS = ["arschloch", "wichser", "hurensohn", "fotze", "schlampe", "missgeburt", "spast", "behindert",
  "nutte", "ficker", "ficken", "schwuchtel", "nazi", "hitler", "kanake", "neger", "nigger", "nigga", "fuck",
  "shit", "bitch", "cunt", "pussy", "whore", "slut", "retard", "faggot", "porn", "penis", "vagina", "titten",
  "scheisse", "pisser", "kacke", "wixer", "hure", "sieg_heil", "siegheil"];
function normName(n) {
  return n.toLowerCase().replace(/[013457_]/g, c => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "_": "" }[c]));
}
function isBadName(n) {
  const x = normName(n);
  return BAD_WORDS.some(w => x.includes(w.replace(/_/g, "")));
}
const CLOUD_INTERVAL_MS = 60000;   // automatisch alle 60 s ins Konto speichern
const CLOUD_MIN_GAP_MS = 15000;    // nie öfter als alle 15 s

const sb = ONLINE_READY ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "brainrot-fliessband-auth" }
}) : null;

let account = null;            // { id, username }
let lastCloudSave = 0;         // Zeitpunkt (Date.now) des letzten erfolgreichen Speicherns
let cloudBusy = false;
let cloudError = "";
let pendingCloud = null;       // Konto-Spielstand, falls der Spieler noch wählen muss

function esc(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function usernameToEmail(name) {
  return `${name.toLowerCase()}@${CFG.usernameEmailDomain || "spieler.brainrot-fliessband.de"}`;
}
// Genauen Grund der Roboter-Prüfung anzeigen (Fehlercode von Cloudflare/Supabase)
function captchaErrorText(m) {
  const code = (m.match(/\(([^)]+)\)\s*$/) || [])[1] || "";
  const why = {
    "invalid-input-secret": "Der Secret Key in Supabase ist falsch.",
    "missing-input-secret": "In Supabase ist kein Secret Key eingetragen.",
    "invalid-input-response": "Cloudflare kennt das Token nicht – passt der Secret Key in Supabase zum Site Key im Spiel, und ist als Anbieter „Turnstile“ gewählt?",
    "timeout-or-duplicate": "Die Bestätigung war abgelaufen oder wurde doppelt verwendet – bitte neu bestätigen.",
    "no captcha_token found": "Es wurde keine Bestätigung mitgeschickt – bitte das Kästchen anklicken.",
    "bad-request": "Fehlerhafte Anfrage an Cloudflare.",
    "internal-error": "Fehler bei Cloudflare – bitte später nochmal versuchen."
  }[code];
  return `Roboter-Prüfung fehlgeschlagen. ${why || "Bitte nochmal bestätigen."}${code ? ` (Code: ${code})` : ""}`;
}

function germanAuthError(err) {
  const m = String((err && err.message) || err || "");
  if (/invalid login credentials/i.test(m)) return "Spielername oder Passwort falsch.";
  if (/already registered|already exists/i.test(m)) return "Dieser Spielername ist schon vergeben.";
  if (/password.*(at least|6)/i.test(m)) return "Das Passwort muss mindestens 6 Zeichen haben.";
  if (/rate limit|too many/i.test(m)) return "Zu viele Versuche – bitte kurz warten.";
  if (/email.*(invalid|not authorized)/i.test(m)) return "Anmeldung vom Server abgelehnt (E-Mail-Domain). Siehe README: usernameEmailDomain.";
  if (/confirm/i.test(m)) return "Konto muss bestätigt werden – in Supabase „Confirm email“ ausschalten (siehe README).";
  if (/captcha/i.test(m)) return captchaErrorText(m);
  if (/nicht erlaubt/i.test(m)) return "Dieser Spielername ist nicht erlaubt.";
  if (/weak|pwned|leaked/i.test(m)) return "Dieses Passwort ist zu unsicher – bitte ein anderes wählen.";
  if (/fetch|network|failed to/i.test(m)) return "Keine Verbindung zum Server. Bist du online?";
  return m || "Unbekannter Fehler.";
}
function hasProgress(st) {
  return !!st && ((st.stats && (st.stats.bought > 0 || st.stats.earned > 1000)) || st.rebirths > 0);
}
function timeStr(ts) {
  return ts ? new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";
}

/* ---------- Kopfzeile ---------- */
function updateAccountButton() {
  const b = $("btnAccount");
  if (!b) return;
  b.innerHTML = account ? `👤<span class="lbl"> ${esc(account.username)}</span>` : `👤<span class="lbl"> Anmelden</span>`;
  b.title = account ? `Angemeldet als ${account.username}` : "Anmelden / Konto erstellen";
  b.classList.toggle("on", !!account);
}

/* ---------- Speichern im Konto ---------- */
function leaderboardRow() {
  return {
    user_id: account.id,
    username: account.username,
    earned: Math.floor(S.stats.earned || 0),
    rebirths: S.rebirths,
    discovered: discoveredCount(),
    updated_at: new Date().toISOString()
  };
}

async function cloudSave(force = false) {
  // Solange der Spieler nicht gewählt hat, welcher Spielstand gilt, nichts überschreiben
  if (!sb || !account || cloudBusy || pendingCloud) return false;
  if (!force && Date.now() - lastCloudSave < CLOUD_MIN_GAP_MS) return false;
  cloudBusy = true;
  try {
    S.owner = account.id;
    save();
    const data = JSON.parse(JSON.stringify(S));
    const r1 = await sb.from("saves").upsert({ user_id: account.id, data, updated_at: new Date().toISOString() });
    if (r1.error) throw r1.error;
    const r2 = await sb.from("leaderboard").upsert(leaderboardRow());
    if (r2.error) throw r2.error;
    lastCloudSave = Date.now();
    cloudError = "";
    return true;
  } catch (e) {
    cloudError = germanAuthError(e);
    return false;
  } finally {
    cloudBusy = false;
    refreshAccountModal();
  }
}

// Nach dem Anmelden: Spielstand auf dem Gerät und im Konto zusammenführen
async function syncAfterLogin() {
  const { data, error } = await sb.from("saves").select("data, updated_at").eq("user_id", account.id).maybeSingle();
  if (error) { cloudError = germanAuthError(error); return; }
  const cloud = data && data.data;

  if (!cloud) {                                   // neues Konto: Gerät-Spielstand übernehmen
    await cloudSave(true);
    log("☁️ Spielstand im Konto angelegt.");
    return;
  }
  const localOwner = S.owner;
  const cloudTime = Number(cloud.savedAt) || 0;
  if (localOwner === account.id) {                // gleiches Konto: neueren Stand nehmen
    if (cloudTime > (Number(S.savedAt) || 0) + 2000) useCloud(cloud);
    else await cloudSave(true);
    return;
  }
  if (!hasProgress(S)) { useCloud(cloud); return; } // Gerät hat nichts Wichtiges
  askWhichSave(cloud);                              // beide haben Fortschritt: Spieler fragen
}

function useCloud(cloud) {
  replaceState(Object.assign({}, cloud, { owner: account.id }));
  lastCloudSave = Date.now();
  log("☁️ Spielstand aus dem Konto geladen.");
}

function saveSummary(st) {
  const n = SPECIES.filter(sp => st.index && st.index[sp.id] && st.index[sp.id].some(Boolean)).length;
  return `₤ ${fmt(st.money)} · insgesamt ₤ ${fmt((st.stats && st.stats.earned) || 0)} verdient · ${n}/${SPECIES.length} entdeckt · ${st.rebirths || 0} Rebirths`;
}

function askWhichSave(cloud) {
  openModal(`
    <h2>☁️ Welchen Spielstand nehmen?</h2>
    <p>Auf diesem Gerät und in deinem Konto gibt es unterschiedliche Spielstände.</p>
    <div class="choice">
      <button class="choicebtn" data-act="keep-cloud"><b>📦 Spielstand im Konto</b><small>${esc(saveSummary(cloud))}</small></button>
      <button class="choicebtn" data-act="keep-local"><b>📱 Spielstand auf diesem Gerät</b><small>${esc(saveSummary(S))}</small></button>
    </div>
    <p class="statsline">Der andere Spielstand wird überschrieben. Bis du gewählt hast, wird nichts im Konto gespeichert.</p>`);
  pendingCloud = cloud;
}

/* ---------- Anmelden / Registrieren / Abmelden ---------- */
async function setAccountFromSession(session) {
  if (!session || !session.user) { account = null; updateAccountButton(); return; }
  const u = session.user;
  const name = (u.user_metadata && u.user_metadata.username) || (u.email || "").split("@")[0];
  account = { id: u.id, username: name };
  updateAccountButton();
}

async function doLogin(register) {
  const name = ($("accName").value || "").trim();
  const pw = $("accPw").value || "";
  const msg = $("accMsg");
  if (!USERNAME_RE.test(name)) { msg.textContent = "Spielername: 3–16 Zeichen, nur Buchstaben, Zahlen und _."; return; }
  if (register && isBadName(name)) { msg.textContent = "Dieser Spielername ist nicht erlaubt – bitte einen anderen wählen."; return; }
  if (register && pw.length < MIN_PW_NEW) { msg.textContent = `Das Passwort muss mindestens ${MIN_PW_NEW} Zeichen haben.`; return; }
  if (register && pw.toLowerCase().includes(name.toLowerCase())) { msg.textContent = "Das Passwort darf den Spielernamen nicht enthalten."; return; }
  if (pw.length < 6) { msg.textContent = "Spielername oder Passwort falsch."; return; }
  if (CAPTCHA_KEY && !captchaToken) { msg.textContent = "Bitte bestätige zuerst unten, dass du kein Roboter bist."; return; }
  msg.textContent = register ? "Konto wird erstellt …" : "Anmeldung läuft …";
  document.querySelectorAll("#modalBody button").forEach(b => { b.disabled = true; });
  try {
    const email = usernameToEmail(name);
    const captcha = CAPTCHA_KEY ? { captchaToken } : {};
    const res = register
      ? await sb.auth.signUp({ email, password: pw, options: Object.assign({ data: { username: name } }, captcha) })
      : await sb.auth.signInWithPassword({ email, password: pw, options: captcha });
    if (res.error) throw res.error;
    if (!res.data.session) throw new Error("confirm");
    await setAccountFromSession(res.data.session);
    SFX.legendary();
    announce(register ? `🎉 Willkommen, ${account.username}!` : `👋 Hallo ${account.username}!`, "good");
    log(`👤 Angemeldet als ${account.username}`);
    closeModal();
    await syncAfterLogin();
  } catch (e) {
    msg.textContent = germanAuthError(e);
    document.querySelectorAll("#modalBody button").forEach(b => { b.disabled = false; });
  } finally {
    resetCaptcha();   // ein CAPTCHA-Token gilt nur für einen Versuch
  }
}

/* ---------- Roboter-Prüfung (Cloudflare Turnstile) ---------- */
let captchaToken = "", captchaWidget = null, turnstileLoading = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoading) {
    turnstileLoading = new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      sc.async = true;
      sc.onload = () => resolve();
      sc.onerror = () => { turnstileLoading = null; reject(new Error("Roboter-Prüfung konnte nicht geladen werden.")); };
      document.head.appendChild(sc);
    });
  }
  return turnstileLoading;
}
async function renderCaptcha() {
  const box = $("captchaBox");
  if (!CAPTCHA_KEY || !box) return;
  captchaToken = "";
  try {
    await loadTurnstile();
    if (!document.body.contains(box)) return;
    captchaWidget = window.turnstile.render(box, {
      sitekey: CAPTCHA_KEY, language: "de", theme: "dark",
      callback: t => { captchaToken = t; },
      "expired-callback": () => { captchaToken = ""; },
      "error-callback": () => { captchaToken = ""; }
    });
  } catch (e) {
    const m = $("accMsg");
    if (m) m.textContent = e.message + " Bist du online?";
  }
}
function resetCaptcha() {
  captchaToken = "";
  if (captchaWidget !== null && window.turnstile) { try { window.turnstile.reset(captchaWidget); } catch (e) { /* egal */ } }
}

async function doLogout() {
  if (!confirm("Abmelden? Dein Spielstand bleibt im Konto gespeichert. Auf diesem Gerät beginnt danach ein neues Spiel.")) return;
  await cloudSave(true);
  try { await sb.auth.signOut(); } catch (e) { /* trotzdem lokal abmelden */ }
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ }
  resetting = true;
  location.reload();
}

/* ---------- Konto-Fenster ---------- */
function accountHTML() {
  if (!ONLINE_READY) {
    return `<h2>👤 Konto</h2>
      <p>Online-Konten und Bestenliste sind für dieses Spiel noch nicht eingerichtet.</p>
      <p class="statsline">Für Admins: In <code>config.js</code> die Supabase-Adresse und den öffentlichen Schlüssel eintragen – Anleitung in der README.</p>`;
  }
  if (!account) {
    return `<h2>👤 Konto</h2>
      <p>Melde dich an, damit dein Spielstand im Konto gespeichert wird – dann kannst du auf jedem Gerät weiterspielen und kommst auf die 🏆 Bestenliste.</p>
      <form id="accForm" class="accform" autocomplete="on" onsubmit="return false">
        <label>Spielername<input id="accName" name="username" autocomplete="username" maxlength="16" placeholder="z. B. Tralalero_42" autocapitalize="off" spellcheck="false"></label>
        <label>Passwort<input id="accPw" name="password" type="password" autocomplete="current-password" placeholder="neues Konto: mind. 8 Zeichen"></label>
        ${CAPTCHA_KEY ? `<div id="captchaBox" class="captcha"></div>` : ""}
        <div class="accbtns">
          <button type="submit" class="buybtn" data-act="login">Anmelden</button>
          <button type="button" class="smallbtn" data-act="register">Neues Konto</button>
        </div>
        <p id="accMsg" class="accmsg"></p>
      </form>
      <p class="statsline">Keine E-Mail nötig. Der Spielername ist auf der Bestenliste für alle sichtbar – bitte nicht deinen echten vollen Namen verwenden. Verwende ein Passwort, das du nirgends sonst benutzt, und merk es dir gut – es kann nicht zurückgesetzt werden. Unpassende Namen werden gelöscht.</p>`;
  }
  return `<h2>👤 ${esc(account.username)}</h2>
    <p>Dein Spielstand wird automatisch im Konto gespeichert.</p>
    <p class="statsline">Zuletzt gespeichert: <b>${timeStr(lastCloudSave)}</b>${cloudBusy ? " · speichert …" : ""}${cloudError ? `<br><span class="err">⚠️ ${esc(cloudError)}</span>` : ""}</p>
    <p class="statsline">Insgesamt verdient: <b>₤ ${fmt(S.stats.earned || 0)}</b></p>
    <div class="accbtns">
      <button class="buybtn" data-act="save">☁️ Jetzt speichern</button>
      <button class="smallbtn" data-act="board">🏆 Bestenliste</button>
      <button class="smallbtn" data-act="logout">Abmelden</button>
    </div>`;
}
function openAccount() {
  if (pendingCloud) { askWhichSave(pendingCloud); return; }
  openModal(accountHTML());
  captchaWidget = null;
  if (!account) renderCaptcha();
  const n = $("accName");
  if (n && !isTouch) n.focus();
}
// Konto-Fenster aktualisieren, falls es gerade offen ist
function refreshAccountModal() {
  if (modalOpen && account && $("modalBody").querySelector('[data-act="logout"]')) $("modalBody").innerHTML = accountHTML();
}

/* ---------- Bestenliste ---------- */
async function openBoard() {
  if (!ONLINE_READY) { openAccount(); return; }
  openModal(`<h2>🏆 Bestenliste</h2><p class="statsline">Lädt …</p>`);
  if (account) await cloudSave(true);
  const { data, error } = await sb.from("leaderboard")
    .select("user_id, username, earned, rebirths, discovered")
    .order("earned", { ascending: false }).limit(50);
  if (!modalOpen) return;
  if (error) { $("modalBody").innerHTML = `<h2>🏆 Bestenliste</h2><p class="err">⚠️ ${esc(germanAuthError(error))}</p>`; return; }

  let ownRank = "";
  if (account && !data.some(r => r.user_id === account.id)) {
    const mine = Math.floor(S.stats.earned || 0);
    const { count } = await sb.from("leaderboard").select("user_id", { count: "exact", head: true }).gt("earned", mine);
    if (typeof count === "number") ownRank = `<p class="statsline">Dein Platz: <b>${count + 1}</b> mit ₤ ${fmt(mine)}</p>`;
  }
  const medal = i => ["🥇", "🥈", "🥉"][i] || String(i + 1);
  const rows = data.map((r, i) => `<tr class="${account && r.user_id === account.id ? "me" : ""}">
      <td class="rk">${medal(i)}</td><td class="nm">${esc(r.username)}</td>
      <td class="num">₤ ${fmt(r.earned)}</td><td class="num">${r.rebirths}</td><td class="num">${r.discovered}/${SPECIES.length}</td></tr>`).join("");
  $("modalBody").innerHTML = `<h2>🏆 Bestenliste</h2>
    <p class="statsline">Gewertet wird, wie viele Lire du insgesamt verdient hast – auch über Rebirths hinweg.</p>
    ${data.length ? `<div class="boardwrap"><table class="board"><thead><tr><th>#</th><th>Name</th><th>Verdient</th><th>♻️</th><th>📖</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p>Noch niemand auf der Liste – sei der Erste!</p>`}
    ${ownRank}
    ${account ? "" : `<p><button class="buybtn" data-act="account">👤 Anmelden und mitmachen</button></p>`}`;
}

/* ---------- Ereignisse ---------- */
$("btnAccount").addEventListener("click", openAccount);
$("btnBoard").addEventListener("click", openBoard);

$("modal").addEventListener("click", async e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  if (act === "login") doLogin(false);
  else if (act === "register") doLogin(true);
  else if (act === "logout") doLogout();
  else if (act === "board") openBoard();
  else if (act === "account") openAccount();
  else if (act === "save") { await cloudSave(true); if (!cloudError) announce("☁️ Gespeichert!", "good"); }
  else if (act === "keep-cloud" && pendingCloud) { useCloud(pendingCloud); pendingCloud = null; closeModal(); }
  else if (act === "keep-local") { pendingCloud = null; closeModal(); await cloudSave(true); log("☁️ Gerät-Spielstand ins Konto übernommen."); }
});
$("modal").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target && e.target.id === "accPw") { e.preventDefault(); doLogin(false); }
});

// Automatisch speichern: regelmäßig, beim Pausieren und wenn die App in den Hintergrund geht
setInterval(() => { if (account && !paused) cloudSave(); }, CLOUD_INTERVAL_MS);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") cloudSave(true); });
$("btnPause").addEventListener("click", () => { if (paused) cloudSave(true); });

/* ---------- Start ---------- */
(async function initOnline() {
  updateAccountButton();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    await setAccountFromSession(data && data.session);
    if (account) {
      log(`👤 Angemeldet als ${account.username}`);
      await syncAfterLogin();
    }
  } catch (e) {
    cloudError = germanAuthError(e);
  }
  sb.auth.onAuthStateChange((_ev, session) => { setAccountFromSession(session); });
})();
