import { useCallback, useEffect, useState } from 'react';
import PhotoCar from '../components/PhotoCar';
import { Credit } from '../components/Photo';
import { Count } from '../components/Numbers';
import SplitText from '../components/SplitText';
import { PARTS, POWER, DIMENSIONS } from '../data/tech';
import { TEAMS, TEAM_BY_ID } from '../data/teams';
import { teamVars } from '../lib/team';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import './Machine.css';

const FIRST = 0.44; // scroll progress at which the first callout appears
const SPAN = 0.5; // ...and how much scroll the five of them share

/**
 * The machine. Identity: assembly. A real car photo arrives in pieces (four
 * body sections and two wheels on separate layers) and pulls itself together
 * as you scroll; then the 2026 rule changes are pinned onto it one by one.
 */
export default function Machine() {
  const [carId, setCarId] = useState('mclaren');
  const [mode, setMode] = useState('corner');
  const [reached, setReached] = useState(-1);
  const [picked, setPicked] = useState(null);

  const onProgress = useCallback((p) => {
    const i = Math.floor(((p - FIRST) / SPAN) * PARTS.length);
    setReached(Math.max(-1, Math.min(PARTS.length - 1, i)));
  }, []);
  const ref = useProgress('contain', onProgress);
  const [dataRef, dataIn] = useInView({ margin: '0px', threshold: 0.4 });

  // Scrolling on to the next part takes over again from a manual choice.
  useEffect(() => setPicked(null), [reached]);

  const active = picked ?? reached;
  const part = active >= 0 ? PARTS[active] : null;
  const team = TEAM_BY_ID[carId];
  const total = POWER.engine + POWER.electric;

  return (
    <section className="machine" ref={ref} data-timeline="contain" style={teamVars(team)} aria-labelledby="machine-title">
      <div className="machine__pin" data-mode={mode}>
        <div className="machine__top wrap">
          <header className="machine__head">
            <h2 id="machine-title" className="t-h2">
              The 2026 car, piece by piece
            </h2>
            <p className="machine__lead">
              New chassis rules and new power unit rules arrived together for the first time. Scroll to put the car together, then see what changed.
            </p>
          </header>

          <div className="machine__panel" aria-live="polite">
            {part ? (
              <article className="mpart" key={part.id}>
                <h3 className="mpart__title">
                  <SplitText text={part.title} styleName="focus" inView />
                </h3>
                <p className="mpart__body">{part.body}</p>
                <p className="mpart__figure">
                  <strong className="t-num">{part.figure[0]}</strong>
                  <span>{part.figure[1]}</span>
                </p>
              </article>
            ) : (
              <p className="machine__wait">Four body sections and two wheels, each on its own layer.</p>
            )}
          </div>
        </div>

        <div className="machine__stage">
          <div className="machine__streaks" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
          <div className="machine__car scrub" style={{ '--hx': part ? part.x : 0.5 }}>
            <div className="machine__carfade" key={carId}>
              <PhotoCar
                id={`${carId}-a`}
                alt={`The ${team.chassisFull} from the side, with the main parts of a 2026 car marked`}
                sliced
                speed
                data-roll={mode === 'straight' ? '' : undefined}
              />
            </div>
            <ol className="machine__hots" aria-label="Parts of the car">
              {PARTS.map((p, i) => (
                <li
                  key={p.id}
                  style={{
                    left: `${p.x * 100}%`,
                    top: `${p.y * 100}%`,
                    // the stem runs from the part to just clear of the car, above or below it
                    '--stem': p.y > 0.6 ? `calc(${((1 - p.y) * 100).toFixed(1)}cqh + 4px)` : `calc(${(p.y * 100).toFixed(1)}cqh + 2px)`,
                  }}
                  data-shown={i <= reached || picked === i ? '' : undefined}
                  data-side={p.y > 0.6 ? 'down' : 'up'}
                >
                  <button
                    type="button"
                    className="hot"
                    aria-pressed={i === active}
                    tabIndex={i <= reached ? 0 : -1}
                    onClick={() => setPicked(i)}
                    onPointerEnter={() => i <= reached && setPicked(i)}
                  >
                    <i aria-hidden="true" />
                    <span>{p.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="machine__bottom wrap" ref={dataRef} data-inview={dataIn ? 'true' : 'false'}>
          <div className="machine__controls">
            <div className="seg" role="group" aria-label="Aerodynamic mode">
              {[
                ['corner', 'Corner mode'],
                ['straight', 'Straight mode'],
              ].map(([id, text]) => (
                <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
                  {text}
                </button>
              ))}
              <i aria-hidden="true" />
            </div>
            <p className="machine__modenote">
              {mode === 'corner'
                ? 'Flaps closed. The wings push the car into the road for grip.'
                : 'Flaps open on both wings. Drag falls away and the car runs faster down the straight.'}
            </p>
            <div className="machine__teams" role="group" aria-label="Change the car shown">
              {TEAMS.map((t) => (
                <button key={t.id} type="button" style={teamVars(t)} aria-pressed={t.id === carId} aria-label={t.name} title={t.name} onClick={() => setCarId(t.id)} />
              ))}
              <Credit id={`${carId}-a`} />
            </div>
          </div>

          <dl className="machine__dims">
            {DIMENSIONS.map((d) => (
              <div key={d.label}>
                <dt>{d.label}</dt>
                <dd>
                  <Count to={d.value} className="machine__dimval" />
                  <span className="machine__unit">{d.unit}</span>
                  <span className="machine__was">
                    was {d.was.toLocaleString('en-GB')}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <figure className="power" aria-label={`Peak power: about ${POWER.engine} kilowatts from the engine and ${POWER.electric} from the electric motor, up from ${POWER.electricBefore} before 2026`}>
            <figcaption>Where the power comes from</figcaption>
            <div className="power__bar" aria-hidden="true">
              <span className="power__seg power__seg--engine" style={{ '--share': POWER.engine / total }}>
                <b className="t-num">{POWER.engine} kW</b> engine
              </span>
              <span className="power__seg power__seg--electric" style={{ '--share': POWER.electric / total }}>
                <b className="t-num">{POWER.electric} kW</b> electric
              </span>
            </div>
            <p className="power__note" aria-hidden="true">
              <i style={{ '--share': POWER.electricBefore / total }} />
              Until 2025 the electric motor gave {POWER.electricBefore} kW
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}
