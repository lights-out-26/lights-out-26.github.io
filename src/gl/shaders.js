/**
 * GLSL for the two kinds of scene.
 *
 * car    a cut-out side-on photo, lit and moved using its depth map: depth
 *        parallax, relighting, motion blur with a light trail, wheels that
 *        turn and spin-blur, heat haze, glowing brakes, a contact shadow,
 *        and an optional blueprint scan.
 * photo  a full photograph with a depth map: a 2.5D camera (parallax and
 *        dolly zoom), panning blur on the background only, a reveal that
 *        travels from near to far, grain and vignette.
 *
 * Texture coordinates use a top-left origin, matching how images upload.
 */

export const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = /* glsl */ `
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}`;

export const CAR = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uColor;   // premultiplied RGBA: the levelled car canvas
uniform sampler2D uDepth;   // greyscale, white = nearest
uniform vec2 uRes;          // canvas size in pixels
uniform vec2 uTexel;        // 1 / colour texture size
uniform vec2 uDepthTexel;   // 1 / depth texture size
uniform vec4 uRect;         // where the car canvas sits in this canvas (x, y, w, h)
uniform float uAspect;      // car canvas width / height
uniform vec3 uWheelF;       // front wheel: centre (car uv) and radius (fraction of width)
uniform vec3 uWheelR;       // rear wheel
uniform vec4 uBox;          // the car's bounding box in car uv (x0, y0, x1, y1)

uniform float uTime;
uniform float uSpeed;       // 0..1: motion blur and trail length
uniform float uSpin;        // wheel blur arc in radians
uniform float uAngle;       // wheel rotation in radians
uniform vec2 uTilt;         // depth parallax, in car widths
uniform vec2 uLight;        // where the light is, -1..1
uniform float uSheen;       // strength of the relighting
uniform float uSweep;       // travelling highlight position, in car widths (< -0.95 = off)
uniform float uHeat;        // heat haze over the engine cover and rear wing
uniform float uBrake;       // brake discs glowing through the rims
uniform float uAberr;       // colour split along the trail
uniform float uHold;       // 0..1: keep the car itself sharp over its trail (a tracking camera)
uniform float uShadow;      // contact shadow strength
uniform float uAlpha;       // overall opacity
uniform vec3 uTint;         // team colour
uniform float uScan;        // < -0.5 = off; else scan line position, 0..1 across the car
uniform float uBlue;        // blueprint visibility ahead of the scan
${NOISE}

