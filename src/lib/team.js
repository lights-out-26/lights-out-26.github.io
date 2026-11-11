import { TEAM_BY_ID } from '../data/teams';
import { CONSTRUCTORS } from '../data/season';

/**
 * The CSS custom properties that put a team "on stage": its colours and its
 * own setting of the variable typeface. Spread into any element's style.
 */
export function teamVars(team) {
  const t = typeof team === 'string' ? TEAM_BY_ID[team] : team;
  if (!t) return {};
  return {
    '--team': t.colors.accent,
    '--team-deep': t.colors.deep,
    '--team-ink': t.colors.ink,
    '--t-wdth': `${t.type.wdth}%`,
    '--t-wght': t.type.wght,
    '--t-style': t.type.slant ? 'italic' : 'normal',
  };
}

const STANDING = Object.fromEntries(CONSTRUCTORS.map(([id, pts], i) => [id, { pos: i + 1, points: pts }]));

/** A team's place and points in the constructors' standings. */
export const standing = (id) => STANDING[id];

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

/** Three-letter codes used for the typographic team marks. */
export const ABBR = {
  mercedes: 'MER', ferrari: 'FER', redbull: 'RBR', mclaren: 'MCL', racingbulls: 'RCB', alpine: 'ALP',
  haas: 'HAA', audi: 'AUD', williams: 'WIL', astonmartin: 'AMR', cadillac: 'CAD',
};

/**
 * A font size (as a share of the available width) at which `text` fits on one
 * line in a team's display type. Caps in this typeface average about 0.8em
 * wide at normal width, and scale with the width axis.
 */
export const fitSize = (text, team, unit = 'cqw', room = 100) =>
  `${(room / (text.length * 0.8 * (team.type.wdth / 100))).toFixed(2)}${unit}`;
