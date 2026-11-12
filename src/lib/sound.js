import { useEffect, useState } from 'react';
import engineWorklet from './engine-worklet.js?url';

/**
 * Sound: real Formula 1 cars from Wikimedia Commons (see scripts/sounds.json),
 * plus two sounds made here: the start-light beeps and the flat-out engine.
 *
 * Off until the viewer turns it on; the choice is remembered. Browsers only
 * let a page start audio after a click or key press, so the audio context is
 * created and resumed from those. Files are fetched only once sound is on.
 */

const BASE = `${import.meta.env.BASE_URL}sounds/`;
const KEY = 'lo26-sound';

let enabled = read();
let ctx = null;
let master = null;
const buffers = new Map();
const listeners = new Set();
const playing = new Set();

function read() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

function write(on) {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
}

function context() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.85;
  master.connect(ctx.destination);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });
  return ctx;
}

export const isSoundOn = () => enabled;

/** Turn sound on or off. Call it from a click or key handler. */
export function setSound(on) {
  enabled = on;
  write(on);
  if (on) {
    const c = context();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  } else {
    playing.forEach((h) => h.stop(0.2));
  }
  listeners.forEach((fn) => fn(on));
}

/** With sound left on from an earlier visit, wake the audio on the first click or key press. */
export function armSound() {
  if (typeof window === 'undefined') return;
  const wake = () => {
    if (enabled) {
      const c = context();
      if (c && c.state !== 'running') c.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', wake, { capture: true });
  window.addEventListener('keydown', wake, { capture: true });
}

export function useSound() {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    listeners.add(setOn);
    setOn(enabled);
    return () => listeners.delete(setOn);
  }, []);
  return on;
}

