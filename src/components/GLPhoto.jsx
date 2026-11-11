import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import { glAvailable, createView } from '../gl/engine';
import { scrollState } from '../lib/smooth';
import './Photo.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;

/** What a scene can animate on a photo (tween `ref.current.s` with GSAP). */
export const PHOTO_STATE = {
  zoom: 1.08, // >= 1
  focus: 0.62, // the depth that stays still while the camera moves (1 = nearest)
  dolly: 0.1, // near things grow faster than far ones as the camera pushes in
  camX: 0, // camera offset
  camY: 0,
  pan: 0, // panning blur on everything behind the focus
  panDirX: 1,
  panDirY: 0,
  grain: 0.035,
  vignette: 0.32,
  reveal: 1, // 0..1: builds from near to far
  exposure: 1,
  tilt: 0.024, // parallax from the pointer and from moving through the viewport
  velPan: 0.03, // how much fast scrolling adds panning blur
};

function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A photograph with depth: the camera drifts around it with the pointer and
 * the scroll position, and the background can be panned into a blur while
 * the car stays sharp. With `revealOnView` the picture builds itself from
 * the nearest objects outwards the first time it is seen.
 *
 * Without WebGL (or with reduced motion) it is an ordinary framed photo.
 */
const GLPhoto = forwardRef(function GLPhoto(
  { id, depth, alt, ratio = '16 / 10', eager = false, tint = '#ffffff', initial, revealOnView = false, className = '', children, ...rest },
  ref
) {
  const canvas = useRef(null);
  const fig = useRef(null);
  const state = useRef(null);
  if (!state.current) state.current = { ...PHOTO_STATE, ...(revealOnView ? { reveal: 0 } : null), ...initial };
  const s = state.current;
  const live = useRef({});
  live.current = { tint: rgb(tint) };
  const [img, setImg] = useState('loading');
  const [drawn, setDrawn] = useState(false);
  const enabled = glAvailable();
  // While a reveal is still to come, keep the plain photo hidden so it does
  // not show and then vanish when the canvas takes over. It comes back if
  // WebGL fails or is slow.
  const [pending, setPending] = useState(revealOnView && enabled);

  useImperativeHandle(ref, () => ({ s, el: fig.current }), [s]);

  useEffect(() => {
    if (!enabled || !canvas.current) return undefined;
    const v = createView({
      canvas: canvas.current,
      program: 'photo',
      textures: { uColor: `${BASE}${id}.webp`, uDepth: `${BASE}${depth}.webp` },
      key: id,
      onFrame(u, dt, vw) {
        const vel = Math.min(1, Math.abs(scrollState.smooth) / 55);
        u.uZoom = s.zoom;
        u.uFocus = s.focus;
        u.uDolly = s.dolly;
        u.uCam = [s.camX + vw.local[0] * s.tilt, s.camY + (vw.local[1] * 0.4 + vw.scrollPos * 0.6) * s.tilt * 0.6];
        u.uPan = s.pan + vel * s.velPan;
        u.uPanDir = [s.panDirX, s.panDirY];
        u.uGrain = s.grain;
        u.uVignette = s.vignette;
        u.uReveal = s.reveal;
        u.uExposure = s.exposure;
        u.uTint = live.current.tint;
      },
      onFirstFrame: () => setDrawn(true),
      onLost: () => {
        setDrawn(false);
        setPending(false);
      },
      onFail: () => {
        setDrawn(false);
        setPending(false);
      },
    });
    return () => {
      if (v) v.dispose();
      setDrawn(false);
    };
  }, [enabled, id, depth, s]);

  // Build the picture from near to far once it is both drawn and on screen.
  useEffect(() => {
    if (!revealOnView || !drawn || !fig.current) return undefined;
    let tween;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        tween = gsap.to(s, { reveal: 1, duration: 2.4, ease: 'power2.inOut', onComplete: () => setPending(false) });
      },
      { rootMargin: '0px -12% 0px -12%', threshold: 0.25 }
    );
    io.observe(fig.current);
    return () => {
      io.disconnect();
      if (tween) tween.kill();
    };
  }, [revealOnView, drawn, s]);

  // If the canvas has not drawn a few seconds after the photo came into view, show the plain one.
  useEffect(() => {
    if (!pending || drawn || !fig.current) return undefined;
    let timer;
    const io = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry.isIntersecting) timer = window.setTimeout(() => setPending(false), 3500);
    });
    io.observe(fig.current);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [pending, drawn]);

  useEffect(() => {
    setImg('loading');
  }, [id]);

  return (
    <figure ref={fig} className={`photo glphoto ${className}`} data-state={img} data-gl={drawn ? 'on' : 'off'} data-reveal={pending ? 'pending' : undefined} style={{ '--ratio': ratio }} {...rest}>
      <div className="photo__frame">
        {img !== 'failed' && (
          <img
            src={`${BASE}${id}.webp`}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onLoad={() => setImg('ready')}
            onError={() => setImg('failed')}
          />
        )}
        {enabled && img !== 'failed' && <canvas ref={canvas} className="glphoto__canvas" aria-hidden="true" />}
        {img === 'failed' && (
          <div className="photo__missing">
            <strong>Photo unavailable</strong>
            <span>{alt}</span>
          </div>
        )}
        {children}
      </div>
    </figure>
  );
});

export default memo(GLPhoto);
