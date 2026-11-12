import { useEffect, useRef, useState } from 'react';
import { carSrc } from './PhotoCar';
import { setSound, startBeeps } from '../lib/sound';
import './Preloader.css';

const LIGHTS = [0, 1, 2, 3, 4];
const LIGHTS_OUT = 2450; // ms: the last lamp is on at 1.95 s, all five go out at 2.45 s

/**
 * The start with sound runs at the real pace: a red light every second, then
 * a random hold before all five go out, so the moment cannot be anticipated.
 */
const REAL = { first: 0.6, step: 1 };
const realStart = () => {
  const hold = 0.6 + Math.random() * 1.6;
  return { ...REAL, out: REAL.first + 4 * REAL.step + hold };
};

/**
 * The intro: five start lights come on one by one while the first images and
 * the typeface load, then go out together and the screen opens.
 * Click, tap or press any key to skip it.
 *
 * "Start with sound" turns sound on and runs the lights again from the first
 * lamp at the real pace, with the start signal: a beep as each red light comes
 * on, and silence when they go out.
 */
export default function Preloader({ onDone }) {
  const [phase, setPhase] = useState('lights'); // lights -> out -> gone
  const [run, setRun] = useState(0);
  const [start, setStart] = useState(null);
  const finished = useRef(false);
  const signal = useRef(null);

  const startWithSound = () => {
    setSound(true);
    const s = realStart();
    signal.current = startBeeps(LIGHTS.map((i) => s.first + i * s.step));
    setStart(s);
    setRun((n) => n + 1);
  };

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers = [];
    const wait = (ms) => new Promise((resolve) => timers.push(window.setTimeout(resolve, ms)));

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      // Skipped part-way through: no more beeps once the lights have gone.
      if (signal.current) signal.current.stop(0.04);
      setPhase('out');
      onDone();
      timers.push(window.setTimeout(() => setPhase('gone'), reduce ? 50 : 1250));
    };

    if (run === 0) {
      const img = new Image();
      img.src = carSrc('mercedes-a');
      const assets = Promise.all([
        img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      ]);
      // Never hold the page hostage: give up waiting after four seconds.
      Promise.all([wait(reduce ? 250 : LIGHTS_OUT), Promise.race([assets, wait(4000)])]).then(finish);
    } else {
      // Lights restarted with sound: they go out after the random hold.
      wait(reduce ? 250 : start.out * 1000).then(finish);
    }

    const skip = (e) => {
      if (e.target && e.target.closest && e.target.closest('.pre__sound')) return;
      finish();
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [onDone, run, start]);

  if (phase === 'gone') return null;

  return (
    <div className="pre" data-phase={phase} role="status" aria-label="Loading Lights Out 26">
      <div className="pre__half pre__half--top" />
      <div className="pre__half pre__half--bottom" />
      <div className="pre__core">
        <div
          className="pre__gantry"
          aria-hidden="true"
          key={run}
          style={start ? { '--lamp-first': `${start.first}s`, '--lamp-step': `${start.step}s` } : undefined}
        >
          {LIGHTS.map((i) => (
            <span key={i} className="pre__lamp" style={{ '--i': i }}>
              <i />
              <i />
            </span>
          ))}
        </div>
        <p className="pre__name">Lights Out 26</p>
        <p className="pre__hint">{run ? 'Start procedure' : 'Getting the grid ready'}</p>
        {run === 0 && (
          <button type="button" className="pre__sound" onClick={startWithSound}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
              <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
            </svg>
            Start with sound
          </button>
        )}
      </div>
    </div>
  );
}