function load(name) {
  if (!buffers.has(name)) {
    const c = context();
    buffers.set(
      name,
      fetch(`${BASE}${name}.mp3`)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${name}`);
          return res.arrayBuffer();
        })
        .then((data) => new Promise((resolve, reject) => c.decodeAudioData(data, resolve, reject)))
        .catch((err) => {
          buffers.delete(name);
          throw err;
        })
    );
  }
  return buffers.get(name);
}

/** Start fetching sounds that are about to be needed. Does nothing while sound is off. */
export function preloadSounds(names) {
  if (!enabled || !context()) return;
  names.forEach((n) => load(n).catch(() => {}));
}

/**
 * The broadcast's own start-signal sound belongs to Formula 1 and is not
 * available under a free licence, so the beeps are made here. If you have the
 * rights to a recording of one beep, put it in public/sounds/ as an .mp3 and
 * set its name here (e.g. 'start-beep'): it is then played for each light.
 */
export const START_SIGNAL_FILE = null;

/**
 * The start-light signal: one short electronic beep for each red light as it
 * comes on, as on the race broadcast, and silence when they go out. The tones
 * are made here rather than fetched, so they land exactly on the lamps.
 * `times` are seconds from now. Returns a handle with stop(fade), or null
 * when sound is off.
 */
export function startBeeps(times, { freq = 880, length = 0.26, volume = 0.42 } = {}) {
  if (!enabled) return null;
  const c = context();
  if (!c) return null;
  const asked = performance.now();
  const bus = c.createGain();
  bus.connect(master);
  const oscs = [];
  const handle = {
    stopped: false,
    stop(fade = 0.05) {
      if (this.stopped) return;
      this.stopped = true;
      playing.delete(this);
      const t = c.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + fade);
      oscs.forEach((o) => {
        try {
          o.stop(t + fade + 0.02);
        } catch {
          /* already stopped */
        }
      });
    },
  };
  playing.add(handle);

  const schedule = (recording) => {
    if (handle.stopped || !enabled) return;
    // If the audio took a moment to wake up, keep the beeps on the lamps' clock.
    const late = (performance.now() - asked) / 1000;
    const now = c.currentTime;
    times.forEach((at) => {
      const t = now + at - late;
      if (t < now - 0.03) return;
      const t0 = Math.max(now, t);
      if (recording) {
        const src = c.createBufferSource();
        src.buffer = recording;
        src.connect(bus);
        src.start(t0);
        oscs.push(src);
        return;
      }
      const env = c.createGain();
      env.gain.setValueAtTime(0, t0);
      env.gain.linearRampToValueAtTime(volume, t0 + 0.006);
      env.gain.setValueAtTime(volume, t0 + length - 0.07);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
      env.connect(bus);
      // A plain sine with a quiet octave above it: a clean timing-system tone.
      [
        [freq, 1],
        [freq * 2, 0.12],
      ].forEach(([f, level]) => {
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const g = c.createGain();
        g.gain.value = level;
        o.connect(g).connect(env);
        o.start(t0);
        o.stop(t0 + length + 0.02);
        oscs.push(o);
      });
    });
    const last = Math.max(...times) - late + length + 0.1;
    window.setTimeout(() => playing.delete(handle), Math.max(0, last * 1000));
  };
  // Your own recording of the signal, if one is set; it gets until just before the first beep to arrive.
  const first = Math.min(...times);
  const recording = START_SIGNAL_FILE
    ? Promise.race([load(START_SIGNAL_FILE).catch(() => null), new Promise((r) => window.setTimeout(() => r(null), Math.max(0, first - 0.15) * 1000))])
    : Promise.resolve(null);
  recording.then((buffer) => {
    if (c.state === 'running') schedule(buffer);
    else c.resume().then(() => schedule(buffer), () => playing.delete(handle));
  });
  return handle;
}

let engineModule = null;

/**
 * A running engine for the flat-out scene, modelled in engine-worklet.js
 * rather than played from a recording, so it can follow the scroll: set its
 * revs and load (0 off the throttle, 1 flat out) as often as you like.
 * Returns a handle: set({ rpm, load }), stop(fade), or null when sound is off.
 */
export function engine({ volume = 0.5, manual = false } = {}) {
  if (!enabled) return null;
  const c = context();
  if (!c || !c.audioWorklet) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  const want = { rpm: 4500, load: 0.2 };
  let resolveReady;
  const handle = {
    stopped: false,
    node: null,
    gain: null,
    tone: null,
    pan: null,
    volume,
    ready: new Promise((resolve) => {
      resolveReady = resolve;
    }),
    set({ rpm, load } = {}) {
      if (rpm !== undefined) want.rpm = rpm;
      if (load !== undefined) want.load = load;
      if (!this.node) return;
      const t = c.currentTime;
      // Revs go straight in (the worklet smooths them), so an upshift arrives as a sudden drop.
      this.node.parameters.get('rpm').setTargetAtTime(want.rpm, t, 0.006);
      this.node.parameters.get('load').setTargetAtTime(want.load, t, 0.04);
      // Off the throttle the note goes duller; flat out it opens right up.
      this.tone.frequency.setTargetAtTime(1800 + want.load * 5200, t, 0.06);
    },
    stop(fade = 0.3) {
      if (this.stopped) return;
      this.stopped = true;
      playing.delete(this);
      if (!this.node) return;
      const t = c.currentTime;
      const { node, gain } = this;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fade);
      window.setTimeout(() => node.disconnect(), (fade + 0.1) * 1000);
    },
  };
  playing.add(handle);
  if (!engineModule) engineModule = c.audioWorklet.addModule(engineWorklet);
  engineModule
    .then(() => {
      if (handle.stopped || !enabled) return;
      const node = new AudioWorkletNode(c, 'f1-engine', { outputChannelCount: [1] });
      const tone = c.createBiquadFilter();
      tone.type = 'lowpass';
      tone.Q.value = 0.5;
      const pan = c.createStereoPanner();
      const gain = c.createGain();
      gain.gain.value = 0;
      node.connect(tone).connect(pan).connect(gain).connect(master);
      Object.assign(handle, { node, tone, pan, gain });
      if (!manual) {
        gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.4);
        handle.set(want);
      }
      resolveReady(handle);
    })
    .catch(() => {
      engineModule = null;
      playing.delete(handle);
    });
  return handle;
}

/**
 * The grid, after the start signal. Once the fifth beep has gone, the engine
 * is brought up to launch revs and held there, flaring, through the hold. As
 * the lights go out the clutch drops; then, in step with the first car on the
 * home screen (which arrives from the right, braking hard, and holds station),
 * the note sweeps in from the right, lifts and crackles through three
 * downshifts, settles and fades.
 *
 * `revAt` is when the revs come up, in seconds from now (scheduled on the
 * audio clock, like the beeps). The clutch drops when go() is called: call it
 * as the lights go out on screen, so sound and picture move together even if
 * the page is busy. Returns a handle: go(), stop(fade); or null when sound is off.
 */
export function startGrid({ revAt, volume = 0.34 }) {
  const e = engine({ volume, manual: true });
  if (!e) return null;
  const c = ctx;
  const asked = performance.now();
  let endTimer = 0;
  let gone = false;

  // Schedule one value on a param: a ramp to it, or a jump.
  const to = (param, t, v, jump = false) => (jump ? param.setValueAtTime(v, t) : param.linearRampToValueAtTime(v, t));
  const params = () => ({
    rpm: e.node.parameters.get('rpm'),
    load: e.node.parameters.get('load'),
    tone: e.tone.frequency,
    pan: e.pan.pan,
    gain: e.gain.gain,
  });
  const clear = (t) => {
    Object.values(params()).forEach((p) => {
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
    });
  };

  // From the clutch drop at L to the fade on the home screen.
  const launch = (L) => {
    const { rpm, load, tone, pan, gain } = params();
    const v = e.volume;
    // Clutch drop: the revs sag as it bites, then climb flat out.
    to(load, L, 1, true);
    to(tone, L, 7000, true);
    to(rpm, L + 0.05, 10100);
    to(rpm, L + 0.36, 11800);
    to(gain, L + 0.12, v * 1.25);
    // The car on screen sweeps in from the right...
    to(pan, L + 0.1, 0);
    to(pan, L + 0.32, 0.6);
    to(pan, L + 0.95, 0.12);
    to(pan, L + 1.8, 0);
    // ...braking: off the throttle, three downshifts, the exhaust popping.
    to(load, L + 0.36, 1);
    to(load, L + 0.42, 0);
    to(tone, L + 0.5, 3200);
    [0.42, 0.62, 0.84].forEach((d, i) => {
      to(rpm, L + d + 0.13, 10200 - i * 500);
      to(rpm, L + d + 0.16, 11400 - i * 400, true); // blip on the downshift
    });
    to(rpm, L + 1.2, 9600);
    to(gain, L + 0.55, v * 1.15);
    // Holding station: part throttle, then away into the background.
    to(load, L + 1.25, 0);
    to(load, L + 1.45, 0.35);
    to(rpm, L + 1.6, 9400);
    to(gain, L + 1.7, v * 0.95);
    to(gain, L + 3.6, 0);
    window.clearTimeout(endTimer);
    endTimer = window.setTimeout(() => e.stop(0.05), (L - c.currentTime + 3.7) * 1000);
  };

  e.ready.then(() => {
    if (e.stopped) return;
    const now = c.currentTime;
    const base = now - (performance.now() - asked) / 1000; // the audio time of the call
    const R = Math.max(now + 0.02, base + revAt);
    const { rpm, load, tone, gain } = params();
    const v = e.volume;
    to(rpm, now, 4300, true);
    to(load, now, 0.15, true);
    to(tone, now, 2400, true);
    to(gain, now, 0, true);
    // Revs up: in fast, then held around launch revs with the driver flaring them.
    to(rpm, R, 4300, true);
    to(gain, R, 0, true);
    to(gain, R + 0.12, v);
    const up = 0.5;
    to(load, R + up * 0.3, 0.8);
    to(tone, R + up, 5200);
    to(rpm, R + up, 10600);
    to(gain, R + up, v * 1.05);
    // Held there, flaring, until the lights go out (go()), for up to four seconds.
    for (let t = R + up + 0.18, i = 0; t < R + 4; t += 0.22, i += 1) to(rpm, t, i % 2 ? 10700 : 10100);
    if (gone) release();
    else endTimer = window.setTimeout(() => e.stop(0.6), (R - now + 6) * 1000);
  });

  // The clutch drops now.
  const release = () => {
    const t = c.currentTime + 0.01;
    clear(t);
    const { rpm, load, gain } = params();
    to(rpm, t, Math.max(rpm.value, 9000), true);
    to(load, t, 0.8, true);
    to(gain, t + 0.04, Math.max(gain.value, e.volume));
    launch(t + 0.03);
  };

  return {
    stop(fade) {
      window.clearTimeout(endTimer);
      e.stop(fade);
    },
    go() {
      if (gone || e.stopped) return;
      gone = true;
      if (e.node) release();
    },
  };
}

/**
 * Plays a sound. Options:
 *   volume   0..1
 *   loop     keep going until stopped
 *   rate     playback rate (pitch)
 *   filter   true to put a low-pass filter in the chain (see handle.set)
 *   sync     if loading takes a moment, skip ahead by that much so the sound
 *            stays in time with what started it
 * Returns a handle: stop(fade), set({ rate, volume, cutoff }), or null when sound is off.
 */
export function play(name, { volume = 1, loop = false, rate = 1, filter = false, sync = false } = {}) {
  if (!enabled) return null;
  const c = context();
  if (!c) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  const asked = performance.now(); // wall clock: the audio clock stands still while the context is suspended
  const handle = {
    stopped: false,
    src: null,
    gain: null,
    lp: null,
    stop(fade = 0.3) {
      if (this.stopped) return;
      this.stopped = true;
      playing.delete(this);
      if (!this.src) return;
      const t = c.currentTime;
      this.gain.gain.cancelScheduledValues(t);
      this.gain.gain.setValueAtTime(this.gain.gain.value, t);
      this.gain.gain.linearRampToValueAtTime(0, t + fade);
      this.src.stop(t + fade + 0.05);
    },
    set({ rate: r, volume: v, cutoff } = {}) {
      if (!this.src) return;
      const t = c.currentTime;
      if (r !== undefined) this.src.playbackRate.setTargetAtTime(r, t, 0.08);
      if (v !== undefined) this.gain.gain.setTargetAtTime(v, t, 0.08);
      if (cutoff !== undefined && this.lp) this.lp.frequency.setTargetAtTime(cutoff, t, 0.08);
    },
  };
  playing.add(handle);
  load(name)
    .then((buffer) => {
      if (handle.stopped || !enabled) return;
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = loop;
      src.playbackRate.value = rate;
      const gain = c.createGain();
      gain.gain.value = volume;
      let node = src;
      if (filter) {
        handle.lp = c.createBiquadFilter();
        handle.lp.type = 'lowpass';
        handle.lp.frequency.value = 1200;
        node.connect(handle.lp);
        node = handle.lp;
      }
      node.connect(gain).connect(master);
      const late = sync ? Math.max(0, (performance.now() - asked) / 1000) : 0;
      if (late > buffer.duration - 0.2) {
        playing.delete(handle);
        return;
      }
      src.start(0, late);
      src.onended = () => playing.delete(handle);
      handle.src = src;
      handle.gain = gain;
    })
    .catch(() => playing.delete(handle));
  return handle;
}
