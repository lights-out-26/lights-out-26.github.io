# Lights Out 26

An unofficial, animation-led tour of the 2026 Formula 1 grid: eleven teams, twenty-two cars and a new rulebook. Built with React and plain CSS as a front-end portfolio piece.

Not affiliated with Formula 1, the FIA or any team.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve the built site
```

Node 20 or newer. The build uses relative paths, so `dist/` can be hosted from any folder (GitHub Pages, Netlify, an S3 bucket) with no server rules. Pages are addressed with plain hashes (`#teams`, `#team-ferrari`).

## What is in it

| Section | Animation idea |
| --- | --- |
| Intro | Five start lights come on in turn, go out together, and the screen splits open |
| Hero | A rolling shot: a real car holds station while speed lines, road markings and other cars stream past, then launches off for the next team's car |
| History | A pinned strip that scrolls sideways through six eras, with outlined years drifting behind the photographs |
| Race weekend | One pinned screen that steps through practice, Q1, Q2, Q3 and the race while a 22-car grid thins out and launches |
| The machine | A car photo that arrives in six layers and assembles as you scroll, then callouts for each 2026 rule change |
| Teams | Eleven slanted "garage doors" that swing open in the team's colours |
| Drivers | Cards that tilt toward the pointer, flood with colour and flip over |
| Records | A line chart that plots itself, bars that run out to their values, CSS-only counters |
| Team pages | Per-team colours, type and pattern; a scroll-geared hero car; an exploded view; a round-by-round result strip |

## How the car animation works

Every side-on car is a real photograph (see credits below) that has been cut out of its background and levelled onto one shared canvas so that both axles land in the same place in every image. `PhotoCar` then rebuilds it from layers:

- four slanted slices of the body (`clip-path`), which can separate and stagger
- two wheel discs lifted from the same photo, each with a sharp and a spin-blurred version
- a motion-blurred copy used for speed trails (`mix-blend-mode: screen`)
- a contact shadow

Scenes drive the layers through four registered custom properties, which means CSS can animate them directly, including from the scroll position:

| Property | Effect |
| --- | --- |
| `--x` | 0 to 1: how far the layers are pulled apart |
| `--wheel-blur` | 0 to 1: cross-fade from sharp wheels to spinning ones |
| `--speed` | 0 to 1: how much of the motion-blurred copy shows |
| `--spin` | time for one wheel revolution |

## Scroll-linked animation

`[data-timeline]` declares a CSS view timeline and `.scrub` binds an element's keyframes to it. Where the browser has no scroll-driven animations, `src/lib/scroll.js` measures progress once per frame and writes it to `--p`; the same keyframes are then scrubbed with a negative `animation-delay`. Intersection Observer (`useInView`) triggers the one-shot reveals.

`prefers-reduced-motion` is respected throughout: loops stop, reveals show their end state, and the sideways history section becomes an ordinary vertical list.

## Project layout

```
src/
  components/   PhotoCar, Photo, SplitText, Numbers, Cursor, Nav, Preloader, Transition, Footer
  sections/     Hero, History, Weekend, Machine, Teams, Drivers, Stats
  pages/        Home, TeamPage
  hooks/        useInView, useProgress, usePointer (parallax and tilt), useReducedMotion
  lib/          scroll tracking, points maths, team styling helpers
  data/         teams, drivers, season results, records, history, tech, photo credits
  router/       a small hash router with animated page transitions
  styles/       tokens, base, motion primitives, team identities
public/photos/  prepared images (cars, wheels, action, eras)
scripts/        the photo pipeline and a data consistency check
```

## Data

Results, standings and records are as they stood after round 20 of 23 (São Paulo Grand Prix, 8 November 2026). Update `src/data/season.js` after each race, then run:

```bash
node scripts/check-data.mjs
```

It recomputes every driver's and team's points from the race results and fails if they do not match the published totals.

## Replacing or adding photos

1. Put a side-on photo in a working folder as `<team>-a.jpg` (and optionally `<team>-b.jpg`, `<team>-action.jpg`).
2. `node scripts/cut-out.mjs` makes the background masks (uses `@imgly/background-removal-node`).
3. `python scripts/find-wheels.py` locates both wheels.
4. `python scripts/prepare-photos.py <raw> <masks> <wheels.json> public/photos` writes the web images and `carsMeta.json`.
5. Add the credit to `src/data/credits.js`.

Driver cards and profiles show each driver's own car. To add portraits you have the rights to, place them in `public/photos/drivers/` and extend `DriverCard`.

Team logos are trademarks and are not included; each team has a typographic mark instead.

## Photo credits and licence

All photographs come from Wikimedia Commons under Creative Commons licences. The full list, with a link to each original, is in `src/data/credits.js` and on the site's credits section.

- 2026 cars: Lukas Raich, 2026 Austrian Grand Prix series, CC BY-SA 4.0
- Alfa Romeo 159: Zairon, CC BY-SA 4.0
- Lotus 79: Legends Of Motorsports, CC BY-SA 2.0
- McLaren MP4/4: Nic Redhead, CC BY-SA 2.0
- Ferrari F2004 and Mercedes W05: emperornie, CC BY-SA 2.0

The images were resized and cropped; side-on car photos were also cut out, levelled and split into layers. Because the licences are ShareAlike, the adapted images in `public/photos/` are offered under the same licence as their originals. If you publish the site, keep the credits section.

The typeface is Archivo (SIL Open Font License).
