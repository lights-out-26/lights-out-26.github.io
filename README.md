# Lights Out 26

An unofficial, animation-led tour of the 2026 Formula 1 grid: eleven teams, twenty-two cars and a new rulebook. Built with React, CSS, GSAP and WebGL as a front-end portfolio piece.

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
| Intro | Five start lights come on in turn, go out together, and the screen splits open; "Start with sound" runs them again at the real pace, a light a second with a beep for each over a real turbo-hybrid V6 grid, which pulls away as they go out |
| Hero | A rolling shot: a real car brakes in with its discs glowing, holds station with the wheels turning while speed lines stream past, then launches off in a blur for the next team's car |
| History | A pinned strip that scrolls sideways through six eras, with outlined years drifting behind the photographs |
| Race weekend | One pinned screen that steps through practice, Q1, Q2, Q3 and the race while a 22-car grid thins out and launches |
| Pit stop | The same sideways strip as the history section, through the five steps of a stop (the call, the pit lane, the crew, the wheel gun, the release), one real photograph each, with the figure that defines each step painted behind it: Box, 80 (km/h), 20 (people), 1 (nut a wheel), 2.0 (seconds) |
| The machine | A blueprint of the car (edges and depth contours) that a scan line turns back into the photograph as you scroll, then callouts for each 2026 rule change |
| Teams | Eleven slanted "garage doors" that swing open in the team's colours while the car rolls in and brakes |
| Drivers | Cards that tilt toward the pointer, flood with colour and flip over |
| Records | A line chart that plots itself, bars that run out to their values, CSS-only counters |
| Team pages | Per-team colours, type and pattern; a scroll-geared hero car; a pinned "flat out" scene where scrolling is the throttle (0 to 340 km/h), with an engine that revs through the gears; a panning shot with the background in motion blur; "Through the corner", a real three-frame burst of the car that scrolling plays as one shot (five teams); a round-by-round result strip |

## How the car animation works

Every car is a real photograph (see credits below); nothing is modelled or redrawn, so the liveries and sponsor marks are the real ones. Side-on photos are cut out of their background and levelled onto one shared canvas, so both axles land in the same place in every image.

Each photo also has a **depth map**, estimated offline with Depth Anything V2 Small (`scripts/make-depth.py`). In the browser, the photo and its depth map go to a WebGL2 shader (`src/gl/`) that draws:

- **depth parallax**: near parts move further than far ones as the pointer and the scroll move the camera
- **relighting**: surface normals from the depth map, so a light follows the pointer and a highlight can sweep along the bodywork
- **wheel spin**: the wheel discs are rotated in the shader, with a rotational blur that grows with speed
- **motion blur and light trails**: a long exposure along the direction of travel, tinted in the team colour with a slight colour split; or, with the camera tracking the car, a sharp car over its trail
- **heat haze** over the engine cover, **brake glow** through the rims, and a soft contact shadow
- **blueprint**: Sobel edges and depth contours, wiped away by a scan line
- on the on-track photos: a **camera push** (dolly) and **panning blur** applied only to what is behind the car
- on the burst sequences (`seq` program, `GLSequence`): a **crossfade** from frame to frame with **motion blur** along the way the car is moving in each frame (a streak across the picture, or a zoom blur centred on the car when it comes at the camera), and a slow push-in on the car

All scenes share one WebGL context: each `<canvas>` on the page is a 2D canvas that the renderer copies its finished view into, so there is no limit on how many scenes a page has and they stay in the normal stacking order. Textures are shared and released when unused. If WebGL2 is not available, or `prefers-reduced-motion` is set, the plain photographs are shown instead.

`GLCar` and `GLPhoto` expose a plain state object (`ref.current.s`): speed, wheel rate, spin blur, brake, heat, sweep, scan, zoom, focus, pan and so on. GSAP timelines tween those values and the renderer maps them to shader uniforms every frame, so a scene is written as an ordinary timeline:

```js
gsap.timeline()
  .fromTo(wrap, { xPercent: 140 }, { xPercent: 0, duration: 1.55, ease: 'expo.out' }, 0)
  .fromTo(car.s, { speed: 1, wheelRate: 90 }, { speed: 0, wheelRate: 24, duration: 1.45 }, 0)
  .to(car.s, { brake: 1, duration: 0.3 }, 0.08)
  .to(car.s, { brake: 0, duration: 1.4 }, 0.7);
```

## Sound

Sound is off until the viewer turns it on, from the intro or the switch in the navigation; the choice is remembered, and no sound file is fetched while it is off. The engines at the start lights, in the history section and at the race start are real Formula 1 cars from Wikimedia Commons; the start-light beeps and the flat-out engine are made in the browser.

