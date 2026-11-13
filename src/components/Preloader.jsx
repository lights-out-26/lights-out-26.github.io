import { useCallback, useEffect, useRef, useState } from 'react';
import { carSrc } from './PhotoCar';
import { isSoundOn, play, preloadSounds, startBeeps } from '../lib/sound';
import './Preloader.css';

const LIGHTS = [0, 1, 2, 3, 4];
/** In the start recording (scripts/sounds.json), the moment the grid pulls away: the lights go out here. */
const START_CUE = 6.95;
/** The grid a little under the beeps while they run, then up as the cars pull away. */
const START_SHAPE = [[0, 0.8], [6.8, 0.8], [7.1, 1.3], [9.5, 1.15]];

/**
 * The start runs at the real pace: a red light every second, then a random
 * hold before all five go out, so the moment cannot be anticipated.
 */
const REAL = { first: 0.6, step: 1 };
const realStart = () => {
  const hold = 0.9 + Math.random() * 1.4;
  return { ...REAL, out: REAL.first + 4 * REAL.step + hold, at: performance.now() };
};

/**
 * The intro: the start lights wait, dark, over a start button while the first
 * images and the typeface load. Pressing it runs the start procedure at the
 * real pace: five red lights come on a second apart, then go out together and
 * the screen opens. With sound on (the default), each light beeps over a real
 * grid of turbo-hybrid V6 cars (the 2021 Russian Grand Prix), idling under the
 * lights and pulling away as they go out. The press is also the click that
 * browsers need before a page may play sound.
 *
 * Once the lights are running, a click, tap or key press skips the rest.
 * Escape skips the intro before it starts.
 */
export default function Preloader({ onDone }) {
  const [phase, setPhase] = useState('ready'); // ready -> lights -> out -> gone
  const [start, setStart] = useState(null);
  const finished = useRef(false);
  const signal = useRef(null);
  const engine = useRef(null);
  const assets = useRef(Promise.resolve());
  const timers = useRef([]);
  const reduce = useRef(false);

  // Load what the first screen needs, and the start recording, while the button waits.
  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    preloadSounds(['start']);
    const img = new Image();
    img.src = carSrc('mercedes-a');
    assets.current = Promise.all([
      img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    ]);
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  const finish = useCallback(
    (skipped) => {
      if (finished.current) return;
      finished.current = true;
      // Skipped part-way through: no more beeps, and the car goes now.
      if (skipped && signal.current) signal.current.stop(0.04);
      if (skipped && engine.current) {
        engine.current.stop(0.08);
        engine.current = play('start', { offset: START_CUE - 0.05 });
      }
      setPhase('out');
      onDone();
      timers.current.push(window.setTimeout(() => setPhase('gone'), reduce.current ? 50 : 1250));
    },
    [onDone]
  );

  const go = () => {
    if (start || finished.current) return;
    const s = realStart();
    if (isSoundOn()) {
      const lamps = LIGHTS.map((i) => s.first + i * s.step);
      signal.current = startBeeps(lamps);
      // Start the recording at the first light, from the point that puts its launch on the lights going out.
      const from = lamps[0] - 0.1;
      engine.current = play('start', { at: from, offset: START_CUE - (s.out - from), fadeIn: 0.3, shape: START_SHAPE });
    }
    setStart(s);
    setPhase('lights');
  };

  // Before the start: Escape skips the intro.
  useEffect(() => {
    if (start) return undefined;
    const onKey = (e) => e.key === 'Escape' && finish(true);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [start, finish]);

  // Lights running: they go out after the random hold (timed from the press, like the beeps),
  // once the first screen is ready, but never waiting more than four seconds for it.
  useEffect(() => {
    if (!start) return undefined;
    const wait = (ms) => new Promise((resolve) => timers.current.push(window.setTimeout(resolve, ms)));
    const left = reduce.current ? 250 : Math.max(0, start.out * 1000 - (performance.now() - start.at));
    Promise.all([wait(left), Promise.race([assets.current, wait(4000)])]).then(() => finish(reduce.current));

    const skip = (e) => !e.repeat && finish(true);
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [start, finish]);

  if (phase === 'gone') return null;

  return (
    <div className="pre" data-phase={phase} role="dialog" aria-modal="true" aria-label="Lights Out 26">
      <div className="pre__half pre__half--top" />
      <div className="pre__half pre__half--bottom" />
      <div className="pre__core">
        <div
          className="pre__gantry"
          aria-hidden="true"
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
        {start ? (
          <p className="pre__hint" role="status">Start procedure</p>
        ) : (
          <>
            <button type="button" className="pre__start" onClick={go} autoFocus aria-label="Start the lights">
              Start
            </button>
            <p className="pre__hint">Press start when you are ready</p>
          </>
        )}
      </div>
    </div>
  );
}
