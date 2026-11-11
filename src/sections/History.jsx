import { Credit } from '../components/Photo';
import GLPhoto from '../components/GLPhoto';
import { glAvailable } from '../gl/engine';
import SplitText from '../components/SplitText';
import { ERAS } from '../data/history';
import useProgress from '../hooks/useProgress';
import useInView from '../hooks/useInView';
import './History.css';

/** The depth map that goes with a photo: eras/1978 -> depth/era-1978, action/mercedes -> depth/action-mercedes. */
const depthOf = (photo) => `depth/${photo.replace('eras/', 'era-').replace('action/', 'action-')}`;

function Era({ era, index, near }) {
  const [ref, inView] = useInView({ margin: '0px -18% 0px -18%', threshold: 0.2 });
  return (
    <article className="era" ref={ref} data-inview={inView ? 'true' : 'false'} style={{ '--i': index }}>
      <span className="era__year t-num" aria-hidden="true">
        {era.year}
      </span>
      <div className="era__photo">
        <GLPhoto
          id={era.photo}
          depth={depthOf(era.photo)}
          alt={era.caption}
          ratio="16 / 10"
          className={glAvailable() ? '' : 'wipe'}
          eager={near}
          tint="#dfe3e8"
          revealOnView
          initial={{ focus: 0.55, zoom: 1.1, dolly: 0.12, tilt: 0.03 }}
        />
        <Credit id={era.photo} />
      </div>
      <div className="era__copy">
        <p className="era__car rise" style={{ '--delay': '120ms' }}>
          <span className="t-num">{era.year}</span> {era.car}
        </p>
        <h3 className="era__title">
          <SplitText text={era.title} styleName="rise" delay={180} />
        </h3>
        <p className="era__body rise" style={{ '--delay': '320ms' }}>
          {era.body}
        </p>
        <ul className="era__facts rise" style={{ '--delay': '420ms' }}>
          {era.fact.map((f) => (
            <li key={f}>{f}</li>
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
  return (
    <section id="about" className="history p-drive" ref={(el) => { ref.current = el; nearRef.current = el; }} data-timeline="contain">
      <div className="history__pin">
        <div className="history__track scrub">
          <header className="history__head" ref={headRef} data-inview={headIn ? 'true' : 'false'}>
            <h2 className="history__title t-display" data-skew="">
              <SplitText text="Seventy-six years, six cars" styleName="rise" />
            </h2>
            <p className="t-lead rise" style={{ '--delay': '400ms' }}>
              Formula 1 is the top class of single-seater racing, and its World Championship has run every year since 1950. The rules are rewritten every few
              seasons, and each rewrite produces a different kind of car.
            </p>
            <p className="history__hint rise" style={{ '--delay': '520ms' }}>
              Keep scrolling. The cars come to you.
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
