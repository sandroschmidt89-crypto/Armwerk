# Armwerk – Home-Workout-App (PWA)

Dein Training für Arme und Schultern: 2× pro Woche, max. 20 Minuten, ohne Konto, ohne Cloud, komplett offline nutzbar.

## Dateien
index.html, style.css, data.js (Übungen und Plan), app.js (Logik), sw.js (Offline), manifest.webmanifest, icons/

## Installation über GitHub Pages (kostenlos, HTTPS inklusive)
1. Auf github.com ein neues Repository anlegen, z. B. `armwerk` (öffentlich; Pages ist bei privaten Repos nur in bezahlten Plänen verfügbar).
2. Alle Dateien samt Ordner `icons/` hochladen (Add file → Upload files) und committen.
3. Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → Save.
4. Nach ca. 1 Minute ist die App unter `https://DEIN-NAME.github.io/armwerk/` erreichbar.
5. Auf dem iPhone in **Safari** öffnen → Teilen-Symbol → **Zum Home-Bildschirm**. Danach einmal im Flugmodus öffnen, um den Offline-Betrieb zu prüfen.

Das Repository enthält keine persönlichen Daten. Die Trainingsdaten liegen nur im Speicher deines iPhones.

## Wichtige Hinweise
- Daten werden lokal im Browser gespeichert. Auf dem iPhone sind Safari-Browser und installierte Home-Bildschirm-App getrennte Speicher. Nutze nach der Installation nur noch die Home-Bildschirm-App und übertrage vorhandene Daten bei Bedarf per Export/Import.
- Sichere deine Daten regelmäßig: Mehr → Einstellungen → Daten exportieren.
- Der Signalton ist bei aktivem Stumm-Schalter aus. Safari auf dem iPhone unterstützt keine Vibration.
- Updates: Dateien im Repository ersetzen; in `sw.js` die Zahl in `CACHE = 'armwerk-v1'` erhöhen, damit der neue Stand geladen wird.
- Lokal testen: `python3 -m http.server 8000` im Ordner und `http://localhost:8000` öffnen.
- Die Videolinks öffnen eine YouTube-Suche zur jeweiligen Übung. Die vollständige Anleitung steht immer in der App.
