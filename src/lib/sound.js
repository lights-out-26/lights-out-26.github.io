import { useEffect, useState } from 'react';

/**
 * Sound: real Formula 1 cars recorded at Goodwood (see scripts/sounds.json).
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
