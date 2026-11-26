# 🦈 Brainrot-Fließband

**Kaufen · Fusionieren · Verteidigen** – ein Idle-Spiel für **Handy, iPad und Browser**.
Brainrots fahren über das Fließband, du kaufst sie, sie verdienen Lire für dich, du fusionierst
gleiche zu stärkeren Stufen und verjagst Diebe, die deine besten Brainrots klauen wollen.

## Spielen

- **Online:** nach dem Veröffentlichen über GitHub Pages (siehe unten) die Seite öffnen.
- **Lokal:** im Ordner `python3 -m http.server 8000` starten und `http://localhost:8000` öffnen.
  (`index.html` per Doppelklick geht auch, dann aber ohne Offline-Modus.)

### Als App aufs Handy / iPad
- **iPhone / iPad (Safari):** Teilen ⬆️ → „Zum Home-Bildschirm“.
- **Android (Chrome):** Menü ⋮ → „App installieren“ – oder den 📲-Knopf im Spiel.

Danach startet das Spiel im Vollbild mit eigenem Icon und funktioniert auch **offline**.

## Steuerung

| Aktion | Touch (Handy/iPad) | Computer |
|---|---|---|
| Kaufen | Brainrot auf dem Fließband antippen | Klicken |
| Fusionieren | Brainrot antippen, dann gleichen (gleiche Stufe) antippen – oder aufeinander ziehen | Ziehen oder nacheinander klicken |
| Verschieben | Antippen, dann freien Platz antippen | Ziehen |
| Verkaufen | 💰 auf dem Platz oder auf „💰 Verkaufen“ ziehen | dito |
| Dieb verjagen | Dieb schnell mehrfach antippen | Klicken |
| Basis sperren | 🔒 Sperren | `L` |
| Auto-Fusion | ⚡ Auto-Fusion | `F` |
| Index / Ton | 📖 / 🔊 | `I` / `M` |
| Pause | ⏸️ | `P` |
| Konto / Bestenliste | 👤 / 🏆 | – |

## Funktionen
- 27 Brainrot-Arten in 7 Seltenheiten, Mutationen (Gold ×2, Diamant ×4, Regenbogen ×10)
- Fusion bis ★★★★★, Upgrades (Glück, Plätze, Fließband-Turbo, Alarmanlage), Rebirth
- Zufällige Ereignisse, Brainrot-Index mit Dauerbonus, Offline-Einnahmen (50 %, max. 2 h)
- Soundeffekte, italienische/russische Sprachausgabe, Vibration (Android)
- Spielstand wird lokal auf dem Gerät gespeichert

## Konten & Bestenliste (online)

Jeder Spieler kann ein eigenes Konto anlegen – nur mit **Spielername und Passwort**, ohne E-Mail.
Der Spielstand wird dann im Konto gespeichert (automatisch jede Minute, beim Pausieren und wenn die
App in den Hintergrund geht). So kann man auf jedem Gerät weiterspielen und sich auf der
**🏆 Bestenliste** messen. Gewertet werden die insgesamt verdienten Lire (auch über Rebirths hinweg).

Ohne Einrichtung läuft das Spiel wie bisher nur lokal; die Knöpfe 👤 und 🏆 zeigen dann einen Hinweis.

