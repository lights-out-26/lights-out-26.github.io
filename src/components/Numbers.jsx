import { memo } from 'react';
import './Numbers.css';

/**
 * Count: a number that counts up using nothing but CSS. The integer lives in
 * a registered custom property, a transition animates it, and a CSS counter
 * prints it. It runs when an ancestor (or itself) gets data-inview="true".
 */
export const Count = memo(function Count({ to, prefix = '', suffix = '', duration, delay, className = '' }) {
  const whole = Math.round(to);
  return (
    <span className={`num ${className}`}>
      <span className="sr-only">{`${prefix}${to.toLocaleString('en-GB')}${suffix}`}</span>
      <span aria-hidden="true">
        {prefix}
        <span className="count" style={{ '--to': whole, '--dur': duration ? `${duration}ms` : undefined, '--delay': delay ? `${delay}ms` : undefined }} />
        {to !== whole ? `.${String(to).split('.')[1]}` : ''}
        {suffix}
      </span>
    </span>
  );
});

/**
 * Odometer: each digit is a strip of 0-9 that rolls into place, the leading
 * digits arriving last, like a mechanical counter.
 */
export const Odometer = memo(function Odometer({ value, className = '', delay = 0 }) {
  const text = typeof value === 'number' ? value.toLocaleString('en-GB') : String(value);
  const chars = [...text];
  let d = 0;
  const digits = chars.filter((c) => /\d/.test(c)).length;
  return (
    <span className={`odo ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="odo__row" aria-hidden="true">
        {chars.map((c, i) =>
          /\d/.test(c) ? (
            <span key={i} className="odo__col" style={{ '--d': Number(c), '--i': digits - 1 - d++, '--delay': `${delay}ms` }}>
              <span className="odo__strip">
                {'0123456789'.split('').map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={i} className="odo__sep">
              {c}
            </span>
          )
        )}
      </span>
    </span>
  );
});