// Texture reads happen inside branches and loops, where the GPU has no
// reliable derivatives to pick a mip level, so the level is worked out once
// from how large the car is drawn and passed explicitly.
float LOD = 0.0;
vec4 car(vec2 p) {
  if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) return vec4(0.0);
  return textureLod(uColor, p, LOD);
}
float depthAt(vec2 p) { return textureLod(uDepth, clamp(p, 0.0, 1.0), 0.0).r; }
// A blurred read of the depth map (from its mipmaps) for smooth lighting normals.
float depthSoft(vec2 p) { return textureLod(uDepth, clamp(p, 0.0, 1.0), 2.0).r; }
// Interleaved gradient noise: a fixed dither that hides banding in the blurs.
float ign(vec2 f) { return fract(52.9829189 * fract(dot(f, vec2(0.06711056, 0.00583715)))); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Car uv is stretched (the canvas is ~3.9 times wider than tall); iso space
// measures both axes in car widths so circles stay round.
vec2 iso(vec2 p) { return vec2(p.x, p.y / uAspect); }
vec2 uniso(vec2 q) { return vec2(q.x, q.y * uAspect); }

// The car with its wheels turned by uAngle and smeared around their hubs by
// uSpin. maxTaps keeps the cost down when called inside the motion blur.
vec4 turned(vec2 p, int maxTaps) {
  vec2 q = iso(p);
  for (int w = 0; w < 2; w++) {
    vec3 wh = w == 0 ? uWheelF : uWheelR;
    vec2 c = iso(wh.xy);
    vec2 d = q - c;
    float r = length(d);
    float R = wh.z * 0.985;
    if (r < R) {
      float a0 = atan(d.y, d.x) + uAngle;
      int n = min(maxTaps, int(uSpin * 6.0) + 1);
      vec4 acc = vec4(0.0);
      for (int i = 0; i < 16; i++) {
        if (i >= n) break;
        float f = n == 1 ? 0.0 : float(i) / float(n - 1) - 0.5;
        float a = a0 + f * uSpin;
        acc += car(uniso(c + r * vec2(cos(a), sin(a))));
      }
      acc /= float(n);
      return mix(car(p), acc, smoothstep(R, R - 0.0025, r));
    }
  }
  return car(p);
}

void main() {
  LOD = max(0.0, log2(1.0 / (uTexel.x * uRes.x * uRect.z)));
  vec2 p = (vUv - uRect.xy) / uRect.zw;
  float trail = uSpeed * 0.45;
  if (p.x < uBox.x - 0.05 || p.x > uBox.z + trail + 0.05 || p.y < uBox.y - 0.2 || p.y > uBox.w + 0.25) {
    fragColor = vec4(0.0);
    return;
  }

  // Hot air above the engine cover and around the rear wing shimmers.
  if (uHeat > 0.001) {
    float mask = smoothstep(uWheelR.x - 0.26, uWheelR.x - 0.05, p.x) * (1.0 - smoothstep(uWheelR.y - 0.1, uWheelR.y + 0.12, p.y));
    vec2 hp = vec2(p.x * 70.0, p.y * 22.0 + uTime * 5.5);
    vec2 h = vec2(noise(hp) - 0.5, noise(hp + 17.3) - 0.5);
    p += h * vec2(0.0035, 0.012) * uHeat * mask;
  }

  // Depth parallax: near parts shift further than far ones. Two lookups
  // keep the silhouette from tearing.
  vec2 tilt = vec2(uTilt.x, uTilt.y * uAspect);
  float d0 = depthAt(p);
  float d1 = depthAt(p - (d0 - 0.5) * tilt);
  p -= (d1 - 0.5) * tilt;

  vec4 col;
  if (trail < 0.002) {
    col = turned(p, 14);
  } else {
    // A long exposure: average the car along its path, most weight on where
    // it is now, so the smear trails behind (the cars always travel left).
    int n = clamp(int(trail * 90.0) + 6, 6, 36);
    vec4 acc = vec4(0.0);
    float wsum = 0.0;
    float j = ign(gl_FragCoord.xy);
    float sharp = LOD;
    LOD = sharp + clamp(trail * 6.0, 0.0, 1.5);
    for (int i = 0; i < 36; i++) {
      if (i >= n) break;
      float t = (float(i) + j) / float(n);
      vec4 c = turned(p - vec2((t * 1.1 - 0.1) * trail, 0.0), 3);
      float w = pow(1.0 - t, 1.6) + 0.04;
      c.rgb = mix(c.rgb, uTint * luma(c.rgb) * 1.6, clamp(t * uSpeed * 0.6, 0.0, 0.6));
      vec3 split = vec3(1.0 + uAberr * (t - 0.35), 1.0, 1.0 - uAberr * (t - 0.35));
      acc += vec4(c.rgb * split, c.a) * w;
      wsum += w;
    }
    col = acc / wsum;
    col.rgb = min(col.rgb, vec3(col.a));
    LOD = sharp;
    // A camera tracking the car keeps the car crisp; only the trail is smeared.
    if (uHold > 0.001) {
      vec4 now = turned(p, 14);
      col = mix(col, now + col * (1.0 - now.a), uHold);
    }
  }

  // Relight the paint with normals taken from the depth map.
  if (uSheen > 0.001 || uSweep > -0.95) {
    vec2 e = uDepthTexel * 5.0;
    float dx = depthSoft(p + vec2(e.x, 0.0)) - depthSoft(p - vec2(e.x, 0.0));
    float dy = depthSoft(p + vec2(0.0, e.y)) - depthSoft(p - vec2(0.0, e.y));
    vec3 n = normalize(vec3(-dx * 16.0, dy * 16.0, 1.0));
    vec3 L = normalize(vec3(uLight.x * 0.9, uLight.y * 0.7 + 0.35, 0.8));
    float lam = max(dot(n, L), 0.0);
    col.rgb *= mix(1.0, 0.72 + 0.48 * lam, uSheen);
    float spec = pow(max(reflect(-L, n).z, 0.0), 30.0) * 0.4 * uSheen;
    float band = 0.0;
    if (uSweep > -0.95) {
      float x = p.x + (p.y / uAspect) * 0.5 - uSweep;
      band = exp(-x * x * 120.0) * (0.25 + 0.75 * smoothstep(0.6, 1.0, n.z)) * 0.55;
    }
    col.rgb += (spec + band) * col.a;
  }

  // Braking hard, the discs glow through the gaps in the rims.
  if (uBrake > 0.001) {
    vec2 q = iso(p);
    float g = 1.0 - smoothstep(uWheelF.z * 0.12, uWheelF.z * 0.55, length(q - iso(uWheelF.xy)));
    g += 1.0 - smoothstep(uWheelR.z * 0.12, uWheelR.z * 0.55, length(q - iso(uWheelR.xy)));
    float dark = 1.0 - smoothstep(0.08, 0.4, luma(col.rgb) / max(col.a, 0.001));
    col.rgb += vec3(1.0, 0.33, 0.05) * g * uBrake * (0.25 + 0.75 * dark) * col.a;
  }

  // Blueprint: the photo's edges and depth contours, swept away by a scan line.
  if (uScan > -0.5) {
    vec2 t = uTexel * 1.5;
    float tl = luma(car(p + vec2(-t.x, -t.y)).rgb), tc = luma(car(p + vec2(0.0, -t.y)).rgb), tr = luma(car(p + vec2(t.x, -t.y)).rgb);
    float ml = luma(car(p + vec2(-t.x, 0.0)).rgb), mr = luma(car(p + vec2(t.x, 0.0)).rgb);
    float bl = luma(car(p + vec2(-t.x, t.y)).rgb), bc = luma(car(p + vec2(0.0, t.y)).rgb), br = luma(car(p + vec2(t.x, t.y)).rgb);
    float gx = (tr + 2.0 * mr + br) - (tl + 2.0 * ml + bl);
    float gy = (bl + 2.0 * bc + br) - (tl + 2.0 * tc + tr);
    float edge = smoothstep(0.12, 0.5, length(vec2(gx, gy)));
    float a = car(p).a;
    float dd = depthAt(p) * 24.0;
    float fw = max(fwidth(dd), 1e-4);
    float contour = (1.0 - smoothstep(0.0, fw * 1.3, min(fract(dd), 1.0 - fract(dd)))) * a;
    vec3 ink = mix(uTint, vec3(1.0), 0.3);
    float ba = clamp(edge * 0.9 + contour * 0.5 + 0.07 * a, 0.0, 1.0) * uBlue;
    float s = mix(uBox.x - 0.03, uBox.z + 0.03, clamp(uScan, 0.0, 1.0));
    col = mix(vec4(ink * ba, ba), col, 1.0 - smoothstep(s - 0.003, s + 0.003, p.x));
    float live = step(0.0005, uScan) * (1.0 - step(0.9995, uScan));
    float line = exp(-pow((p.x - s) * 220.0, 2.0)) * step(uBox.y - 0.08, p.y) * step(p.y, uBox.w + 0.06) * live;
    float glow = exp(-pow((p.x - s) * 30.0, 2.0)) * a * live * 0.35;
    col.rgb += ink * (line + glow);
    col.a = min(1.0, col.a + line * 0.9);
  }

  // A soft contact shadow that stretches with speed.
  if (uShadow > 0.001) {
    vec2 c = vec2((uWheelF.x + uWheelR.x) * 0.5 + trail * 0.3, uBox.w - 0.01);
    vec2 q = iso(p) - iso(c);
    float rx = (uWheelR.x - uWheelF.x) * (0.72 + trail * 1.5);
    float e = length(q / vec2(rx, 0.014));
    float sh = (1.0 - smoothstep(0.2, 1.0, e)) * uShadow * 0.8;
    col += vec4(0.0, 0.0, 0.0, sh) * (1.0 - col.a);
  }

  fragColor = col * uAlpha;
}`;

export const PHOTO = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uRes;
uniform vec2 uTexel;
uniform float uImgAspect;
uniform float uTime;
uniform float uZoom;        // >= 1
uniform float uFocus;       // the depth that stays put while the camera moves
uniform float uDolly;       // depth-dependent zoom: near things grow faster
uniform vec2 uCam;          // parallax offset
uniform float uPan;         // panning blur on everything behind the focus
uniform vec2 uPanDir;
uniform float uGrain;
uniform float uVignette;
uniform float uReveal;      // 0..1: the picture builds from near to far
uniform float uExposure;
uniform vec3 uTint;
${NOISE}

void main() {
  float va = uRes.x / uRes.y;
  vec2 c = vUv - 0.5;
  if (va > uImgAspect) c.y *= uImgAspect / va;
  else c.x *= va / uImgAspect;
  c /= uZoom;

  // Mip level from the scale the photo is drawn at (see the car shader).
  vec2 span = vec2(1.0) / uTexel * fwidth(c);
  float lod = max(0.0, log2(max(span.x, span.y)));
  float d = textureLod(uDepth, 0.5 + c, 0.0).r;
  vec2 q = 0.5 + c / (1.0 + uDolly * (d - uFocus)) + (d - uFocus) * uCam;
  d = textureLod(uDepth, clamp(q, 0.0, 1.0), 0.0).r;
  q = 0.5 + c / (1.0 + uDolly * (d - uFocus)) + (d - uFocus) * uCam;
  q = clamp(q, vec2(0.001), vec2(0.999));

  float far = 1.0 - smoothstep(uFocus - 0.3, uFocus - 0.02, d);
  float amt = uPan * far;
  vec3 col;
  if (amt < 0.0006) {
    col = textureLod(uColor, q, lod).rgb;
  } else {
    int n = clamp(int(amt * 500.0) + 3, 3, 24);
    float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    // Only samples that are themselves behind the focus count, so the car
    // does not bleed into the blurred background around it.
    vec3 acc = textureLod(uColor, q, lod).rgb * 0.06;
    float ws = 0.06;
    for (int i = 0; i < 24; i++) {
      if (i >= n) break;
      float t = (float(i) + j) / float(n) - 0.5;
      vec2 sq = clamp(q + uPanDir * t * amt, vec2(0.001), vec2(0.999));
      float w = 1.0 - smoothstep(uFocus - 0.3, uFocus - 0.02, textureLod(uDepth, sq, 0.0).r);
      acc += textureLod(uColor, sq, lod + 0.5).rgb * w;
      ws += w;
    }
    col = acc / ws;
  }

  float alpha = 1.0;
  if (uReveal < 0.999) {
    float k = uReveal * 1.35 - (1.0 - d) - (noise(vUv * vec2(va, 1.0) * 7.0) - 0.5) * 0.25;
    alpha = smoothstep(0.0, 0.06, k);
    float edge = smoothstep(-0.02, 0.0, k) * (1.0 - smoothstep(0.0, 0.07, k));
    col = col * alpha + uTint * edge * 1.4;
    alpha = max(alpha, edge);
  }

  col *= 1.0 - uVignette * smoothstep(0.25, 0.85, length(vUv - 0.5) * 1.25);
  col += (hash(gl_FragCoord.xy + floor(uTime * 24.0) * 13.1) - 0.5) * uGrain;
  col = max(col * uExposure, 0.0);
  fragColor = vec4(col * alpha, alpha);
}`;

export const PROGRAMS = { car: CAR, photo: PHOTO };
