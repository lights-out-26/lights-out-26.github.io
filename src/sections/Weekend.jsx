import { useCallback, useState } from 'react';
import SplitText from '../components/SplitText';
import { WEEKEND } from '../data/tech';
import useProgress from '../hooks/useProgress';
import { scrollToY } from '../lib/smooth';
import './Weekend.css';

const SLOTS = Array.from({ length: 22 }, (_, i) => i + 1);
const SHORT = ['Practice', 'Q1', 'Q2', 'Q3', 'Race'];
/** How many cars are still in at each stage. */
const ALIVE = { practice: 22, q1: 16, q2: 10, q3: 10, race: 22 };

/**
 * The race weekend. Identity: one pinned screen that changes as you scroll.
 * A 22-car grid on the right thins out through qualifying, then the five
 * lights come on, go out, and the grid launches.
 */
export default function Weekend() {
  const [step, setStep] = useState(0);
  const onProgress = useCallback((p) => {
    setStep(Math.min(WEEKEND.length - 1, Math.max(0, Math.floor(p * WEEKEND.length * 0.999))));
  }, []);
  const ref = useProgress('contain', onProgress);
  const stage = WEEKEND[step];

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
              How a race weekend works
            </h2>

            <div className="weekend__steps">
              {WEEKEND.map((s, i) => (
                <article key={s.id} className="wstep" data-state={i === step ? 'on' : i < step ? 'past' : 'next'} aria-hidden={i !== step}>
                  <p className="wstep__day">{s.day}</p>
                  <h3 className="wstep__title t-display">
                    <SplitText text={s.title} styleName="brake" inView={i === step} stagger={20} />
                  </h3>
                  <p className="wstep__lead">{s.lead}</p>
                  <p className="wstep__body">{s.body}</p>
                  <p className="wstep__stat">
                    <strong className="t-num">{s.stat[0]}</strong>
                    <span>{s.stat[1]}</span>
                  </p>
                </article>
              ))}
            </div>

            <ol className="weekend__rail" aria-label="Stages of the weekend">
              {WEEKEND.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className="weekend__dot" aria-current={i === step ? 'step' : undefined} data-done={i < step ? '' : undefined} onClick={() => jump(i)}>
                    <i />
                    <span>{SHORT[i]}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="weekend__visual" aria-hidden="true">
            <div className="gantry">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ '--i': i }} />
              ))}
            </div>
            <ol className="grid22">
              {SLOTS.map((n) => (
                <li key={n} className="grid22__slot" data-out={n > ALIVE[stage.id] ? '' : undefined} data-pole={stage.id === 'q3' && n === 1 ? '' : undefined} style={{ '--n': n }}>
                  <span className="grid22__box" />
                  <span className="grid22__car" />
                  <span className="grid22__no t-num">{n}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
