import { useCallback, useEffect, useRef, useState } from 'react';
import Photo, { Credit } from '../components/Photo';
import SplitText from '../components/SplitText';
import useInView from '../hooks/useInView';
import useReducedMotion from '../hooks/useReducedMotion';
import { play, preloadSounds, setSound, useSound } from '../lib/sound';
import { soundCreditFor } from '../data/credits';
import './Pitstop.css';

/**
 * Moments in the pit stop sound, in seconds from its start
 * (scripts/prepare-pitstop.py builds it and prints these):
 * the call, the reply, the car stopping, the wheel guns taking the wheels off
 * and doing the new ones up, the jacks dropping, and the release.
 */
export const PIT_CUES = { box: 0.22, copy: 1.52, stop: 2.6, off: 2.66, on: 3.62, done: 4.12, down: 4.42, go: 4.9, end: 7.9 };

const STOP_TIME = PIT_CUES.go - PIT_CUES.stop;
const PHASES = ['idle', 'box', 'copy', 'stop', 'off', 'on', 'done', 'down', 'go'];
/** The four corners finish a few hundredths apart, as they do. */
const WHEELS = [
  ['fl', 'Front left', 0.02],
  ['fr', 'Front right', 0.09],
  ['rl', 'Rear left', 0],
  ['rr', 'Rear right', 0.13],
];

