import { useEffect, useMemo, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import { Count } from '../components/Numbers';
import { ROUNDS, CONSTRUCTORS, DRIVER_ORDER, OFFICIAL_POINTS, AS_OF, REMAINING } from '../data/season';
import { DRIVER_BY_CODE, STAND_IN_DRIVERS } from '../data/drivers';
import { TEAM_BY_ID } from '../data/teams';
import { RECORDS, MILESTONES, AGES, FIRSTS_2026 } from '../data/records';
import { cumulative, driverSeason } from '../lib/points';
import { teamVars } from '../lib/team';
import { Link } from '../router/router';
import useInView from '../hooks/useInView';
import { list, t } from '../lib/lang';
import './Stats.css';

const LEADERS = ['ANT', 'VER', 'RUS', 'HAM', 'LEC', 'NOR'];
/** Team-mates share a colour, so the second of each pair is drawn dashed. */
const DASHED = new Set(['RUS', 'LEC']);
const MAX = 400;
const STAND_IN = Object.fromEntries(STAND_IN_DRIVERS.map((d) => [d.code, d]));

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    setWidth(Math.round(ref.current.getBoundingClientRect().width));
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/** Points after every round for the six drivers who led the championship fight. */
function TitleFight() {
  const [sizeRef, w] = useWidth();
  const [viewRef, inView] = useInView({ margin: '0px 0px -10% 0px', threshold: 0.25 });
  const [at, setAt] = useState(null);

  const series = useMemo(
    () =>
      LEADERS.map((code) => {
        const d = DRIVER_BY_CODE[code];
        return { code, name: `${d.first} ${d.last}`, team: TEAM_BY_ID[d.team], values: cumulative(code), dashed: DASHED.has(code) };
      }),
    []
  );

  const narrow = w < 640;
  const H = Math.round(Math.max(280, Math.min(480, w * 0.5)));
  const m = { l: 38, r: narrow ? 70 : 104, t: 14, b: 34 };
  const pw = Math.max(10, w - m.l - m.r);
  const ph = H - m.t - m.b;
  const last = ROUNDS.length - 1;
  const x = (i) => m.l + (pw * i) / last;
  const y = (v) => m.t + ph * (1 - v / MAX);

  // End labels, nudged apart where two totals are almost level.
  const labels = useMemo(() => {
    const list = series.map((s) => ({ ...s, v: s.values[last], ly: y(s.values[last]) })).sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < list.length; i += 1) if (list[i].ly - list[i - 1].ly < 17) list[i].ly = list[i - 1].ly + 17;
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, H, w]);

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left - m.l) / pw) * last);
    setAt(Math.max(0, Math.min(last, i)));
  };
  const onKey = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setAt((v) => Math.max(0, Math.min(last, (v ?? last) + (e.key === 'ArrowLeft' ? -1 : 1))));
  };

  const ranked = at == null ? [] : [...series].sort((a, b) => b.values[at] - a.values[at]);
  const flip = at != null && x(at) > w * 0.58;

  return (
    <figure className="fight" ref={viewRef} data-inview={inView ? 'true' : 'false'}>
      <figcaption className="fight__cap">
        <h3 className="stats__h3">{t('The title fight, round by round')}</h3>
        <ul className="fight__legend">
          {series.map((s) => (
            <li key={s.code} style={teamVars(s.team)}>
              <svg width="26" height="8" aria-hidden="true">
                <line x1="1" y1="4" x2="25" y2="4" strokeDasharray={s.dashed ? '6 4' : undefined} />
              </svg>
              <span>{s.name}</span>
            </li>
          ))}
        </ul>
      </figcaption>

      <div className="fight__plot" ref={sizeRef} style={{ height: H }}>
        {w > 0 && (
          <svg
            width={w}
            height={H}
            role="img"
            tabIndex={0}
            aria-label={t('Line chart of championship points after each of {n} rounds. {list}. Use the left and right arrow keys to step through the rounds.', {
              n: ROUNDS.length,
              list: labels.map((l) => `${l.name} ${l.v}`).join(', '),
            })}
            onPointerMove={onMove}
            onPointerLeave={() => setAt(null)}
            onKeyDown={onKey}
            onBlur={() => setAt(null)}
          >
            <defs>
              <clipPath id="fight-clip">
                <rect className="fight__reveal" x="0" y="0" width={w} height={H} />
              </clipPath>
            </defs>

            <g className="fight__grid">
              {[0, 100, 200, 300, 400].map((v) => (
                <g key={v}>
                  <line x1={m.l} x2={m.l + pw} y1={y(v)} y2={y(v)} />
                  <text x={m.l - 8} y={y(v)} dy="0.32em" textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {ROUNDS.map((r, i) =>
                !narrow || i % 3 === 0 || i === last ? (
                  <text key={r.code} x={x(i)} y={H - 10} textAnchor="middle">
                    {narrow ? i + 1 : r.code}
                  </text>
                ) : null
              )}
            </g>

            <g clipPath="url(#fight-clip)">
              {series.map((s) => (
                <path
                  key={s.code}
                  className="fight__line"
                  style={teamVars(s.team)}
                  d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('')}
                  strokeDasharray={s.dashed ? '7 5' : undefined}
                />
              ))}
            </g>

            <g className="fight__ends">
              {labels.map((l) => (
                <g key={l.code} style={teamVars(l.team)}>
                  <line className="fight__leader" x1={x(last) + 5} y1={y(l.v)} x2={x(last) + 14} y2={l.ly} />
                  <circle className="fight__dot" cx={x(last)} cy={y(l.v)} r="4.5" />
                  <text x={x(last) + 18} y={l.ly} dy="0.32em">
                    <tspan className="fight__code">{l.code}</tspan>
                    <tspan dx="6" className="fight__val">
                      {l.v}
                    </tspan>
                  </text>
                </g>
              ))}
            </g>

            {at != null && (
              <g className="fight__cross">
                <line x1={x(at)} x2={x(at)} y1={m.t} y2={m.t + ph} />
                {series.map((s) => (
                  <circle key={s.code} style={teamVars(s.team)} cx={x(at)} cy={y(s.values[at])} r="5" />
                ))}
              </g>
            )}
          </svg>
        )}

        {at != null && (
          <div className="tip" style={{ left: x(at), top: m.t }} data-flip={flip ? '' : undefined} role="status">
            <p className="tip__title">
              {t('Round {n}, {name}', { n: at + 1, name: t(ROUNDS[at].name) })}
            </p>
            <ul>
              {ranked.map((s) => (
                <li key={s.code} style={teamVars(s.team)}>
                  <i data-dashed={s.dashed ? '' : undefined} />
                  <span>{s.name}</span>
                  <b className="t-num">{s.values[at]}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </figure>
  );
}

function Constructors() {
  const [ref, inView] = useInView({ margin: '0px 0px -10% 0px', threshold: 0.2 });
  const top = CONSTRUCTORS[0][1];
  return (
    <div className="cons" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <h3 className="stats__h3">{t('Constructors’ Championship')}</h3>
      <ol className="cons__list">
        {CONSTRUCTORS.map(([id, pts], i) => {
          const team = TEAM_BY_ID[id];
          return (
            <li key={id} style={{ ...teamVars(team), '--i': i, '--share': pts / top }}>
              <Link className="cons__row" to={`#team-${id}`} data-cursor="view" data-cursor-label={t('Open')}>
                <span className="cons__pos t-num">{i + 1}</span>
                <span className="cons__name">{team.name}</span>
                <span className="cons__track">
                  <i />
                </span>
                <span className="cons__pts">
                  <Count to={pts} delay={200 + i * 70} duration={1400} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="stats__foot">{t('Mercedes sealed the title at round 20. Select a team to open its page.')}</p>
    </div>
  );
}

function Records() {
  const keys = Object.keys(RECORDS);
  const [tab, setTab] = useState(keys[0]);
  const [ref, inView] = useInView({ margin: '0px 0px -10% 0px', threshold: 0.2 });
  const set = RECORDS[tab];
  const top = Math.max(...set.rows.map((r) => r.value));
  return (
    <div className="recs" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <h3 className="stats__h3">{t('All-time records')}</h3>
      <div className="recs__tabs" role="tablist" aria-label={t('Record')}>
        {keys.map((k) => (
          <button key={k} type="button" role="tab" id={`rec-tab-${k}`} aria-selected={k === tab} aria-controls="rec-panel" onClick={() => setTab(k)}>
            {t(RECORDS[k].label)}
          </button>
        ))}
      </div>
      <ol className="recs__list" id="rec-panel" role="tabpanel" aria-labelledby={`rec-tab-${tab}`} key={tab}>
        {set.rows.map((r, i) => (
          <li key={r.name} style={{ ...(r.team ? teamVars(r.team) : {}), '--i': i, '--share': r.value / top }} data-current={r.team ? '' : undefined}>
            <span className="recs__name">{r.name}</span>
            <b className="recs__val t-num">{r.value}</b>
            <span className="recs__track">
              <i />
            </span>
          </li>
        ))}
      </ol>
      <p className="stats__foot">{t('Bars in a team’s colour belong to drivers and teams still racing in 2026.')}</p>
    </div>
  );
}

function StandingsTable() {
  return (
    <details className="table">
      <summary>
        <span>{t('Full drivers’ standings as a table')}</span>
      </summary>
      <div className="table__scroll">
        <table>
          <caption className="sr-only">{t('Drivers’ Championship after round {round}', { round: AS_OF.round })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Pos')}</th>
              <th scope="col">{t('Driver')}</th>
              <th scope="col">{t('Team')}</th>
              <th scope="col" className="num">{t('Wins')}</th>
              <th scope="col" className="num">{t('Podiums')}</th>
              <th scope="col" className="num">{t('Poles')}</th>
              <th scope="col" className="num">{t('Points')}</th>
            </tr>
          </thead>
          <tbody>
            {DRIVER_ORDER.map((code, i) => {
              const d = DRIVER_BY_CODE[code] || STAND_IN[code];
              const s = driverSeason(code);
              const team = TEAM_BY_ID[d.team];
              return (
                <tr key={code} style={teamVars(team)}>
                  <td className="t-num">{i + 1}</td>
                  <th scope="row">
                    {d.first} {d.last}
                  </th>
                  <td>
                    <i className="table__chip" aria-hidden="true" />
                    {team.name}
                    {STAND_IN[code] ? ` (${t('stand-in')})` : ''}
                  </td>
                  <td className="num t-num">{s.wins}</td>
                  <td className="num t-num">{s.podiums}</td>
                  <td className="num t-num">{s.poles}</td>
                  <td className="num t-num">{OFFICIAL_POINTS[code]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/**
 * Records and statistics. Identity: instruments. Lines draw themselves, bars
 * run out to their values and numbers count up, each once, as they arrive.
 */
export default function Stats() {
  const [headRef, headIn] = useInView();
  const [mileRef, mileIn] = useInView({ margin: '0px 0px -12% 0px', threshold: 0.2 });
  return (
    <section id="records" className="stats">
      <div className="wrap">
        <header className="stats__head" ref={headRef} data-inview={headIn ? 'true' : 'false'}>
          <h2 className="t-display" data-skew="">
            <SplitText text={t('The numbers')} styleName="rise" />
          </h2>
          <p className="t-lead rise" style={{ '--delay': '260ms' }}>
            {t('The 2026 standings after round {round} of {of}, the {race}, with {left} still to run. Both titles are already decided.', {
              round: AS_OF.round,
              of: AS_OF.of,
              race: t(AS_OF.race),
              left: list(REMAINING.map((r) => t(r.name))),
            })}
          </p>
        </header>

        <TitleFight />
        <StandingsTable />

        <div className="stats__pair">
          <Constructors />
          <Records />
        </div>

        <div className="miles" ref={mileRef} data-inview={mileIn ? 'true' : 'false'}>
          {MILESTONES.map((mile, i) => (
            <div key={mile.label} className="miles__item">
              <Count to={mile.value} className="miles__value" delay={i * 120} duration={1800} />
              <p className="miles__label">{t(mile.label)}</p>
              <p className="miles__who">{mile.who}</p>
            </div>
          ))}
        </div>

        <div className="stats__pair stats__pair--text">
          <div>
            <h3 className="stats__h3">{t('Youngest and oldest')}</h3>
            <dl className="ages">
              {AGES.map((a) => (
                <div key={a.label}>
                  <dt>{t(a.label)}</dt>
                  <dd>
                    <b className="t-num">{t(a.value)}</b>
                    <span>{t(a.who)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="stats__h3">{t('What 2026 added to the record books')}</h3>
            <ul className="firsts">
              {FIRSTS_2026.map(([place, text]) => (
                <li key={place}>
                  <b>{t(place)}</b>
                  <span>{t(text)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
