import { useCallback, useEffect, useRef, useState } from 'react';
import PhotoCar, { carSrc } from '../components/PhotoCar';
import SplitText from '../components/SplitText';
import { Credit } from '../components/Photo';
import { Link } from '../router/router';
import { TEAMS } from '../data/teams';
import { AS_OF } from '../data/season';
import { teamVars, standing, ordinal } from '../lib/team';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import useReducedMotion from '../hooks/useReducedMotion';
import { usePointerParallax } from '../hooks/usePointer';
import './Hero.css';

const DWELL = 6500; // how long each car stays on stage
const PASS_EVERY = 5200; // how often another car flies past behind it

// A repeatable scatter of speed lines (no Math.random, so renders match).
const rand = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const STREAKS = Array.from({ length: 16 }, (_, i) => ({
  '--top': `${(6 + rand(i + 1) * 80).toFixed(1)}%`,
  '--w': `${(14 + rand(i + 21) * 38).toFixed(1)}vw`,
  '--dur': `${(0.7 + rand(i + 41) * 1.5).toFixed(2)}s`,
  '--delay': `${(-rand(i + 61) * 2.4).toFixed(2)}s`,
  '--o': (0.08 + rand(i + 81) * 0.3).toFixed(2),
  '--h': `${i % 5 === 0 ? 2 : 1}px`,
}));

export default function Hero({ booted }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState({ index: 0, leaving: null, n: 0 });
  const [pass, setPass] = useState(null);
  const [held, setHeld] = useState(false);
  const scrollRef = useProgress('contain');
  const [viewRef, inView] = useInView({ once: false, margin: '0px', threshold: 0.2 });
  const parallax = usePointerParallax({ ease: 0.07 });

  const team = TEAMS[stage.index];
  const place = standing(team.id);
  const running = booted && inView && !reduce && !held;

  const show = useCallback((index) => {
    setStage((s) => (index === s.index ? s : { index, leaving: TEAMS[s.index].id, n: s.n + 1 }));
  }, []);

  // Fetch the other ten cars once the page is up, so swaps are instant.
  useEffect(() => {
    if (!booted) return undefined;
    const t = window.setTimeout(() => TEAMS.forEach(({ id }) => (new Image().src = carSrc(`${id}-a`))), 600);
    return () => window.clearTimeout(t);
  }, [booted]);

  // Move on to the next team after each dwell.
  useEffect(() => {
    if (!running) return undefined;
    const t = window.setTimeout(() => show((stage.index + 1) % TEAMS.length), DWELL);
    return () => window.clearTimeout(t);
  }, [running, stage.index, show]);

  // Clear the departing car once it has left the screen.
  useEffect(() => {
    if (!stage.leaving) return undefined;
    const t = window.setTimeout(() => setStage((s) => ({ ...s, leaving: null })), 950);
    return () => window.clearTimeout(t);
  }, [stage.n, stage.leaving]);

  // Every few seconds, a different team's car crosses the background.
  const indexRef = useRef(0);
  indexRef.current = stage.index;
  useEffect(() => {
    if (!running) return undefined;
    let n = 0;
    const fire = () => {
      n += 1;
      const pick = (indexRef.current + 2 + n * 3) % TEAMS.length;
      setPass({ n, team: TEAMS[pick === indexRef.current ? (pick + 1) % TEAMS.length : pick] });
    };
    const first = window.setTimeout(fire, 2600);
    const loop = window.setInterval(fire, PASS_EVERY);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [running]);

  return (
    <section
      id="home"
      className="hero"
      ref={scrollRef}
      data-timeline="contain"
      data-live={booted ? 'true' : 'false'}
      style={teamVars(team)}
    >
      <div className="hero__stage" ref={(el) => { viewRef.current = el; parallax.current = el; }} data-inview={inView ? 'true' : 'false'}>
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__grid" aria-hidden="true" />

        <h1 className="hero__title scrub" aria-label="Lights out">
          <span className="hero__line hero__line--1" aria-hidden="true">
            <SplitText text="Lights" styleName="brake" inView={booted} stagger={46} delay={380} />
          </span>
          <span className="hero__line hero__line--2" aria-hidden="true">
            <SplitText text="Out" styleName="brake" inView={booted} stagger={46} delay={640} />
          </span>
        </h1>

        <div className="hero__streaks" aria-hidden="true">
          {STREAKS.map((style, i) => (
            <i key={i} style={style} />
          ))}
        </div>

        {pass && (
          <div className="hero__pass" key={pass.n} style={teamVars(pass.team)} aria-hidden="true">
            <PhotoCar id={`${pass.team.id}-a`} alt="" speed eager data-roll="" sizes="50vw" />
          </div>
        )}

        <div className="hero__road" aria-hidden="true">
          <i />
        </div>

        <div className="hero__carscroll scrub">
          <div className="hero__carpar">
            {stage.leaving && (
              <div className="hero__car" data-phase="exit" key={`out-${stage.n}`} aria-hidden="true">
                <PhotoCar id={`${stage.leaving}-a`} alt="" sliced speed eager data-roll="" />
              </div>
            )}
            <div className="hero__car" data-phase={stage.n === 0 ? 'first' : 'enter'} key={`in-${stage.n}`}>
              <PhotoCar
                id={`${team.id}-a`}
                alt={`The ${team.chassisFull}, photographed from the side at the 2026 Austrian Grand Prix`}
                sliced
                speed
                eager
                data-roll=""
              />
            </div>
          </div>
        </div>

        <div className="hero__title hero__title--ghost scrub" aria-hidden="true">
          <span className="hero__line hero__line--1">Lights</span>
          <span className="hero__line hero__line--2">Out</span>
        </div>

        <div className="hero__flares" aria-hidden="true">
          <i /><i /><i />
        </div>

        <div className="hero__foot wrap scrub">
          <div className="hero__now" key={team.id}>
            <p className="hero__place">
              <span>{ordinal(place.pos)} of 11 in the constructors’ standings</span>
            </p>
            <h2 className="hero__team t-team">
              <span>{team.name}</span>
            </h2>
            <p className="hero__spec">
              <span>
                {team.chassis}, {team.powerUnit} power
              </span>
            </p>
          </div>

          <div className="hero__side">
            <p className="hero__lead">
              Eleven teams, twenty-two cars and a new rulebook. An unofficial tour of the 2026 grid as it stood after round {AS_OF.round} of {AS_OF.of}.
            </p>
            <div className="hero__actions">
              <Link className="btn" to={`#team-${team.id}`} data-cursor="view" data-cursor-label="Open">
                See the {team.short || team.name} page
              </Link>
              <Credit id={`${team.id}-a`} />
            </div>
          </div>

          <ol
            className="hero__picker"
            aria-label="Choose the car on stage"
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
          >
            {TEAMS.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="hero__pick"
                  style={teamVars(t)}
                  aria-label={`Show the ${t.name} car`}
                  aria-pressed={i === stage.index}
                  data-running={i === stage.index && running ? '' : undefined}
                  onClick={() => show(i)}
                >
                  <i />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <Link className="hero__scroll scrub" to="#about" aria-label="Scroll to the next section">
          <span>Scroll</span>
          <i aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
