/**
 * One scroll listener for the whole app.
 *
 * track(el, mode, onChange) reports how far `el` has travelled through the
 * viewport as a number from 0 to 1, and mirrors it into the `--p` custom
 * property so CSS can use it. `mode` matches the CSS view-timeline ranges:
 *
 *   cover    0 when the element's top meets the viewport bottom, 1 when its bottom leaves the top
 *   contain  for tall (pinned) elements: 0 when its top meets the viewport top, 1 when its bottom meets the bottom
 *   entry    the part of `cover` while the element is still arriving
 *   exit     the part of `cover` while the element is leaving
 */

const items = new Set();
let scheduled = false;
let vh = typeof window !== 'undefined' ? window.innerHeight : 0;

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function progress(mode, rect) {
  const h = rect.height || 1;
  switch (mode) {
    case 'contain':
      return h > vh ? clamp(-rect.top / (h - vh)) : clamp((vh - rect.bottom) / Math.max(1, vh - h));
    case 'entry':
      return clamp((vh - rect.top) / Math.min(h, vh));
    case 'exit':
      return clamp((Math.min(h, vh) - rect.bottom) / Math.min(h, vh));
    default:
      return clamp((vh - rect.top) / (vh + h));
  }
}

function measure() {
  scheduled = false;
  items.forEach((it) => {
    const p = progress(it.mode, it.el.getBoundingClientRect());
    if (Math.abs(p - it.p) < 0.0004 && it.p !== -1) return;
    it.p = p;
    it.el.style.setProperty('--p', p.toFixed(4));
    if (it.onChange) it.onChange(p);
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(measure);
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    vh = window.innerHeight;
    schedule();
  });
}

export function track(el, mode = 'cover', onChange) {
  const item = { el, mode, onChange, p: -1 };
  items.add(item);
  schedule();
  return () => items.delete(item);
}

export function refresh() {
  vh = window.innerHeight;
  schedule();
}

/** Scroll to an element, leaving room for the fixed header. */
export function scrollToEl(el, smooth = true) {
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: smooth && !reduce ? 'smooth' : 'auto' });
}
