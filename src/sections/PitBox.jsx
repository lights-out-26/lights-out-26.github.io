import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import GLCar from '../components/GLCar';
import META from '../data/carsMeta.json';
import { ABBR, teamVars } from '../lib/team';

const C = META.canvas;
const CAR_PAD = { t: 0.14, r: 0.5, b: 0.24, l: 0.5 }; // room for the trail when it arrives and leaves
const PARKED = { speed: 0, spin: 0, wheelRate: 0, aberr: 0, brake: 0, heat: 0.5, sheen: 0.8, hold: 0 };

/**
 * The pit box, side on: the team's garage behind, its box painted on the pit
 * lane, and a real 2026 car (the same photographs as the rest of the site,
 * rendered in WebGL) that brakes into the box, goes up on the jacks while the
 * wheel guns work, drops, and is gone on the release.
 *
 * `cues` are the moments in the pit stop sound (PIT_CUES); `run` changes on
 * each call, starting a new stop in step with that sound. Between stops the
 * car sits in its box.
 */
export default function PitBox({ team, phase, run, cues, reduce }) {
  const wrap = useRef(null);
  const car = useRef(null);
  const meta = META.cars[`${team.id}-a`] || { rf: 0.062, rr: 0.064 };

  useLayoutEffect(() => {
    const el = wrap.current;
    const s = car.current && car.current.s;
    if (!el || !s) return undefined;
    gsap.killTweensOf([el, s]);
    if (reduce || !run) {
      gsap.set(el, { xPercent: 0, yPercent: 0, skewX: 0, scaleX: 1 });
      Object.assign(s, PARKED);
      return undefined;
    }
    const arrive = cues.stop - 1.5;
    const tl = gsap.timeline();
    // Waiting for the car: the box is empty while the radio call goes out.
    tl.set(el, { xPercent: 150, yPercent: 0, skewX: 12, scaleX: 1.1 }, 0)
      .set(s, { speed: 1, spin: 2.8, wheelRate: 90, aberr: 1, brake: 0, heat: 0, hold: 0 }, 0)
      // In on the limiter and hard on the brakes, stopping on its marks.
      .to(el, { xPercent: 0, skewX: 0, scaleX: 1, duration: 1.5, ease: 'expo.out' }, arrive)
      .to(s, { speed: 0, spin: 0, wheelRate: 0, aberr: 0, duration: 1.4, ease: 'power3.out' }, arrive)
      .to(s, { brake: 1, duration: 0.25, ease: 'power2.out' }, arrive + 0.1)
      .to(s, { brake: 0, duration: 1.2, ease: 'power2.in' }, cues.stop)
      // Up on the jacks, front and rear.
      .to(el, { yPercent: -4, duration: 0.12, ease: 'power2.out' }, cues.stop + 0.05)
      // Down again once the guns are done.
      .to(el, { yPercent: 0, duration: 0.1, ease: 'power2.in' }, cues.down)
      // Released: away up the pit lane.
      .to(s, { speed: 1, spin: 2.6, wheelRate: 95, aberr: 0.8, duration: 0.9, ease: 'power3.in' }, cues.go)
      .to(el, { xPercent: -175, skewX: -12, scaleX: 1.1, duration: 0.9, ease: 'power3.in' }, cues.go)
      // The car back in its box for the next call, without a sound.
      .set(el, { xPercent: 150, skewX: 0, scaleX: 1 }, cues.go + 1.6)
      .set(s, { speed: 0.4, spin: 0.6, wheelRate: 20, aberr: 0 }, cues.go + 1.6)
      .to(el, { xPercent: 0, duration: 1.6, ease: 'power3.out' }, cues.go + 1.65)
      .to(s, { ...PARKED, duration: 1.4, ease: 'power2.out' }, cues.go + 1.65);
    return () => tl.kill();
  }, [run, reduce, cues, team.id]);

  const past = (p) => phase === p || (PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(p) && phase !== 'idle');
  const gun = past('done') ? 'on' : past('off') ? 'off' : 'wait';

  return (
    <div className="pitbox" style={teamVars(team)} data-phase={phase}>
      <div className="pitbox__garage" aria-hidden="true">
        <span className="pitbox__mark t-team">{ABBR[team.id]}</span>
        <span className="pitbox__name">{team.name}</span>
      </div>
      <div className="pitbox__lane" aria-hidden="true">
        <i className="pitbox__line pitbox__line--front" />
        <i className="pitbox__line pitbox__line--rear" />
        <i className="pitbox__stripe" />
      </div>
      <div className="pitbox__car" ref={wrap}>
        <GLCar
          ref={car}
          id={`${team.id}-a`}
          tint={team.colors.accent}
          alt={`The ${team.chassisFull} in its pit box`}
          hd
          pad={CAR_PAD}
          initial={{ ...PARKED, tilt: 0.004 }}
        >
          {[
            ['front', C.frontX, meta.rf],
            ['rear', C.rearX, meta.rr],
          ].map(([id, x, r]) => (
            <i
              key={id}
              className={`pitbox__gun pitbox__gun--${id}`}
              data-state={gun}
              style={{ left: `${x * 100}%`, top: `${C.axleY * 100}%`, width: `${r * 2 * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </GLCar>
        <i className="pitbox__jack pitbox__jack--front" data-up={past('stop') && !past('down') ? 'true' : 'false'} style={{ left: '1.5%' }} aria-hidden="true" />
        <i className="pitbox__jack pitbox__jack--rear" data-up={past('stop') && !past('down') ? 'true' : 'false'} style={{ right: '1%' }} aria-hidden="true" />
      </div>
    </div>
  );
}

const PHASE_ORDER = ['idle', 'box', 'copy', 'stop', 'off', 'on', 'done', 'down', 'go'];
