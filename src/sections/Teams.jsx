import { useEffect, useRef, useState } from 'react';
import PhotoCar from '../components/PhotoCar';
import SplitText from '../components/SplitText';
import { Link } from '../router/router';
import { TEAMS } from '../data/teams';
import { DRIVER_BY_CODE } from '../data/drivers';
import { AS_OF } from '../data/season';
import { teamVars, standing, ordinal, ABBR } from '../lib/team';
import useInView from '../hooks/useInView';
import { useTilt } from '../hooks/usePointer';
import './Teams.css';

function Slat({ team, index, on, onPick, onHover }) {
  const place = standing(team.id);
  const tilt = useTilt({ max: 5 });
  return (
    <li
      className="slat"
      data-active={on ? '' : undefined}
      style={{ ...teamVars(team), '--i': index }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(index)}
      ref={tilt}
    >
      <button type="button" className="slat__tab" aria-expanded={on} aria-controls={`slat-${team.id}`} onClick={() => onPick(index)}>
        <span className="slat__pos t-num">{place.pos}</span>
        <span className="mark slat__chip" aria-hidden="true">
          {ABBR[team.id]}
        </span>
        <span className="slat__name t-team">{team.short || team.name}</span>
        <span className="slat__pts t-num">{place.points}</span>
      </button>

      <div className="slat__panel" id={`slat-${team.id}`}>
        <div className="slat__clip">
          <div className="slat__flood" aria-hidden="true" />
          <div className="motif" data-motif={team.motif} aria-hidden="true" />
          <span className="slat__chassis t-team" aria-hidden="true">
            {team.chassis}
          </span>

          <div className="slat__body">
            <p className="slat__meta">
              <span className="mark" aria-hidden="true">
                {ABBR[team.id]}
              </span>
              <span>
                {ordinal(place.pos)} in the standings, <span className="t-num">{place.points}</span> points
              </span>
            </p>
            <h3 className="slat__title t-team">
              <SplitText text={team.name} styleName="rise" inView={on} stagger={18} delay={160} />
            </h3>
            <p className="slat__entrant">{team.entrant}</p>
            <dl className="slat__facts">
              <div>
                <dt>Country</dt>
                <dd>{team.country}</dd>
              </div>
              <div>
                <dt>Base</dt>
                <dd>{team.base}</dd>
              </div>
              <div>
                <dt>Power unit</dt>
                <dd>{team.powerUnit}</dd>
              </div>
              <div>
                <dt>Drivers</dt>
                <dd>
                  {team.drivers.map((code) => {
                    const d = DRIVER_BY_CODE[code];
                    return (
                      <span key={code} className="slat__driver">
                        <b className="t-num">{d.no}</b> {d.first} {d.last}
                      </span>
                    );
                  })}
                </dd>
              </div>
            </dl>
            <p className="slat__intro">{team.intro}</p>
            <Link className="btn slat__link" to={`#team-${team.id}`} tabIndex={on ? 0 : -1} data-cursor="view" data-cursor-label="Open">
              Open the {team.short || team.name} page
            </Link>
          </div>

          <div className="slat__car">
            <PhotoCar id={`${team.id}-a`} alt={`The ${team.chassisFull}`} sizes="(max-width: 900px) 130vw, 60vw" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Teams. Identity: garage doors. Eleven slanted panels stand side by side;
 * the one you point at swings open in that team's colours and its car rolls in.
 * On small screens the same list opens downwards, one row at a time.
 */
/** Remembered between visits, so coming back from a team page reopens that team's panel. */
let lastOpen = 0;

export default function Teams() {
  const [active, setActiveState] = useState(lastOpen);
  const setActive = (i) => {
    lastOpen = i;
    setActiveState(i);
  };
  const [ref, inView] = useInView({ margin: '0px 0px -20% 0px' });
  const timer = useRef(0);

  // A short delay stops the panels flapping when the mouse sweeps across them.
  const onHover = (i) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(i), 80);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <section id="teams" className="teams" style={teamVars(TEAMS[active])} ref={ref} data-inview={inView ? 'true' : 'false'}>
      <header className="teams__head wrap">
        <h2 className="t-display">
          <SplitText text="Eleven teams" styleName="brake" />
        </h2>
        <p className="t-lead rise" style={{ '--delay': '250ms' }}>
          Ten became eleven in 2026, which puts 22 cars on the grid for the first time in a decade. They are shown here in championship order after round{' '}
          {AS_OF.round}.
        </p>
      </header>

      <ol className="slats">
        {TEAMS.map((team, i) => (
          <Slat key={team.id} team={team} index={i} on={i === active} onPick={setActive} onHover={onHover} />
        ))}
      </ol>
    </section>
  );
}
