# The 100

Meine 100-Spiele-Challenge: https://dasistdaniel.github.io/the100/

Jedes Spiel hat ein eigenes Repo. Diese Seite sammelt alle Spiele mit Screenshot, Infos und Links und zeigt den Fortschritt.

## Neues Spiel hinzufügen

```bash
npm run new -- mojiblast "MojiBlast"
```

Das legt `games/NNN-mojiblast/index.md` mit der nächsten freien Nummer an. Dann:

1. In `index.md` Titel, Datum, Tags und Beschreibung anpassen. Pflicht sind `title`, `date`, `repo`. Optional sind `play_url` (zeigt den "Spielen"-Button), `tags` und `emoji` (Platzhalter ohne Screenshot).
2. Optional einen Screenshot als `screenshot.png` in denselben Ordner legen. Bestes Format: **1280×640 px** (2:1), das ist auch das Format des GitHub-Social-Previews. Dieselbe Datei kannst du also im Repo unter Settings, Social preview hochladen.
3. Lokal ansehen: `npm run dev` und `http://localhost:4173/` öffnen (Seite neu laden, um neu zu bauen).
4. Veröffentlichen mit `npm run publish -- "neues Spiel: MojiBlast"` (oder selbst committen und pushen). Die GitHub Action baut und veröffentlicht die Seite.

Ist der Repo-Name ein anderer als der Titel: `npm run new -- captainmoji "Captain Moji" captainmoji`.

## Befehle

| Befehl | Wirkung |
|---|---|
| `npm run new -- <slug> "<Titel>" [repo]` | Neues Spiel anlegen |
| `npm run dev` | Bauen und lokal auf Port 4173 servieren |
| `npm run build` | Seite nach `dist/` bauen (prüft auch die Farbkontraste) |
| `npm run publish -- "Nachricht"` | Tests, Build, Commit und Push in einem Schritt (`--dry-run` zeigt nur, was passieren würde) |
| `npm run previews -- [Spiel] [--force]` | Social Preview des Spiel-Repos von GitHub als `screenshot.png` laden (siehe unten) |
| `npm test` | Tests ausführen |

## Aufbau

- `games/` – ein Ordner pro Spiel (`NNN-slug/index.md`, optional `screenshot.png`)
- `site/` – Template, Styles, Theme-Umschalter und `palette.json` (alle Farben)
- `scripts/` – Build-Script und Hilfsmodule
- `logo/` – Logo-Dateien, Richtlinien (`GUIDELINES.md`) und Präsentationsboard
- `docs/superpowers/` – Design-Spec und Implementierungsplan

## Social Previews als Screenshots

Hast du im Spiel-Repo unter Settings, Social preview ein Bild (1280×640) hochgeladen, holt `npm run previews` es als `screenshot.png`:

```bash
npm run previews                      # nur Spiele ohne screenshot.png
npm run previews -- 8 --force         # Spiel 008 ersetzen (auch: Slug oder Ordnername)
npm run previews -- --force           # alle ersetzen, die ein eigenes Preview haben
npm run previews -- --dry-run         # nur anzeigen, was passieren würde
```

- Ein vorhandener Screenshot wird nur mit `--force` ersetzt.
- Die von GitHub automatisch erzeugte Karte (Repo-Name, Sterne) wird nicht geladen, weil sie das Spiel nicht zeigt. Mit `--include-generated` geht es trotzdem.
- Braucht die GitHub CLI (`gh auth login`).

## RSS-Feed

Bei jedem Build entsteht `feed.xml` (RSS 2.0, neueste Spiele zuerst): https://dasistdaniel.github.io/the100/feed.xml

Die Basis-URL steht in `site/site.json`. Das Datum eines Eintrags ist das Feld `date` des Spiels.

## Farben ändern

Alle Farben stehen in `site/palette.json` (Hell und Dunkel). `npm run build` und `npm test` schlagen fehl, wenn ein Farbpaar WCAG AA unterschreitet.

## Einmalig: GitHub Pages einschalten

Repo-Einstellungen, Pages, Source: **GitHub Actions**.
