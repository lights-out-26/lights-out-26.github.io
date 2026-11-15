import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SplitText from '../components/SplitText';
import { WEEKEND } from '../data/tech';
import useProgress from '../hooks/useProgress';
import { scrollToY } from '../lib/smooth';
import { buildWeekend, towerAt, teamColour, lapText } from '../lib/session';
import { isSoundOn, play, preloadSounds } from '../lib/sound';
import { t } from '../lib/lang';
import './Weekend.css';

const SLOTS = Array.from({ length: 22 }, (_, i) => i + 1);
const SHORT = ['Practice', 'Q1', 'Q2', 'Q3', 'Race'];
const SESSION_NAME = { practice: 'Practice', q1: 'Q1', q2: 'Q2', q3: 'Q3' };
const CUT_LABEL = { q1: 'Bottom six out', q2: 'Bottom six out' };
const WEEKEND_DATA = buildWeekend();
const CODES = WEEKEND_DATA.entrants.practice;

/** Session progress for a share of one stage: a short pause at the start, and time at the end to see the result. */
const sessionProgress = (local) => Math.min(1, Math.max(0, (local - 0.06) / 0.72));

/**
 * A timing screen. Rows keep one DOM node per driver and move to their slot,
 * so a driver who improves visibly climbs past the others.
 */
function Tower({ id, s }) {
  const tower = useMemo(() => towerAt(WEEKEND_DATA, id, s), [id, s]);
  const byCode = useMemo(() => Object.fromEntries(tower.rows.map((r) => [r.code, r])), [tower]);

  // Remember each driver's last slot in this session, so a change of place shows an arrow.
  const moves = useRef({ id: null, rows: {} });
  if (moves.current.id !== id) moves.current = { id, rows: {} };
  const marks = moves.current.rows;
  tower.rows.forEach((r) => {
    const m = marks[r.code];
    if (!m) marks[r.code] = { slot: r.slot, n: 0, dir: null };
    else if (m.slot !== r.slot) {
      marks[r.code] = { slot: r.slot, n: m.n + 1, dir: r.slot < m.slot ? 'up' : 'down' };
    }
  });

  return (
    <div className="tower" data-done={tower.done ? '' : undefined} data-session={id}>
      <div className="tower__head">
        <span className="tower__session">{t(SESSION_NAME[id])}</span>
        <span className="tower__clock t-num">{tower.clock}</span>
        <span className="tower__flag" title={t('Chequered flag')} />
      </div>
      <div className="tower__list" style={{ '--count': tower.rows.length }}>
        {CODES.map((code) => {
          const r = byCode[code];
          const m = marks[code];
          const first = r.slot === 0 && r.state !== 'wait';
          const time = r.time === undefined ? t('No time') : first || r.state === 'gone' ? lapText(r.time) : `+${(r.time - tower.lead).toFixed(3)}`;
          return (
            <div
              key={code}
              className="tower__row"
              data-state={r.state}
              data-alt={r.slot % 2 ? '' : undefined}
              data-pole={id === 'q3' && tower.done && r.slot === 0 ? '' : undefined}
              style={{ '--slot': r.slot, '--col': r.slot >= 11 ? 1 : 0, '--r': r.slot % 11, '--team-c': teamColour(code) }}
            >
              <span className="tower__pos t-num">{r.slot + 1}</span>
              <i className="tower__bar" />
              <span className="tower__code">{code}</span>
              <span className="tower__time t-num">{time}</span>
              {m.dir && <span key={m.n} className="tower__arrow" data-dir={m.dir} />}
            </div>
          );
        })}
        {tower.cut && (
          <div className="tower__cut" style={{ '--slot': tower.cut, '--col': tower.cut >= 11 ? 1 : 0, '--r': tower.cut % 11 }}>
            <span>{t(CUT_LABEL[id])}</span>
          </div>
        )}
      </div>
      <p className="tower__note">{t('Illustrative session, simulated from the 2026 standings')}</p>
    </div>
  );
}

/**
 * The race weekend. Identity: one pinned screen that changes as you scroll.
 * Through practice and qualifying a timing screen runs on the right, its
 * session clock geared to the scroll: times fall, drivers swap places, and
 * when the clock runs out the slowest drop below the line. Then the cars line
 * up in that order, the five lights come on, go out, and the grid launches.
 */
export default function Weekend() {
  const [pos, setPos] = useState({ step: 0, s: 0 });
  const onProgress = useCallback((p) => {
    const x = p * WEEKEND.length;
    const step = Math.min(WEEKEND.length - 1, Math.max(0, Math.floor(x * 0.9999)));
    const s = Math.round(sessionProgress(x - step) * 600) / 600;
    setPos((prev) => (prev.step === step && prev.s === s ? prev : { step, s }));
  }, []);
  const ref = useProgress('contain', onProgress);
  const { step, s } = pos;
  const stage = WEEKEND[step];
  const racing = stage.id === 'race';

  // With sound on: fetch the launch during qualifying, play it on arriving at the race. Its cue
  // (the car launching, 3.45 s in) lands as the lights go out and the grid leaves.
  useEffect(() => {
    if (step >= 3) preloadSounds(['launch']);
  }, [step]);
  useEffect(() => {
    if (!racing || !isSoundOn()) return undefined;
    const launch = play('launch', { sync: true });
    return () => launch && launch.stop(0.6);
  }, [racing]);

  const jump = (i) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    scrollToY(top + (travel * (i + 0.4)) / WEEKEND.length);
  };

  return (
    <section className="weekend" ref={ref} data-timeline="contain" aria-labelledby="weekend-title">
      <div className="weekend__pin" data-stage={stage.id}>
        <div className="weekend__inner wrap">
          <div className="weekend__copy">
            <h2 id="weekend-title" className="weekend__kicker">
              {t('How a race weekend works')}
            </h2>

            <div className="weekend__steps">
              {WEEKEND.map((st, i) => (
                <article key={st.id} className="wstep" data-state={i === step ? 'on' : i < step ? 'past' : 'next'} aria-hidden={i !== step}>
                  <p className="wstep__day">{t(st.day)}</p>
                  <h3 className="wstep__title t-display">
                    <SplitText text={t(st.title)} styleName="brake" inView={i === step} stagger={20} />
                  </h3>
                  <p className="wstep__lead">{t(st.lead)}</p>
                  <p className="wstep__body">{t(st.body)}</p>
                  <p className="wstep__stat">
                    <strong className="t-num">{t(st.stat[0])}</strong>
                    <span>{t(st.stat[1])}</span>
                  </p>
                </article>
              ))}
            </div>

            <ol className="weekend__rail" aria-label={t('Stages of the weekend')}>
              {WEEKEND.map((st, i) => (
                <li key={st.id}>
                  <button type="button" className="weekend__dot" aria-current={i === step ? 'step' : undefined} data-done={i < step ? '' : undefined} onClick={() => jump(i)}>
                    <i style={i === step && !racing ? { '--fill': s } : undefined} />
                    <span>{t(SHORT[i])}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="weekend__visual" aria-hidden="true">
            {!racing && <Tower id={stage.id} s={s} />}
            <div className="weekend__race">
              <div className="gantry">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} style={{ '--i': i }} />
                ))}
              </div>
              <ol className="grid22">
                {SLOTS.map((n) => {
                  const code = WEEKEND_DATA.grid[n - 1];
                  return (
                    <li key={n} className="grid22__slot" style={{ '--n': n, '--car': teamColour(code) }}>
                      <span className="grid22__box" />
                      <span className="grid22__car" />
                      <span className="grid22__no t-num">{code}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
