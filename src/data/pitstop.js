/**
 * The pit stop in five steps, each told through one photograph, like the
 * history section. `mark` is the figure painted behind the step: something
 * true about it, not a number for its own sake. `kind` picks the step's own
 * graphic (radio, speed sign, crew plan, wheel, release light). `photo` points at
 * public/photos/pit/<photo>.webp; `sound` is the clip that plays as the step
 * arrives (scripts/prepare-pitstop.py), `volume` its level (default 0.95) and
 * `credits` the sound credits.
 *
 * No freely licensed photograph of a 2026 pit stop exists yet, so these are
 * the most recent ones that do (2015 to 2021), all from Wikimedia Commons.
 */
export const STEPS = [
  {
    mark: 'Box',
    kind: 'call',
    label: 'The call',
    title: 'Two words on the radio',
    photo: 'pit/crew-waiting',
    caption: 'The Haas crew in position, waiting for its car, at the 2017 United States Grand Prix',
    body: 'The strategists on the pit wall pick the lap, weighing the tyres, the gaps to the cars around and whether a safety car is coming. Then the race engineer calls the driver in: “Box, box.” The crew is out and in place before the car arrives.',
    fact: ['Called on the team radio', 'The driver confirms'],
    sound: 'pit-radio',
    volume: 0.6, // this clip is mastered louder than the others
    credits: [['pit-radio', 'Radio']],
  },
  {
    mark: '80',
    kind: 'lane',
    label: 'Pit lane',
    title: 'On the limiter',
    photo: 'pit/astonmartin-2021',
    caption: 'Sebastian Vettel’s Aston Martin AMR21 in its pit box during qualifying for the 2021 United States Grand Prix',
    body: 'The pit lane has a speed limit, 80 km/h at most circuits and lower at a few tight ones. The driver switches on a limiter at the entry line and has to stop exactly on the team’s marks, nose to the front jack.',
    fact: ['80 km/h limit at most circuits', 'Speeding is penalised'],
  },
  {
    mark: '20',
    kind: 'crew',
    label: 'The crew',
    title: 'Twenty people, one car',
    photo: 'pit/redbull-2015',
    caption: 'A Red Bull practice pit stop at pre-season testing in Barcelona, 2015',
    body: 'Each wheel has three people: one on the wheel gun, one pulling the old wheel off, one putting the new one on. A jack lifts each end, two people steady the car at the sides, and one watches the pit lane for traffic. They practise it over and over, at the factory and at every race.',
    fact: ['Three on each wheel', 'A jack at each end'],
    sound: 'pit-guns',
    credits: [['pit-guns', 'Wheel guns']],
  },
  {
    mark: '1',
    kind: 'gun',
    label: 'The wheel gun',
    title: 'One nut a wheel',
    photo: 'pit/wheel-gun',
    caption: 'A Formula One wheel gun, 2012',
    body: 'Each wheel is held on by a single nut at its centre. The gun, a pneumatic one, undoes it and does it up again in a fraction of a second, and tells the release system when its wheel is secure.',
    fact: ['One central nut', 'Pneumatic'],
  },
  {
    mark: '2.0',
    kind: 'release',
    label: 'The release',
    title: 'Green light',
    photo: 'pit/ferrari-2017',
    caption: 'The Ferrari crew around Kimi Räikkönen’s car at the 2017 United States Grand Prix',
    body: 'When all four wheels are done the jacks drop, and once the lane is clear the light in front of the driver turns green. The clock runs from the car stopping to that light: the best crews are done in about two seconds. Releasing a car into the path of another is penalised.',
    fact: ['About 2 s for the best crews', 'Unsafe release: a penalty'],
    sound: 'pit-release',
    credits: [['pit-release', 'Car leaving']],
  },
];
