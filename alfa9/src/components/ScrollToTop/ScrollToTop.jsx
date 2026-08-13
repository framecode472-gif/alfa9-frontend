import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Browsers auto-restore the old scroll position on back/forward navigation
// (history.scrollRestoration = 'auto' by default). That fights with our
// manual scrollTo below and is the usual reason "scroll to top" still
// doesn't work when using the back button. Turn it off once, on load.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Placed once inside <BrowserRouter>. React Router does NOT reset scroll
// position on navigation like a normal multi-page site does — this makes
// every route change start from the top, and also fixes the "opened a
// sub-page while the previous page was scrolled down, and it opens already
// scrolled down" bug.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;