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

## Funktionen
- 17 Brainrot-Arten in 7 Seltenheiten, Mutationen (Gold ×2, Diamant ×4, Regenbogen ×10)
- Fusion bis ★★★★★, Upgrades (Glück, Plätze, Fließband-Turbo, Alarmanlage), Rebirth
- Zufällige Ereignisse, Brainrot-Index mit Dauerbonus, Offline-Einnahmen (50 %, max. 2 h)
- Soundeffekte, italienische/russische Sprachausgabe, Vibration (Android)
- Spielstand wird lokal auf dem Gerät gespeichert

## Veröffentlichen mit GitHub Pages
1. Im Repository: **Settings → Pages → Source: „GitHub Actions“**.
2. Den Code auf den Branch `main` bringen (oder den Workflow unter **Actions** manuell starten).
3. Das Spiel ist dann unter `https://<benutzername>.github.io/<repository>/` erreichbar.

## Aufbau
```
index.html            Seite
css/style.css         Aussehen (responsiv für Handy, Tablet, Desktop)
js/game.js            Spiellogik
manifest.webmanifest  App-Manifest (installierbar)
sw.js                 Service Worker (offline) – bei Änderungen CACHE-Version erhöhen
icons/                App-Icons
```

---
Fan-Projekt zum Spaß · Figurennamen stammen aus Internet-Memes (Italian/Soviet Brainrot) · keine kommerzielle Nutzung.
