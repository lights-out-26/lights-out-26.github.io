import { useEffect, useState } from 'react';
import { Link, useRouter } from '../router/router';
import { lockScroll } from '../lib/smooth';
import SoundToggle from './SoundToggle';
import { setLang, t, useLang } from '../lib/lang';
import './Nav.css';

const LINKS = [
  ['#about', 'The sport'],
  ['#teams', 'Teams'],
  ['#drivers', 'Drivers'],
  ['#records', 'Records'],
];

export default function Nav() {
  const { route } = useRouter();
  const lang = useLang();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  // Slide away while reading down the page, come back on the way up.
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setSolid(y > 40);
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 240);
          last = y;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [route]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onTeam = route.page === 'team';
  const other = lang === 'ko' ? 'en' : 'ko';
  const langLabel = other === 'ko' ? '한국어로 보기' : 'View in English';

  return (
    <header className="nav" data-hidden={hidden && !open ? '' : undefined} data-solid={solid ? '' : undefined} data-open={open ? '' : undefined}>
      <div className="nav__bar wrap">
        <Link to="#home" className="nav__brand" label={t('The grid')} aria-label={t('Lights Out 26, home')}>
          <span className="nav__lights" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </span>
          <span className="nav__name">Lights Out</span>
          <span className="nav__year">26</span>
        </Link>

        <nav className="nav__links" aria-label={t('Sections')}>
          {LINKS.map(([to, text]) => (
            <Link key={to} to={to} className="nav__link" label={t('The grid')} restore={onTeam && to === '#teams'}>
              <span className="nav__clip">
                <span data-text={t(text)}>{t(text)}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="nav__end">
          <button type="button" className="soundtoggle langtoggle" lang={other} aria-label={langLabel} title={langLabel} onClick={() => setLang(other)}>
            {other === 'ko' ? '한' : 'EN'}
          </button>
          <SoundToggle />
          <button className="nav__toggle" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((v) => !v)}>
            <span className="sr-only">{t(open ? 'Close menu' : 'Open menu')}</span>
            <span className="nav__burger" aria-hidden="true">
              <i /><i />
            </span>
          </button>
        </div>
      </div>

      <div className="menu" id="menu" hidden={!open}>
        <nav className="menu__list wrap" aria-label={t('Sections')}>
          {LINKS.map(([to, text], i) => (
            <Link key={to} to={to} className="menu__link" label={t('The grid')} style={{ '--i': i }} restore={onTeam && to === '#teams'}>
              <span>{t(text)}</span>
            </Link>
          ))}
          <Link to="#credits" className="menu__small" label={t('The grid')} style={{ '--i': LINKS.length }}>
            <span>{t('Photo and sound credits')}</span>
          </Link>
          <button type="button" className="menu__small menu__lang" lang={other} style={{ '--i': LINKS.length + 1 }} onClick={() => setLang(other)}>
            <span>{other === 'ko' ? '한국어' : 'English'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
