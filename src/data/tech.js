/**
 * The 2026 technical regulations in brief. `x`/`y` place each callout on the
 * shared car canvas (0..1), so the same points work for every team's photo.
 */
export const PARTS = [
  {
    id: 'front-wing',
    label: 'Front wing',
    x: 0.115, y: 0.83,
    title: 'Wings that move',
    body: 'Two flaps on the front wing and the rear wing flatten on the straights and close again for the corners. Every driver can use it on every lap. It replaces DRS.',
    figure: ['2 modes', 'Corner and straight'],
  },
  {
    id: 'tyres',
    label: 'Tyres',
    x: 0.292, y: 0.72,
    title: 'Narrower tyres',
    body: 'The 18-inch wheels stay, but the front tyres are 25 mm narrower and the rears 30 mm narrower, which cuts drag and weight.',
    figure: ['−25 / −30 mm', 'Front and rear width'],
  },
  {
    id: 'chassis',
    label: 'Chassis',
    x: 0.50, y: 0.50,
    title: 'Smaller and lighter',
    body: 'The wheelbase is capped at 3,400 mm, 200 mm shorter than before. The car is 100 mm narrower at 1,900 mm, and the minimum weight drops by 30 kg to 768 kg.',
    figure: ['768 kg', 'Minimum weight'],
  },
  {
    id: 'power-unit',
    label: 'Power unit',
    x: 0.69, y: 0.36,
    title: 'Half electric',
    body: 'A 1.6-litre turbo V6 makes about 400 kW. The electric motor now adds up to 350 kW, almost three times as much as before, and the complex heat-recovery motor is gone. The fuel is fully sustainable.',
    figure: ['350 kW', 'Electric power'],
  },
  {
    id: 'rear-wing',
    label: 'Rear wing',
    x: 0.915, y: 0.33,
    title: 'Overtake mode',
    body: 'A driver within one second of the car ahead gets extra electrical energy to attack with. It does the job DRS used to do, with battery power instead of a flap.',
    figure: ['< 1 s', 'Gap needed to use it'],
  },
];

export const POWER = { engine: 400, electric: 350, electricBefore: 120 };

export const DIMENSIONS = [
  { label: 'Wheelbase', value: 3400, unit: 'mm', was: 3600 },
  { label: 'Width', value: 1900, unit: 'mm', was: 2000 },
  { label: 'Minimum weight', value: 768, unit: 'kg', was: 798 },
];

/** The race weekend, stage by stage. */
export const WEEKEND = [
  {
    id: 'practice',
    day: 'Friday and Saturday',
    title: 'Practice',
    lead: 'Three one-hour sessions to find a set-up.',
    body: 'Teams try fuel loads, tyres and wing levels. Nothing counts yet. On the six sprint weekends there is only one practice session.',
    stat: ['3 × 60 min', 'Track time'],
  },
  {
    id: 'q1',
    day: 'Saturday qualifying',
    title: 'Q1',
    lead: 'Eighteen minutes. All 22 cars. Six go out.',
    body: 'Everyone sets a lap time. With an eleventh team on the grid, the slowest six are now eliminated and will start from 17th to 22nd.',
    stat: ['22 → 16', 'Cars left'],
  },
  {
    id: 'q2',
    day: 'Saturday qualifying',
    title: 'Q2',
    lead: 'Fifteen minutes. Six more go out.',
    body: 'Times are wiped and the 16 survivors go again. The slowest six fill 11th to 16th on the grid.',
    stat: ['16 → 10', 'Cars left'],
  },
  {
    id: 'q3',
    day: 'Saturday qualifying',
    title: 'Q3',
    lead: 'Thirteen minutes for pole position.',
    body: 'The fastest ten fight for the front of the grid. Whoever sets the quickest lap starts first on Sunday.',
    stat: ['10', 'Cars in the shoot-out'],
  },
  {
    id: 'race',
    day: 'Sunday',
    title: 'The Grand Prix',
    lead: 'Five lights go out. About 305 km to the flag.',
    body: 'The top ten score, from 25 points for the win down to one for tenth. Sprint races on Saturday pay eight points down to one for the first eight.',
    stat: ['25 – 18 – 15', 'Points for the podium'],
  },
];
