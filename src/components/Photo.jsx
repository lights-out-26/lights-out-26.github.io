import { memo, useEffect, useRef, useState } from 'react';
import { creditFor } from '../data/credits';
import { t } from '../lib/lang';
import './Photo.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;

/** A short line naming the photographer and licence, linked to the source. */
export function Credit({ id, className = '' }) {
  const c = creditFor(id);
  if (!c) return null;
  return (
    <span className={`credit ${className}`}>
      {t(c.kind === 'video' ? 'Video' : 'Photo')}:{' '}
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
 * One line for several photos (a burst sequence, say): each photographer once,
 * with a numbered link to every original, then the licence.
 */
export function Credits({ ids, className = '' }) {
  const groups = [];
  ids.forEach((id, i) => {
    const c = creditFor(id);
    if (!c) return;
    let g = groups.find((x) => x.author === c.author && x.licence.name === c.licence.name);
    if (!g) groups.push((g = { author: c.author, licence: c.licence, items: [] }));
    g.items.push({ n: i + 1, url: c.url, label: c.note || c.subject });
  });
  if (!groups.length) return null;
  const kind = ids.every((id) => creditFor(id)?.kind === 'video') ? 'Video' : groups.length > 1 || ids.length > 1 ? 'Photos' : 'Photo';
  return (
    <span className={`credit ${className}`}>
      {t(kind)}:{' '}
      {groups.map((g, gi) => (
        <span key={g.author}>
          {gi > 0 && '; '}
          {g.author} (
          {g.items.map((it, k) => (
            <span key={it.n}>
              {k > 0 && ', '}
              <a className="link" href={it.url} target="_blank" rel="noreferrer" aria-label={t('{label}, original on Wikimedia Commons', { label: it.label })}>
                {it.n}
              </a>
            </span>
          ))}
          ),{' '}
          <a className="link" href={g.licence.url} target="_blank" rel="noreferrer">
            {g.licence.name}
          </a>
        </span>
      ))}
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
            <strong>{t('Photo unavailable')}</strong>
            <span>{alt}</span>
          </div>
        )}
        {children}
      </div>
    </figure>
  );
}

export default memo(Photo);
