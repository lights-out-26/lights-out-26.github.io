/**
 * The 22 race drivers of 2026. Career figures run to the end of round 20
 * (São Paulo Grand Prix); 2026 figures are computed from data/season.js.
 *
 * `car` names the photo of that driver's own car. To add portraits, drop
 * `public/photos/drivers/<code>.webp` in place and set `portrait: true`;
 * the cards fall back to the car when no portrait is found.
 */
export const DRIVERS = [
  { code: 'ANT', no: 12, first: 'Kimi', last: 'Antonelli', nat: 'Italy', cc: 'ITA', team: 'mercedes', car: 'mercedes-a',
    career: { starts: 44, wins: 9, podiums: 19, poles: 7, fastest: 11, points: 540, titles: ['2026'] },
    note: 'World Champion at 20 years and 68 days, the youngest in history, and the first from Italy since Alberto Ascari in 1953.' },
  { code: 'RUS', no: 63, first: 'George', last: 'Russell', nat: 'United Kingdom', cc: 'GBR', team: 'mercedes', car: 'mercedes-b',
    career: { starts: 172, wins: 8, podiums: 32, poles: 12, fastest: 13, points: 1295, titles: [] },
    note: 'Won the first race of the new era in Melbourne, and led every lap from pole with fastest lap in Baku.' },
  { code: 'LEC', no: 16, first: 'Charles', last: 'Leclerc', nat: 'Monaco', cc: 'MON', team: 'ferrari', car: 'ferrari-b',
    career: { starts: 191, wins: 9, podiums: 56, poles: 27, fastest: 15, points: 1921, titles: [] },
    note: 'Winner of the 2026 British Grand Prix. His 27 pole positions are the most by any driver without a title.' },
  { code: 'HAM', no: 44, first: 'Lewis', last: 'Hamilton', nat: 'United Kingdom', cc: 'GBR', team: 'ferrari', car: 'ferrari-a',
    career: { starts: 400, wins: 106, podiums: 209, poles: 105, fastest: 70, points: 5279.5, titles: ['2008', '2014', '2015', '2017', '2018', '2019', '2020'] },
    note: 'Seven titles and the record for wins, poles and podiums. First win for Ferrari at Barcelona; 400th start in São Paulo.' },
  { code: 'VER', no: 3, first: 'Max', last: 'Verstappen', nat: 'Netherlands', cc: 'NED', team: 'redbull', car: 'redbull-a',
    career: { starts: 253, wins: 74, podiums: 139, poles: 50, fastest: 38, points: 3723.5, titles: ['2021', '2022', '2023', '2024'] },
    note: 'Four titles in a row from 2021. Gave Ford its first win as an engine partner since 2003.' },
  { code: 'HAD', no: 6, first: 'Isack', last: 'Hadjar', nat: 'France', cc: 'FRA', team: 'redbull', car: 'redbull-b',
    career: { starts: 40, wins: 0, podiums: 4, poles: 0, fastest: 0, points: 173, titles: [] },
    note: 'Promoted to Red Bull after one season. Podiums in Monaco, Baku and São Paulo; missed three rounds with a wrist injury.' },
  { code: 'NOR', no: 1, first: 'Lando', last: 'Norris', nat: 'United Kingdom', cc: 'GBR', team: 'mclaren', car: 'mclaren-a',
    career: { starts: 171, wins: 14, podiums: 50, poles: 20, fastest: 20, points: 1676, titles: ['2025'] },
    note: 'The 2025 World Champion races with the number 1. Three wins in 2026, the last in the rain at Interlagos.' },
  { code: 'PIA', no: 81, first: 'Oscar', last: 'Piastri', nat: 'Australia', cc: 'AUS', team: 'mclaren', car: 'mclaren-b',
    career: { starts: 88, wins: 9, podiums: 28, poles: 6, fastest: 9, points: 951, titles: [] },
    note: 'Nine Grand Prix wins, seven of them in 2025. Second in Japan is his best result of 2026.' },
  { code: 'LAW', no: 30, first: 'Liam', last: 'Lawson', nat: 'New Zealand', cc: 'NZL', team: 'racingbulls', car: 'racingbulls-a',
    career: { starts: 55, wins: 0, podiums: 0, poles: 0, fastest: 0, points: 133, titles: [] },
    note: 'Stood in for the injured Hadjar at Red Bull for three rounds, then went back and kept scoring.' },
  { code: 'LIN', no: 41, first: 'Arvid', last: 'Lindblad', nat: 'United Kingdom', cc: 'GBR', team: 'racingbulls', car: 'racingbulls-b',
    career: { starts: 19, wins: 0, podiums: 0, poles: 0, fastest: 0, points: 38, titles: [] },
    note: 'The only full-season rookie of 2026. Eighth on debut in Australia, and sixth in Monaco.' },
  { code: 'GAS', no: 10, first: 'Pierre', last: 'Gasly', nat: 'France', cc: 'FRA', team: 'alpine', car: 'alpine-a',
    career: { starts: 197, wins: 1, podiums: 5, poles: 1, fastest: 3, points: 500, titles: [] },
    note: 'Took his first pole position at Monza in 2026, six years after winning there.' },
  { code: 'COL', no: 43, first: 'Franco', last: 'Colapinto', nat: 'Argentina', cc: 'ARG', team: 'alpine', car: 'alpine-b',
    career: { starts: 46, wins: 0, podiums: 0, poles: 0, fastest: 0, points: 32, titles: [] },
    note: 'His first full season. Sixth in Canada is his best result so far.' },
  { code: 'OCO', no: 31, first: 'Esteban', last: 'Ocon', nat: 'France', cc: 'FRA', team: 'haas', car: 'haas-a',
    career: { starts: 198, wins: 1, podiums: 4, poles: 0, fastest: 1, points: 490, titles: [] },
    note: 'Winner of the 2021 Hungarian Grand Prix. Sat out the Mexico City and São Paulo rounds.' },
  { code: 'BEA', no: 87, first: 'Oliver', last: 'Bearman', nat: 'United Kingdom', cc: 'GBR', team: 'haas', car: 'haas-b',
    career: { starts: 47, wins: 0, podiums: 0, poles: 0, fastest: 0, points: 71, titles: [] },
    note: 'Fifth in China, the best finish by a Haas in 2026.' },
  { code: 'BOR', no: 5, first: 'Gabriel', last: 'Bortoleto', nat: 'Brazil', cc: 'BRA', team: 'audi', car: 'audi-a',
    career: { starts: 43, wins: 0, podiums: 0, poles: 0, fastest: 0, points: 33, titles: [] },
    note: 'Scored Audi’s first points in its first race, with ninth in Australia.' },
  { code: 'HUL', no: 27, first: 'Nico', last: 'Hülkenberg', nat: 'Germany', cc: 'GER', team: 'audi', car: 'audi-b',
    career: { starts: 269, wins: 0, podiums: 1, poles: 1, fastest: 2, points: 636, titles: [] },
    note: 'Among the ten most experienced drivers ever. His first podium came at Silverstone in 2025.' },
  { code: 'ALB', no: 23, first: 'Alexander', last: 'Albon', nat: 'Thailand', cc: 'THA', team: 'williams', car: 'williams-a',
    career: { starts: 147, wins: 0, podiums: 2, poles: 0, fastest: 1, points: 318, titles: [] },
    note: 'Two podiums with Red Bull in 2020. Has led Williams since 2022.' },
  { code: 'SAI', no: 55, first: 'Carlos', last: 'Sainz', nat: 'Spain', cc: 'ESP', team: 'williams', car: 'williams-b',
    career: { starts: 249, wins: 4, podiums: 29, poles: 6, fastest: 4, points: 1343.5, titles: [] },
    note: 'Four wins with Ferrari between 2022 and 2024.' },
  { code: 'ALO', no: 14, first: 'Fernando', last: 'Alonso', nat: 'Spain', cc: 'ESP', team: 'astonmartin', car: 'astonmartin-a',
    career: { starts: 445, wins: 32, podiums: 106, poles: 22, fastest: 26, points: 2400, titles: ['2005', '2006'] },
    note: 'Champion in 2005 and 2006, and the driver with more starts than anyone in history.' },
  { code: 'STR', no: 18, first: 'Lance', last: 'Stroll', nat: 'Canada', cc: 'CAN', team: 'astonmartin', car: 'astonmartin-b',
    career: { starts: 209, wins: 0, podiums: 3, poles: 1, fastest: 0, points: 325, titles: [] },
    note: 'Pole position in the wet at the 2020 Turkish Grand Prix.' },
  { code: 'PER', no: 11, first: 'Sergio', last: 'Pérez', nat: 'Mexico', cc: 'MEX', team: 'cadillac', car: 'cadillac-a',
    career: { starts: 301, wins: 6, podiums: 39, poles: 3, fastest: 12, points: 1638, titles: [] },
    note: 'Six wins, and runner-up in the 2023 championship. Back after a year away to lead a brand-new team.' },
  { code: 'BOT', no: 77, first: 'Valtteri', last: 'Bottas', nat: 'Finland', cc: 'FIN', team: 'cadillac', car: 'cadillac-b',
    career: { starts: 265, wins: 10, podiums: 67, poles: 20, fastest: 19, points: 1797, titles: [] },
    note: 'Ten wins and twenty poles with Mercedes. Returned to a race seat with Cadillac.' },
];

/** Drivers who stood in during 2026 but are not full-time entries. */
export const STAND_IN_DRIVERS = [
  { code: 'TSU', first: 'Yuki', last: 'Tsunoda', team: 'racingbulls', rounds: 'Dutch, Italian and Spanish Grands Prix' },
  { code: 'HIR', first: 'Ryo', last: 'Hirakawa', team: 'haas', rounds: 'Mexico City Grand Prix' },
  { code: 'CAM', first: 'Rafael', last: 'Câmara', team: 'haas', rounds: 'São Paulo Grand Prix' },
];

export const DRIVER_BY_CODE = Object.fromEntries(DRIVERS.map((d) => [d.code, d]));

/** driver code -> home team id, including the stand-ins. */
export const HOME_TEAM = Object.fromEntries(
  [...DRIVERS, ...STAND_IN_DRIVERS].map((d) => [d.code, d.team])
);
