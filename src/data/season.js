/**
 * The 2026 FIA Formula One World Championship, as it stood after round 20
 * (São Paulo Grand Prix, 8 November 2026). Three rounds were still to run.
 *
 * Results are finishing positions. Codes: R = retired, DNS = did not start,
 * NC = not classified, WD = withdrawn, null = not entered.
 * Sources are listed in README.md.
 */

export const AS_OF = {
  round: 20,
  of: 23,
  race: 'São Paulo Grand Prix',
  date: '8 November 2026',
};

export const ROUNDS = [
  { code: 'AUS', name: 'Australian', place: 'Melbourne', date: '8 Mar' },
  { code: 'CHN', name: 'Chinese', place: 'Shanghai', date: '15 Mar', sprint: true },
  { code: 'JPN', name: 'Japanese', place: 'Suzuka', date: '29 Mar' },
  { code: 'MIA', name: 'Miami', place: 'Miami Gardens', date: '3 May', sprint: true },
  { code: 'CAN', name: 'Canadian', place: 'Montreal', date: '24 May', sprint: true },
  { code: 'MON', name: 'Monaco', place: 'Monaco', date: '7 Jun' },
  { code: 'BCN', name: 'Barcelona-Catalunya', place: 'Montmeló', date: '14 Jun' },
  { code: 'AUT', name: 'Austrian', place: 'Spielberg', date: '28 Jun' },
  { code: 'GBR', name: 'British', place: 'Silverstone', date: '5 Jul', sprint: true },
  { code: 'BEL', name: 'Belgian', place: 'Spa-Francorchamps', date: '19 Jul' },
  { code: 'HUN', name: 'Hungarian', place: 'Mogyoród', date: '26 Jul' },
  { code: 'NED', name: 'Dutch', place: 'Zandvoort', date: '23 Aug', sprint: true },
  { code: 'ITA', name: 'Italian', place: 'Monza', date: '6 Sep' },
  { code: 'ESP', name: 'Spanish', place: 'Madrid', date: '13 Sep' },
  { code: 'AZE', name: 'Azerbaijan', place: 'Baku', date: '26 Sep' },
  { code: 'BHR', name: 'Bahrain', place: 'Sepang, Malaysia', date: '4 Oct' },
  { code: 'SIN', name: 'Singapore', place: 'Marina Bay', date: '11 Oct', sprint: true },
  { code: 'USA', name: 'United States', place: 'Austin', date: '25 Oct' },
  { code: 'MXC', name: 'Mexico City', place: 'Mexico City', date: '1 Nov' },
  { code: 'SAP', name: 'São Paulo', place: 'Interlagos', date: '8 Nov' },
];

export const REMAINING = [
  { code: 'LVG', name: 'Las Vegas', date: '21 Nov' },
  { code: 'QAT', name: 'Qatar', date: '29 Nov' },
  { code: 'ABU', name: 'Abu Dhabi', date: '6 Dec' },
];

/** Pole position, fastest lap and winner for each round, by driver code. */
export const HONOURS = {
  pole: ['RUS', 'ANT', 'ANT', 'ANT', 'RUS', 'ANT', 'RUS', 'RUS', 'ANT', 'ANT', 'NOR', 'NOR', 'GAS', 'NOR', 'RUS', 'VER', 'VER', 'ANT', 'HAM', 'NOR'],
  fastest: ['VER', 'ANT', 'ANT', 'NOR', 'ANT', 'ANT', 'HAM', 'ANT', 'ANT', 'NOR', 'LEC', 'LEC', 'ANT', 'RUS', 'RUS', 'VER', 'LEC', 'LEC', 'HAM', 'ANT'],
};

const R = 'R';
const _ = null;

