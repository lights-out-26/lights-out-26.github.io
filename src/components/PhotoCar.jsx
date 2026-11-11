import { memo, useEffect, useRef, useState } from 'react';
import './PhotoCar.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;

/** Side-on car photos: 1500 px wide by default, `-lg` for the 3000 px version. */
export const carSrc = (id, variant = '') => `${BASE}cars/${id}${variant}.webp`;

/**
 * A still side-on photograph of a car, cut out from its background and
 * levelled so the axles sit in the same place in every image. Used where a
 * car is scenery (driver cards and rows, the next-team link); the animated
 * cars are GLCar.
 */
function PhotoCar({ id, alt, eager = false, sizes = '(max-width: 900px) 100vw, 1500px', className = '', style, ...rest }) {
  const [state, setState] = useState('loading');
  const imgRef = useRef(null);
  const primary = id.endsWith('-a');

  useEffect(() => {
    setState('loading');
    const img = imgRef.current;
    if (img && img.complete) setState(img.naturalWidth ? 'ready' : 'failed');
  }, [id]);

  return (
    <div className={`pcar ${className}`} data-state={state} role={alt ? 'img' : undefined} aria-label={alt || undefined} style={style} {...rest}>
      <img
        ref={imgRef}
        className="pcar__img"
        src={carSrc(id)}
        srcSet={primary ? `${carSrc(id)} 1500w, ${carSrc(id, '-lg')} 3000w` : undefined}
        sizes={primary ? sizes : undefined}
        alt=""
        draggable={false}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setState('ready')}
        onError={() => setState('failed')}
      />
      {state === 'failed' && <CarMissing />}
    </div>
  );
}

/** Dashed outline shown in place of a car photo that failed to load. */
export function CarMissing() {
  return (
    <div className="pcar__missing">
      <svg viewBox="0 0 600 154" aria-hidden="true">
        <path d="M14 122c40-6 86-22 132-34l58-10c22-22 60-34 104-34l30-14h22l4 20c62 6 120 22 150 40l28 4 30-30h14l-6 62-22 6H40z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="175" cy="111" r="37" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="515" cy="111" r="38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
      </svg>
      <span>Photo unavailable</span>
    </div>
  );
}

export default memo(PhotoCar);
