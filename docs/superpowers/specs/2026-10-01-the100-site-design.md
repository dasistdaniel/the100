# The 100 – Showcase-Seite: Design

Datum: 2026-10-01
Repo: https://github.com/dasistdaniel/The100
Ziel-URL: https://dasistdaniel.github.io/the100/

## Ziel

Eine statische Showcase-Seite auf GitHub Pages für die „100 Spiele Challenge". Jedes Spiel erscheint als Kachel mit Screenshot, Infos und Links. Eine Progress Bar zeigt den Fortschritt („X / 100"). Neue Spiele lassen sich über eine Markdown-Datei und ein Build-Script hinzufügen. Die Seite richtet sich an Freunde und andere Besucher, die die Challenge verfolgen.

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Spiele-Hosting | Jedes Spiel hat ein eigenes Repo. Nicht alle laufen auf Pages. |
| Links | Pflicht: `repo`. Optional: `play_url`. „Spielen"-Button nur mit `play_url`. |
| Screenshots | Manuell als `screenshot.png` im Spiel-Ordner. Ohne Screenshot zeigt die Kachel ein Emoji bzw. die Nummer als Platzhalter. |
| Technik | Eigenes Node-Build-Script, Markdown mit Front Matter, kein Framework. |
| Deployment | GitHub Action baut bei Push auf `main` und veröffentlicht auf Pages. |
| Themes | System (Standard), Hell, Dunkel, umschaltbar. |
| Accessibility | WCAG AA als Mindestziel, im Build geprüft. |

Bewusst nicht enthalten (YAGNI): Suche, Filter, Detailseiten pro Spiel, automatische Screenshots.

## Repo-Struktur

```
The100/
├─ games/
│  ├─ 001-mojiblast/
│  │   ├─ index.md          # Front Matter + Beschreibung
│  │   └─ screenshot.png    # optional
│  └─ ...
├─ site/
│  ├─ template.html         # Layout mit Platzhaltern
│  └─ style.css
├─ scripts/
│  ├─ build.js              # Build-Script
│  ├─ new-game.js           # legt neuen Spiel-Ordner an
│  └─ lib/                  # Parsing, Validierung, Kontrast-Check
├─ test/                    # Tests für Validierung und Zählung
├─ .github/workflows/pages.yml
├─ package.json
└─ README.md                # Anleitung "Neues Spiel hinzufügen"
```

Die Zahl im Ordnernamen (`NNN-slug`) ist die Spielnummer (1 bis 100).

## Datenformat

`games/001-mojiblast/index.md`:

```markdown
---
title: MojiBlast
date: 2026-03-14
repo: https://github.com/dasistdaniel/MojiBlast
play_url: https://dasistdaniel.github.io/MojiBlast/   # optional
tags: [emoji, arcade]                                   # optional
emoji: 💥                                               # optional, Platzhalter
---
Kurze Beschreibung des Spiels.
```

Validierung (Build bricht mit klarer Fehlermeldung ab):

- Pflichtfelder `title`, `date`, `repo` vorhanden.
- Ordnername entspricht `NNN-slug`, Nummer 1 bis 100, keine doppelten Nummern.
- `date` ist ein gültiges Datum.
- `repo` und `play_url` sind `https://`-URLs.

## Seitenaufbau

Eine einzige Seite (`index.html`), nur HTML, CSS und Vanilla-JS.

1. **Header:** Titel „The 100", Untertitel, Link zum Repo, Theme-Umschalter.
2. **Progress Bar:** Balken mit „X / 100" und Prozent. Dazu ein Raster aus 100 Kästchen, fertige Spiele sind eingefärbt, ein Klick springt zur Kachel. X ist die Anzahl der Spiel-Ordner und wird beim Build berechnet.
3. **Kachel-Raster:** Responsive (1 Spalte mobil, 2 Tablet, 3 bis 4 Desktop). Kachel: Screenshot oder Emoji-Platzhalter, Nummer und Titel, Datum und Tags, gekürzte Beschreibung, Buttons „Spielen" (nur mit `play_url`) und „Code".
4. **Footer:** Build-Datum.

Sortierung: neueste zuerst, die Nummer bleibt auf der Kachel sichtbar.

