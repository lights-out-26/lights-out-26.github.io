import { useEffect, useRef } from 'react';

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Parallax: writes the pointer position, eased, to --mx / --my (-1..1) on the
 * element. Layers inside multiply those by their own depth in CSS.
 */
export function usePointerParallax({ ease = 0.08 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine() || reduced()) return undefined;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = false;

    const tick = () => {
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(tick);
      else active = false;
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!active) { active = true; raf = requestAnimationFrame(tick); }
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!active) { active = true; raf = requestAnimationFrame(tick); }
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ease]);

  return ref;
}

/**
 * 3D tilt: writes --rx / --ry (degrees), --tx / --ty (-1..1, for parallax
 * inside the element) and --gx / --gy (glare position, %) so the element can
 * lean toward the pointer.
 */
export function useTilt({ max = 9 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine() || reduced()) return undefined;
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--tx', ((px - 0.5) * 2).toFixed(3));
        el.style.setProperty('--ty', ((py - 0.5) * 2).toFixed(3));
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        el.dataset.tilting = 'true';
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
      delete el.dataset.tilting;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);

  return ref;
}
