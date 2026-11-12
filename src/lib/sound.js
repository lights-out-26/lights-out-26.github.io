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
export function engine({ volume = 0.5 } = {}) {
  if (!enabled) return null;
  const c = context();
  if (!c || !c.audioWorklet) return null;
  if (c.state !== 'running') c.resume().catch(() => {});
  const want = { rpm: 4500, load: 0.2 };
  const handle = {
    stopped: false,
    node: null,
    gain: null,
    tone: null,
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
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.4);
      node.connect(tone).connect(gain).connect(master);
      Object.assign(handle, { node, tone, gain });
      handle.set(want);
    })
    .catch(() => {
      engineModule = null;
      playing.delete(handle);
    });
  return handle;
}

/**
 * Plays a sound. Options:
 *   volume   0..1
 *   loop     keep going until stopped
 *   rate     playback rate (pitch)
 *   filter   true to put a low-pass filter in the chain (see handle.set)
 *   sync     if loading takes a moment, skip ahead by that much so the sound
 *            stays in time with what started it
 *   offset   start this many seconds into the sound
 *   at       start this many seconds from now, on the audio clock (implies
 *            sync: if it is not loaded by then, it starts as far in as it
 *            would have reached)
 *   fadeIn   seconds to fade in from silence
 *   shape    [[seconds into the sound, gain], ...]: a volume curve over the
 *            sound itself (multiplies volume), e.g. to lift a quiet stretch
 * Returns a handle: stop(fade), set({ rate, volume, cutoff }), or null when sound is off.
 */
export function play(name, { volume = 1, loop = false, rate = 1, filter = false, sync = false, offset = 0, at = 0, fadeIn = 0, shape = null } = {}) {
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
      let node = src;
      if (filter) {
        handle.lp = c.createBiquadFilter();
        handle.lp.type = 'lowpass';
        handle.lp.frequency.value = 1200;
        node.connect(handle.lp);
        node = handle.lp;
      }
      node.connect(gain).connect(master);
      const elapsed = (performance.now() - asked) / 1000;
      const wait = Math.max(0, at - elapsed);
      const late = sync || at ? Math.max(0, elapsed - at) : 0;
      const from = offset + late;
      if (from > buffer.duration - 0.2) {
        playing.delete(handle);
        return;
      }
      const t0 = c.currentTime + wait;
      // The volume curve at a position in the sound, as a gain.
      const level = (pos) => {
        if (!shape) return volume;
        let k = shape.findIndex(([q]) => q > pos);
        if (k === -1) return volume * shape[shape.length - 1][1];
        if (k === 0) return volume * shape[0][1];
        const [q0, g0] = shape[k - 1];
        const [q1, g1] = shape[k];
        return volume * (g0 + ((g1 - g0) * (pos - q0)) / (q1 - q0));
      };
      gain.gain.setValueAtTime(fadeIn ? 0 : level(from), t0);
      if (fadeIn) gain.gain.linearRampToValueAtTime(level(from + fadeIn), t0 + fadeIn);
      if (shape) shape.forEach(([q]) => q > from + fadeIn && gain.gain.linearRampToValueAtTime(level(q), t0 + (q - from) / rate));
      src.start(t0, from);
      src.onended = () => playing.delete(handle);
      handle.src = src;
      handle.gain = gain;
    })
    .catch(() => playing.delete(handle));
  return handle;
}
