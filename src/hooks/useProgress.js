import { useEffect, useRef } from 'react';
import { track } from '../lib/scroll';

const NATIVE = typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('animation-timeline: view()');

/**
 * Ref for a scroll-linked element (one with a data-timeline attribute).
 *
 * Where the browser has CSS scroll-driven animations, CSS does the work and
 * this hook stays idle unless you pass `onChange`. Elsewhere it measures the
 * element's progress (0..1) and writes it to the `--p` custom property, which
 * the `.scrub` and `.p-drive` rules in motion.css read as a fallback.
 */
export default function useProgress(mode = 'cover', onChange) {
  const ref = useRef(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const wantsJs = !!onChange;

  useEffect(() => {
    if (!ref.current) return undefined;
    if (NATIVE && !wantsJs) return undefined;
    return track(ref.current, mode, (p) => cb.current && cb.current(p));
  }, [mode, wantsJs]);

  return ref;
}