### Einmalige Einrichtung (kostenlos, ca. 10 Minuten)
1. Auf [supabase.com](https://supabase.com) ein Konto und ein **neues Projekt** anlegen
   (Region am besten *Central EU (Frankfurt)*).
2. Im Projekt **SQL Editor** öffnen, den Inhalt von [`supabase/schema.sql`](supabase/schema.sql)
   einfügen und **Run** klicken. Das legt die Tabellen für Spielstände und Bestenliste samt
   Zugriffsregeln an.
3. **Authentication → Sign In / Providers → Email**: E-Mail-Anmeldung muss an sein,
   **„Confirm email“ ausschalten** (es gibt ja keine echten E-Mail-Adressen) und speichern.
4. **Project Settings → API** (bzw. *API Keys*): die **Project URL** und den **anon public**-Schlüssel
   (unter *Legacy API keys*, beginnt mit `eyJ…`) kopieren und in [`config.js`](config.js) eintragen.
5. Committen und pushen – fertig. Der anon-Schlüssel ist öffentlich gedacht; die Daten schützen die
   Regeln aus `schema.sql` (jeder darf nur seinen eigenen Spielstand lesen/schreiben, die Bestenliste
   ist für alle lesbar).

Falls Supabase beim Registrieren die interne Adresse ablehnt („email invalid“), in `config.js` bei
`usernameEmailDomain` eine andere Domain eintragen (z. B. eine eigene).

### Sicherheit
- **Passwörter:** neue Konten brauchen mindestens 8 Zeichen, das Passwort darf den Spielernamen nicht
  enthalten. Zusätzlich in Supabase unter *Authentication → Sign In / Providers → Email* die
  **Minimum password length** auf **8** stellen.
- **Schimpfwort-Filter:** unpassende Spielernamen werden beim Registrieren abgelehnt und vom Server nicht
  auf die Bestenliste gelassen (Liste in `js/online.js` und `supabase/schema.sql`).
- **Plausibilitätsprüfung am Server:** Die Bestenliste begrenzt Punktsprünge (höchstens 5 % des bisherigen
  Verdienstes + 1000 Lire pro Sekunde seit dem letzten Eintrag), Punkte können nicht sinken und Rebirths
  müssen zu den verdienten Lire passen. Das ist ein grober Filter – wer sich auskennt, kann langsam
  schummeln; auffällige Einträge im *Table Editor* löschen.
- **Roboter-Prüfung (optional, empfohlen):** Cloudflare Turnstile beim Anmelden und Registrieren.
  1. Auf [dash.cloudflare.com](https://dash.cloudflare.com) (kostenloses Konto) → **Turnstile** →
     **Add widget**: Name „Brainrot“, Domain `kaeptnzursee1910.github.io`, Modus *Managed*.
  2. Den **Site Key** in `config.js` bei `turnstileSiteKey` eintragen, committen und veröffentlichen.
  3. **Erst danach** in Supabase *Authentication → Attack Protection* → **Enable Captcha protection**,
     Anbieter *Turnstile*, den **Secret Key** eintragen und speichern.
     (Umgekehrte Reihenfolge würde Anmeldungen blockieren, bis das Spiel den Site Key kennt.)

### Gut zu wissen
- **Spielername** ist auf der Bestenliste für alle sichtbar → keinen echten vollen Namen verwenden.
- **Passwort vergessen** lässt sich nicht zurücksetzen (keine E-Mail). Im Notfall kann der Admin
  in Supabase unter *Authentication → Users* den Nutzer löschen oder ein neues Passwort setzen.
- Melden sich zwei Geräte mit unterschiedlichem Fortschritt am selben Konto an, fragt das Spiel,
  welcher Spielstand gelten soll.
- **Abmelden** speichert ins Konto und startet auf dem Gerät ein neues Spiel – praktisch, wenn sich
  Geschwister ein Tablet teilen.
- Da das Spiel komplett im Browser läuft, könnten technisch versierte Spieler ihre Punkte fälschen.
  Unpassende Einträge kann der Admin in Supabase im *Table Editor* (Tabelle `leaderboard`) löschen.

## Figuren-Bilder
Jede Figur hat ein eigenes, selbst gezeichnetes Bild in `img/characters/<id>.svg`
(z. B. `tralalero.svg`, `tung.svg`, `spaghettosauro.svg`).

**Eigene Bilder verwenden:** Datei mit gleichem Namen ersetzen – oder in `js/game.js` bei der
Figur ein eigenes Bild angeben, z. B. `img: "img/characters/tralalero.png"`.
Am besten quadratisch mit transparentem Hintergrund (PNG, SVG oder WebP).
Fehlt ein Bild, zeigt das Spiel automatisch die Emoji-Variante.
Nach dem Austauschen in `sw.js` die `CACHE`-Version erhöhen (und neue Dateinamen in `ASSETS`
eintragen), damit installierte Apps die neuen Bilder laden.

## Veröffentlichen mit GitHub Pages
1. Im Repository: **Settings → Pages → Source: „GitHub Actions“**.
2. Den Code auf den Branch `main` bringen (oder den Workflow unter **Actions** manuell starten).
3. Das Spiel ist dann unter `https://<benutzername>.github.io/<repository>/` erreichbar.

## Aufbau
```
index.html            Seite
css/style.css         Aussehen (responsiv für Handy, Tablet, Desktop)
js/game.js            Spiellogik
js/online.js          Konto, Speichern im Konto, Bestenliste (Supabase)
js/vendor/            supabase-js 2.45.4 (MIT-Lizenz)
config.js             Zugangsdaten für Supabase (leer = nur lokal)
supabase/schema.sql   Datenbank-Tabellen und Zugriffsregeln
manifest.webmanifest  App-Manifest (installierbar)
sw.js                 Service Worker (offline) – bei Änderungen CACHE-Version erhöhen
icons/                App-Icons
img/characters/       Bilder der 27 Figuren
```

---
Fan-Projekt zum Spaß · Figurennamen stammen aus Internet-Memes (Italian/Soviet Brainrot) · keine kommerzielle Nutzung.
