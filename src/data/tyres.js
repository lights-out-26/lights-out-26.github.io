/**
 * The tyres: Pirelli's 2026 range, the five tyres a team has at a race, each
 * told by the colour on its sidewall. `photo` points at
 * public/photos/tyres/<photo>.webp (scripts/prepare-tyres.py); `hub` places
 * the tyre's badge on the range photo (percent of its width and height).
 * `grip` and `life` compare the three slicks with each other (1 to 5); the two
 * rain tyres give the water each one clears instead (litres a second, at
 * 300 km/h).
 *
 * Sources: Formula 1, "The beginner's guide to F1 tyres" (compounds, colours,
 * the two-compound rule, sizes, sets per weekend); Pirelli, "The range of
 * compounds for the 2026 season has been set" (24 November 2025: C1 to C5, no
 * C6) and "F1 2026: what's changing on track" (1.6 kg lighter a set); Pirelli,
 * "When it's time to change from slick to wet tyres" (35 to 40 litres for an
 * intermediate). The full wet's 85 litres is also printed on the display in
 * the wet tyre's photo.
 */
export const TYRES = [
  {
    id: 'soft',
    group: 'dry',
    name: 'Soft',
    letter: 'S',
    colour: 'Red',
    line: 'The fastest, for the shortest time',
    body: 'The softest of the three compounds at a race. It warms up quickly and grips hardest, which makes it the tyre for qualifying, but it wears out and overheats the soonest. In a race it suits short stints and a late dash to the flag.',
    grip: 5,
    life: 2,
    use: ['Qualifying', 'Short stints'],
    photo: 'soft',
    caption: 'A soft tyre, with red markings, on its stand in the paddock at the 2024 Dutch Grand Prix',
    hub: [9.7, 30.1],
  },
  {
    id: 'medium',
    group: 'dry',
    name: 'Medium',
    letter: 'M',
    colour: 'Yellow',
    line: 'The all-rounder',
    body: 'In between: close to the grip of the soft, with much of the life of the hard. That balance makes it a common choice for the start of a race, and the tyre for the middle of one.',
    grip: 4,
    life: 3,
    use: ['Race starts', 'Middle stints'],
    photo: 'medium',
    caption: 'A medium tyre, with yellow markings, on its stand in the paddock at the 2024 Dutch Grand Prix',
    hub: [18.8, 32.1],
  },
  {
    id: 'hard',
    group: 'dry',
    name: 'Hard',
    letter: 'H',
    colour: 'White',
    line: 'Built to last',
    body: 'The least grip of the three and the slowest to warm up, which can make the first laps hard work on a cold day or straight after a stop. But it lasts the longest, so it carries the long stints and can get a driver to the end on one stop.',
    grip: 3,
    life: 5,
    use: ['Long stints', 'One-stop races'],
    photo: 'hard',
    caption: 'A hard tyre, with white markings, on its stand in the paddock at the 2024 Dutch Grand Prix',
    hub: [31.0, 36.8],
  },
  {
    id: 'inter',
    group: 'wet',
    name: 'Intermediate',
    letter: 'I',
    colour: 'Green',
    line: 'Damp, drying, light rain',
    body: 'For a track that is wet but not flooded: light rain, or a track drying out after a shower. Its shallower grooves clear less water than a full wet’s, but it grips better and runs faster on a damp track. It is the rain tyre used most often, and when to swap it for slicks is one of the big calls of a race.',
    water: [35, 40],
    use: ['Light rain', 'A drying track'],
    photo: 'inter',
    caption: 'An intermediate, with green markings and a shallow tread, at the Formula 1 Exhibition in London',
    hub: [50.6, 43.6],
  },
  {
    id: 'wet',
    group: 'wet',
    name: 'Full wet',
    letter: 'W',
    colour: 'Blue',
    line: 'Heavy rain',
    body: 'Deep grooves for heavy rain and standing water. It keeps the car on the road where any other tyre would aquaplane, but it is slow once the water goes. When the rain is at its heaviest the race is often run behind the safety car, or stopped.',
    water: [85],
    use: ['Heavy rain', 'Standing water'],
    photo: 'wet',
    caption: 'A full wet, with blue markings and a deep tread, at the Formula 1 Exhibition in London',
    hub: [77.3, 54.4],
  },
];

/** The five slick compounds, hardest to softest; Pirelli brings three to each race. */
export const COMPOUNDS = ['C1', 'C2', 'C3', 'C4', 'C5'];

/** Tyre sizes (width / diameter in mm, on an 18-inch wheel), 2026 against 2022 to 2025. */
export const SIZES = [
  { axle: 'Front', now: [280, 705], was: [305, 720] },
  { axle: 'Rear', now: [375, 710], was: [405, 720] },
];

/** The rules, each as the figure that defines it. */
export const RULES = [
  {
    figure: '2',
    text: 'different slick compounds every driver has to use in a dry race, so everyone changes tyres at least once. It no longer applies once a driver has run intermediates or full wets.',
  },
  {
    figure: '13',
    text: 'sets of slicks for each driver over a race weekend, 12 at a sprint weekend, and one more set of softs for reaching Q3.',
  },
  {
    figure: '1',
    text: 'make of tyre for the whole grid. Pirelli has been the only supplier since 2011, so every team gets the same tyres.',
  },
];
