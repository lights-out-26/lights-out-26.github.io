import { useEffect, useRef, useState } from 'react';
import { carSrc } from './PhotoCar';
import './Preloader.css';

const LIGHTS = [0, 1, 2, 3, 4];

/**
 * The intro: five start lights come on one by one while the first images and
 * the typeface load, then go out together and the screen opens.
 * Click, tap or press any key to skip it.
 */
export default function Preloader({ onDone }) {
  const [phase, setPhase] = useState('lights'); // lights -> out -> gone
  const finished = useRef(false);

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

    const img = new Image();
    img.src = carSrc('mercedes-a');
    const assets = Promise.all([
      img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    ]);

    // Never hold the page hostage: give up waiting after four seconds.
    Promise.all([wait(reduce ? 250 : 2450), Promise.race([assets, wait(4000)])]).then(finish);

    const skip = () => finish();
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [onDone]);

  if (phase === 'gone') return null;

  return (
    <div className="pre" data-phase={phase} role="status" aria-label="Loading Lights Out 26">
      <div className="pre__half pre__half--top" />
      <div className="pre__half pre__half--bottom" />
      <div className="pre__core">
        <div className="pre__gantry" aria-hidden="true">
          {LIGHTS.map((i) => (
            <span key={i} className="pre__lamp" style={{ '--i': i }}>
              <i />
              <i />
            </span>
          ))}
        </div>
        <p className="pre__name">Lights Out 26</p>
        <p className="pre__hint">Getting the grid ready</p>
      </div>
    </div>
  );
}
