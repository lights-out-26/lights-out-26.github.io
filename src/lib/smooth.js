import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling and the one clock everything shares.
 *
 * Lenis eases wheel and trackpad scrolling (touch keeps the native feel),
 * GSAP's ticker drives Lenis, ScrollTrigger and the WebGL renderer from a
 * single requestAnimationFrame, and scrollState.smooth carries the current
 * scroll speed so the car shaders can blur harder the faster you scroll.
 */
export let lenis = null;
export const scrollState = { velocity: 0, smooth: 0 };

let started = false;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSmoothScroll() {
  if (started || typeof window === 'undefined') return;
  started = true;

  if (!reduced()) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, syncTouch: false, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000), false, true);
    gsap.ticker.lagSmoothing(0);
  }

  // Scroll speed in pixels per 60 Hz frame, whatever the real frame rate.
  // Jumps (a route change, a hash link) are not speed, so they are ignored.
  const motion = !reduced();
  let last = window.scrollY;
  gsap.ticker.add((time, deltaMs) => {
    const y = window.scrollY;
    const dy = y - last;
    last = y;
    const frames = Math.max(0.25, Math.min(6, deltaMs / 16.667));
    const v = Math.abs(dy) > window.innerHeight * 1.5 ? 0 : Math.max(-120, Math.min(120, dy / frames));
    scrollState.velocity = v;
    scrollState.smooth += (v - scrollState.smooth) * (1 - Math.pow(0.86, frames));
    if (Math.abs(scrollState.smooth) < 0.01) scrollState.smooth = 0;
    if (motion) skew();
  });
}

/** Big headings marked data-skew lean into fast scrolling and settle when it stops. */
let skewed = false;
function skew() {
  const v = Math.max(-1, Math.min(1, scrollState.smooth / 45));
  if (Math.abs(v) < 0.004 && !skewed) return;
  const els = document.querySelectorAll('[data-skew]');
  const deg = Math.abs(v) < 0.004 ? 0 : -v * 3.2;
  els.forEach((el) => {
    el.style.transform = deg ? `skewY(${deg.toFixed(3)}deg)` : '';
  });
  skewed = deg !== 0;
}

export function scrollToY(y, { smooth = true } = {}) {
  const instant = !smooth || reduced();
  if (lenis) lenis.scrollTo(y, { immediate: instant, force: true, duration: instant ? 0 : 1.3 });
  else window.scrollTo({ top: y, behavior: instant ? 'auto' : 'smooth' });
}

export function scrollToEl(el, smooth = true) {
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY, { smooth });
}

/** Freezes the page behind a full-screen menu. */
export function lockScroll(locked) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

export function refreshTriggers() {
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
