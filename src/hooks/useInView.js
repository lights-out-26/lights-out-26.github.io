import { useEffect, useRef, useState } from 'react';

/**
 * Marks an element with data-inview="true" once it scrolls into view.
 * CSS does the rest. With `once: false` the flag follows the element in and
 * out of view, which is used to pause off-screen animations.
 */
export default function useInView({ once = true, margin = '0px 0px -12% 0px', threshold = 0.08 } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { rootMargin: margin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, margin, threshold]);

  return [ref, inView];
}
