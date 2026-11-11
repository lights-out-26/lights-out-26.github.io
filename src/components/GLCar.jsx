import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import META from '../data/carsMeta.json';
import { glAvailable, createView } from '../gl/engine';
import { scrollState } from '../lib/smooth';
import { carSrc, CarMissing } from './PhotoCar';
import './GLCar.css';

const C = META.canvas;
const ASPECT = C.w / C.h;
const TAU = Math.PI * 2;
const BASE = `${import.meta.env.BASE_URL}photos/`;

/**
 * Everything a scene can animate. GSAP tweens these values on the object a
 * GLCar ref exposes (`ref.current.s`); the renderer turns them into shader
 * uniforms every frame.
 */
export const CAR_STATE = {
  speed: 0, // 0..1: motion blur and the light trail behind the car
  spin: 0, // wheel blur arc in radians (about 2.5 reads as flat out)
  wheelRate: 0, // wheel rotation in radians per second
  heat: 0, // heat haze above the engine cover
  brake: 0, // brake discs glowing through the rims
  sheen: 0.75, // relighting that follows the pointer
  sweep: -1, // position of a travelling highlight in car widths (-1 = off)
  aberr: 0, // colour split along the trail
  hold: 0, // 0..1: keep the car sharp over its trail, as a tracking camera would
  shadow: 1, // contact shadow
  alpha: 1,
  scan: -1, // blueprint scan position 0..1 (-1 = off)
  blue: 1, // blueprint strength ahead of the scan
  tilt: 0.006, // depth parallax from the pointer and the scroll position
  velGain: 0.4, // how much fast scrolling adds blur
};

const DEFAULT_PAD = { t: 0.1, r: 0.12, b: 0.16, l: 0.04 };

/** The texture URLs a car scene uses, for preloading. */
export const carTextures = (key, hd = false) => ({ uColor: carSrc(key, hd ? '-lg' : ''), uDepth: `${BASE}depth/${key}.webp` });

function rgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A real car photograph rendered in WebGL with its depth map.
 *
 * The element itself is the car's box, so it lays out exactly like a still
 * image; the canvas reaches past it by `pad` (fractions of the box) to leave
 * room for trails and shadows. Until the first frame is drawn, and wherever
 * WebGL or motion is unavailable, the plain photo shows instead.
 */
const GLCar = forwardRef(function GLCar(
  { id, alt = '', tint = '#c8cdd4', hd = false, pad = DEFAULT_PAD, initial, active = true, eager = false, sizes = '(max-width: 900px) 100vw, 1500px', onFrame, className = '', style, children, ...rest },
  ref
) {
  const box = useRef(null);
  const canvas = useRef(null);
  const view = useRef(null);
  const state = useRef(null);
  if (!state.current) state.current = { ...CAR_STATE, ...initial };
  const s = state.current;
  const angle = useRef(0);
  const live = useRef({});
  live.current = { tint: rgb(tint), pad, onFrame };
  const [drawn, setDrawn] = useState(false);
  const [poster, setPoster] = useState('loading');
  const enabled = active && glAvailable();
  const textures = (key) => carTextures(key, hd);

  useImperativeHandle(ref, () => ({ s, el: box.current }), [s]);

  useEffect(() => {
    if (!enabled || !canvas.current) return undefined;
    const v = createView({
      canvas: canvas.current,
      program: 'car',
      textures: textures(id),
      key: id,
      onFrame(u, dt, vw) {
        const m = META.cars[vw.key] || META.cars[id];
        const { pad: p, tint: t, onFrame: extra } = live.current;
        const W = 1 + p.l + p.r;
        const H = 1 + p.t + p.b;
        const vel = Math.min(1, Math.abs(scrollState.smooth) / 55) * s.velGain;
        angle.current = (angle.current + s.wheelRate * dt) % TAU;
        u.uRect = [p.l / W, p.t / H, 1 / W, 1 / H];
        u.uAspect = ASPECT;
        u.uWheelF = [C.frontX, C.axleY, m.rf];
        u.uWheelR = [C.rearX, C.axleY, m.rr];
        u.uBox = m.bbox;
        u.uAngle = angle.current;
        u.uSpeed = Math.min(1.25, s.speed + vel * 0.5);
        u.uSpin = Math.min(3, s.spin + vel * 1.4);
        u.uTilt = [vw.local[0] * s.tilt, (vw.local[1] * 0.5 + vw.scrollPos * 0.5) * s.tilt * 0.6];
        u.uLight = [vw.local[0], -vw.local[1]];
        u.uSheen = s.sheen;
        u.uSweep = s.sweep;
        u.uHeat = s.heat;
        u.uBrake = s.brake;
        u.uAberr = s.aberr + vel * 0.6;
        u.uHold = s.hold;
        u.uShadow = s.shadow;
        u.uAlpha = s.alpha;
        u.uScan = s.scan;
        u.uBlue = s.blue;
        u.uTint = t;
        if (extra) extra(s, u, dt, vw);
      },
      onFirstFrame: () => setDrawn(true),
      onLost: () => setDrawn(false),
      onFail: () => setDrawn(false),
    });
    view.current = v;
    return () => {
      if (v) v.dispose();
      view.current = null;
      setDrawn(false);
    };
    // The view lives as long as the scene is enabled; textures follow `id` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (view.current) view.current.setTextures(textures(id), id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hd]);

  useEffect(() => setPoster('loading'), [id]);

  const W = 1 + pad.l + pad.r;
  const H = 1 + pad.t + pad.b;
  return (
    <div
      ref={box}
      className={`glcar ${className}`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      data-gl={drawn ? 'on' : 'off'}
      data-poster={poster}
      style={style}
      {...rest}
    >
      <span className="glcar__shadow" aria-hidden="true" />
      <img
        className="glcar__poster"
        src={carSrc(id)}
        srcSet={`${carSrc(id)} 1500w, ${carSrc(id, '-lg')} 3000w`}
        sizes={sizes}
        alt=""
        draggable={false}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setPoster('ready')}
        onError={() => setPoster('failed')}
      />
      {enabled && (
        <canvas
          ref={canvas}
          className="glcar__canvas"
          aria-hidden="true"
          style={{ left: `${-pad.l * 100}%`, top: `${-pad.t * 100}%`, width: `${W * 100}%`, height: `${H * 100}%` }}
        />
      )}
      {poster === 'failed' && !drawn && <CarMissing />}
      {children}
    </div>
  );
});

export default memo(GLCar);
