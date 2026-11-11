import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RouterProvider, useRouter } from './router/router';
import { TEAM_BY_ID } from './data/teams';
import { refresh } from './lib/scroll';
import { initSmoothScroll, scrollToEl, scrollToY, refreshTriggers } from './lib/smooth';
import { armSound } from './lib/sound';
import Preloader from './components/Preloader';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Transition from './components/Transition';
import Home from './pages/Home';
import TeamPage from './pages/TeamPage';

function Shell() {
  const { route } = useRouter();
  const [booted, setBooted] = useState(false);
  const previous = useRef(null);
  const onBoot = useCallback(() => setBooted(true), []);

  useEffect(() => {
    initSmoothScroll();
    armSound();
  }, []);

  // Put the scroll position where each kind of navigation expects it.
  useLayoutEffect(() => {
    const was = previous.current;
    previous.current = route;
    const sameHome = was && was.page === 'home' && route.page === 'home';

    if (route.page === 'team') {
      scrollToY(0, { smooth: false });
    } else if (route.restore != null) {
      scrollToY(route.restore, { smooth: false });
    } else if (route.section) {
      const go = () => scrollToEl(document.getElementById(route.section), !!sameHome);
      if (sameHome) go();
      else requestAnimationFrame(go);
    } else if (sameHome && route.stamp) {
      scrollToEl(document.body, true);
    } else if (was) {
      scrollToY(0, { smooth: false });
    }
    refresh();
    refreshTriggers();
  }, [route]);

  useEffect(() => {
    const team = route.page === 'team' ? TEAM_BY_ID[route.id] : null;
    document.title = team ? `${team.name} — Lights Out 26` : 'Lights Out 26';
  }, [route]);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        {route.page === 'team' ? <TeamPage key={route.id} id={route.id} /> : <Home booted={booted} />}
      </main>
      <Transition />
      <Preloader onDone={onBoot} />
      <Cursor />
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}
