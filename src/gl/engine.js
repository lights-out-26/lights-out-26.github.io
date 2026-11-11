import gsap from 'gsap';
import { VERT, PROGRAMS } from './shaders';

/**
 * One WebGL2 context for the whole site.
 *
 * Every scene has its own 2D canvas in the page, so it stacks with the
 * surrounding HTML like any other element. Each frame the shared context
 * renders the visible scenes one after another and copies each result into
 * its canvas. That keeps the number of contexts at one however many scenes
 * there are, and lets textures be shared between them.
 *
 * Scenes ("views") hand over a plain uniforms object and an onFrame hook;
 * GSAP can tween whatever feeds that object.
 */

const isBrowser = typeof window !== 'undefined';
const coarse = isBrowser && window.matchMedia('(pointer: coarse)').matches;
const DPR_CAP = coarse ? 1.5 : 1.75;
const MAX_PIXELS = coarse ? 1.5e6 : 3.4e6;

let supported = null;
let gl = null;
let canvas = null;
let quad = null;
let lost = false;
let broken = false;
let running = false;
const programs = {};
const textures = new Map();
const views = new Set();
const pointer = { x: isBrowser ? window.innerWidth / 2 : 0, y: isBrowser ? window.innerHeight / 2 : 0, tx: 0, ty: 0, seen: false };

/** True when the scenes can run: WebGL2 is there and motion is welcome. */
export function glAvailable() {
  if (supported !== null) return supported && !broken;
  if (!isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return (supported = false);
  try {
    const probe = document.createElement('canvas').getContext('webgl2');
    supported = !!probe;
    probe?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    supported = false;
  }
  return supported;
}

function context() {
  if (gl || broken) return gl;
  canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2;
  gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  if (!gl) {
    broken = true;
    return null;
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    views.forEach((v) => v.onLost && v.onLost());
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    setup();
    textures.forEach((t) => {
      t.tex = null;
      t.ready = false;
      load(t);
    });
    views.forEach((v) => (v.drawn = false));
  });
  setup();
  window.addEventListener('pointermove', (e) => {
    pointer.tx = e.clientX;
    pointer.ty = e.clientY;
    if (!pointer.seen) {
      pointer.seen = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }
  }, { passive: true });
  return gl;
}

function setup() {
  quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);
  Object.keys(programs).forEach((k) => delete programs[k]);
}

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader did not compile');
  return s;
}

function program(name) {
  if (programs[name]) return programs[name];
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, PROGRAMS[name]));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'program did not link');
  const uniforms = {};
  let unit = 0;
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i += 1) {
    const info = gl.getActiveUniform(p, i);
    uniforms[info.name] = { loc: gl.getUniformLocation(p, info.name), type: info.type, unit: info.type === gl.SAMPLER_2D ? unit++ : -1 };
  }
  return (programs[name] = { p, uniforms });
}

// ---- textures, shared by URL and freed a while after the last user lets go ----

function load(t) {
  fetch(t.url)
    .then((res) => {
      if (!res.ok) throw new Error(`${res.status} ${t.url}`);
      return res.blob();
    })
    .then((blob) =>
      'createImageBitmap' in window
        ? createImageBitmap(blob, { premultiplyAlpha: t.premultiply ? 'premultiply' : 'none', colorSpaceConversion: 'none' })
        : new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
          })
    )
    .then((src) => {
      if (!gl || lost) return;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, t.premultiply && !(typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap));
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, t.mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      if (t.mips) gl.generateMipmap(gl.TEXTURE_2D);
      t.w = src.width;
      t.h = src.height;
      if (typeof src.close === 'function') src.close();
      if (t.refs <= 0) {
        gl.deleteTexture(tex);
        return;
      }
      t.tex = tex;
      t.ready = true;
    })
    .catch(() => {
      t.failed = true;
    });
}

function acquire(url, kind) {
  let t = textures.get(url);
  if (!t) {
    t = { url, refs: 0, tex: null, w: 0, h: 0, ready: false, failed: false, timer: 0, premultiply: kind === 'color', mips: true };
    textures.set(url, t);
    t.refs = 1;
    load(t);
    return t;
  }
  window.clearTimeout(t.timer);
  t.refs += 1;
  return t;
}

function release(t) {
  t.refs -= 1;
  if (t.refs > 0) return;
  t.timer = window.setTimeout(() => {
    if (t.refs > 0) return;
    if (gl && t.tex) gl.deleteTexture(t.tex);
    textures.delete(t.url);
  }, 10000);
}

const allReady = (set) => set && Object.values(set).every((t) => t.ready);
const anyFailed = (set) => set && Object.values(set).some((t) => t.failed);

// ---- views ----

/**
 * Registers a scene.
 *   canvas      the 2D canvas in the page that shows it
 *   program     'car' or 'photo'
 *   textures    { uColor: url, uDepth: url }
 *   onFrame     (u, dt, view) => void, called before each draw to fill `u`
 * The returned view has local pointer and scroll positions (view.local,
 * view.scrollPos) for parallax, setTextures() and dispose().
 */
