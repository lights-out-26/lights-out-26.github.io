import { useEffect, useState } from 'react';
import Photo, { Credit } from '../components/Photo';
import SplitText from '../components/SplitText';
import { TYRES, COMPOUNDS, SIZES, RULES } from '../data/tyres';
import useInView from '../hooks/useInView';
import useProgress from '../hooks/useProgress';
import useReducedMotion from '../hooks/useReducedMotion';
import { t } from '../lib/lang';
import './Tyres.css';

const ROLE = ['hard', 'medium', 'soft'];

/**
 * The tyre that rolls behind the heading: one made of five real ones
 * (scripts/prepare-tyres.py). It goes to CSS as --ring, so it is made absolute
 * here: a relative url() in a custom property resolves against the stylesheet
 * that uses it (assets/), not against the page.
 */
const RING = `url("${new URL(`${import.meta.env.BASE_URL}photos/tyres/ring.webp`, document.baseURI).href}")`;

/** A ring like the tyre's own sidewall: the compound's two painted arcs round a letter. */
function Badge({ letter }) {
  return (
    <span className="tbadge" aria-hidden="true">
      <b>{letter}</b>
    </span>
  );
}

/** Grip and life as short bars, against the other two slicks. */
function Meters({ grip, life }) {
  return (
    <dl className="tmeter">
      {[
        ['Grip', grip],
        ['Life', life],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd>
            <span className="tmeter__bars" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <i key={n} data-on={n <= value ? '' : undefined} style={{ '--n': n }} />
              ))}
            </span>
            <span className="sr-only">{t('{n} out of 5', { n: value })}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** How much water a rain tyre clears, as a bar against the full wet's 85 litres. */
function Water({ water }) {
  const top = water[water.length - 1];
  return (
    <div className="twater">
      <p className="twater__fig">
        <strong className="t-num">{water.join('–')}</strong>
        <span>{t('litres of water a second, per tyre, at 300 km/h')}</span>
      </p>
      <span className="twater__bar" aria-hidden="true">
        <i style={{ '--share': top / 85 }} />
      </span>
    </div>
  );
}

function TyreCard({ tyre, index }) {
  const [ref, inView] = useInView({ threshold: 0.15 });
  return (
    <article className="tcard" ref={ref} data-tyre={tyre.id} data-inview={inView ? 'true' : 'false'} style={{ '--i': index }} aria-labelledby={`tyre-${tyre.id}`}>
      <div className="tcard__photo">
        <Photo id={`tyres/${tyre.photo}`} alt={t(tyre.caption)} ratio="4 / 5" className="wipe" />
        <Badge letter={tyre.letter} />
      </div>
      <div className="tcard__copy">
        <p className="tcard__label rise" style={{ '--delay': '200ms' }}>
          <i aria-hidden="true" /> {t(tyre.colour)}
        </p>
        <h4 id={`tyre-${tyre.id}`} className="tcard__name">
          <SplitText text={t(tyre.name)} styleName="rise" delay={240} />
        </h4>
        <p className="tcard__line rise" style={{ '--delay': '320ms' }}>
          {t(tyre.line)}
        </p>
        <p className="tcard__body rise" style={{ '--delay': '380ms' }}>
          {t(tyre.body)}
        </p>
        <div className="rise" style={{ '--delay': '440ms' }}>
          {tyre.water ? <Water water={tyre.water} /> : <Meters grip={tyre.grip} life={tyre.life} />}
        </div>
        <ul className="tcard__use rise" style={{ '--delay': '500ms' }}>
          {tyre.use.map((u) => (
            <li key={u}>{t(u)}</li>
          ))}
        </ul>
        <Credit id={`tyres/${tyre.photo}`} />
      </div>
    </article>
  );
}

/**
 * C1 to C5, with the three Pirelli brings to a race lit up as hard, medium and
 * soft. The pick slides along while it is on screen: the colours stay where
 * they are while the compounds under them change, as they do from track to track.
 */
function CompoundScale() {
  const [start, setStart] = useState(1);
  const [ref, inView] = useInView({ once: false, threshold: 0.4 });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView || reduced) return undefined;
    const id = setInterval(() => setStart((s) => (s + 1) % 3), 2400);
    return () => clearInterval(id);
  }, [inView, reduced]);

  return (
    <figure className="cscale" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <figcaption className="tgroup__cap">{t('Five compounds, three at each race')}</figcaption>
      <p className="sr-only">
        {t('From C1, the hardest, to C5, the softest. At a race where Pirelli brings C2, C3 and C4, C2 is the hard, C3 the medium and C4 the soft.')}
      </p>
      <div className="cscale__row" aria-hidden="true" style={{ '--start': start }}>
        {COMPOUNDS.map((c, i) => {
          const role = ROLE[i - start];
          return (
            <span key={c} className="cscale__c" data-role={role}>
              <b className="t-num">{c}</b>
              <small>{role ? t(role) : ' '}</small>
            </span>
          );
        })}
        <i className="cscale__pick" />
      </div>
      <p className="cscale__ends" aria-hidden="true">
        <span>{t('Hardest')}</span>
        <span>{t('Softest')}</span>
      </p>
    </figure>
  );
}

