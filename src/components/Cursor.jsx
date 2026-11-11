import { useEffect, useRef, useState } from 'react';
import './Cursor.css';

const INTERACTIVE = '[data-cursor], a, button, [role="button"], summary, label, input, select';

/**
 * A custom pointer for mouse users: a dot that tracks the mouse exactly and a
 * ring that trails it. Elements choose how it reacts with data-cursor:
 *   (links and buttons)   the ring grows and the dot disappears
 *   data-cursor="view"    a filled disc in the team's colour with a label
 *   data-cursor="drag"    a wide pill with arrows
 * data-cursor-label sets the word shown inside.
 */
export default function Cursor() {
  const root = useRef(null);
  const dot = useRef(null);
  const ring = useRef(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return undefined;

    const el = root.current;
    document.documentElement.classList.add('has-cursor');
    let x = -100, y = -100, rx = -100, ry = -100;
    let raf = 0, running = false, shown = false, current = null;

    const tick = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.current.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(tick);
      else running = false;
    };

    const setTarget = (target) => {
      if (target === current) return;
      current = target;
      const state = target ? target.dataset.cursor || 'link' : '';
      el.dataset.state = state;
      setLabel(target ? target.dataset.cursorLabel || '' : '');
      const team = target ? getComputedStyle(target).getPropertyValue('--team').trim() : '';
      const ink = target ? getComputedStyle(target).getPropertyValue('--team-ink').trim() : '';
      el.style.setProperty('--c', team || '#f5f6f7');
      el.style.setProperty('--c-ink', ink || '#000');
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        el.dataset.shown = 'true';
      }
      dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
      setTarget(e.target instanceof Element ? e.target.closest(INTERACTIVE) : null);
    };
    const onDown = () => (el.dataset.down = 'true');
    const onUp = () => delete el.dataset.down;
    const onLeave = () => {
      shown = false;
      delete el.dataset.shown;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span className="cursor__disc">
          <span className="cursor__label">{label}</span>
        </span>
      </div>
      <div className="cursor__dot" ref={dot}>
        <span />
      </div>
    </div>
  );
}
