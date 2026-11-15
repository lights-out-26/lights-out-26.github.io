import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import GLCar from '../components/GLCar';
import SplitText from '../components/SplitText';
import { Link } from '../router/router';
import { TEAMS } from '../data/teams';
import { DRIVER_BY_CODE } from '../data/drivers';
import { AS_OF } from '../data/season';
import { teamVars, standing, ordinal, ABBR } from '../lib/team';
import useInView from '../hooks/useInView';
import { useTilt } from '../hooks/usePointer';
import useReducedMotion from '../hooks/useReducedMotion';
import { t } from '../lib/lang';
import './Teams.css';

const SLAT_PAD = { t: 0.1, r: 0.3, b: 0.16, l: 0.04 };
const wide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;

function Slat({ team, index, on, onPick, onHover }) {
  const place = standing(team.id);
  const tilt = useTilt({ max: 5 });
  const car = useRef(null);
  const reduce = useReducedMotion();

  // The car rolls in as its door opens (the slide itself is CSS): wheels
  // turning and a short trail, then the brakes, then a glint along the body.
  useLayoutEffect(() => {
    if (!on || reduce || !car.current) return undefined;
    const s = car.current.s;
    const tl = gsap
      .timeline({ delay: wide() ? 0 : 0.15 })
      .fromTo(s, { speed: 0.5, spin: 2.4, wheelRate: 62, aberr: 0.45, brake: 0 }, { speed: 0, spin: 0, wheelRate: 0, aberr: 0, duration: 1.25, ease: 'power3.out' }, 0)
      .to(s, { brake: 1, duration: 0.25, ease: 'power2.out' }, 0.12)
      .to(s, { brake: 0, duration: 1.2, ease: 'power2.in' }, 0.6)
      .fromTo(s, { sweep: -0.7 }, { sweep: 1.7, duration: 1.4, ease: 'power2.inOut', immediateRender: false }, 0.75)
      .set(s, { sweep: -1 });
    return () => tl.kill();
  }, [on, reduce]);

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
              <span>{t('{pos} in the standings, {points} points', { pos: ordinal(place.pos), points: <span className="t-num">{place.points}</span> })}</span>
            </p>
            <h3 className="slat__title t-team">
              <SplitText text={team.name} styleName="rise" inView={on} stagger={18} delay={160} />
            </h3>
            <p className="slat__entrant">{team.entrant}</p>
            <dl className="slat__facts">
              <div>
                <dt>{t('Country')}</dt>
                <dd>{t(team.country)}</dd>
              </div>
              <div>
                <dt>{t('Base')}</dt>
                <dd>{t(team.base)}</dd>
              </div>
              <div>
                <dt>{t('Power unit')}</dt>
                <dd>{team.powerUnit}</dd>
              </div>
              <div>
                <dt>{t('Drivers')}</dt>
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
            <p className="slat__intro">{t(team.intro)}</p>
            <Link className="btn slat__link" to={`#team-${team.id}`} tabIndex={on ? 0 : -1} data-cursor="view" data-cursor-label={t('Open')}>
              {t('Open the {team} page', { team: team.short || team.name })}
            </Link>
          </div>

          <div className="slat__car">
            <GLCar
              ref={car}
              id={`${team.id}-a`}
              tint={team.colors.accent}
              alt={t('The {car}', { car: team.chassisFull })}
              active={on}
              hd={wide()}
              pad={SLAT_PAD}
              initial={{ heat: 0.3, sheen: 0.8, tilt: 0.006 }}
              sizes="(max-width: 900px) 130vw, 60vw"
            />
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
        <h2 className="t-display" data-skew="">
          <SplitText text={t('Eleven teams')} styleName="brake" />
        </h2>
        <p className="t-lead rise" style={{ '--delay': '250ms' }}>
          {t(
            'Ten became eleven in 2026, which puts 22 cars on the grid for the first time in a decade. They are shown here in championship order after round {round}.',
            { round: AS_OF.round }
          )}
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