| Where | Sound |
| --- | --- |
| Intro (start lights) | A short beep as each red light comes on, a second apart, over a real grid of turbo-hybrid V6 cars: rubin16's recording of the 2021 Russian Grand Prix grid, idling under the lights and pulling away. The clip starts at the first light from whichever point puts the pull-away (6.95 s in) on the lights going out, whatever the random hold. No 2026 car has been recorded under a free licence yet; the 2026 engines keep the 1.6-litre turbo V6. The beeps are synthesised: the broadcast's own start-signal sound belongs to Formula 1 and has no free licence; to use a recording you have the rights to, put it in `public/sounds/` and set `START_SIGNAL_FILE` in `src/lib/sound.js` |
| Race weekend, race stage | Ferrari F60 (2009, Edvvc): idle, revs and launch, timed to the lights going out and the grid leaving (3.45 s) |
| History | The era's own car where one was recorded: Mercedes-Benz W196 (1954) for the 1950s, the Lotus 79 (1978), the McLaren MP4/4 (1988) and a Cosworth V10 Red Bull RB1 (2005), all by Edvvc. The two hybrid eras use turbo-hybrid V6 cars recorded at 2021 races: racing at the Turkish Grand Prix (SAİT71, two videos from the same corner) for 2014 and 2026. No 2026 car has been recorded under a free licence yet; the 2026 engines keep the 1.6-litre turbo V6 |
| Pit stop | Built by `scripts/prepare-pitstop.py` from real recordings and cut into three clips that play as their steps arrive: the radio call, the engineer's "Box, box" (Vealhurl) and the driver's "Copy" (Grendelkhan), words recorded for Lingua Libre and put through a radio (telephone band, a tinny lift, gated hiss, the squelch); the wheel guns of Red Bull Racing's pit stop practice in Mexico City, 2015 (ProtoplasmaKid), two bursts placed about a second apart; and a turbo-hybrid V6 pulling away (rubin16). Real F1 team radio is not available under a free licence, so the voices are real people rather than a real team |
| Team pages, flat out | A turbo V6 modelled sample by sample in an AudioWorklet (`src/lib/engine-worklet.js`): six uneven exhaust pulses per cycle ringing broad exhaust resonances, combustion noise, a turbo whistle, an ignition cut at each upshift and crackles on the overrun. The revs follow the gear readout (rising through each gear, dropping at every upshift) and the load follows the scroll: flat out while the speed rises, part throttle while it holds, lifted while it falls |

The flat-out engine is modelled rather than recorded because it has to follow the scroll: speeding up a recording to raise its pitch also speeds up everything in it, and an idle recording played at nearly three times the speed turns into chatter.

`src/lib/sound.js` plays everything with the Web Audio API (fetched on demand, kept in time with the animation even when a file arrives late, paused while the tab is hidden). To try a recording you cannot publish, put it in `public/sounds/local/` under the same name: the dev server plays it instead, the folder is gitignored and the build leaves it out. The recorded clips are cut from the originals with:

```bash
FFMPEG=/path/to/ffmpeg python scripts/prepare-sounds.py <folder with the originals> public/sounds [name ...]
```

`scripts/sounds.json` lists each source file, the cut, fades, loudness target (EBU R128) and the launch cue. For the two 2021 videos, the 240p transcode from Commons carries the same soundtrack and can stand in for the original.

## Scroll-linked animation

Lenis smooths wheel and trackpad scrolling (touch keeps the native feel). GSAP's ticker drives Lenis, ScrollTrigger and the WebGL renderer from one `requestAnimationFrame`, and the current scroll speed feeds the shaders (faster scrolling, more blur) and makes the big headings lean (`data-skew`).

`[data-timeline]` declares a CSS view timeline and `.scrub` binds an element's keyframes to it. Where the browser has no scroll-driven animations, `src/lib/scroll.js` measures progress once per frame and writes it to `--p`; the same keyframes are then scrubbed with a negative `animation-delay`. `useProgress` hands the same progress to JavaScript for the WebGL scenes. Intersection Observer (`useInView`) triggers the one-shot reveals.

`prefers-reduced-motion` is respected throughout: smooth scrolling and WebGL are switched off, loops stop, reveals show their end state, and the sideways history section becomes an ordinary vertical list.

## Project layout

