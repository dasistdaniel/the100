# The 100 – Logo-Richtlinien

Das Logo ist die Zahl **100** in einer 3×5-Pixelschrift, mit einem Farbverlauf von Indigo zu Fuchsia, der in Spalten abgestuft ist. Das kleine „THE" davor ist in derselben Pixelschrift gesetzt. Es wird keine Schriftart benutzt, alles sind Formen. Damit entfallen Lizenzfragen.

## Dateien

| Datei | Wofür |
|---|---|
| `master/the100-horizontal*.svg` | Standardlogo: „THE" klein links, „100" groß rechts (Header, README, Social) |
| `master/the100-stacked*.svg` | Hochformat: „THE" über „100" (Plakat, Sticker, Profilbild-Banner) |
| `master/the100-mark*.svg` | Nur „100" (wenn „THE" überflüssig ist) |
| `master/the100-one*.svg` | Nur die „1" (Basis für Favicon und App-Icon) |
| `web/` | Favicon, Apple-Touch-Icon, PWA-Icons, Manifest |
| `png/` | Fertige PNGs (transparent) |
| `board/` | Präsentationsboard mit Mockups |

Jede Form gibt es in vier Fassungen:

- **ohne Zusatz**: Farbe, für helle Hintergründe
- **`-dark`**: Farbe, für dunkle Hintergründe
- **`-black`** und **`-white`**: einfarbig (Stempel, Gravur, Faxtauglich, Fotos)

## Farben

| Name | HEX | RGB | Einsatz |
|---|---|---|---|
| Indigo | `#4338ca` | 67 / 56 / 202 | Verlaufsanfang, Markenfarbe, App-Icon-Fläche |
| Fuchsia | `#c026d3` | 192 / 38 / 211 | Verlaufsende |
| Tinte | `#1b1b24` | 27 / 27 / 36 | „THE" auf hellem Grund |
| Indigo hell | `#a5b4fc` | 165 / 180 / 252 | Verlaufsanfang auf dunklem Grund |
| Fuchsia hell | `#f0abfc` | 240 / 171 / 252 | Verlaufsende auf dunklem Grund |
| Hell-Text | `#ececf4` | 236 / 236 / 244 | „THE" auf dunklem Grund |

Die Werte stammen aus `site/palette.json`. Dort steht die einzige Wahrheit: Ändert sich die Palette, erzeugt `node scripts/logo.js` die Masterdateien neu. CMYK- und Pantone-Werte sind nicht festgelegt. Für den Druck bitte mit der Druckerei abstimmen.

Die Verlaufsfarben haben auf allen Hintergründen der Seite mindestens 3:1 Kontrast (WCAG für Grafiken), „THE" mindestens 4,5:1. Der Build prüft das bei jedem Lauf.

## Schutzraum und Mindestgröße

- **Schutzraum:** mindestens ein großes Pixel (die Kantenlänge eines Pixels der „100") rundherum frei.
- **Mindestgröße:** Standardlogo 32 px Höhe, nur „100" 20 px Höhe. Darunter das **Favicon** (die „1" auf Indigo) nehmen.
- Das Logo immer mit dem Seitenverhältnis des Originals skalieren.

## Hintergründe

- Farbversion auf hellen oder mittelhellen Flächen, `-dark` auf dunklen.
- Auf Fotos oder bunten Flächen die einfarbige Fassung in Schwarz oder Weiß nehmen, je nachdem, was mehr Kontrast gibt.

## Nicht erlaubt

- Pixel verschieben, weglassen oder die Abstände ändern
- Den Verlauf umdrehen, durch andere Farben ersetzen oder stufenlos glätten
- Schatten, Konturen, Leuchteffekte oder Verzerrung
- „THE" größer als die Hälfte der Zahlhöhe setzen
- Das Logo auf unruhigem Hintergrund ohne einfarbige Fassung benutzen

## Neu erzeugen

```bash
node scripts/logo.js
```

schreibt alle Masterdateien nach `logo/master/`. Die Web-Icons entstehen daraus mit dem Export-Skript des Logo-Design-Skills (`export_variants.py … --web-icons`), die Dateien liegen aktuell in `logo/web/` und `site/icons/`.

## Hinweis

Eine Markenrecherche wurde nicht durchgeführt. Wird das Logo geschäftlich genutzt, vorher recherchieren lassen.
