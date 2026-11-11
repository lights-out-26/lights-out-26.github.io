import { memo, useEffect, useRef, useState } from 'react';
import META from '../data/carsMeta.json';
import './PhotoCar.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;
const C = META.canvas;
const pct = (n) => `${(n * 100).toFixed(3)}%`;

/** The four slanted slices the bodywork is cut into, front to back. */
const SLICES = ['nose', 'cockpit', 'engine', 'tail'];

export const carSrc = (id, variant = '') => `${BASE}cars/${id}${variant}.webp`;

/**
 * A real photograph of a car, cut out from its background and rebuilt as
 * layers so CSS can move the parts independently:
 *
 *   shadow   a soft contact shadow
 *   speed    a motion-blurred copy of the photo, used for trails
 *   body     the photo itself, optionally cut into four slanted slices
 *   wheels   two discs lifted from the same photo, each with a sharp and a
 *            spin-blurred version, so the wheels can actually turn
 *
 * Every car photo is levelled onto the same canvas with the axles in the
 * same place, so one set of positions works for all eleven teams.
 *
 * Driven from CSS on any ancestor:
 *   --x           0..1  how far the layers are pulled apart
 *   --wheel-blur  0..1  cross-fade from sharp wheels to spinning ones
 *   --spin        time for one wheel revolution
 * and data-roll on the element starts the wheels turning.
 */
function PhotoCar({
  id,
  alt,
  sliced = false,
  speed = false,
  wheels = true,
  eager = false,
  sizes = '(max-width: 900px) 100vw, 1500px',
  className = '',
  style,
  ...rest
}) {
  const meta = META.cars[id];
  const primary = id.endsWith('-a');
  const withWheels = wheels && primary;
  const [state, setState] = useState('loading');
  const imgRef = useRef(null);

  useEffect(() => {
    setState('loading');
    const img = imgRef.current;
    if (img && img.complete) setState(img.naturalWidth ? 'ready' : 'failed');
  }, [id]);

  const src = carSrc(id);
  const srcSet = primary ? `${src} 1500w, ${carSrc(id, '-lg')} 3000w` : undefined;
  const common = {
    src,
    srcSet,
    sizes: primary ? sizes : undefined,
    alt: '',
    draggable: false,
    decoding: 'async',
    loading: eager ? 'eager' : 'lazy',
  };

  const vars = {
    '--fx': pct(C.frontX),
    '--rx': pct(C.rearX),
    '--ay': pct(C.axleY),
    '--wf': pct(meta?.wheelBox?.[0] ?? meta?.rf * 2 ?? 0.125),
    '--wr': pct(meta?.wheelBox?.[1] ?? meta?.rr * 2 ?? 0.128),
    '--hf': pct((meta?.rf ?? 0.062) * 0.9),
    '--hr': pct((meta?.rr ?? 0.064) * 0.9),
    ...style,
  };

  return (
    <div
      className={`pcar ${className}`}
      data-state={state}
      data-sliced={sliced ? '' : undefined}
      role="img"
      aria-label={alt}
      style={vars}
      {...rest}
    >
      <div className="pcar__shadow" />
      {speed && primary && <img className="pcar__speed" src={carSrc(id, '-speed')} alt="" draggable={false} decoding="async" loading={eager ? 'eager' : 'lazy'} />}
      <div className="pcar__body">
        {sliced ? (
          SLICES.map((name, i) => (
            <img
              key={name}
              className={`pcar__slice pcar__slice--${name}`}
              {...common}
              ref={i === 0 ? imgRef : undefined}
              onLoad={i === 0 ? () => setState('ready') : undefined}
              onError={i === 0 ? () => setState('failed') : undefined}
            />
          ))
        ) : (
          <img className="pcar__img" {...common} ref={imgRef} onLoad={() => setState('ready')} onError={() => setState('failed')} />
        )}
      </div>
      {withWheels &&
        ['f', 'r'].map((w) => (
          <div key={w} className={`pcar__wheel pcar__wheel--${w}`}>
            <img className="pcar__tyre" src={`${BASE}wheels/${id}-${w}.webp`} alt="" draggable={false} decoding="async" loading={eager ? 'eager' : 'lazy'} />
            <img className="pcar__tyre pcar__tyre--spin" src={`${BASE}wheels/${id}-${w}-spin.webp`} alt="" draggable={false} decoding="async" loading={eager ? 'eager' : 'lazy'} />
          </div>
        ))}
      {state === 'failed' && (
        <div className="pcar__missing">
          <svg viewBox="0 0 600 154" aria-hidden="true">
            <path d="M14 122c40-6 86-22 132-34l58-10c22-22 60-34 104-34l30-14h22l4 20c62 6 120 22 150 40l28 4 30-30h14l-6 62-22 6H40z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="175" cy="111" r="37" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="515" cy="111" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>
          <span>Photo unavailable</span>
        </div>
      )}
    </div>
  );
}

export default memo(PhotoCar);
