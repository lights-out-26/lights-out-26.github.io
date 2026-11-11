import { memo, useMemo, useRef, useState } from 'react';
import PhotoCar from '../components/PhotoCar';
import SplitText from '../components/SplitText';
import { DRIVERS } from '../data/drivers';
import { TEAMS, TEAM_BY_ID } from '../data/teams';
import { DRIVER_ORDER, AS_OF } from '../data/season';
import { cumulative, driverSeason } from '../lib/points';
import { teamVars, ABBR, fitSize } from '../lib/team';
import useInView from '../hooks/useInView';
import { useTilt } from '../hooks/usePointer';
import './Drivers.css';

const TOP = 390; // the leader's points: every sparkline shares this scale
const RANK = Object.fromEntries(DRIVER_ORDER.map((code, i) => [code, i + 1]));
const BY_STANDING = [...DRIVERS].sort((a, b) => RANK[a.code] - RANK[b.code]);
const BY_TEAM = TEAMS.flatMap((t) => t.drivers.map((code) => DRIVERS.find((d) => d.code === code)));

const fmt = (n) => n.toLocaleString('en-GB');

function sparkPath(values, w = 220, h = 44) {
  const step = w / (values.length - 1);
  return values.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)} ${(h - (v / TOP) * h).toFixed(1)}`).join('');
}

const DriverCard = memo(function DriverCard({ d, index }) {
  const [flipped, setFlipped] = useState(false);
  const tilt = useTilt({ max: 11 });
  const team = TEAM_BY_ID[d.team];
  const season = useMemo(() => driverSeason(d.code), [d.code]);
  const path = useMemo(() => sparkPath(cumulative(d.code)), [d.code]);
  const name = `${d.first} ${d.last}`;
  const c = d.career;

  return (
    <li className="dcard" ref={tilt} style={{ ...teamVars(team), '--i': index }} data-flipped={flipped ? '' : undefined}>
      <div className="dcard__inner">
        <div className="dcard__face dcard__face--front" aria-hidden={flipped}>
          <span className="dcard__no t-num" aria-hidden="true">
            {d.no}
          </span>
          <div className="dcard__car">
            <PhotoCar id={d.car} alt="" sizes="700px" />
          </div>
          <p className="dcard__top">
            <span className="t-num">P{RANK[d.code]}</span>
            <span className="t-num">{season.points} pts</span>
          </p>
          <div className="dcard__id">
            <p className="dcard__first">{d.first}</p>
            <h3 className="dcard__last t-team" style={{ '--fit': fitSize(d.last, team) }}>
              {d.last}
            </h3>
            <p className="dcard__meta">
              <span className="mark" aria-hidden="true">
                {ABBR[team.id]}
              </span>
              <span>
                {team.name}
                <br />
                {d.nat}
              </span>
            </p>
          </div>
          <span className="dcard__glare" aria-hidden="true" />
        </div>

        <div className="dcard__face dcard__face--back" aria-hidden={!flipped}>
          <p className="dcard__backname">
            <span className="t-num">{d.no}</span> {name}
          </p>
          <dl className="dcard__stats">
            {[
              ['Starts', c.starts],
              ['Wins', c.wins],
              ['Podiums', c.podiums],
              ['Poles', c.poles],
              ['Fastest laps', c.fastest],
              ['Points', c.points],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="t-num">{fmt(value)}</dd>
              </div>
            ))}
          </dl>
          {c.titles.length > 0 && (
            <p className="dcard__titles">
              World Champion <span className="t-num">{c.titles.length > 3 ? `${c.titles.length} times, ${c.titles[0]} to ${c.titles[c.titles.length - 1]}` : c.titles.join(', ')}</span>
            </p>
          )}
          <p className="dcard__note">{d.note}</p>
          <figure className="dcard__spark">
            <svg viewBox="0 -3 220 50" preserveAspectRatio="none" aria-hidden="true">
              <path d={path} pathLength="1" />
            </svg>
            <figcaption>
              2026 points by round: <span className="t-num">{season.points}</span>, with {season.wins} {season.wins === 1 ? 'win' : 'wins'}
            </figcaption>
          </figure>
        </div>
      </div>
      <button
        type="button"
        className="dcard__toggle"
        aria-pressed={flipped}
        aria-label={`${name}, ${team.name}. ${flipped ? 'Turn the card back over' : 'Turn the card over for career figures'}`}
        data-cursor="view"
        data-cursor-label={flipped ? 'Back' : 'Profile'}
        onClick={() => setFlipped((f) => !f)}
      />
    </li>
  );
});

/**
 * Drivers. Identity: a hand of cards. Each card leans toward the pointer,
 * floods with its team's colour, and turns over to show the career figures.
 */
export default function Drivers() {
  const [order, setOrder] = useState('standing');
  const [ref, inView] = useInView({ margin: '0px 0px -15% 0px' });
  const rail = useRef(null);
  const drag = useRef(null);
  const list = order === 'standing' ? BY_STANDING : BY_TEAM;

  const step = (dir) => {
    const el = rail.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.72, behavior: reduce ? 'auto' : 'smooth' });
  };

  // Click and drag the rail with a mouse; touch and trackpads scroll it natively.
  const onDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, left: rail.current.scrollLeft, moved: false };
  };
  const onMove = (e) => {
    const g = drag.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    if (!g.moved && Math.abs(dx) > 6) {
      g.moved = true;
      rail.current.dataset.dragging = 'true';
      rail.current.setPointerCapture(e.pointerId);
    }
    if (g.moved) rail.current.scrollLeft = g.left - dx;
  };
  const onUp = (e) => {
    const g = drag.current;
    drag.current = null;
    if (g && g.moved) {
      delete rail.current.dataset.dragging;
      rail.current.releasePointerCapture(e.pointerId);
      // swallow the click that ends a drag, so it does not flip a card
      const stop = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', stop, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
    }
  };

  return (
    <section id="drivers" className="drivers" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <header className="drivers__head wrap">
        <h2 className="t-display" data-skew="">
          <SplitText text="Twenty-two drivers" styleName="focus" stagger={22} />
        </h2>
        <div className="drivers__bar rise" style={{ '--delay': '300ms' }}>
          <p className="t-lead">
            Five world champions, one full-season rookie, and a 20-year-old at the top of the standings. Career figures run to the end of round {AS_OF.round}. Turn a card
            over for the detail.
          </p>
          <div className="drivers__tools">
            <div className="seg drivers__seg" role="group" aria-label="Order the drivers">
              {[
                ['standing', 'By standing'],
                ['team', 'By team'],
              ].map(([id, text]) => (
                <button key={id} type="button" aria-pressed={order === id} onClick={() => { setOrder(id); rail.current && (rail.current.scrollLeft = 0); }}>
                  {text}
                </button>
              ))}
              <i aria-hidden="true" />
            </div>
            <div className="drivers__arrows">
              <button type="button" onClick={() => step(-1)} aria-label="Earlier drivers">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" onClick={() => step(1)} aria-label="More drivers">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ol
        className="drivers__rail"
        key={order}
        ref={rail}
        data-cursor="drag"
        data-cursor-label="Drag"
        tabIndex={0}
        aria-label="Drivers"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {list.map((d, i) => (
          <DriverCard key={d.code} d={d} index={i} />
        ))}
      </ol>
    </section>
  );
}
