import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import GLCar, { carTextures } from '../components/GLCar';
import PhotoCar from '../components/PhotoCar';
import SplitText from '../components/SplitText';
import { Credit } from '../components/Photo';
import { Link } from '../router/router';
import { TEAMS } from '../data/teams';
import { AS_OF } from '../data/season';
import { preloadTextures } from '../gl/engine';
import { teamVars, standing, ordinal } from '../lib/team';
import { t } from '../lib/lang';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import useReducedMotion from '../hooks/useReducedMotion';
import { usePointerParallax } from '../hooks/usePointer';
import './Hero.css';

const DWELL = 6500; // how long each car stays on stage
const PASS_EVERY = 5200; // how often another car flies past behind it
const CAR_PAD = { t: 0.12, r: 0.55, b: 0.2, l: 0.06 }; // room for the light trail

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

/** The rolling-shot cruise: wheels turning, engine heat, no body blur. */
const CRUISE = { speed: 0, spin: 0.85, wheelRate: 24, aberr: 0, heat: 0.7, sheen: 0.8 };

/**
 * One of the two cars on stage. The same instance brakes in, holds station,
 * and launches off again, so its renderer state carries straight through.
 */
function HeroCar({ slot, live, boost }) {
  const wrap = useRef(null);
  const car = useRef(null);
  const reduce = useReducedMotion();
  const team = TEAMS[slot.team];
  const { phase, n } = slot;

  useLayoutEffect(() => {
    if (reduce || (phase === 'first' && !live)) return undefined;
    const s = car.current.s;
    gsap.killTweensOf(s);
    const tl = gsap.timeline();
    if (phase === 'exit') {
      tl.to(wrap.current, { xPercent: -170, skewX: -14, scaleX: 1.12, duration: 0.95, ease: 'power3.in' }, 0)
        .to(s, { speed: 1, spin: 2.8, wheelRate: 95, aberr: 1, heat: 0, duration: 0.95, ease: 'power3.in' }, 0);
    } else {
      // Braking in from the right: smeared at first, the discs glowing, then crisp.
      tl.delay(phase === 'first' ? 0.3 : 0.12)
        .fromTo(wrap.current, { xPercent: 140, skewX: 14, scaleX: 1.12 }, { xPercent: 0, skewX: 0, scaleX: 1, duration: 1.55, ease: 'expo.out' }, 0)
        .fromTo(s, { speed: 1, spin: 2.8, wheelRate: 90, aberr: 1, heat: 0, brake: 0 }, { ...CRUISE, heat: 0, duration: 1.45, ease: 'power3.out' }, 0)
        .to(s, { brake: 1, duration: 0.3, ease: 'power2.out' }, 0.08)
        .to(s, { brake: 0, duration: 1.4, ease: 'power2.in' }, 0.7)
        .to(s, { heat: CRUISE.heat, duration: 1.2, ease: 'none' }, 0.8)
        .fromTo(s, { sweep: -0.7 }, { sweep: 1.7, duration: 1.6, ease: 'power2.inOut', immediateRender: false }, 0.75)
        .set(s, { sweep: -1 });
    }
    return () => tl.kill();
  }, [phase, n, live, reduce]);

  // Scrolling away from the hero launches the car with a growing trail.
  const onFrame = useCallback(
    (s, u) => {
      const b = boost.current;
      if (b < 0.001) return;
      u.uSpeed = Math.min(1.25, u.uSpeed + b * b * 1.2);
      u.uSpin = Math.min(3, u.uSpin + b * 2.2);
      u.uAberr += b * 0.8;
    },
    [boost]
  );

  return (
    <div className="hero__car" data-phase={phase} ref={wrap} aria-hidden={phase === 'exit' ? true : undefined}>
      <GLCar
        ref={car}
        id={`${team.id}-a`}
        tint={team.colors.accent}
        alt={phase === 'exit' ? '' : t('The {car}, photographed from the side at the 2026 Austrian Grand Prix', { car: team.chassisFull })}
        hd
        eager
        pad={CAR_PAD}
        initial={{ ...CRUISE, tilt: 0.007 }}
        onFrame={onFrame}
      />
    </div>
  );
}

