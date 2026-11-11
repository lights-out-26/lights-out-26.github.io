import { useEffect, useRef, useState } from 'react';
import { carSrc } from './PhotoCar';
import { play, setSound } from '../lib/sound';
import './Preloader.css';

const LIGHTS = [0, 1, 2, 3, 4];
const LIGHTS_OUT = 2450; // ms: the last lamp is on at 1.95 s, all five go out at 2.45 s

/**
 * The intro: five start lights come on one by one while the first images and
 * the typeface load, then go out together and the screen opens.
 * Click, tap or press any key to skip it.
 *
 * "Start with sound" turns the engine sound on and runs the lights again from
 * the first lamp, with a real F1 car holding revs on the line and dropping the
 * clutch as they go out.
 */
export default function Preloader({ onDone }) {
  const [phase, setPhase] = useState('lights'); // lights -> out -> gone
  const [run, setRun] = useState(0);
  const finished = useRef(false);

  const startWithSound = () => {
    setSound(true);
    play('start', { sync: true });
    setRun((n) => n + 1);
  };

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers = [];
    const wait = (ms) => new Promise((resolve) => timers.push(window.setTimeout(resolve, ms)));

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
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
      // Lights restarted with sound: they go out exactly on the clutch drop in the recording.
      wait(LIGHTS_OUT).then(finish);
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
  }, [onDone, run]);

  if (phase === 'gone') return null;

  return (
    <div className="pre" data-phase={phase} role="status" aria-label="Loading Lights Out 26">
      <div className="pre__half pre__half--top" />
      <div className="pre__half pre__half--bottom" />
      <div className="pre__core">
        <div className="pre__gantry" aria-hidden="true" key={run}>
          {LIGHTS.map((i) => (
            <span key={i} className="pre__lamp" style={{ '--i': i }}>
              <i />
              <i />
            </span>
          ))}
        </div>
        <p className="pre__name">Lights Out 26</p>
        <p className="pre__hint">{run ? 'Engines running' : 'Getting the grid ready'}</p>
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
