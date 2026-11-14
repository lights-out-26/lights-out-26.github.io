import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TEAM_BY_ID } from '../data/teams';

/**
 * A tiny hash router. Addresses are plain names so they survive any host:
 *   #home (or nothing)   the main page
 *   #about, #tyres ...   the main page, scrolled to that section
 *   #team-ferrari        a team's own page
 *
 * navigate() plays a full-screen transition before swapping the page.
 */
export const SECTIONS = ['about', 'tyres', 'teams', 'drivers', 'records', 'credits'];

export function parse(hash) {
  const name = (hash || '').replace(/^#/, '');
  if (name.startsWith('team-') && TEAM_BY_ID[name.slice(5)]) return { page: 'team', id: name.slice(5), section: null };
  return { page: 'home', id: null, section: SECTIONS.includes(name) ? name : null };
}

const RouterContext = createContext(null);
export const useRouter = () => useContext(RouterContext);

const COVER_MS = 720;
const REVEAL_MS = 900;

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  const [transition, setTransition] = useState({ phase: 'idle', team: null, label: '' });
  const busy = useRef(false);
  const selfNav = useRef(false);
  const homeScroll = useRef(0);
  const routeRef = useRef(route);
  routeRef.current = route;

  const apply = useCallback((next) => {
    const prev = routeRef.current;
    if (prev.page === 'home' && next.page !== 'home') homeScroll.current = window.scrollY;
    setRoute(next);
  }, []);

  const navigate = useCallback(
    (hash, opts = {}) => {
      const next = parse(hash);
      const prev = routeRef.current;
      const samePage = next.page === prev.page && next.id === prev.id;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const commit = () => {
        if (window.location.hash !== hash) {
          selfNav.current = true;
          window.location.hash = hash;
        }
        apply({ ...next, restore: opts.restore && next.page === 'home' ? homeScroll.current : null, stamp: Date.now() });
      };

      if (samePage || reduce || opts.instant) {
        commit();
        return;
      }
      if (busy.current) return;
      busy.current = true;
      const team = next.page === 'team' ? next.id : opts.team || (prev.page === 'team' ? prev.id : null);
      const label = opts.label || (next.page === 'team' ? TEAM_BY_ID[next.id].name : 'The grid');
      setTransition({ phase: 'cover', team, label });
      window.setTimeout(() => {
        commit();
        setTransition({ phase: 'reveal', team, label });
        window.setTimeout(() => {
          setTransition({ phase: 'idle', team, label });
          busy.current = false;
        }, REVEAL_MS);
      }, COVER_MS);
    },
    [apply]
  );

  useEffect(() => {
    const onHash = () => {
      if (selfNav.current) {
        selfNav.current = false;
        return;
      }
      // Back/forward buttons or a pasted address: swap straight away.
      apply({ ...parse(window.location.hash), stamp: Date.now() });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [apply]);

  const value = useMemo(() => ({ route, navigate, transition }), [route, navigate, transition]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

/** An anchor that routes through navigate() but still works as a plain link. */
export function Link({ to, team, label, restore, onClick, children, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to, { team, label, restore });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
