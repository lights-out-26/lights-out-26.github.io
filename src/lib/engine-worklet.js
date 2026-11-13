/**
 * A turbo V6 engine, made sample by sample (runs as an AudioWorklet).
 *
 * The flat-out scene needs an engine that follows the scroll: revs that climb
 * through each gear and fall at every upshift. Speeding up a recording does
 * that badly (an idle recording played at nearly three times the speed turns
 * into chatter), so the sound is modelled instead:
 *
 *   - six exhaust pulses per engine cycle (two turns of the crank), each a
 *     little different in strength and timing, as no two firings are alike
 *   - the pulses ring the exhaust and bodywork, three resonances
 *   - a short burst of combustion noise with every firing
 *   - a turbo whistle that rises with the boost
 *   - a cut of the ignition at every upshift, and crackles on the overrun
 *
 * Parameters: rpm (revs per minute) and load (0 off the throttle, 1 flat out).
 */

const TAU = Math.PI * 2;
const CYLINDERS = 6;

/** Two-pole band-pass filter (0 dB at the centre). */
function resonator(f, q) {
  const r = { x1: 0, x2: 0, y1: 0, y2: 0, b0: 0, b2: 0, a1: 0, a2: 0 };
  r.set = (freq, quality) => {
    const w = (TAU * freq) / sampleRate;
    const alpha = Math.sin(w) / (2 * quality);
    const n = 1 + alpha;
    r.b0 = alpha / n;
    r.b2 = -alpha / n;
    r.a1 = (-2 * Math.cos(w)) / n;
    r.a2 = (1 - alpha) / n;
  };
  r.run = (x) => {
    const y = r.b0 * x + r.b2 * r.x2 - r.a1 * r.y1 - r.a2 * r.y2;
    r.x2 = r.x1;
    r.x1 = x;
    r.y2 = r.y1;
    r.y1 = y;
    return y;
  };
  r.set(f, q);
  return r;
}

class EngineProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 4500, minValue: 1500, maxValue: 16000, automationRate: 'k-rate' },
      { name: 'load', defaultValue: 0.2, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.rpm = 4500;
    this.load = 0.2;
    this.boost = 0;
    this.cut = 0; // seconds of ignition cut left (an upshift)
    this.pos = 0; // position in engine cycles (one cycle: every cylinder fires once)
    this.lap = 0; // the cycle the next firing belongs to
    this.next = 0; // the next cylinder to fire
    this.nextAt = 0; // and when, in cycles
    // Each cylinder fires a touch early or late and a touch stronger or weaker:
    // that unevenness is what makes an engine sound like an engine and not a buzzer.
    this.strength = [1, 0.8, 1.12, 0.9, 1.07, 0.84];
    this.offset = [0, 0.006, -0.004, 0.003, -0.006, 0.002];
    this.carry = 0; // the part of a pulse that lands on the next sample
    this.noiseEnv = 0;
    this.body = [0, 0];
    this.res = [resonator(560, 0.9), resonator(1450, 1.1), resonator(3600, 1)];
    this.hiss = resonator(2800, 0.8);
    this.turbo = 0;
    this.wobble = 0;
    this.dcIn = 0;
    this.dcOut = 0;
    this.seed = 0x2468ace;
  }

  random() {
    // xorshift: cheap, and the same every run
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  }

  process(inputs, outputs, params) {
    const out = outputs[0][0];
    if (!out) return true;
    const fs = sampleRate;
    const dt = 1 / fs;
    const targetRpm = params.rpm[0];
    const targetLoad = params.load[0];

    // An upshift: the revs drop by several hundred at once, so cut the ignition for a moment.
    // (Lifting off lowers them far more gently, a few dozen per block at most.)
    if (targetRpm < this.rpm - 500 && this.cut <= 0) this.cut = 0.03;

    // Revs and load follow their targets: quickly down (a shift), a little slower up.
    const n = out.length;
    const kUp = 1 - Math.exp(-n / (fs * 0.06));
    const kDown = 1 - Math.exp(-n / (fs * 0.018));
    this.rpm += (targetRpm - this.rpm) * (targetRpm < this.rpm ? kDown : kUp);
    this.load += (targetLoad - this.load) * (1 - Math.exp(-n / (fs * 0.05)));
    const spool = Math.min(1, this.load * 1.2) * Math.min(1, Math.max(0, (this.rpm - 5000) / 6000));
    this.boost += (spool - this.boost) * (1 - Math.exp(-n / (fs * 0.4)));

    const rpm = this.rpm;
    const load = this.load;
    const k = Math.min(1, Math.max(0, (rpm - 4000) / 8000));

    // The tone of the exhaust opens up with the revs. Broad resonances, partly following
    // the firing rate: narrow fixed ones over a pulse train would start to sound like a voice.
    const firing = (rpm / 120) * CYLINDERS;
    this.res[0].set(Math.min(1500, 260 + firing * 1.1), 0.9);
    this.res[1].set(Math.min(3600, 700 + firing * 2.2), 1.1);
    this.res[2].set(3600 + k * 600, 1.0);
    const bodyCoef = 1 - Math.exp((-TAU * (900 + k * 2600)) / fs);

    const pulseGain = (0.45 + 0.55 * load) * (0.7 + 0.3 * k);
    const noiseAmt = 0.25 + 0.6 * load;
    const turboFreq = 2000 + 5600 * this.boost;
    const turboAmp = 0.035 * this.boost * this.boost;
    const overrun = load < 0.1 && rpm > 6500;
    const noiseDecay = Math.exp(-dt / 0.0012);

    for (let i = 0; i < n; i += 1) {
      // A slow, slight wander in the revs, as no engine holds them perfectly still.
      this.wobble += (this.random() - 0.5) * 0.02 - this.wobble * 0.0005;
      const step = (rpm / 120) * dt * (1 + this.wobble * 0.01);
      let excite = this.carry;
      this.carry = 0;
      this.pos += step;
      while (this.pos >= this.nextAt) {
        const c = this.next;
        let a = pulseGain * this.strength[c] * (0.85 + 0.3 * this.random());
        if (this.cut > 0) a *= 0.12;
        if (overrun) {
          a *= 0.3;
          // Unburnt fuel going off in the exhaust.
          if (this.random() < 0.045) {
            a = 1.4 + this.random();
            this.noiseEnv = Math.max(this.noiseEnv, 1.6);
          }
        }
        // Share the pulse between this sample and the next, so its timing is exact.
        const frac = Math.min(1, (this.pos - this.nextAt) / step);
        excite += a * frac;
        this.carry += a * (1 - frac);
        this.noiseEnv = Math.max(this.noiseEnv, a * noiseAmt);
        this.next = (c + 1) % CYLINDERS;
        if (this.next === 0) this.lap += 1;
        this.nextAt = this.lap + this.next / CYLINDERS + this.offset[this.next];
      }
      if (this.pos >= 1 && this.lap >= 1) {
        this.pos -= 1;
        this.lap -= 1;
        this.nextAt -= 1;
      }

      // The pressure pulse itself: the firing, smoothed into a short bump.
      this.body[0] += (excite * 6 - this.body[0]) * bodyCoef;
      this.body[1] += (this.body[0] - this.body[1]) * bodyCoef;

      // Combustion noise, a burst with every firing.
      const noise = (this.random() * 2 - 1) * this.noiseEnv;
      this.noiseEnv *= noiseDecay;

      const drive = excite * 40;
      let y =
        this.body[1] * 1.1 +
        this.res[0].run(drive) * 0.9 +
        this.res[1].run(drive) * 0.24 +
        this.res[2].run(drive) * 0.09 +
        this.hiss.run(noise) * 0.45;

      // The turbo's whistle.
      this.turbo += (turboFreq / fs) * TAU;
      if (this.turbo > TAU) this.turbo -= TAU;
      y += Math.sin(this.turbo) * turboAmp;

      // Soft saturation, then take out any DC.
      y = Math.tanh(y * 1.5) * 0.8;
      const hp = y - this.dcIn + 0.995 * this.dcOut;
      this.dcIn = y;
      this.dcOut = hp;
      out[i] = hp;
      if (this.cut > 0) this.cut -= dt;
    }
    for (let ch = 1; ch < outputs[0].length; ch += 1) outputs[0][ch].set(out);
    return true;
  }
}

registerProcessor('f1-engine', EngineProcessor);
