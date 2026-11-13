import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { glAvailable, createView } from '../gl/engine';
import { scrollState } from '../lib/smooth';
import './Photo.css';

const BASE = `${import.meta.env.BASE_URL}photos/`;

/** Direction of travel in a frame -> [x, y across the picture, towards the camera]. */
const MOTION = { right: [1, 0, 0], left: [-1, 0, 0], toward: [0, 0, 1], away: [0, 0, -1] };

/** What a scene can animate on a sequence (tween `ref.current.s` with GSAP, or set it on scroll). */
export const SEQUENCE_STATE = {
  pos: 0, // 0 .. frames - 1: which frame is showing; in between, a crossfade
  blur: 0.022, // motion blur at the middle of a crossfade, in frame widths
  push: 0.05, // how far the camera pushes in on the car across one step
  hold: 0.3, // share of each step spent holding still on a frame (each end)
  lag: 6, // how quickly the shown frame catches up with `pos` (higher = snappier)
  grain: 0.03,
  vignette: 0.34,
  exposure: 1,
  drift: 0.006, // parallax from the pointer
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const centre = (box) => [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];

/**
 * A burst of photographs of one car, played as one shot: each frame holds,
 * then gives way to the next with a crossfade and a motion blur along the
 * way the car is moving in it.
 *
 * Mount-time loading is up to the caller: the textures are only requested
 * once `active` is true. Without WebGL (or with reduced motion) this shows
 * the first frame; the caller is expected to show stills instead.
 *
 * frames: [{ src: 'seq/ferrari-1', car: [x0, y0, x1, y1] }]  (car box in 0..1)
 * motion: ['right', 'toward', 'left'], one per frame
 */
const GLSequence = forwardRef(function GLSequence(
  { frames, motion, size = [1600, 900], alt, ratio = '16 / 9', active = true, initial, onFail, className = '', children, ...rest },
  ref
) {
  const canvas = useRef(null);
  const fig = useRef(null);
  const state = useRef(null);
  if (!state.current) state.current = { ...SEQUENCE_STATE, ...initial };
  const s = state.current;
  const fail = useRef(onFail);
  fail.current = onFail;
  const [img, setImg] = useState('loading');
  const [drawn, setDrawn] = useState(false);
  const enabled = glAvailable();

  useImperativeHandle(ref, () => ({ s, el: fig.current }), [s]);

  useEffect(() => {
    if (!enabled || !active || !canvas.current) return undefined;
    const n = Math.min(frames.length, 4);
    const textures = Object.fromEntries(frames.slice(0, n).map((f, i) => [`uF${i}`, `${BASE}${f.src}.webp`]));
    const motions = frames.map((_, i) => MOTION[motion[i]] || [0, 0, 0]);
    const cars = frames.map((f) => centre(f.car));
    let shown = s.pos;
    const v = createView({
      canvas: canvas.current,
      program: 'seq',
      textures,
      key: frames[0].src,
      onFrame(u, dt, vw) {
        shown += (s.pos - shown) * Math.min(1, dt * s.lag);
        const p = Math.min(n - 1, Math.max(0, shown));
        const i = Math.min(n - 2, Math.floor(p));
        const m = smooth(s.hold, 1 - s.hold, p - i);
        // Faster scrolling (or a frame that is still catching up) smears a little more.
        const rush = Math.min(1, Math.abs(scrollState.smooth) / 60 + Math.abs(s.pos - shown) * 1.5);
        const blur = s.blur * (Math.sin(Math.PI * m) + rush * 0.35);
        u.uA = i;
        u.uB = i + 1;
        u.uMix = m;
        u.uBlurA = blur * (0.35 + m);
        u.uBlurB = blur * (1.35 - m);
        u.uMotA = motions[i];
        u.uMotB = motions[i + 1];
        u.uCarA = cars[i];
        u.uCarB = cars[i + 1];
        // The camera keeps pushing in on the frame that is leaving and settles on the one arriving.
        u.uZoomA = 1 + s.push * m;
        u.uZoomB = 1 + s.push * (1 - m);
        u.uDrift = [vw.local[0] * s.drift, (vw.local[1] * 0.4 + vw.scrollPos * 0.6) * s.drift * 0.6];
        u.uImgAspect = size[0] / size[1];
        u.uFrameTexel = [1 / size[0], 1 / size[1]];
        u.uGrain = s.grain;
        u.uVignette = s.vignette;
        u.uExposure = s.exposure;
      },
      onFirstFrame: () => setDrawn(true),
      onLost: () => setDrawn(false),
      onFail: () => {
        setDrawn(false);
        if (fail.current) fail.current();
      },
    });
    if (!v && fail.current) fail.current();
    return () => {
      if (v) v.dispose();
      setDrawn(false);
    };
  }, [enabled, active, frames, motion, size, s]);

  return (
    <figure ref={fig} className={`photo glphoto glseq ${className}`} data-state={img} data-gl={drawn ? 'on' : 'off'} style={{ '--ratio': ratio }} {...rest}>
      <div className="photo__frame">
        {img !== 'failed' && (
          <img
            src={`${BASE}${frames[0].src}.webp`}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setImg('ready')}
            onError={() => setImg('failed')}
          />
        )}
        {enabled && <canvas ref={canvas} className="glphoto__canvas" aria-hidden="true" />}
        {img === 'failed' && !drawn && (
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

export default memo(GLSequence);
