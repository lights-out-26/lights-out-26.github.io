import { useEffect, useRef, useState } from 'react';

/**
 * Marks an element with data-inview="true" once it scrolls into view.
 * CSS does the rest. With `once: false` the flag follows the element in and
 * out of view, which is used to pause off-screen animations.
 *
 * With `track: true` a third value follows the element in and out of view even
 * when the first stays set, for things that should happen on every visit (a
 * sound) while the reveal still plays once.
 */
export default function useInView({ once = true, track = false, margin = '0px 0px -12% 0px', threshold = 0.08 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            setInView(true);
            if (once && !track) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { rootMargin: margin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, track, margin, threshold]);

  return [ref, inView, visible];
}