```
src/
  components/   GLCar, GLPhoto, GLSequence, PhotoCar, Photo, SplitText, Numbers, Cursor, Nav, Preloader, Transition, Footer
  gl/           the shared WebGL2 renderer and the car and photo shaders
  sections/     Hero, History, Weekend, Pitstop, Machine, Teams, Drivers, Stats
  pages/        Home, TeamPage
  hooks/        useInView, useProgress, usePointer (parallax and tilt), useReducedMotion
  lib/          smooth scrolling, scroll tracking, points maths, team styling helpers
  data/         teams, drivers, season results, records, history, tech, photo credits, burst sequences
  router/       a small hash router with animated page transitions
  styles/       tokens, base, motion primitives, team identities
public/photos/  prepared images (cars, action, eras, seq) and their depth maps (depth)
scripts/        the photo, depth and sequence pipelines and a data consistency check
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
5. `python scripts/make-depth.py <model.onnx> <raw> <wheels.json> public/photos` writes the depth maps. It needs `onnxruntime`, `opencv-python`, `numpy` and `pillow`, and the Depth Anything V2 Small ONNX model from [onnx-community/depth-anything-v2-small](https://huggingface.co/onnx-community/depth-anything-v2-small) (`onnx/model_quantized.onnx` was used here).
6. Add the credit to `src/data/credits.js`.

## Burst sequences

"Through the corner" on the team pages uses real bursts: one car photographed three times in a second or three, from the same spot on the outside of a slow corner at Zandvoort (Steffen Prößdorf, Friday 21 August 2026). Each car comes in heading right, turns towards the camera and leaves heading left. The sets are listed in `scripts/sequences.json`.

```bash
python scripts/fetch-sequences.py <raw>                       # originals from Commons as <team>-<n>.jpg, with their author and licence
node scripts/cut-out.mjs <raw> <masks> ferrari-1 ferrari-2 …   # car masks (see above)
python scripts/prepare-sequences.py <raw> <masks> public/photos src/data/sequences.json
```

`prepare-sequences.py` frames every shot the same way (the car centred, its tyres on one ground line, scaled to a fixed safe area without the crop leaving the original), grades frames taken from the same spot to the same background brightness, contrast and white balance across all sets, and writes 1600 x 900 webp frames (about 1.8 MB for all fifteen) plus `src/data/sequences.json` with each car's position and the shooting times. Only teams with a full burst get the section; the photographer's uploads cover Ferrari (Hamilton), McLaren, Red Bull, Mercedes and Audi. Without WebGL, or with reduced motion, the three frames are shown side by side as stills.

Driver cards and profiles show each driver's own car. To add portraits you have the rights to, place them in `public/photos/drivers/` and extend `DriverCard`.

Team logos are trademarks and are not included; each team has a typographic mark instead.

## Photo credits and licence

All photographs come from Wikimedia Commons under Creative Commons licences. The full list, with a link to each original, is in `src/data/credits.js` and on the site's credits section.

- 2026 cars: Lukas Raich, 2026 Austrian Grand Prix series, CC BY-SA 4.0
- 2026 burst sequences: Steffen Prößdorf, 2026 Dutch Grand Prix series (STP 2292–2294, 2303–2305, 2311–2313, 2323–2325, 2330–2332), CC BY-SA 4.0
- Alfa Romeo 159: Zairon, CC BY-SA 4.0
- Lotus 79: Legends Of Motorsports, CC BY-SA 2.0
- McLaren MP4/4: Nic Redhead, CC BY-SA 2.0
- Ferrari F2004 and Mercedes W05: emperornie, CC BY-SA 2.0
- Pit stops: Curt Smith (Haas and Ferrari, 2017 United States GP), CC BY 2.0; Declan M Martin (Aston Martin, 2021 United States GP), public domain; Alberto-g-rovi (Red Bull, Barcelona testing 2015), CC BY-SA 4.0; Rich Jones (wheel gun), CC BY 2.0. No freely licensed photograph of a 2026 pit stop exists yet

The images were resized and cropped; the 2026 car photos were also given depth maps, the side-on ones were cut out and levelled, and the burst frames were aligned on the car and matched for exposure and colour. Because the licences are ShareAlike, the adapted images and depth maps in `public/photos/` are offered under the same licence as their originals. If you publish the site, keep the credits section.

The typeface is Archivo (SIL Open Font License).

Sounds: Edvvc, Goodwood Festival of Speed recordings, CC BY-SA 3.0 (Ferrari F60, Mercedes-Benz W196, Lotus 79, McLaren MP4/4, Red Bull RB1); SAİT71, 2021 Turkish Grand Prix, CC BY-SA 4.0; rubin16, 2021 Russian Grand Prix, CC BY-SA 4.0; ProtoplasmaKid, Red Bull Racing pit stop practice, CC BY-SA 4.0; Vealhurl ("box", CC BY-SA 4.0) and Grendelkhan ("copy", CC0), Lingua Libre. The clips were cut, faded and loudness-normalised and are shared under the same licences.

Depth maps: Depth Anything V2 Small (Apache License 2.0), by Lihe Yang et al. Libraries: React (MIT), GSAP (free standard licence), Lenis (MIT).
