import { useEffect } from 'react';
import Photo, { Credit } from '../components/Photo';
import SplitText from '../components/SplitText';
import PitDeco from './PitDeco';
import { STEPS } from '../data/pitstop';
import { soundCreditFor } from '../data/credits';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import { isSoundOn, play, preloadSounds } from '../lib/sound';
import './Pitstop.css';

// One step's sound at a time: the next one takes over from the last.
let current = null;
function playStep(name, volume = 0.95) {
  if (current) current.stop(0.4);
  current = play(name, { volume });
}

function SoundCredit({ name, label }) {
  const c = soundCreditFor(name);
  if (!c) return null;
  return (
    <span className="credit">
      {label}:{' '}
      <a className="link" href={c.url} target="_blank" rel="noreferrer">
        {c.author}
      </a>
      ,{' '}
      <a className="link" href={c.licence.url} target="_blank" rel="noreferrer">
        {c.licence.name}
      </a>
    </span>
  );
}

function Step({ step, index, near }) {
  const [ref, inView, visible] = useInView({ track: true, margin: '0px -18% 0px -18%', threshold: 0.2 });

  // With sound on, the step's sound plays as its photo arrives, every time it does.
  useEffect(() => {
    if (visible && step.sound && isSoundOn()) playStep(step.sound, step.volume);
  }, [visible, step.sound, step.volume]);

  return (
    <article className="pstep" ref={ref} data-kind={step.kind} data-inview={inView ? 'true' : 'false'} style={{ '--i': index }}>
      <span className="pstep__mark t-num" aria-hidden="true">
        {step.mark}
      </span>
      <div className="pstep__photo">
        <Photo id={step.photo} alt={step.caption} ratio="16 / 10" className="wipe" eager={near} />
        {/* Painted pit box corners and the step's own graphic, laid over the photo. */}
        <i className="pstep__corners" aria-hidden="true" />
        <PitDeco kind={step.kind} />
        <p className="pstep__credits">
          <Credit id={step.photo} />
          {(step.credits || []).map(([name, label]) => (
            <SoundCredit key={name} name={name} label={label} />
          ))}
        </p>
      </div>
      <div className="pstep__copy">
        <p className="pstep__label rise" style={{ '--delay': '120ms' }}>
          <span className="pstep__box t-num">{String(index + 1).padStart(2, '0')}</span> {step.label}
        </p>
        <h3 className="pstep__title">
          <SplitText text={step.title} styleName="rise" delay={180} />
        </h3>
        <p className="pstep__body rise" style={{ '--delay': '320ms' }}>
          {step.body}
        </p>
        <ul className="pstep__facts rise" style={{ '--delay': '420ms' }}>
          {step.fact.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * The pit stop. Identity: the same sideways journey as the history section,
 * through the five steps of a stop, one photograph each, with the figure that
 * defines each step painted behind it. With sound on, the radio call, the
 * wheel guns and the car leaving play as their steps arrive. On narrow
 * screens it becomes an ordinary vertical list.
 */
/**
 * Lewis Hamilton's Ferrari SF-26 seen from above, nose to the right: Ferrari's
 * own 2026 launch image, cut out of its background, with the race number
 * changed from 16 to 44 (see the credits).
 */
const TOP_CAR = `${import.meta.env.BASE_URL}photos/pit/sf26-top.webp`;

export default function Pitstop() {
  const ref = useProgress('contain');
  const [headRef, headIn] = useInView();
  const [nearRef, near] = useInView({ margin: '100% 0px 100% 0px', threshold: 0 });
  useEffect(() => {
    if (near) preloadSounds(STEPS.filter((s) => s.sound).map((s) => s.sound));
  }, [near]);
  return (
    <section
      id="pitstop"
      className="pit p-drive"
      ref={(el) => {
        ref.current = el;
        nearRef.current = el;
      }}
      data-timeline="contain"
      aria-labelledby="pit-title"
    >
      <div className="pit__pin">
        {/* The pit lane behind it all: the pit wall's hazard stripe above, painted lines below. */}
        <div className="pit__scene" aria-hidden="true">
          <i className="pit__wall" />
          <i className="pit__lane" />
          <i className="pit__glow" />
        </div>
        <div className="pit__track scrub">
          <header className="pit__head" ref={headRef} data-inview={headIn ? 'true' : 'false'}>
            <span className="pit__tyre" aria-hidden="true">
              <i />
            </span>
            <p className="pit__kicker rise">
              <span className="pit__tag">Pit lane</span> Pit stop
            </p>
            <h2 id="pit-title" className="pit__title t-display" data-skew="">
              <SplitText text="Box, box" styleName="rise" />
            </h2>
            <p className="t-lead rise" style={{ '--delay': '400ms' }}>
              Two words on the radio, and about twenty people have the car on four new tyres and back on its way in a little over two seconds. This is how.
            </p>
            <p className="pit__hint rise" style={{ '--delay': '520ms' }}>
              Keep scrolling. The car is coming in.
            </p>
          </header>
          {STEPS.map((step, i) => (
            <Step key={step.label} step={step} index={i} near={near} />
          ))}
        </div>

        <div className="pit__ruler" aria-hidden="true">
          <div className="pit__ticks">
            {STEPS.map((step, i) => (
              <span key={step.label}>
                <b className="t-num">{String(i + 1).padStart(2, '0')}</b>
                {step.label}
              </span>
            ))}
          </div>
          <div className="pit__bar">
            <i className="scrub" />
          </div>
          <span className="pit__marker">
            <img className="pit__car" src={TOP_CAR} alt="" width="480" height="170" loading="lazy" decoding="async" />
          </span>
        </div>
      </div>
    </section>
  );
}
