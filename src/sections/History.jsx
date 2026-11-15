import { useEffect } from 'react';
import Photo, { Credit } from '../components/Photo';
import SplitText from '../components/SplitText';
import { ERAS } from '../data/history';
import { soundCreditFor } from '../data/credits';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import { isSoundOn, play, preloadSounds } from '../lib/sound';
import { t } from '../lib/lang';
import './History.css';

/**
 * Each era's sound: a car of that time where one was recorded. The hybrid eras use
 * 2021 race recordings of the turbo-hybrid V6, which the 2026 engines keep.
 */
const ERA_SOUND = { 1950: 'era-1950', 1978: 'era-1978', 1988: 'era-1988', 2004: 'era-2004', 2014: 'era-2014', 2026: 'era-2026' };

// One era sound at a time: the next era's car takes over from the last.
let current = null;
function playEra(name) {
  if (current) current.stop(0.8);
  current = play(name, { volume: 0.9 });
}

function SoundCredit({ name }) {
  const c = soundCreditFor(name);
  if (!c) return null;
  return (
    <span className="credit">
      {t('Sound')}:{' '}
      <a className="link" href={c.url} target="_blank" rel="noreferrer">
        {c.car}, {c.author}
      </a>
      ,{' '}
      <a className="link" href={c.licence.url} target="_blank" rel="noreferrer">
        {c.licence.name}
      </a>
    </span>
  );
}

function Era({ era, index, near }) {
  const [ref, inView, visible] = useInView({ track: true, margin: '0px -18% 0px -18%', threshold: 0.2 });
  const sound = ERA_SOUND[era.year];

  // With sound on, the era's engine plays as its photo arrives, every time it does.
  useEffect(() => {
    if (visible && sound && isSoundOn()) playEra(sound);
  }, [visible, sound]);
  return (
    <article className="era" ref={ref} data-inview={inView ? 'true' : 'false'} style={{ '--i': index }}>
      <span className="era__year t-num" aria-hidden="true">
        {era.year}
      </span>
      <div className="era__photo">
        <Photo id={era.photo} alt={t(era.caption)} ratio="16 / 10" className="wipe" eager={near} />
        <p className="era__credits">
          <Credit id={era.photo} />
          {sound && <SoundCredit name={sound} />}
        </p>
      </div>
      <div className="era__copy">
        <p className="era__car rise" style={{ '--delay': '120ms' }}>
          <span className="t-num">{era.year}</span> {t(era.car)}
        </p>
        <h3 className="era__title">
          <SplitText text={t(era.title)} styleName="rise" delay={180} />
        </h3>
        <p className="era__body rise" style={{ '--delay': '320ms' }}>
          {t(era.body)}
        </p>
        <ul className="era__facts rise" style={{ '--delay': '420ms' }}>
          {era.fact.map((f) => (
            <li key={f}>{t(f)}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * History. Identity: a sideways journey. The section pins and scrolling moves
 * a long strip of cars past, one era at a time, with the years as the scenery.
 * On narrow screens it becomes an ordinary vertical list.
 */
export default function History() {
  const ref = useProgress('contain');
  const [headRef, headIn] = useInView();
  // Start fetching the photos a screen before the section arrives.
  const [nearRef, near] = useInView({ margin: '100% 0px 100% 0px', threshold: 0 });
  useEffect(() => {
    if (near) preloadSounds(Object.values(ERA_SOUND));
  }, [near]);
  return (
    <section id="about" className="history p-drive" ref={(el) => { ref.current = el; nearRef.current = el; }} data-timeline="contain">
      <div className="history__pin">
        <div className="history__track scrub">
          <header className="history__head" ref={headRef} data-inview={headIn ? 'true' : 'false'}>
            <h2 className="history__title t-display" data-skew="">
              <SplitText text={t('Seventy-six years, six cars')} styleName="rise" />
            </h2>
            <p className="t-lead rise" style={{ '--delay': '400ms' }}>
              {t(
                'Formula 1 is the top class of single-seater racing, and its World Championship has run every year since 1950. The rules are rewritten every few seasons, and each rewrite produces a different kind of car.'
              )}
            </p>
            <p className="history__hint rise" style={{ '--delay': '520ms' }}>
              {t('Keep scrolling. The cars come to you.')}
            </p>
          </header>
          {ERAS.map((era, i) => (
            <Era key={era.year} era={era} index={i} near={near} />
          ))}
        </div>

        <div className="history__ruler" aria-hidden="true">
          <div className="history__ticks">
            {ERAS.map((era) => (
              <span key={era.year} className="t-num">
                {era.year}
              </span>
            ))}
          </div>
          <div className="history__bar">
            <i className="scrub" />
          </div>
        </div>
      </div>
    </section>
  );
}