function SoundLine({ name, label }) {
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

/**
 * The pit stop. Identity: two words on the radio, then two seconds of work.
 * As the section arrives the engineer calls the car in, the driver answers,
 * the picture cuts to the car in the box, the wheel guns go, the jacks drop
 * and the light goes green. A stopwatch runs from the car stopping to the
 * release. With sound on, the guns and the car leaving are real recordings
 * (see scripts/prepare-pitstop.py); the radio voices are real people too,
 * put through a radio.
 */
export default function Pitstop() {
  const reduce = useReducedMotion();
  const soundOn = useSound();
  const [phase, setPhase] = useState(reduce ? 'go' : 'idle');
  const [ref, inView] = useInView({ threshold: 0.5 });
  const [nearRef, near] = useInView({ margin: '100% 0px 100% 0px', threshold: 0 });
  const clock = useRef(null);
  const timers = useRef([]);
  const raf = useRef(0);
  const audio = useRef(null);
  const ran = useRef(false);

  const halt = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    window.cancelAnimationFrame(raf.current);
  }, []);

  const showClock = (t) => {
    if (clock.current) clock.current.textContent = Math.max(0, Math.min(STOP_TIME, t)).toFixed(2);
  };

  const run = useCallback(() => {
    halt();
    if (audio.current) audio.current.stop(0.08);
    // `sync`: if the sound takes a moment to load it joins part-way, still in step with the picture.
    audio.current = play('pitstop', { sync: true });
    const t0 = performance.now();
    setPhase('idle');
    showClock(0);
    PHASES.slice(1).forEach((p) => {
      timers.current.push(window.setTimeout(() => setPhase(p), PIT_CUES[p] * 1000));
    });
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      showClock(t - PIT_CUES.stop);
      if (t < PIT_CUES.go + 0.1) raf.current = window.requestAnimationFrame(tick);
    };
    raf.current = window.requestAnimationFrame(tick);
  }, [halt]);

  // Fetch the sound a screen early; call the car in the first time the section is on screen.
  useEffect(() => {
    if (near) preloadSounds(['pitstop']);
  }, [near]);
  useEffect(() => {
    if (!inView || ran.current || reduce) return;
    ran.current = true;
    run();
  }, [inView, reduce, run]);
  useEffect(() => {
    if (reduce) showClock(STOP_TIME);
  }, [reduce]);
  useEffect(
    () => () => {
      halt();
      if (audio.current) audio.current.stop(0.1);
    },
    [halt]
  );

  const again = () => {
    // The button says so: with sound off, it turns sound on for the replay.
    if (!soundOn) setSound(true);
    run();
  };

  const at = PHASES.indexOf(phase);
  const past = (p) => at >= PHASES.indexOf(p);
  const inBox = past('stop');
  const wheel = () => (past('done') ? 'on' : past('off') ? 'off' : 'wait');

  return (
    <section
      id="pitstop"
      className="pit"
      ref={(el) => {
        ref.current = el;
        nearRef.current = el;
      }}
      data-phase={phase}
      aria-labelledby="pit-title"
    >
      <div className="pit__inner wrap">
        <header className="pit__head" data-inview={inView || ran.current ? 'true' : 'false'}>
          <p className="pit__kicker">Pit stop</p>
          <h2 id="pit-title" className="pit__title t-display" data-skew="">
            <SplitText text="Box, box" styleName="rise" />
          </h2>
          <p className="pit__lead rise" style={{ '--delay': '260ms' }}>
            Two words on the radio, and a crew of about twenty has the car on four new tyres and back on its way in a little over two seconds.
          </p>
        </header>

        <div className="pit__stage">
          <div className="pit__frame" data-cut={inBox ? 'box' : 'wait'}>
            <div className="pit__shot">
              <Photo
                id="pit/haas-wait"
                alt="The Haas pit crew in position, waiting for the car, at the 2017 United States Grand Prix"
                ratio="3 / 2"
                className="pit__photo pit__photo--wait"
                eager={near}
              />
              <Photo
                id="pit/haas-stop"
                alt="The Haas car stopped in its box with the crew changing all four wheels, at the 2017 United States Grand Prix"
                ratio="3 / 2"
                className="pit__photo pit__photo--stop"
                eager={near}
              />

              <div className="pit__hud" aria-hidden="true">
                <p className="pit__clock">
                  <b className="t-num" ref={clock}>
                    0.00
                  </b>
                  <span>s stationary</span>
                </p>
                <div className="pit__car">
                  {WHEELS.map(([id, name, delay]) => (
                    <i key={id} className={`pit__wheel pit__wheel--${id}`} data-state={wheel()} style={{ '--d': `${delay}s` }} title={name} />
                  ))}
                  <i className="pit__body" />
                  <i className="pit__jack pit__jack--front" data-up={inBox && !past('down') ? 'true' : 'false'} />
                  <i className="pit__jack pit__jack--rear" data-up={inBox && !past('down') ? 'true' : 'false'} />
                </div>
                <p className="pit__light" data-go={past('go') ? 'true' : 'false'}>
                  <i />
                  {past('go') ? 'Go' : inBox ? 'Hold' : 'Pit lane'}
                </p>
              </div>
            </div>

            <div className="pit__radio" data-live={phase === 'box' || phase === 'copy' ? 'true' : 'false'} aria-live="polite">
              <p className="pit__radio-head">
                <i className="pit__radio-dot" aria-hidden="true" />
                Team radio
                <span className="pit__wave" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <b key={i} style={{ '--i': i }} />
                  ))}
                </span>
              </p>
              <p className="pit__line" data-on={past('box') ? 'true' : 'false'}>
                <span>Engineer</span> Box, box.
              </p>
              <p className="pit__line" data-on={past('copy') ? 'true' : 'false'}>
                <span>Driver</span> Copy.
              </p>
            </div>
          </div>

          <div className="pit__side">
            <dl className="pit__facts">
              <div>
                <dt>On each wheel</dt>
                <dd>Three people: one on the wheel gun, one pulling the old wheel off, one putting the new one on.</dd>
              </div>
              <div>
                <dt>Around them</dt>
                <dd>A jack at each end, two people steadying the car, and one watching for traffic before giving the release.</dd>
              </div>
              <div>
                <dt>The clock</dt>
                <dd>Runs from the car stopping to the release. The best crews are done in about two seconds.</dd>
              </div>
            </dl>
            <button type="button" className="pit__again" onClick={again}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
              </svg>
              {soundOn ? 'Box, box again' : 'Box, box again, with sound'}
            </button>
            <p className="pit__credits">
              <Credit id="pit/haas-wait" />
              <SoundLine name="pitstop" label="Wheel guns" />
              <SoundLine name="pit-engineer" label="Engineer" />
              <SoundLine name="pit-driver" label="Driver" />
              <SoundLine name="start" label="Car leaving" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
