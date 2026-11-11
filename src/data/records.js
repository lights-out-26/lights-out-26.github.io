/**
 * All-time records, to the end of the 2026 São Paulo Grand Prix.
 * `team` (where given) colours the bar for a driver still racing in 2026.
 */
export const RECORDS = {
  wins: {
    label: 'Grand Prix wins',
    unit: 'wins',
    rows: [
      { name: 'Lewis Hamilton', value: 106, team: 'ferrari' },
      { name: 'Michael Schumacher', value: 91 },
      { name: 'Max Verstappen', value: 74, team: 'redbull' },
      { name: 'Sebastian Vettel', value: 53 },
      { name: 'Alain Prost', value: 51 },
    ],
  },
  poles: {
    label: 'Pole positions',
    unit: 'poles',
    rows: [
      { name: 'Lewis Hamilton', value: 105, team: 'ferrari' },
      { name: 'Michael Schumacher', value: 68 },
      { name: 'Ayrton Senna', value: 65 },
      { name: 'Sebastian Vettel', value: 57 },
      { name: 'Max Verstappen', value: 50, team: 'redbull' },
    ],
  },
  titles: {
    label: 'World Championships',
    unit: 'titles',
    rows: [
      { name: 'Michael Schumacher', value: 7 },
      { name: 'Lewis Hamilton', value: 7, team: 'ferrari' },
      { name: 'Juan Manuel Fangio', value: 5 },
      { name: 'Alain Prost', value: 4 },
      { name: 'Sebastian Vettel', value: 4 },
      { name: 'Max Verstappen', value: 4, team: 'redbull' },
    ],
  },
  teamWins: {
    label: 'Wins by team',
    unit: 'wins',
    rows: [
      { name: 'Ferrari', value: 250, team: 'ferrari' },
      { name: 'McLaren', value: 206, team: 'mclaren' },
      { name: 'Mercedes', value: 143, team: 'mercedes' },
      { name: 'Red Bull Racing', value: 133, team: 'redbull' },
      { name: 'Williams', value: 114, team: 'williams' },
    ],
  },
  teamTitles: {
    label: 'Constructors’ titles',
    unit: 'titles',
    rows: [
      { name: 'Ferrari', value: 16, team: 'ferrari' },
      { name: 'McLaren', value: 10, team: 'mclaren' },
      { name: 'Mercedes', value: 9, team: 'mercedes' },
      { name: 'Williams', value: 9, team: 'williams' },
      { name: 'Red Bull Racing', value: 6, team: 'redbull' },
    ],
  },
};

/** Single-figure records, shown as large numbers. */
export const MILESTONES = [
  { value: 19, label: 'Wins in one season', who: 'Max Verstappen, 2023' },
  { value: 10, label: 'Wins in a row', who: 'Max Verstappen, 2023' },
  { value: 445, label: 'Race starts', who: 'Fernando Alonso' },
  { value: 209, label: 'Podium finishes', who: 'Lewis Hamilton' },
];

export const AGES = [
  { label: 'Youngest champion', value: '20 years, 68 days', who: 'Kimi Antonelli, 2026' },
  { label: 'Youngest race winner', value: '18 years, 228 days', who: 'Max Verstappen, Spain 2016' },
  { label: 'Youngest on pole', value: '19 years, 202 days', who: 'Kimi Antonelli, China 2026' },
  { label: 'Oldest race winner', value: '53 years, 22 days', who: 'Luigi Fagioli, France 1951' },
];

/** What 2026 added to the record books. */
export const FIRSTS_2026 = [
  ['Mexico City', 'Kimi Antonelli becomes the youngest World Champion, taking the record Sebastian Vettel had held since 2010.'],
  ['São Paulo', 'Mercedes wins a ninth constructors’ title, its first since 2021, with three rounds left.'],
  ['Barcelona', 'Lewis Hamilton wins for Ferrari for the first time, on an all-British podium, the first since 1968.'],
  ['Sepang', 'Max Verstappen gives Ford its first win as an engine partner since 2003.'],
  ['Monza', 'Antonelli wins from 19th on the grid, the first Italian to win the Italian Grand Prix since 1966.'],
  ['Melbourne', 'Twenty-two cars are entered for the first time since 2016.'],
];

/** Headline numbers for the About section. */
export const NUMBERS = [
  { value: 77, label: 'World Championship seasons', note: 'The 2026 season is the 77th since 1950.' },
  { value: 1169, label: 'Grands Prix', note: 'Championship races run, up to São Paulo 2026.' },
  { value: 11, label: 'Teams', note: 'Cadillac’s arrival makes it eleven for the first time since 2016.' },
  { value: 23, label: 'Rounds in 2026', note: 'Twenty-four were planned; one was cancelled.' },
];
