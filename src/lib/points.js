import { RACE, SPRINT, RACE_POINTS, SPRINT_POINTS, HONOURS, STAND_INS, ROUNDS } from '../data/season.js';

const racePts = (pos) => (typeof pos === 'number' && pos <= 10 ? RACE_POINTS[pos - 1] : 0);
const sprintPts = (pos) => (typeof pos === 'number' && pos <= 8 ? SPRINT_POINTS[pos - 1] : 0);

/** Points a driver scored in one round (race plus sprint). */
export function roundPoints(code, i) {
  return racePts(RACE[code]?.[i]) + sprintPts(SPRINT[code]?.[i]);
}

/** Running points total after each round. */
export function cumulative(code) {
  let sum = 0;
  return ROUNDS.map((_, i) => (sum += roundPoints(code, i)));
}

export function totalPoints(code) {
  return ROUNDS.reduce((s, _, i) => s + roundPoints(code, i), 0);
}

/** A driver's 2026 season in numbers. */
export function driverSeason(code) {
  const race = RACE[code] || [];
  const finishes = race.filter((p) => typeof p === 'number');
  return {
    points: totalPoints(code),
    starts: race.filter((p) => p !== null && p !== 'DNS' && p !== 'WD').length,
    wins: race.filter((p) => p === 1).length,
    podiums: race.filter((p) => typeof p === 'number' && p <= 3).length,
    poles: HONOURS.pole.filter((c) => c === code).length,
    fastest: HONOURS.fastest.filter((c) => c === code).length,
    retirements: race.filter((p) => p === 'R').length,
    best: finishes.length ? Math.min(...finishes) : null,
    sprintWins: Object.values(SPRINT[code] || {}).filter((p) => p === 1).length,
  };
}

/**
 * A team's 2026 season, summed over whoever was in its cars each round.
 * `drivers` maps driver code -> home team id.
 */
export function teamSeason(teamId, drivers) {
  const out = { points: 0, wins: 0, podiums: 0, poles: 0, fastest: 0, retirements: 0, starts: 0, best: null, oneTwos: 0, sprintWins: 0 };
  const teamOf = (code, i) => STAND_INS[code]?.[i] || drivers[code];
  ROUNDS.forEach((_, i) => {
    const here = Object.keys(RACE).filter((code) => teamOf(code, i) === teamId && RACE[code][i] !== null);
    const positions = [];
    here.forEach((code) => {
      const p = RACE[code][i];
      out.points += roundPoints(code, i);
      if (p !== 'DNS' && p !== 'WD') out.starts += 1;
      if (p === 'R') out.retirements += 1;
      if (typeof p === 'number') {
        positions.push(p);
        if (p === 1) out.wins += 1;
        if (p <= 3) out.podiums += 1;
        out.best = out.best === null ? p : Math.min(out.best, p);
      }
      if (SPRINT[code]?.[i] === 1) out.sprintWins += 1;
    });
    if (positions.includes(1) && positions.includes(2)) out.oneTwos += 1;
    if (teamOf(HONOURS.pole[i], i) === teamId) out.poles += 1;
    if (teamOf(HONOURS.fastest[i], i) === teamId) out.fastest += 1;
  });
  return out;
}

/**
 * Who drove each of a team's two cars in round `i`, home drivers in their
 * usual seat and stand-ins in the seat they covered.
 * Returns two entries of { code, pos, sprint } (or null for an empty seat).
 */
export function teamRound(team, i, home) {
  const teamOf = (code) => STAND_INS[code]?.[i] || home[code];
  const here = Object.keys(RACE).filter((code) => teamOf(code) === team.id && RACE[code][i] !== null);
  const spare = here.filter((code) => !team.drivers.includes(code));
  return team.drivers
    .map((code) => {
      const raced = here.includes(code) && RACE[code][i] !== 'WD';
      return raced ? code : spare.shift() || (here.includes(code) ? code : null);
    })
    .map((code) => (code ? { code, pos: RACE[code][i], sprint: SPRINT[code]?.[i] ?? null } : null));
}

/** Sorts a finishing result into one of five classes for the season strip. */
export function resultClass(pos) {
  if (pos === 1) return 'win';
  if (typeof pos === 'number') return pos <= 3 ? 'podium' : pos <= 10 ? 'points' : 'out';
  return pos === 'R' ? 'dnf' : 'dns';
}