/** Grand Prix finishing positions, one entry per round. */
export const RACE = {
  ANT: [2, 1, 1, 1, 1, 1, 16, 3, 15, 1, 3, 2, 1, 1, 5, 2, 3, 1, 3, 5],
  VER: [6, R, 8, 5, 3, R, 4, 2, 20, 3, 2, R, 3, 2, 2, 1, 1, 3, 1, 2],
  RUS: [1, 2, 4, 4, R, 12, 2, 1, 2, R, 7, 3, 2, 5, 1, 20, 9, 8, 6, 4],
  HAM: [4, 3, 6, 6, 2, 2, 1, 5, 3, 4, 5, 4, 6, R, 6, 3, 6, 4, 2, 9],
  LEC: [3, 4, 3, 8, 4, R, 15, 8, 1, 2, 4, 5, R, 4, 4, 4, 2, 2, 4, 8],
  NOR: [5, 'DNS', 5, 2, R, R, 3, 7, 4, 7, 1, 1, 4, 3, R, 9, 4, 5, 5, 1],
  PIA: ['DNS', 'DNS', 2, 3, 11, 4, 5, 4, 11, 5, R, 6, 5, 8, 13, 6, 5, 7, 13, 6],
  HAD: [R, 8, 12, R, 5, 3, 6, 6, 5, 6, 6, _, _, _, 3, 5, 10, 6, 9, 3],
  LAW: [13, 7, 9, R, 7, 5, 8, 9, 6, 12, 8, 7, 14, 6, 12, 7, 7, 9, 7, 7],
  GAS: [10, 6, 7, R, 8, 7, 7, 13, 10, 11, 12, 10, 7, 12, R, 16, 11, 10, 17, 14],
  LIN: [8, 12, 14, 14, 'DNS', 6, 9, 10, 7, 9, 10, 12, 8, 9, 7, 10, 15, 12, R, 11],
  COL: [14, 10, 16, 7, 6, 14, 10, 15, 9, 10, 15, 14, 9, 7, R, 13, R, R, 15, 13],
  BEA: [7, 5, R, 11, 10, R, 17, 14, 12, 14, 19, R, 15, 16, 9, 14, 12, R, R, 17],
  BOR: [9, 'DNS', 13, 12, 13, 11, 11, 11, 8, 8, 11, 13, 11, 13, 15, 18, R, 13, 8, 16],
  HUL: ['DNS', 11, 11, R, 12, 13, R, 12, R, 13, 9, 8, 12, 10, 11, 11, 8, 11, 14, 10],
  OCO: [11, 14, 10, 13, 14, 9, 13, 16, 13, 17, 16, R, 16, 11, 8, 15, 13, 14, 'WD', _],
  ALO: [R, R, 18, 15, R, 10, R, 18, 18, 19, 14, 9, R, 17, R, 8, 16, 16, R, 12],
  SAI: [15, 9, 15, 9, 9, 16, 12, R, 17, 16, 18, 16, 13, R, 10, 17, 14, 18, 12, 19],
  ALB: [12, 'DNS', 20, 10, R, 8, 'NC', 17, R, 15, 17, 17, 17, 15, R, R, 18, 17, 11, 15],
  TSU: [_, _, _, _, _, _, _, _, _, _, _, 11, 10, 14, _, _, _, _, _, _],
  HIR: [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 10, _],
  STR: ['NC', R, R, 17, 15, R, R, R, 19, R, 13, R, R, R, R, 12, R, 15, R, R],
  BOT: [R, 13, 19, 18, 16, R, R, R, 16, 18, R, R, 19, 18, 16, R, 19, R, R, 'DNS'],
  PER: [16, 15, 17, 16, R, 15, 14, R, 14, R, R, 15, 18, R, 14, 19, 17, 19, 16, 18],
  CAM: [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 20],
};

/** Sprint finishing positions for the six sprint rounds (round index -> position). */
export const SPRINT = {
  ANT: { 1: 5, 3: 6, 4: 3, 8: 1, 11: 4, 16: 4 },
  VER: { 3: 5, 4: 7, 8: 6, 11: 6, 16: 1 },
  RUS: { 1: 1, 3: 4, 4: 1, 8: 4, 11: 1 },
  HAM: { 1: 3, 3: 7, 4: 6, 8: 2, 11: 7, 16: 2 },
  LEC: { 1: 2, 3: 3, 4: 5, 8: 5, 11: 2, 16: 3 },
  NOR: { 1: 4, 3: 1, 4: 2, 8: 3, 11: 3, 16: 8 },
  PIA: { 1: 6, 3: 2, 4: 4, 8: 7, 11: 5 },
  LAW: { 1: 7, 8: 8, 16: 5 },
  GAS: { 3: 8, 11: 8 },
  LIN: { 4: 8 },
  BEA: { 1: 8, 16: 6 },
  HUL: { 16: 7 },
};

export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Which team a driver scored for in a given round. Only the mid-season
 * stand-ins need listing; everyone else uses their team from drivers.js.
 */
export const STAND_INS = {
  LAW: { 11: 'redbull', 12: 'redbull', 13: 'redbull' },
};

/** Constructors' standings after round 20. */
export const CONSTRUCTORS = [
  ['mercedes', 652],
  ['ferrari', 510],
  ['redbull', 415],
  ['mclaren', 398],
  ['racingbulls', 114],
  ['alpine', 69],
  ['haas', 31],
  ['audi', 28],
  ['williams', 12],
  ['astonmartin', 7],
  ['cadillac', 0],
];

/** Drivers' standings after round 20, in championship order. */
export const DRIVER_ORDER = [
  'ANT', 'VER', 'RUS', 'HAM', 'LEC', 'NOR', 'PIA', 'HAD', 'LAW', 'GAS', 'LIN',
  'COL', 'BEA', 'BOR', 'HUL', 'OCO', 'ALO', 'SAI', 'ALB', 'TSU', 'HIR', 'STR',
  'BOT', 'PER', 'CAM',
];

export const OFFICIAL_POINTS = {
  ANT: 390, VER: 279, RUS: 262, HAM: 261, LEC: 249, NOR: 246, PIA: 152, HAD: 122,
  LAW: 89, GAS: 42, LIN: 38, COL: 27, BEA: 23, BOR: 14, HUL: 14, OCO: 7, ALO: 7,
  SAI: 7, ALB: 5, TSU: 1, HIR: 1, STR: 0, BOT: 0, PER: 0, CAM: 0,
};
