import { CREDIT_GROUPS } from '../data/credits';
import { AS_OF } from '../data/season';
import useInView from '../hooks/useInView';
import './Footer.css';

/** Closing band: a running wordmark, the photo credits and the small print. */
export default function Footer() {
  const [ref, inView] = useInView({ once: false, margin: '0px', threshold: 0 });
  return (
    <footer id="credits" className="footer" ref={ref} data-inview={inView ? 'true' : 'false'}>
      <div className="footer__marquee" aria-hidden="true">
        <div>
          {[0, 1].map((k) => (
            <span key={k}>
              Lights out <i>and away we go</i> Lights out <i>and away we go</i>{' '}
            </span>
          ))}
        </div>
      </div>

      <div className="footer__grid wrap">
        <section className="footer__credits" aria-labelledby="credits-title">
          <h2 id="credits-title" className="footer__h">
            Photographs
          </h2>
          <p className="footer__p">
            Every photograph here comes from Wikimedia Commons under a Creative Commons licence. Each has been resized and cropped, and has a depth map estimated from
            it; the side-on car photos were also cut out of their backgrounds and levelled. These adapted versions, depth maps included, are shared under the same
            licences as the originals.
          </p>
          {CREDIT_GROUPS.map((g) => (
            <div key={`${g.author}-${g.licence.name}`} className="footer__group">
              <p className="footer__author">
                {g.author},{' '}
                <a className="link" href={g.licence.url} target="_blank" rel="noreferrer">
                  {g.licence.name}
                </a>
              </p>
              <ul>
                {g.items.map((item) => (
                  <li key={item.key}>
                    <a className="link" href={item.url} target="_blank" rel="noreferrer">
                      {item.subject}
                      {g.items.length > 5 ? ` (${item.key.startsWith('action/') ? 'on track' : 'side'})` : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="footer__about" aria-labelledby="about-title">
          <h2 id="about-title" className="footer__h">
            About this site
          </h2>
          <p className="footer__p">
            Lights Out 26 is an unofficial fan project, built as a front-end portfolio piece. It is not affiliated with Formula 1, the FIA or any team. Team names, car
            liveries and sponsor marks that appear in the photographs belong to their owners.
          </p>
          <p className="footer__p">
            Results, standings and records are as they stood after round {AS_OF.round} of {AS_OF.of}, the {AS_OF.race} on {AS_OF.date}, compiled from Wikipedia’s season
            and records pages and checked against published standings.
          </p>
          <p className="footer__p">
            Built with React, GSAP and WebGL, with smooth scrolling by Lenis. The cars are the original photographs, drawn by small shaders that use each photo’s depth
            map for parallax, relighting, wheel spin, motion blur and heat haze. The depth maps were made with Depth Anything V2 Small (Apache License 2.0). Type is set
            in Archivo (SIL Open Font License).
          </p>
        </section>
      </div>
    </footer>
  );
}
