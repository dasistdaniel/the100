# The 100

Meine 100-Spiele-Challenge: https://dasistdaniel.github.io/The100/

Jedes Spiel hat ein eigenes Repo. Diese Seite sammelt alle Spiele mit Screenshot, Infos und Links und zeigt den Fortschritt.

## Neues Spiel hinzufügen

```bash
npm run new -- mojiblast "MojiBlast"
```

Das legt `games/NNN-mojiblast/index.md` mit der nächsten freien Nummer an. Dann:

1. In `index.md` Titel, Datum, Tags und Beschreibung anpassen. Pflicht sind `title`, `date`, `repo`. Optional sind `play_url` (zeigt den "Spielen"-Button), `tags` und `emoji` (Platzhalter ohne Screenshot).
2. Optional einen Screenshot als `screenshot.png` in denselben Ordner legen.
3. Lokal ansehen: `npm run dev` und `http://localhost:4173/` öffnen (Seite neu laden, um neu zu bauen).
4. Committen und pushen. Die GitHub Action baut und veröffentlicht die Seite.

Ist der Repo-Name ein anderer als der Titel: `npm run new -- captainmoji "Captain Moji" captainmoji`.

## Befehle

| Befehl | Wirkung |
|---|---|
| `npm run new -- <slug> "<Titel>" [repo]` | Neues Spiel anlegen |
| `npm run dev` | Bauen und lokal auf Port 4173 servieren |
| `npm run build` | Seite nach `dist/` bauen (prüft auch die Farbkontraste) |
| `npm test` | Tests ausführen |

## Aufbau

- `games/` – ein Ordner pro Spiel (`NNN-slug/index.md`, optional `screenshot.png`)
- `site/` – Template, Styles, Theme-Umschalter und `palette.json` (alle Farben)
- `scripts/` – Build-Script und Hilfsmodule
- `docs/superpowers/` – Design-Spec und Implementierungsplan

## Farben ändern

Alle Farben stehen in `site/palette.json` (Hell und Dunkel). `npm run build` und `npm test` schlagen fehl, wenn ein Farbpaar WCAG AA unterschreitet.

## Einmalig: GitHub Pages einschalten

Repo-Einstellungen, Pages, Source: **GitHub Actions**.
