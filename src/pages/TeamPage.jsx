import { useMemo } from 'react';
import PhotoCar from '../components/PhotoCar';
import Photo, { Credit } from '../components/Photo';
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

function TeamHero({ team }) {
  const place = standing(team.id);
  const scrollRef = useProgress('contain');
  const parallax = usePointerParallax({ ease: 0.07 });
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
          <div className="tph__car">
            <PhotoCar id={`${team.id}-a`} alt={`The ${team.chassisFull}, photographed from the side at the 2026 Austrian Grand Prix`} sliced speed eager data-roll="" />
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

/** The labels shown while the car is apart; their positions live in TeamPage.css. */
const PARTS = [
  ['nose', 'Front wing and nose'],
  ['cell', 'Survival cell and halo'],
  ['pu', 'Power unit'],
  ['tail', 'Rear wing and gearbox'],
  ['wheels', '18-inch wheels'],
];

function TeamCar({ team }) {
  const ref = useProgress('contain');
  return (
    <section className="tpc" ref={ref} data-timeline="contain" aria-labelledby="tpc-title">
      <div className="tpc__pin">
        <div className="tpc__head wrap">
          <h2 id="tpc-title" className="t-h2">
            The {team.chassis}, taken apart
          </h2>
          <p>
            One photograph, six layers. Scroll to pull the {team.chassisFull} into its main sections and put it back together.
          </p>
        </div>
        <div className="tpc__stage">
          <span className="tpc__ghost t-team scrub" aria-hidden="true">
            {team.chassis}
          </span>
          <div className="tpc__car scrub">
            <PhotoCar id={`${team.id}-a`} alt={`The ${team.chassisFull} separated into nose, cockpit, engine cover, tail and wheels`} sliced />
            <ul className="tpc__labels scrub" aria-hidden="true">
              {PARTS.map(([id, text]) => (
                <li key={id} data-part={id}>
                  {id === 'pu' ? `${team.powerUnit} power unit` : text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="tpc__credit wrap">
          <Credit id={`${team.id}-a`} />
        </p>
      </div>
    </section>
  );
}

function TeamAction({ team }) {
  const ref = useProgress('cover');
  const key = `action/${team.id}`;
  return (
    <section className="tpa" ref={ref} data-timeline="cover" aria-label={`${team.name} on track`}>
      <div className="tpa__frame scrub">
        <div className="tpa__img scrub">
          <Photo id={key} alt={`A ${team.chassisFull} at speed during the 2026 Austrian Grand Prix weekend`} ratio="21 / 10" />
        </div>
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
        <PhotoCar id={d.car} alt={`${d.first} ${d.last}'s ${team.chassis}, car number ${d.no}`} wheels={false} />
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
        <h2 id="tpr-title" className="t-h2">
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
        <h2 id="tpt-title" className="t-h2">
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
      <TeamCar team={team} />
      <TeamAction team={team} />
      <section className="tpds" aria-labelledby="tpds-title">
        <Reveal className="tpds__head wrap">
          <h2 id="tpds-title" className="t-display">
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
