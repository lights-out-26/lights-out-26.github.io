import { DRIVER_BY_CODE } from '../data/drivers';
import { DRIVER_ORDER } from '../data/season';
import { TEAM_BY_ID } from '../data/teams';

/**
 * An illustrative race weekend for the timing tower in the Weekend section:
 * a practice session and the three parts of qualifying, simulated from the
 * 2026 standings with a fixed seed, so every visit shows the same session.
 *
 * Each session is a list of laps ({ t, code, time }) where t runs 0..1 over
 * the session. towerAt() replays the laps up to a point in the session and
 * returns the timing screen as it would look at that moment.
 */

/** Session length (minutes), timed runs per car, and how many go through. */
export const SESSIONS = {
  practice: { minutes: 60, runs: 8, offset: 1.15, scatter: 0.75, evolution: 1.1, cut: null },
  q1: { minutes: 18, runs: 3, offset: 0.4, scatter: 0.22, evolution: 0.35, cut: 16 },
  q2: { minutes: 15, runs: 2, offset: 0.15, scatter: 0.16, evolution: 0.25, cut: 10 },
  q3: { minutes: 13, runs: 2, offset: -0.1, scatter: 0.12, evolution: 0.2, cut: null },
};

const BASE = 75.2; // a lap of an imaginary track, in seconds

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate(id, codes, pace, seed) {
  const s = SESSIONS[id];
  const r = rng(seed);
  const laps = [];
  codes.forEach((code) => {
    for (let k = 0; k < s.runs; k += 1) {
      // Practice laps are spread over the hour; qualifying runs bunch up, with the last one just before the flag.
      const t =
        id === 'practice'
          ? (k + 0.1 + r() * 0.8) / s.runs
          : Math.min(0.985, 0.12 + (k / s.runs) * 0.8 + r() * (0.8 / s.runs) * 0.9);
      const time = BASE + s.offset + pace[code] + (1 - t) * s.evolution + (r() - 0.3) * s.scatter;
      laps.push({ t, code, time });
    }
  });
  return laps.sort((a, b) => a.t - b.t);
}

function bests(laps, until = 1) {
  const best = {};
  for (const lap of laps) {
    if (lap.t > until) break;
    if (!(lap.code in best) || lap.time < best[lap.code]) best[lap.code] = lap.time;
  }
  return best;
}

const classify = (codes, best) =>
  [...codes].sort((a, b) => (best[a] ?? Infinity) - (best[b] ?? Infinity) || codes.indexOf(a) - codes.indexOf(b));

export function buildWeekend() {
  const codes = DRIVER_ORDER.filter((c) => DRIVER_BY_CODE[c]);
  const r = rng(7);
  // Pace from the championship order, with a little noise so no session is a copy of the table.
  const pace = Object.fromEntries(codes.map((c, i) => [c, i * 0.045 + r() * 0.22]));
  const laps = {};
  const best = {};
  const entrants = { practice: codes, q1: codes };

  laps.practice = simulate('practice', codes, pace, 11);
  laps.q1 = simulate('q1', codes, pace, 23);
  best.q1 = bests(laps.q1);
  const q1 = classify(codes, best.q1);
  entrants.q2 = q1.slice(0, 16);

  laps.q2 = simulate('q2', entrants.q2, pace, 37);
  best.q2 = bests(laps.q2);
  const q2 = classify(entrants.q2, best.q2);
  entrants.q3 = q2.slice(0, 10);

  laps.q3 = simulate('q3', entrants.q3, pace, 51);
  best.q3 = bests(laps.q3);
  const q3 = classify(entrants.q3, best.q3);

  // Drivers already knocked out stay on the screen, greyed, with the time that knocked them out.
  const gone = {
    practice: [],
    q1: [],
    q2: q1.slice(16).map((code) => ({ code, time: best.q1[code] })),
    q3: [...q2.slice(10).map((code) => ({ code, time: best.q2[code] })), ...q1.slice(16).map((code) => ({ code, time: best.q1[code] }))],
  };

  return { laps, entrants, gone, grid: [...q3, ...q2.slice(10), ...q1.slice(16)] };
}

export const teamColour = (code) => TEAM_BY_ID[DRIVER_BY_CODE[code].team].colors.accent;

export function lapText(sec) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, '0')}`;
}

export function clockText(id, s) {
  const left = Math.max(0, Math.round(SESSIONS[id].minutes * 60 * (1 - s)));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

/**
 * The timing screen for session `id` at session progress `s` (0..1).
 * rows: [{ code, slot, time, state }] where state is
 *   'run'  on track with a time     'wait'  no time yet
 *   'out'  just knocked out (s = 1)  'gone'  knocked out in an earlier part
 */
export function towerAt(w, id, s) {
  const active = w.entrants[id];
  const best = bests(w.laps[id], s);
  const order = classify(active, best);
  const { cut } = SESSIONS[id];
  const done = s >= 1;
  const rows = order.map((code, slot) => ({
    code,
    slot,
    time: best[code],
    state: best[code] === undefined ? 'wait' : done && cut && slot >= cut ? 'out' : 'run',
  }));
  w.gone[id].forEach((g, i) => rows.push({ code: g.code, slot: active.length + i, time: g.time, state: 'gone' }));
  const lead = best[order[0]];
  return { rows, lead, cut, done, clock: clockText(id, s) };
}
