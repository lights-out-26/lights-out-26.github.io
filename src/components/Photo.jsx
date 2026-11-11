import { memo, useEffect, useRef, useState } from 'react';
import { creditFor } from '../data/credits';
import './Photo.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;

/** A short line naming the photographer and licence, linked to the source. */
export function Credit({ id, className = '' }) {
  const c = creditFor(id);
  if (!c) return null;
  return (
    <span className={`credit ${className}`}>
      Photo:{' '}
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
 * A framed photograph with a loading shimmer and a clear fallback when the
 * file is missing. `id` is the path under public/photos without extension.
 */
function Photo({ id, alt, ratio = '16 / 10', eager = false, position = '50% 50%', className = '', children, ...rest }) {
  const [state, setState] = useState('loading');
  const ref = useRef(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) setState(img.naturalWidth ? 'ready' : 'failed');
  }, [id]);

  return (
    <figure className={`photo ${className}`} data-state={state} style={{ '--ratio': ratio }} {...rest}>
      <div className="photo__frame">
        {state !== 'failed' && (
          <img
            ref={ref}
            src={`${BASE}${id}.webp`}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{ objectPosition: position }}
            onLoad={() => setState('ready')}
            onError={() => setState('failed')}
          />
        )}
        {state === 'failed' && (
          <div className="photo__missing">
            <strong>Photo unavailable</strong>
            <span>{alt}</span>
          </div>
        )}
        {children}
      </div>
    </figure>
  );
}

export default memo(Photo);