/** Which tyre for which track: slicks, then the intermediate, then the full wet as the water gets deeper. */
function WetScale() {
  const [ref, inView] = useInView({ threshold: 0.4 });
  return (
    <figure className="wscale" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <figcaption className="tgroup__cap">{t('From dry to standing water')}</figcaption>
      <div className="wscale__bar">
        <span data-t="slick">{t('Slicks')}</span>
        <span data-t="inter">{t('Intermediate')}</span>
        <span data-t="wet">{t('Full wet')}</span>
      </div>
      <ol className="wscale__ticks">
        {['Dry', 'Damp', 'Wet', 'Standing water'].map((w, i) => (
          <li key={w} style={{ '--drops': i }}>
            <span className="wscale__drops" aria-hidden="true">
              {Array.from({ length: i }, (_, k) => (
                <i key={k} />
              ))}
            </span>
            {t(w)}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** The crossover: lap times on intermediates and on slicks as a track dries, and the lap where they cross. */
function Crossover() {
  const [ref, inView] = useInView({ threshold: 0.35 });
  return (
    <article className="tcross" ref={ref} data-inview={inView ? 'true' : 'false'} aria-labelledby="tyres-cross">
      <p className="tgroup__label">{t('The big call')}</p>
      <h4 id="tyres-cross" className="tcross__title">
        {t('The crossover')}
      </h4>
      <figure className="tcross__chart">
        <svg viewBox="0 0 320 178" role="img" aria-label={t('A sketch of lap times as a track dries: on intermediates they improve slowly, on slicks they start far slower and improve quickly, and the two lines cross')}>
          <line className="tcross__axis" x1="16" y1="8" x2="16" y2="158" />
          <line className="tcross__axis" x1="16" y1="158" x2="308" y2="158" />
          <path className="tcross__line tcross__line--inter" pathLength="1" d="M16 78 C 110 92, 200 104, 304 96" />
          <path className="tcross__line tcross__line--slick" pathLength="1" d="M16 14 C 120 36, 170 132, 304 150" />
          <line className="tcross__mark" x1="167.6" y1="96" x2="167.6" y2="158" />
          <circle className="tcross__dot" cx="167.6" cy="96" r="5" />
          <text className="tcross__tag" x="174" y="86">
            {t('Switch')}
          </text>
          <text className="tcross__key tcross__key--inter" x="24" y="68">
            {t('Intermediates')}
          </text>
          <text className="tcross__key tcross__key--slick" x="300" y="141" textAnchor="end">
            {t('Slicks')}
          </text>
          <text className="tcross__axislabel" x="22" y="16">
            {t('↑ Slower laps')}
          </text>
          <text className="tcross__axislabel" x="308" y="174" textAnchor="end">
            {t('Laps, as the track dries →')}
          </text>
        </svg>
      </figure>
      <p className="tcross__body">
        {t(
          'As a wet track dries, a dry line appears and the intermediates start to overheat on it. Soon slicks would be faster: that lap is the crossover. Stop a lap too early and the car slides around on slicks on a damp track; a lap too late and the time is gone. When the rain comes, the same call runs the other way.'
        )}
      </p>
    </article>
  );
}

/** A family of tyres: what they are for, a figure that explains them, then a card for each. */
function Group({ kind, label, title, text, aside, children }) {
  const [ref, inView] = useInView();
  return (
    <section className="tgroup" data-kind={kind} aria-labelledby={`tyres-${kind}`}>
      <header className="tgroup__head" ref={ref} data-inview={inView ? 'true' : 'false'}>
        <div className="tgroup__intro">
          <p className="tgroup__label rise">{label}</p>
          <h3 id={`tyres-${kind}`} className="tgroup__title">
            <SplitText text={title} styleName="rise" delay={80} />
          </h3>
          <p className="tgroup__text rise" style={{ '--delay': '200ms' }}>
            {text}
          </p>
        </div>
        <div className="tgroup__aside rise" style={{ '--delay': '300ms' }}>
          {aside}
        </div>
      </header>
      <div className="tcards">{children}</div>
    </section>
  );
}

/**
 * The tyres. Identity: the sidewall. Every tyre is a real photograph, and the
 * only colours here are the ones painted on the rubber (soft red, medium
 * yellow, hard white, intermediate green, full wet blue), carried into each
 * tyre's badge, bars and figures. Three slicks for the dry, two treaded tyres
 * for the rain, then why they wear out, the 2026 size and the rules.
 */
export default function Tyres() {
  const ref = useProgress('cover');
  const [headRef, headIn] = useInView();
  const [rangeRef, rangeIn] = useInView({ threshold: 0.25 });
  const [wornRef, wornIn] = useInView({ threshold: 0.2 });
  const [sideRef, sideIn] = useInView({ threshold: 0.2 });
  const [rulesRef, rulesIn] = useInView({ threshold: 0.2 });
  const dry = TYRES.filter((t) => t.group === 'dry');
  const wet = TYRES.filter((t) => t.group === 'wet');

  return (
    <section id="tyres" className="tyres p-drive" ref={ref} data-timeline="cover" style={{ '--ring': RING }} aria-labelledby="tyres-title">
      <div className="wrap">
        <header className="tyres__head" ref={headRef} data-inview={headIn ? 'true' : 'false'}>
          <p className="tyres__kicker rise">
            <span className="tyres__tag">{t('Tyres')}</span> {t('What the crew bolts on')}
          </p>
          <h2 id="tyres-title" className="tyres__title t-display" data-skew="">
            <SplitText text={t('Grip has a colour')} styleName="rise" />
          </h2>
          <p className="t-lead rise" style={{ '--delay': '300ms' }}>
            {t(
              'Every car runs on the same Pirelli tyres, and the colour on the sidewall says which one it is: three slicks for a dry track, two treaded tyres for the rain. Choosing when to change from one to another is most of a race strategy.'
            )}
          </p>
        </header>

        <figure className="trange" ref={rangeRef} data-inview={rangeIn ? 'true' : 'false'}>
          <div className="trange__frame">
            <Photo id="tyres/range" alt={t('The five tyres side by side at the Formula 1 Exhibition in London, 2025: soft, medium, hard, intermediate and full wet')} ratio="2 / 1" className="wipe" />
            <ol className="trange__tags" aria-hidden="true">
              {TYRES.map((ty, i) => (
                <li key={ty.id} data-tyre={ty.id} style={{ left: `${ty.hub[0]}%`, top: `${ty.hub[1]}%`, '--i': i }}>
                  <b>{ty.letter}</b>
                  <span>{t(ty.name)}</span>
                </li>
              ))}
            </ol>
          </div>
          <figcaption className="trange__cap">
            <span>{t('The whole range. The colours are the same in 2026; the tyres themselves are a little smaller.')}</span>
            <Credit id="tyres/range" />
          </figcaption>
        </figure>

        <Group
          kind="dry"
          label={t('Slicks')}
          title={t('For a dry track')}
          text={t(
            'No tread at all, so as much rubber as possible touches the road. Pirelli makes five compounds for 2026, from C1, the hardest, to C5, the softest, and brings three of them to each race. The softest of the three is marked red, the middle one yellow and the hardest white, so the colour always means the same thing, even when the compound under it changes.'
          )}
          aside={<CompoundScale />}
        >
          {dry.map((t, i) => (
            <TyreCard key={t.id} tyre={t} index={i} />
          ))}
        </Group>

        <Group
          kind="wet"
          label={t('Treaded')}
          title={t('For a wet track')}
          text={t(
            'On standing water a slick rides up on a film of water and loses its grip: aquaplaning. These two have a tread, grooves that push the water out from under the tyre so the rubber can still reach the track. They are for the wet only; on a dry track the tread overheats and wears away fast.'
          )}
          aside={<WetScale />}
        >
          {wet.map((t, i) => (
            <TyreCard key={t.id} tyre={t} index={i} />
          ))}
          <Crossover />
        </Group>

        <div className="tmore">
          <article className="tpanel tpanel--worn" ref={wornRef} data-inview={wornIn ? 'true' : 'false'} aria-labelledby="tyres-worn">
            <Photo id="tyres/worn" alt={t('A used hard tyre on a Haas after the 2024 Austrian Grand Prix, coated in rubber picked up from the track')} ratio="4 / 3" className="wipe" />
            <p className="tgroup__label rise">{t('Why they stop')}</p>
            <h3 id="tyres-worn" className="tpanel__title">
              {t('Grip wears out')}
            </h3>
            <p className="tpanel__body rise" style={{ '--delay': '150ms' }}>
              {t(
                'A tyre is at its best for only so many laps. Heat, the load through the corners and wheelspin wear the rubber away, and the lap times slowly drop off: degradation. Once old tyres are losing more time than a stop costs in the pit lane, the driver is called in. A used tyre comes back coated in rubber it has picked up off the track.'
              )}
            </p>
            <Credit id="tyres/worn" />
          </article>

          <article className="tpanel tpanel--side" ref={sideRef} data-inview={sideIn ? 'true' : 'false'} aria-labelledby="tyres-size">
            <div className="tside">
              <Photo id="tyres/sidewall" alt={t('A 2026 medium tyre on a car, its size, 280/705-18, moulded into the sidewall')} ratio="1 / 1" className="wipe" />
              {/* Where the size is moulded into the rubber (scripts/prepare-tyres.py). */}
              <span className="tside__pin" aria-hidden="true" style={{ left: '21.8%', top: '30%' }}>
                <i />
                <b className="t-num">280/705-18</b>
              </span>
            </div>
            <p className="tgroup__label rise">2026</p>
            <h3 id="tyres-size" className="tpanel__title">
              {t('Read the sidewall')}
            </h3>
            <p className="tpanel__body rise" style={{ '--delay': '150ms' }}>
              {t(
                'The size is moulded into the rubber: 280 mm wide and 705 mm across, on an 18-inch wheel. That is a 2026 front tyre. Both ends are narrower and smaller than in 2022 to 2025, and a set of four weighs 1.6 kg less.'
              )}
            </p>
            <dl className="tsizes rise" style={{ '--delay': '250ms' }}>
              {SIZES.map((s) => (
                <div key={s.axle}>
                  <dt>{t(s.axle)}</dt>
                  <dd>
                    <strong className="t-num">{s.now.join('/')}</strong>
                    <span className="t-num">{t('was {v}', { v: s.was.join('/') })}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <Credit id="tyres/sidewall" />
          </article>

          <article className="tpanel tpanel--rules" ref={rulesRef} data-inview={rulesIn ? 'true' : 'false'} aria-labelledby="tyres-rules">
            <p className="tgroup__label rise">{t('The rules')}</p>
            <h3 id="tyres-rules" className="tpanel__title">
              {t('Two compounds, every dry race')}
            </h3>
            <ol className="trules">
              {RULES.map((r, i) => (
                <li key={r.figure} className="rise" style={{ '--delay': `${150 + i * 110}ms` }}>
                  <strong className="t-num">{r.figure}</strong>
                  <span>{t(r.text)}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}
