import { useRouter } from '../router/router';
import { teamVars } from '../lib/team';
import './Transition.css';

/**
 * The full-screen wipe between pages. Three slanted panels sweep across in
 * the colours of the team you are heading to, hold while the page swaps
 * underneath, then carry on off the other side.
 */
export default function Transition() {
  const { transition } = useRouter();
  const { phase, team, label } = transition;
  return (
    <div className="tr" data-phase={phase} style={team ? teamVars(team) : undefined} aria-hidden="true">
      <div className="tr__panel tr__panel--a" />
      <div className="tr__panel tr__panel--b" />
      <div className="tr__panel tr__panel--c">
        <span className="tr__label t-team">{label}</span>
      </div>
    </div>
  );
}
