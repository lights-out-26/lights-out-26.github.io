import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import PhotoCar from '../components/PhotoCar';
import GLCar from '../components/GLCar';
import GLPhoto from '../components/GLPhoto';
import { Credit } from '../components/Photo';
import SplitText from '../components/SplitText';
import { Count, Odometer } from '../components/Numbers';
import Footer from '../components/Footer';
import { Link } from '../router/router';
import { TEAMS, TEAM_BY_ID } from '../data/teams';
import { DRIVER_BY_CODE, HOME_TEAM } from '../data/drivers';
import { ROUNDS, DRIVER_ORDER, AS_OF } from '../data/season';
import { teamSeason, driverSeason, teamRound, resultClass } from '../lib/points';
import { teamVars, standing, ordinal, ABBR, fitSize } from '../lib/team';
import useInView from '../hooks/useInView';
import useProgress from '../hooks/useProgress';
import { usePointerParallax } from '../hooks/usePointer';
import useReducedMotion from '../hooks/useReducedMotion';
import { glAvailable } from '../gl/engine';
import { engine as startEngine, isSoundOn } from '../lib/sound';
import './TeamPage.css';

const RANK = Object.fromEntries(DRIVER_ORDER.map((code, i) => [code, i + 1]));
const fmt = (n) => n.toLocaleString('en-GB');
const RESULT_WORDS = { R: 'retired', DNS: 'did not start', NC: 'not classified', WD: 'withdrew' };

/** Wraps children and flags them once they scroll into view. */
function Reveal({ as: Tag = 'div', className = '', options, children, ...rest }) {
  const [ref, inView] = useInView(options);
  return (
    <Tag ref={ref} className={className} data-inview={inView ? 'true' : 'false'} {...rest}>
      {children}
    </Tag>
  );
}

const HERO_PAD = { t: 0.12, r: 0.6, b: 0.2, l: 0.06 };

