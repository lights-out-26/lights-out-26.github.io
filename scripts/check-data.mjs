// Sanity checks: points computed from race results must match the published standings.
import { RACE, OFFICIAL_POINTS, CONSTRUCTORS, DRIVER_ORDER, ROUNDS, HONOURS } from '../src/data/season.js';
import { DRIVERS, HOME_TEAM } from '../src/data/drivers.js';
import { TEAMS } from '../src/data/teams.js';
import { totalPoints, teamSeason, driverSeason } from '../src/lib/points.js';

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
for (const code of DRIVER_ORDER) {
  if (RACE[code].length !== ROUNDS.length) fail(`${code} has ${RACE[code].length} rounds`);
  const t = totalPoints(code);
  if (t !== OFFICIAL_POINTS[code]) fail(`${code}: computed ${t}, published ${OFFICIAL_POINTS[code]}`);
}
for (const [id, pts] of CONSTRUCTORS) {
  const s = teamSeason(id, HOME_TEAM);
  if (s.points !== pts) fail(`${id}: computed ${s.points}, published ${pts}`);
}
// each finishing position can be held by only one driver per round
ROUNDS.forEach((r, i) => {
  const seen = {};
  for (const [code, res] of Object.entries(RACE)) {
    const p = res[i];
    if (typeof p === 'number') { if (seen[p]) fail(`${r.code}: P${p} held by ${seen[p]} and ${code}`); seen[p] = code; }
  }
  const winner = Object.keys(RACE).find((c) => RACE[c][i] === 1);
  if (!winner) fail(`${r.code}: no winner`);
});
if (DRIVERS.length !== 22) fail('expected 22 drivers');
if (TEAMS.length !== 11) fail('expected 11 teams');
for (const t of TEAMS) for (const d of t.drivers) if (HOME_TEAM[d] !== t.id) fail(`${d} not in ${t.id}`);

console.log('\n2026 by team:');
for (const t of TEAMS) {
  const s = teamSeason(t.id, HOME_TEAM);
  console.log(t.id.padEnd(12), `pts ${String(s.points).padStart(3)}  wins ${s.wins}  podiums ${String(s.podiums).padStart(2)}  poles ${String(s.poles).padStart(2)}  FL ${String(s.fastest).padStart(2)}  DNF ${String(s.retirements).padStart(2)}  best P${s.best}  1-2s ${s.oneTwos}  sprint wins ${s.sprintWins}  starts ${s.starts}`);
}
console.log('\n2026 by driver:');
for (const d of DRIVERS) {
  const s = driverSeason(d.code);
  console.log(d.code, `pts ${String(s.points).padStart(3)} wins ${s.wins} pod ${String(s.podiums).padStart(2)} poles ${s.poles} FL ${s.fastest} DNF ${s.retirements} best P${s.best} starts ${s.starts}`);
}
console.log(bad ? `\n${bad} problem(s)` : '\nAll checks passed');
process.exit(bad ? 1 : 0);