## Themes

- Zustände: System (Standard), Hell, Dunkel. Ein Button im Header schaltet durch.
- Wahl wird im `localStorage` gespeichert (Zugriff in `try/catch`).
- Ein kleines Inline-Script im `<head>` setzt `data-theme` vor dem ersten Rendern, damit nichts aufblitzt.
- Alle Farben sind CSS-Variablen mit eigenen Werten für Hell und Dunkel.
- Ohne JavaScript folgt die Seite dem System (`prefers-color-scheme`).

## Accessibility

- **Kontrast:** WCAG AA in beiden Themes (4,5:1 Text, 3:1 UI-Elemente), inklusive Tags, Buttons und Balken. Der Build prüft die Farbpaare und schlägt bei Unterschreitung fehl.
- **Semantik:** `header`, `main`, `footer`, saubere Überschriftenhierarchie, jede Kachel ein `article` mit `h2`, „Zum Inhalt springen"-Link.
- **Progress Bar:** `role="progressbar"` mit `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` („23 von 100 Spielen fertig"). Das 100er-Raster ist dekorativ (`aria-hidden`).
- **Bilder:** Sinnvoller `alt`-Text pro Screenshot. Emoji-Platzhalter sind `aria-hidden`.
- **Buttons und Links:** Eindeutige Namen („MojiBlast spielen", „MojiBlast Code ansehen"). Der Theme-Button nennt den aktuellen Zustand.
- **Tastatur:** Alles per Tab erreichbar, sichtbarer Fokusring (nicht nur Farbe), Zielgröße mindestens 44×44 px.
- **Bewegung:** Animationen respektieren `prefers-reduced-motion`.
- **Sprache und Zoom:** `lang="de"`, kein horizontales Scrollen bis 320 px, Schrift in `rem`, Zoom bis 200 % nutzbar.
- **Nicht nur Farbe:** Der Fortschritt steht zusätzlich als Text da.

## Build (`scripts/build.js`)

1. Spiel-Ordner in `games/` einlesen, `index.md` mit `gray-matter` (Front Matter) und `marked` (Markdown zu HTML) parsen.
2. Validieren (siehe oben).
3. Screenshots nach `dist/games/<slug>/` kopieren, optional mit `sharp` auf etwa 800 px Breite verkleinern.
4. Template rendern, `dist/index.html` und CSS schreiben. Alle Pfade sind relativ, damit der Unterpfad `/The100/` funktioniert.
5. Kontrast-Check ausführen.
6. Beschreibungstexte werden bereinigt bzw. escaped, damit kein unerwartetes HTML in die Seite gelangt.

Abhängigkeiten: `gray-matter`, `marked`, `sharp` (optional).

## Update-Weg

```bash
npm run new -- mojiblast "MojiBlast"   # legt games/NNN-mojiblast/index.md an
# Text ergänzen, screenshot.png daneben legen
npm run dev                            # baut und serviert dist/ lokal
git add . && git commit && git push    # Action baut und veröffentlicht
```

`new-game.js` vergibt die nächste freie Nummer und füllt das Front Matter vor.

## Deployment (`.github/workflows/pages.yml`)

- Trigger: Push auf `main`.
- Schritte: Checkout, Node einrichten, `npm ci`, `npm run build`, `actions/upload-pages-artifact`, `actions/deploy-pages`.
- Einmalig: In den Repo-Einstellungen unter Pages „Source: GitHub Actions" wählen.

## Start-Inhalt

Beispieleinträge für vorhandene Spiele-Repos (u. a. MojiBlast, MemoMoji, MatchMoji, captainmoji, StoryMoji), mit `repo` und, wo vorhanden, `play_url`. Texte und Daten sind Platzhalter. Welche Repos zu den 100 zählen und in welcher Reihenfolge, entscheidet Daniel und passt es nach dem ersten Lauf an.

## Tests und Verifikation

- Unit-Tests für Validierung (fehlende Felder, doppelte Nummern, ungültige URLs) und die Zählung der Progress Bar.
- Ein vollständiger Build-Lauf.
- Sichtprüfung im Browser: beide Themes, Tastaturbedienung, Fokus, schmale Breite (320 px), Zoom 200 %.