export function createView({ canvas: target, program: name, textures: urls, key, onFrame, onFirstFrame, onLost, onFail }) {
  if (!glAvailable() || !context()) return null;
  const view = {
    canvas: target,
    ctx: target.getContext('2d'),
    program: name,
    u: {},
    tex: null,
    pending: null,
    urls: {},
    key: null,
    pendingKey: null,
    visible: false,
    awake: true,
    drawn: false,
    local: [0, 0],
    scrollPos: 0,
    onFrame,
    onFirstFrame,
    onLost,
    onFail,
  };

  view.setTextures = (next, nextKey) => {
    const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);
    if (same(next, view.urls)) return;
    view.urls = next;
    if (view.pending) Object.values(view.pending).forEach(release);
    view.pending = Object.fromEntries(Object.entries(next).map(([k, url]) => [k, acquire(url, k === 'uColor' ? 'color' : 'data')]));
    view.pendingKey = nextKey;
  };
  view.setTextures(urls, key);

  const size = () => {
    const r = target.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    if (r.width * r.height * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (r.width * r.height));
    const w = Math.max(2, Math.round(r.width * dpr));
    const h = Math.max(2, Math.round(r.height * dpr));
    if (target.width !== w || target.height !== h) {
      target.width = w;
      target.height = h;
      view.drawn = false;
    }
  };
  const ro = new ResizeObserver(size);
  ro.observe(target);
  size();
  const io = new IntersectionObserver(([entry]) => (view.visible = entry.isIntersecting), { rootMargin: '20% 0px 20% 0px' });
  io.observe(target);

  view.dispose = () => {
    ro.disconnect();
    io.disconnect();
    views.delete(view);
    if (view.tex) Object.values(view.tex).forEach(release);
    if (view.pending) Object.values(view.pending).forEach(release);
    view.tex = view.pending = null;
  };

  views.add(view);
  start();
  return view;
}

function setUniform(info, value) {
  const { loc, type } = info;
  switch (type) {
    case gl.FLOAT:
      gl.uniform1f(loc, value);
      break;
    case gl.FLOAT_VEC2:
      gl.uniform2f(loc, value[0], value[1]);
      break;
    case gl.FLOAT_VEC3:
      gl.uniform3f(loc, value[0], value[1], value[2]);
      break;
    case gl.FLOAT_VEC4:
      gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
      break;
    case gl.INT:
      gl.uniform1i(loc, value);
      break;
    default:
  }
}

function draw(view, time) {
  const w = view.canvas.width;
  const h = view.canvas.height;
  if (canvas.width < w || canvas.height < h) {
    canvas.width = Math.max(canvas.width, w);
    canvas.height = Math.max(canvas.height, h);
  }
  const prog = program(view.program);
  gl.viewport(0, 0, w, h);
  gl.useProgram(prog.p);
  gl.bindVertexArray(quad);
  const color = view.tex.uColor;
  const depth = view.tex.uDepth;
  for (const name in prog.uniforms) {
    const info = prog.uniforms[name];
    if (info.unit >= 0) {
      gl.activeTexture(gl.TEXTURE0 + info.unit);
      gl.bindTexture(gl.TEXTURE_2D, view.tex[name] ? view.tex[name].tex : null);
      gl.uniform1i(info.loc, info.unit);
    } else if (name === 'uTime') gl.uniform1f(info.loc, time);
    else if (name === 'uRes') gl.uniform2f(info.loc, w, h);
    else if (name === 'uTexel' && color) gl.uniform2f(info.loc, 1 / color.w, 1 / color.h);
    else if (name === 'uDepthTexel' && depth) gl.uniform2f(info.loc, 1 / depth.w, 1 / depth.h);
    else if (name === 'uImgAspect' && color) gl.uniform1f(info.loc, color.w / color.h);
    else if (view.u[name] !== undefined) setUniform(info, view.u[name]);
  }
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  view.ctx.clearRect(0, 0, w, h);
  view.ctx.drawImage(canvas, 0, canvas.height - h, w, h, 0, 0, w, h);
  if (!view.drawn) {
    view.drawn = true;
    if (view.onFirstFrame) view.onFirstFrame();
  }
}

function frame(time, deltaMs) {
  if (lost || broken || !views.size) return;
  const dt = Math.min(deltaMs || 16, 50) / 1000;
  pointer.x += (pointer.tx - pointer.x) * 0.09;
  pointer.y += (pointer.ty - pointer.y) * 0.09;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const px = pointer.seen ? pointer.x : vw / 2;
  const py = pointer.seen ? pointer.y : vh / 2;

  views.forEach((view) => {
    if (view.pending) {
      if (allReady(view.pending)) {
        if (view.tex) Object.values(view.tex).forEach(release);
        view.tex = view.pending;
        view.key = view.pendingKey;
        view.pending = null;
      } else if (anyFailed(view.pending) && !view.tex) {
        if (view.onFail) view.onFail();
        return;
      }
    }
    if (!view.visible || !view.awake || !view.tex) return;
    if (view.canvas.width < 3 || view.canvas.height < 3) return;
    const r = view.canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const lx = Math.max(-1.5, Math.min(1.5, (px - cx) / (vw / 2)));
    const ly = Math.max(-1.5, Math.min(1.5, (py - cy) / (vh / 2)));
    view.local[0] += (lx - view.local[0]) * 0.1;
    view.local[1] += (ly - view.local[1]) * 0.1;
    view.scrollPos = Math.max(-1.5, Math.min(1.5, (cy - vh / 2) / (vh / 2)));
    if (view.onFrame) view.onFrame(view.u, dt, view);
    try {
      draw(view, time);
    } catch (err) {
      broken = true;
      // eslint-disable-next-line no-console
      console.error('WebGL scenes switched off:', err);
      views.forEach((v) => v.onLost && v.onLost());
    }
  });
}

function start() {
  if (running) return;
  running = true;
  gsap.ticker.add(frame);
}

/**
 * Starts loading textures ahead of need (the next car on stage, say) and
 * holds them for `ms` so the scene that wants them finds them ready.
 */
export function preloadTextures(urls, ms = 20000) {
  if (!glAvailable() || !context()) return;
  Object.entries(urls).forEach(([k, url]) => {
    const t = acquire(url, k === 'uColor' ? 'color' : 'data');
    window.setTimeout(() => release(t), ms);
  });
}