function TeamHero({ team }) {
  const place = standing(team.id);
  const progress = useRef(0);
  const onScroll = useCallback((p) => {
    progress.current = p;
  }, []);
  const scrollRef = useProgress('contain', onScroll);
  const parallax = usePointerParallax({ ease: 0.07 });
  const wrap = useRef(null);
  const car = useRef(null);
  const reduce = useReducedMotion();

  // Arrival: the car brakes in from the right, discs glowing, light sweeping over it.
  useLayoutEffect(() => {
    if (reduce) return undefined;
    const s = car.current.s;
    const tl = gsap
      .timeline({ delay: 0.35 })
      .fromTo(wrap.current, { xPercent: 125, skewX: 12, scaleX: 1.1 }, { xPercent: 0, skewX: 0, scaleX: 1, duration: 1.6, ease: 'expo.out' }, 0)
      .fromTo(s, { speed: 1, spin: 2.8, wheelRate: 80, aberr: 1, brake: 0 }, { speed: 0, spin: 0, wheelRate: 0, aberr: 0, duration: 1.5, ease: 'power3.out' }, 0)
      .to(s, { brake: 1, duration: 0.3, ease: 'power2.out' }, 0.1)
      .to(s, { brake: 0, duration: 1.6, ease: 'power2.in' }, 0.8)
      .fromTo(s, { sweep: -0.7 }, { sweep: 1.7, duration: 1.7, ease: 'power2.inOut', immediateRender: false }, 0.9)
      .set(s, { sweep: -1 });
    return () => tl.kill();
  }, [reduce]);

  // Leaving: the wheels are geared to the scroll and the trail grows as it pulls away.
  const onFrame = useCallback((s, u) => {
    const p = progress.current;
    if (p < 0.001) return;
    u.uAngle += p * 46;
    u.uSpin = Math.min(3, u.uSpin + p * 2.6);
    u.uSpeed = Math.min(1.25, u.uSpeed + p * p * 1.1);
    u.uAberr += p * 0.9;
  }, []);

  return (
    <header className="tph" ref={scrollRef} data-timeline="contain">
      <div className="tph__stage" ref={parallax}>
        <div className="tph__glow" aria-hidden="true" />
        <div className="motif" data-motif={team.motif} aria-hidden="true" />

        <p className="tph__chassis t-team scrub" aria-hidden="true">
          <span>
            <SplitText text={team.chassis} styleName="brake" inView stagger={55} delay={520} />
          </span>
        </p>

        <div className="tph__carscroll scrub">
          <div className="tph__car" ref={wrap}>
            <GLCar
              ref={car}
              id={`${team.id}-a`}
              tint={team.colors.accent}
              alt={`The ${team.chassisFull}, photographed from the side at the 2026 Austrian Grand Prix`}
              hd
              eager
              pad={HERO_PAD}
              initial={{ heat: 0.45, sheen: 0.85, tilt: 0.007 }}
              onFrame={onFrame}
            />
          </div>
        </div>

        <div className="tph__top wrap scrub">
          <Link className="tph__back" to="#teams" restore label="The grid">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l-7 7 7 7" /></svg>
            All teams
          </Link>
          <p className="tph__place">
            <span className="mark" aria-hidden="true">{ABBR[team.id]}</span>
            {ordinal(place.pos)} in the 2026 constructors’ standings, <span className="t-num">{place.points}</span> points
          </p>
          <h1 className="tph__name t-team">
            <SplitText text={team.name} styleName="rise" inView stagger={24} delay={420} />
          </h1>
          <p className="tph__entrant">{team.entrant}</p>
        </div>

        <dl className="tph__facts wrap scrub">
          {[
            ['Base', team.base],
            ['Licence', team.country],
            ['Power unit', team.powerUnit],
            ['In Formula 1', team.since],
          ].map(([k, v], i) => (
            <div key={k} style={{ '--i': i }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

function TeamStory({ team }) {
  return (
    <Reveal as="section" className="tps wrap" aria-label={`About ${team.name}`}>
      <p className="tps__intro">
        <SplitText text={team.intro} styleName="focus" stagger={7} />
      </p>
      <div className="tps__story">
        {team.story.map((para, i) => (
          <p key={i} className="rise" style={{ '--delay': `${250 + i * 120}ms` }}>
            {para}
          </p>
        ))}
      </div>
    </Reveal>
  );
}

const TOP_SPEED = 340;
/** Illustrative upshift points (km/h) for an eight-speed gearbox. */
const SHIFTS = [0, 70, 112, 152, 190, 228, 264, 300];
/** Engine revs: idle, the clutch slipping off the line, and the upshift point. */
const RPM = { idle: 4500, launch: 8800, shift: 11800 };

/**
 * Revs for a speed: in each gear they rise with the speed up to the shift point,
 * then drop as the next gear goes in. Off the line the clutch holds them up.
 */
function revsAt(kmh, load) {
  const gear = SHIFTS.filter((g) => kmh >= g).length;
  const top = gear < SHIFTS.length ? SHIFTS[gear] : TOP_SPEED;
  let rpm = (kmh / top) * RPM.shift;
  if (gear === 1) rpm = Math.max(rpm, RPM.idle + load * (RPM.launch - RPM.idle));
  return Math.max(RPM.idle, rpm);
}
const SPEED_PAD = { t: 0.1, r: 0.5, b: 0.18, l: 0.05 };
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Flat out. Identity: acceleration. A pinned scene where scrolling is the
 * throttle: speed, gear and a growing light trail all follow the scroll,
 * with a little lag, as if the car had weight.
 */
function TeamSpeed({ team }) {
  const wrap = useRef(null);
  const road = useRef(null);
  const kmhEl = useRef(null);
  const gearEl = useRef(null);
  const barEl = useRef(null);
  const hud = useRef(null);
  const target = useRef(0);
  const current = useRef(0);
  const roadX = useRef(0);
  const engine = useRef(null);
  const throttle = useRef({ kmh: 0, at: 0, load: 0.15 });
  const gl = glAvailable();

  // With sound on, an engine runs while the scene is pinned. Its revs climb through each
  // gear and drop at every upshift, in step with the gear readout; the load comes from
  // how hard the speed is rising (flat out), holding (part throttle) or falling (lifted).
  useEffect(() => () => engine.current && engine.current.stop(0.2), []);

  const readout = useCallback((p, dt) => {
    const kmh = TOP_SPEED * easeInOut(Math.max(0, Math.min(1, (p - 0.05) / 0.8)));
    const k = kmh / TOP_SPEED;
    if (engine.current) {
      const th = throttle.current;
      const now = performance.now();
      const step = Math.min(0.25, (now - th.at) / 1000);
      if (step > 0) {
        const accel = (kmh - th.kmh) / step; // km/h per second
        const want = kmh < 0.5 && accel <= 0 ? 0.15 : accel > 3 ? Math.min(1, 0.6 + accel / 150) : accel < -3 ? 0 : 0.3;
        th.load += (want - th.load) * Math.min(1, step * 6);
        th.kmh = kmh;
        th.at = now;
      }
      engine.current.set({ rpm: revsAt(kmh, th.load), load: th.load });
    }
    if (kmhEl.current) kmhEl.current.textContent = String(Math.round(kmh));
    if (gearEl.current) gearEl.current.textContent = String(SHIFTS.filter((g) => kmh >= g).length);
    if (barEl.current) barEl.current.style.transform = `scaleX(${k.toFixed(4)})`;
    if (hud.current) hud.current.dataset.straight = kmh >= 290 ? 'on' : 'off';
    if (road.current && dt) {
      roadX.current = (roadX.current - kmh * dt * 9) % 2000;
      road.current.style.backgroundPositionX = `${roadX.current.toFixed(1)}px`;
      road.current.style.opacity = (0.12 + k * 0.88).toFixed(3);
    }
    return { kmh, k };
  }, []);

  const onScroll = useCallback(
    (p) => {
      target.current = p;
      const inside = p > 0.002 && p < 0.998;
      const running = engine.current && !engine.current.stopped;
      if (inside && !running && isSoundOn()) {
        throttle.current = { kmh: 0, at: performance.now(), load: 0.15 };
        engine.current = startEngine({ volume: 0.3 });
      }
      else if (!inside && running) {
        engine.current.stop(0.5);
        engine.current = null;
      }
      if (!gl) readout(p, 0);
    },
    [gl, readout]
  );
  const ref = useProgress('contain', onScroll);

  const onFrame = useCallback(
    (s, u, dt) => {
      current.current += (target.current - current.current) * Math.min(1, dt * 5);
      const { kmh, k } = readout(current.current, dt);
      s.wheelRate = Math.min(kmh, 120) * 0.35;
      u.uSpin = Math.min(3, k * 3);
      u.uHeat = 0.25 + k * 0.9;
      // The camera tracks the car, so the car stays sharp while a light trail grows behind it.
      u.uSpeed = Math.min(1.25, u.uSpeed + Math.max(0, (k - 0.35) / 0.65) * 0.55);
      u.uAberr += Math.max(0, (k - 0.6) / 0.4) * 0.8;
      const shake = k * k * 2.4;
      if (wrap.current) wrap.current.style.transform = shake > 0.05 ? `translate3d(${((Math.random() - 0.5) * shake).toFixed(2)}px, ${((Math.random() - 0.5) * shake).toFixed(2)}px, 0)` : '';
    },
    [readout]
  );

  return (
    <section className="tpv" ref={ref} data-timeline="contain" aria-labelledby="tpv-title">
      <div className="tpv__pin">
        <div className="tpv__head wrap">
          <h2 id="tpv-title" className="t-h2" data-skew="">
            The {team.chassis}, flat out
          </h2>
          <p>Scroll to take it from a standstill to about 340 km/h, roughly what these cars reach at the end of the longest straights.</p>
        </div>
        <div className="tpv__stage">
          <div className="tpv__road" ref={road} aria-hidden="true" />
          <span className="tpv__ghost t-team" aria-hidden="true">
            {team.chassis}
          </span>
          <div className="tpv__car" ref={wrap}>
            <GLCar
              id={`${team.id}-a`}
              tint={team.colors.accent}
              alt={`The ${team.chassisFull} at speed`}
              hd
              pad={SPEED_PAD}
              initial={{ heat: 0.25, sheen: 0.8, tilt: 0.006, velGain: 0, hold: 1 }}
              onFrame={onFrame}
            />
          </div>
        </div>
        <div className="tpv__hud wrap" ref={hud} data-straight="off" aria-hidden="true">
          <p className="tpv__speed">
            <b className="t-num" ref={kmhEl}>
              0
            </b>
            <span>km/h</span>
          </p>
          <p className="tpv__gear">
            <span>Gear</span>
            <b className="t-num" ref={gearEl}>
              1
            </b>
          </p>
          <p className="tpv__mode">Straight mode</p>
          <div className="tpv__bar">
            <i ref={barEl} />
          </div>
        </div>
        <p className="tpv__credit wrap">
          <Credit id={`${team.id}-a`} />
        </p>
      </div>
    </section>
  );
}

function TeamAction({ team }) {
  const key = `action/${team.id}`;
  const photo = useRef(null);
  // The camera pushes in and drops as the frame rises; the background pans into a blur.
  const onScroll = useCallback((p) => {
    const s = photo.current && photo.current.s;
    if (!s) return;
    s.zoom = 1.32 - p * 0.24;
    s.camY = (p - 0.5) * 0.03;
    s.pan = 0.004 + Math.max(0, p - 0.3) * 0.022;
  }, []);
  const ref = useProgress('cover', onScroll);
  return (
    <section className="tpa" ref={ref} data-timeline="cover" aria-label={`${team.name} on track`}>
      <div className="tpa__frame scrub">
        <GLPhoto
          ref={photo}
          id={key}
          depth={`depth/action-${team.id}`}
          alt={`A ${team.chassisFull} at speed during the 2026 Austrian Grand Prix weekend`}
          ratio="21 / 10"
          tint={team.colors.accent}
          initial={{ focus: 0.52, zoom: 1.32, dolly: 0.14, vignette: 0.4 }}
        />
        <p className="tpa__word t-team scrub" aria-hidden="true">
          Spielberg
        </p>
      </div>
      <p className="tpa__cap wrap">
        <span>Red Bull Ring, Austrian Grand Prix, June 2026.</span> <Credit id={key} />
      </p>
    </section>
  );
}

function DriverRow({ code, team, flip }) {
  const d = DRIVER_BY_CODE[code];
  const s = useMemo(() => driverSeason(code), [code]);
  const ref = useProgress('cover');
  const [viewRef, inView] = useInView({ margin: '0px 0px -18% 0px', threshold: 0.15 });
  const c = d.career;
  return (
    <article
      className="tpd"
      data-flip={flip ? '' : undefined}
      data-timeline="cover"
      data-inview={inView ? 'true' : 'false'}
      ref={(el) => {
        ref.current = el;
        viewRef.current = el;
      }}
    >
      <span className="tpd__no t-num scrub" aria-hidden="true">
        {d.no}
      </span>
      <div className="tpd__car scrub">
        <PhotoCar id={d.car} alt={`${d.first} ${d.last}'s ${team.chassis}, car number ${d.no}`} />
      </div>
      <div className="tpd__copy wrap">
        <p className="tpd__first rise">{d.first}</p>
        <h3 className="tpd__last t-team" style={{ '--fit': fitSize(d.last, team) }}>
          <SplitText text={d.last} styleName="brake" stagger={34} delay={80} />
        </h3>
        <p className="tpd__meta rise" style={{ '--delay': '200ms' }}>
          {d.nat}, car number <span className="t-num">{d.no}</span>
        </p>
        <p className="tpd__note rise" style={{ '--delay': '280ms' }}>
          {d.note}
        </p>
        <dl className="tpd__stats rise" style={{ '--delay': '360ms' }}>
          <div className="tpd__group">
            <dt>2026 so far</dt>
            <dd>
              {[
                ['Standing', `P${RANK[code]}`],
                ['Points', s.points],
                ['Wins', s.wins],
                ['Podiums', s.podiums],
                ['Best finish', s.best ? `P${s.best}` : 'n/a'],
              ].map(([k, v]) => (
                <span key={k}>
                  <b className="t-num">{v}</b>
                  {k}
                </span>
              ))}
            </dd>
          </div>
          <div className="tpd__group">
            <dt>Career</dt>
            <dd>
              {[
                ['Starts', c.starts],
                ['Wins', c.wins],
                ['Podiums', c.podiums],
                ['Poles', c.poles],
                ['Titles', c.titles.length],
              ].map(([k, v]) => (
                <span key={k}>
                  <b className="t-num">{fmt(v)}</b>
                  {k}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function TeamResults({ team }) {
  const s = useMemo(() => teamSeason(team.id, HOME_TEAM), [team.id]);
  const rounds = useMemo(() => ROUNDS.map((_, i) => teamRound(team, i, HOME_TEAM)), [team]);
  const place = standing(team.id);
  const honours = [
    ['Constructors’ titles', team.titles.constructors],
    ['Drivers’ titles', team.titles.drivers],
    ['Grand Prix wins', team.allTime.wins],
    ['Pole positions', team.allTime.poles],
    ['Podium finishes', team.allTime.podiums],
  ];
  const season = [
    ['Standing', ordinal(place.pos)],
    ['Points', s.points],
    ['Wins', s.wins],
    ['Podiums', s.podiums],
    ['Poles', s.poles],
    ['Fastest laps', s.fastest],
    ['One-two finishes', s.oneTwos],
    ['Retirements', s.retirements],
  ];
  return (
    <section className="tpr wrap" aria-labelledby="tpr-title">
      <Reveal className="tpr__head">
        <h2 id="tpr-title" className="t-h2" data-skew="">
          <SplitText text="Honours and results" styleName="rise" />
        </h2>
        <p className="rise" style={{ '--delay': '200ms' }}>
          All-time figures run to the end of round {AS_OF.round} of 2026{team.titles.constructors || team.titles.drivers ? ', and count titles already settled this year' : ''}.
        </p>
      </Reveal>

      <Reveal className="tpr__honours" options={{ threshold: 0.3 }}>
        {honours.map(([label, value], i) => (
          <div key={label} className="tpr__honour">
            <Odometer value={value} className="tpr__big" delay={i * 110} />
            <p>{label}</p>
          </div>
        ))}
      </Reveal>

      <Reveal className="tpr__season" options={{ threshold: 0.25 }}>
        <h3 className="tpr__h3">2026, round by round</h3>
        <dl className="tpr__figs">
          {season.map(([label, value], i) => (
            <div key={label} style={{ '--i': i }}>
              <dd>{typeof value === 'number' ? <Count to={value} delay={i * 60} duration={1200} /> : <span className="t-num">{value}</span>}</dd>
              <dt>{label}</dt>
            </div>
          ))}
        </dl>

        <div className="strip" role="table" aria-label={`${team.name}: finishing position of each car in every Grand Prix of 2026`}>
          <div className="strip__row strip__row--head" role="row">
            <span role="columnheader" className="strip__who">Car</span>
            {ROUNDS.map((r) => (
              <span key={r.code} role="columnheader" title={`${r.name} Grand Prix, ${r.place}`}>
                {r.code}
              </span>
            ))}
          </div>
          {[0, 1].map((seat) => (
            <div key={seat} className="strip__row" role="row">
              <span role="rowheader" className="strip__who">
                {DRIVER_BY_CODE[team.drivers[seat]].last}
              </span>
              {rounds.map((entries, i) => {
                const e = entries[seat];
                if (!e) return <span key={i} role="cell" className="strip__cell" data-kind="none" style={{ '--i': i }} aria-label="No entry" />;
                const kind = resultClass(e.pos);
                const standIn = e.code !== team.drivers[seat];
                const text = typeof e.pos === 'number' ? `finished ${ordinal(e.pos)}` : RESULT_WORDS[e.pos];
                const tip = `${ROUNDS[i].name}: ${standIn ? `${e.code} (stand-in) ` : ''}${text}${e.sprint ? `, sprint ${ordinal(e.sprint)}` : ''}`;
                return (
                  <span key={i} role="cell" className="strip__cell t-num" data-kind={kind} data-standin={standIn ? '' : undefined} style={{ '--i': i }} data-tip={tip} aria-label={tip} tabIndex={0}>
                    {typeof e.pos === 'number' ? e.pos : e.pos === 'R' ? 'R' : '–'}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <ul className="strip__key" aria-hidden="true">
          <li data-kind="win">Win</li>
          <li data-kind="podium">Podium</li>
          <li data-kind="points">Points</li>
          <li data-kind="out">Outside the points</li>
          <li data-kind="dnf">R: retired</li>
          <li data-kind="standin">Stand-in driver</li>
        </ul>
      </Reveal>
    </section>
  );
}

function TeamStrengths({ team }) {
  return (
    <section className="tpt wrap" aria-labelledby="tpt-title">
      <Reveal className="tpt__head">
        <h2 id="tpt-title" className="t-h2" data-skew="">
          <SplitText text="What defines this car" styleName="rise" />
        </h2>
      </Reveal>
      <ul className="tpt__list">
        {team.traits.map(([title, body], i) => (
          <Reveal as="li" key={title} className="tpt__item" options={{ margin: '0px 0px -8% 0px' }} style={{ '--i': i }}>
            <i className="tpt__rule draw-x" aria-hidden="true" />
            <h3 className="tpt__title t-team">
              <span className="mask-up">
                <span>{title}</span>
              </span>
            </h3>
            <p className="tpt__body rise" style={{ '--delay': '180ms' }}>
              {body}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function TeamNext({ team }) {
  const i = TEAMS.indexOf(team);
  const next = TEAMS[(i + 1) % TEAMS.length];
  const prev = TEAMS[(i + TEAMS.length - 1) % TEAMS.length];
  return (
    <nav className="tpn" aria-label="More teams">
      <Link className="tpn__next" to={`#team-${next.id}`} style={teamVars(next)} data-cursor="view" data-cursor-label="Next">
        <span className="tpn__flood" aria-hidden="true" />
        <span className="tpn__label">Next team, {ordinal(standing(next.id).pos)} in the standings</span>
        <span className="tpn__name t-team">{next.name}</span>
        <span className="tpn__car" aria-hidden="true">
          <PhotoCar id={`${next.id}-a`} alt="" />
        </span>
      </Link>
      <div className="tpn__row wrap">
        <Link className="btn" to={`#team-${prev.id}`} style={teamVars(prev)}>
          Previous: {prev.name}
        </Link>
        <Link className="btn" to="#teams" restore label="The grid">
          All eleven teams
        </Link>
      </div>
    </nav>
  );
}

export default function TeamPage({ id }) {
  const team = TEAM_BY_ID[id];
  return (
    <article className="tp" style={{ ...teamVars(team), '--len': team.chassis.length, '--name-fit': fitSize(team.name, team, 'vw', 88) }}>
      <TeamHero team={team} />
      <TeamStory team={team} />
      <TeamSpeed team={team} />
      <TeamAction team={team} />
      <section className="tpds" aria-labelledby="tpds-title">
        <Reveal className="tpds__head wrap">
          <h2 id="tpds-title" className="t-display" data-skew="">
            <SplitText text="The drivers" styleName="brake" />
          </h2>
        </Reveal>
        {team.drivers.map((code, i) => (
          <DriverRow key={code} code={code} team={team} flip={i % 2 === 1} />
        ))}
      </section>
      <TeamResults team={team} />
      <TeamStrengths team={team} />
      <TeamNext team={team} />
      <Footer />
    </article>
  );
}