export default function Hero({ booted }) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState({ slots: [{ team: 0, phase: 'first', n: 0 }, null], front: 0 });
  const [pass, setPass] = useState(null);
  const [held, setHeld] = useState(false);
  const boost = useRef(0);
  const onScroll = useCallback((p) => {
    boost.current = p;
  }, []);
  const scrollRef = useProgress('contain', onScroll);
  const [viewRef, inView] = useInView({ once: false, margin: '0px', threshold: 0.2 });
  const parallax = usePointerParallax({ ease: 0.07 });

  const current = stage.slots[stage.front].team;
  const team = TEAMS[current];
  const place = standing(team.id);
  const running = booted && inView && !reduce && !held;

  // The car on stage leaves; the other slot brings the chosen team in.
  const show = useCallback((index) => {
    setStage((st) => {
      const front = st.slots[st.front];
      if (front.team === index) return st;
      const back = 1 - st.front;
      const slots = [...st.slots];
      slots[st.front] = { ...front, phase: 'exit', n: front.n + 1 };
      slots[back] = { team: index, phase: 'enter', n: (st.slots[back]?.n || 0) + 1 };
      return { slots, front: back };
    });
  }, []);

  // Get the next car's textures onto the GPU while this one is on stage.
  useEffect(() => {
    if (!booted) return;
    preloadTextures(carTextures(`${TEAMS[(current + 1) % TEAMS.length].id}-a`, true), DWELL * 2);
  }, [booted, current]);

  // Move on to the next team after each dwell.
  useEffect(() => {
    if (!running) return undefined;
    const t = window.setTimeout(() => show((current + 1) % TEAMS.length), DWELL);
    return () => window.clearTimeout(t);
  }, [running, current, show]);

  // Every few seconds, a different team's car crosses the background.
  const currentRef = useRef(0);
  currentRef.current = current;
  useEffect(() => {
    if (!running) return undefined;
    let n = 0;
    const fire = () => {
      n += 1;
      const pick = (currentRef.current + 2 + n * 3) % TEAMS.length;
      setPass({ n, team: TEAMS[pick === currentRef.current ? (pick + 1) % TEAMS.length : pick] });
    };
    const first = window.setTimeout(fire, 2600);
    const loop = window.setInterval(fire, PASS_EVERY);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [running]);

  return (
    <section id="home" className="hero" ref={scrollRef} data-timeline="contain" data-live={booted ? 'true' : 'false'} style={teamVars(team)}>
      <div
        className="hero__stage"
        ref={(el) => {
          viewRef.current = el;
          parallax.current = el;
        }}
        data-inview={inView ? 'true' : 'false'}
      >
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
            <PhotoCar id={`${pass.team.id}-a`} alt="" eager sizes="50vw" />
          </div>
        )}

        <div className="hero__road" aria-hidden="true">
          <i />
        </div>

        <div className="hero__carscroll scrub">
          <div className="hero__carpar">
            {stage.slots.map((slot, i) => (slot ? <HeroCar key={i} slot={slot} live={booted} boost={boost} /> : null))}
          </div>
        </div>

        <div className="hero__title hero__title--ghost scrub" aria-hidden="true">
          <span className="hero__line hero__line--1">Lights</span>
          <span className="hero__line hero__line--2">Out</span>
        </div>

        <div className="hero__flares" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div className="hero__foot wrap scrub">
          <div className="hero__now" key={team.id}>
            <p className="hero__place">
              <span>{t('{pos} of 11 in the constructors’ standings', { pos: ordinal(place.pos) })}</span>
            </p>
            <h2 className="hero__team t-team">
              <span>{team.name}</span>
            </h2>
            <p className="hero__spec">
              <span>{t('{chassis}, {engine} power', { chassis: team.chassis, engine: team.powerUnit })}</span>
            </p>
          </div>

          <div className="hero__side">
            <p className="hero__lead">
              {t('Eleven teams, twenty-two cars and a new rulebook. An unofficial tour of the 2026 grid as it stood after round {round} of {of}.', {
                round: AS_OF.round,
                of: AS_OF.of,
              })}
            </p>
            <div className="hero__actions">
              <Link className="btn" to={`#team-${team.id}`} data-cursor="view" data-cursor-label={t('Open')}>
                {t('See the {team} page', { team: team.short || team.name })}
              </Link>
              <Credit id={`${team.id}-a`} />
            </div>
          </div>

          <ol
            className="hero__picker"
            aria-label={t('Choose the car on stage')}
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
          >
            {TEAMS.map((tm, i) => (
              <li key={tm.id}>
                <button
                  type="button"
                  className="hero__pick"
                  style={teamVars(tm)}
                  aria-label={t('Show the {team} car', { team: tm.name })}
                  aria-pressed={i === current}
                  data-running={i === current && running ? '' : undefined}
                  onClick={() => show(i)}
                >
                  <i />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <Link className="hero__scroll scrub" to="#about" aria-label={t('Scroll to the next section')}>
          <span>{t('Scroll')}</span>
          <i aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
