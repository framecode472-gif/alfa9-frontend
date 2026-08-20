import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer.jsx';
import WelcomePopup from '../../components/WelcomePopup/WelcomePopup.jsx';
import SplashScreen from '../../components/SplashScreen/SplashScreen.jsx';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Home.css';

const SLIDES = [1, 2, 3, 4, 5].map((n) => `/image/slider-image-${n}.png`);

const ANNOUNCEMENT_KEYS = ['home_announce_1', 'home_announce_2', 'home_announce_3'];

const CATEGORIES_ROW1 = [
  { key: 'popular', label: 'Popular', bg: '/image/clickfunnelimage10 (2).png', icon: '/image/clickfunnelimage09 (1).png' },
  { key: 'fishing', label: 'Fishing', bg: '/image/clickfunnelimage12 (2).png', icon: '/image/clickfunnelimage11 (2).png' },
];
const CATEGORIES_ROW2 = [
  { key: 'slots', label: 'Slots', bg: '/image/clickfunnelimage14 (1).png', icon: '/image/slot.png' },
  { key: 'lottery', label: 'Lottery', bg: '/image/clickfunnelimage16 (1).png', icon: '/image/lottery.png' },
  { key: 'original', label: 'Original', bg: '/image/clickfunnelimage18 (1).png', icon: '/image/avaitor.png' },
];
const CATEGORIES_ROW3 = [
  { key: 'casino', label: 'Casino', bg: '/image/clickfunnelimage20 (1).png', icon: '/image/casino.png' },
  { key: 'sports', label: 'Sports', bg: '/image/clickfunnelimage22 (1).png', icon: '/image/sport.png' },
  { key: 'rummy', label: 'Rummy', bg: '/image/clickfunnelimage24 (1).png', icon: '/image/Rummy.png' },
];

const SECTION_IDS = {
  popular: 'section-popular',
  fishing: 'section-fishing',
  slots: 'section-slots',
  lottery: 'section-lottery',
  original: 'section-original',
  casino: 'section-casino',
  sports: 'section-sports',
  rummy: 'section-rummy',
};

// These 6 are shown as static recommendation cards — no click/redirect
// behaviour, just image + RTP display.
const PLATFORM_GAMES = [
  { img: '/image/chicken.png', alt: 'Chicken Road 2', rtp: '97.8%' },
  { img: '/image/firstavai.png', alt: 'Aviator', rtp: '96.85%' },
  { img: '/image/Javeline.png', alt: 'Javelin', rtp: '97.02%' },
  { img: '/image/Booms.png', alt: 'Boom', rtp: '97%', route: '/games/boom' },
  { img: '/image/Fortunetiger.png', alt: 'Fortune Tiger', rtp: '96.42%' },
  { img: '/image/avatorcard.png', alt: 'Aviator 2', rtp: '96.5%' },
];

const LOTTERY_GAMES = [
  { name: 'Win Go', img: '/image/wingo.png' },
  { name: 'K3', img: '/image/k3.png' },
  { name: '5D', img: '/image/5D.png' },
];

// Maps lottery game name -> its route
const LOTTERY_ROUTES = {
  'Win Go': '/lottery/wingo',
  K3: '/lottery/k3',
  '5D': '/lottery/5d',
};

const ORIGINAL_GAMES = [
  { img: '/image/mine.png', alt: 'Mines' },
  { img: '/image/chicken.png', alt: 'Chicken Road 2' },
  { img: '/image/pubg.png', alt: 'PUBG 1MIN' },
  { img: '/image/vortex.png', alt: 'Vortex' },
  { img: '/image/firstavai.png', alt: 'Aviator' },
  { img: '/image/Javeline.png', alt: 'Javelin' },
];

const SLOT_PROVIDERS = [
  { img: '/image/slot3.png', alt: 'JILI Game' },
  { img: '/image/slot1.png', alt: 'M Game' },
  { img: '/image/slot2.png', alt: 'PG Game' },
  { img: '/image/slot4.png', alt: 'JDB' },
  { img: '/image/slot5.png', alt: 'PP Game' },
];

const SPORTS_GAMES = [
  { img: '/image/sportgame11.png', alt: 'Sports' },
  { img: '/image/sportgame22.png', alt: 'Sports' },
];

const CASINO_GAMES = [
  { img: '/image/casion1.png', alt: 'Dragon Tiger' },
  { img: '/image/casion2.png', alt: 'Crazy Time' },
  { img: '/image/casion3.png', alt: 'Baccarat' },
  { img: '/image/casion4.png', alt: 'Super Sic Bo' },
  { img: '/image/casion5.png', alt: 'Auto Roulette' },
  { img: '/image/casion6.png', alt: 'Blackjack' },
];

const FISHING_GAMES = [
  { img: '/image/fishing-1.png', alt: 'Jackpot Fishing' },
  { img: '/image/fishing-2.png', alt: 'Royal Fishing' },
  { img: '/image/fishing-3.png', alt: 'All Star Fishing' },
  { img: '/image/fishing-4.png', alt: 'Bombing Fishing' },
  { img: '/image/fishing-5.png', alt: 'Dragon Fishing' },
  { img: '/image/fishing-6.png', alt: 'Happy Fishing' },
];

const RUMMY_GAMES = [
  { img: '/image/Rummy1.png', alt: 'Rummy' },
  { img: '/image/Rummy2.png', alt: 'Rummy' },
];

const ALL_WINNERS = [
  { name: 'Mem***NCP', avatar: '/image/winner1.webp', game: '/image/gamewinner1.png', amount: 'Rs75.00' },
  { name: 'Mem***WKV', avatar: '/image/winner2.webp', game: '/image/gamewinner3.png', amount: 'Rs325.00' },
  { name: 'Mem***VWD', avatar: '/image/winner3.webp', game: '/image/5D.png', amount: 'Rs290.00' },
  { name: 'Mem***RHE', avatar: '/image/winner1.webp', game: '/image/5D.png', amount: 'Rs75.00' },
  { name: 'Mem***MTQ', avatar: '/image/winner6.webp', game: '/image/gamewinner3.png', amount: 'Rs60.00' },
  { name: 'Mem***ZNK', avatar: '/image/ava-6.png', game: '/image/gamewinner1.png', amount: 'Rs510.00' },
  { name: 'Mem***ALI', avatar: '/image/mem3.webp', game: '/image/5D.png', amount: 'Rs180.00' },
  { name: 'Lo***ya', avatar: '/image/winner6.webp', game: '/image/gamewinner3.png', amount: 'Rs1,250.00' },
  { name: 'N00***KHN', avatar: '/image/mem33.webp', game: '/image/gamewinner1.png', amount: 'Rs430.00' },
  { name: 'Mem***BEU', avatar: '/image/winner5.webp', game: '/image/5D.png', amount: 'Rs95.00' },
  { name: 'Mem***PSY', avatar: '/image/winner1.webp', game: '/image/gamewinner3.png', amount: 'Rs2,100.00' },
  { name: 'Mem***RNK', avatar: '/image/mem33.webp', game: '/image/gamewinner1.png', amount: 'Rs370.00' },
];

function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}

const LEADERBOARD = [
  { rank: 4, avatar: '/image/winner2.webp', name: 'Mem***ABC', amount: 'Rs1,789,161.83' },
  { rank: 5, avatar: '/image/winner6.webp', name: 'Lo***ya', amount: 'Rs1,355,085.20' },
  { rank: 6, avatar: '/image/winner1.webp', name: 'lhs***lah', amount: 'Rs1,184,232.00' },
  { rank: 7, avatar: '/image/mem33.webp', name: 'Mem***RNK', amount: 'Rs1,032,510.00' },
  { rank: 8, avatar: '/image/mem3.webp', name: 'N00***ALI', amount: 'Rs949,370.00' },
  { rank: 9, avatar: '/image/mem33.webp', name: 'Mem***NZN', amount: 'Rs904,870.00' },
  { rank: 10, avatar: '/image/ava-6.png', name: 'Mem***H2I', amount: 'Rs883,862.00' },
];

/* ── Scroll-reveal ──────────────────────────────────────────────────
   Tracks whether an element is currently in the viewport (not just
   "has it ever been in view" — it flips back to false when the element
   scrolls out), so sections replay their entrance animation both when
   scrolling down into them and when scrolling back up past them. */
function useRevealSection(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/* Generic reveal wrapper — renders as whatever tag the section needs
   (section/div) and exposes `.is-visible` for CSS to animate against. */
function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, inView] = useRevealSection();
  return (
    <Tag ref={ref} className={`reveal-parent${inView ? ' is-visible' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}

/* Premium "coming soon" toast — hidden by default so the artwork stays
   clean, and only pops in over the tapped card for a couple seconds.
   FIX: now driven by `active` prop (true only right after a tap) instead
   of being visible at all times. Replaces the old native browser alert()
   on click. */
function ComingSoonOverlay({ active }) {
  return (
    <div className={`coming-soon-overlay${active ? ' is-active' : ''}`}>
      <span className="coming-soon-pill">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2"></rect>
          <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
        </svg>
        <span className="csp-text">Coming Soon</span>
      </span>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);

  // ── SPLASH SCREEN (only right after login/register, not on refresh) ──
  const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem('alfa9_show_splash') === '1');
  const handleSplashFinish = () => {
    sessionStorage.removeItem('alfa9_show_splash');
    setShowSplash(false);
  };

  // ── HERO MOUNT-IN ──
  // The above-the-fold block (header, slider, announcement, categories)
  // animates in once, right after first paint, in a short stagger.
  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setHeroReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── SLIDER ──
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderTimerRef = useRef(null);
  const touchXRef = useRef(0);

  const resetSliderTimer = () => {
    if (sliderTimerRef.current) clearInterval(sliderTimerRef.current);
    sliderTimerRef.current = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % SLIDES.length);
    }, 5000);
  };

  useEffect(() => {
    resetSliderTimer();
    return () => clearInterval(sliderTimerRef.current);
  }, []);

  const goToSlide = (n) => {
    setCurrentSlide(n);
    resetSliderTimer();
  };

  const handleTouchStart = (e) => {
    touchXRef.current = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchXRef.current - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      const next = diff > 0 ? (currentSlide + 1) % SLIDES.length : (currentSlide - 1 + SLIDES.length) % SLIDES.length;
      goToSlide(next);
    }
  };

  // ── ANNOUNCEMENT MARQUEE ──
  const [annIndex, setAnnIndex] = useState(0);
  const [annKey, setAnnKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnIndex((i) => (i + 1) % ANNOUNCEMENT_KEYS.length);
      setAnnKey((k) => k + 1);
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  // ── CATEGORY SMOOTH SCROLL ──
  const handleCategoryClick = (key) => {
    const section = document.getElementById(SECTION_IDS[key]);
    if (!section) return;
    const headerH = document.querySelector('.home-page .header')?.offsetHeight || 56;
    const y = section.getBoundingClientRect().top + window.scrollY - headerH - 8;
    window.scrollTo({ top: y, behavior: 'smooth' });
    const bar = section.querySelector('.title-bar');
    if (bar) {
      bar.style.boxShadow = '0 0 18px 4px #d4af37';
      setTimeout(() => { bar.style.boxShadow = ''; }, 900);
    }
  };

  // ── GAME CLICK HANDLERS ──
  const handleLotteryClick = (name) => {
    const route = LOTTERY_ROUTES[name];
    if (route) navigate(route);
  };

  // ── "COMING SOON" LOCKED-CARD TAP STATE ──
  // Overlay is hidden by default; tapping a locked card flashes it on
  // for ~1.8s over that specific card, then hides again.
  const [activeLocked, setActiveLocked] = useState({});
  const showComingSoon = (key) => {
    setActiveLocked((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setActiveLocked((prev) => ({ ...prev, [key]: false }));
    }, 1800);
  };

  // ── LIVE WINNING LIST ──
  const poolRef = useRef(shuffle(ALL_WINNERS));
  const ptrRef = useRef(0);
  const [visibleWinners, setVisibleWinners] = useState(() => {
    const initial = poolRef.current.slice(0, 5).map((w, i) => ({ ...w, _id: `seed-${i}`, anim: 'slide-in' }));
    ptrRef.current = 5;
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleWinners((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[idx] = { ...next[idx], anim: 'slide-out' };
        return next;
      });

      setTimeout(() => {
        setVisibleWinners((prev) => {
          if (ptrRef.current >= poolRef.current.length) {
            poolRef.current = shuffle(ALL_WINNERS);
            ptrRef.current = 0;
          }
          const winner = poolRef.current[ptrRef.current++];
          const idx = prev.findIndex((w) => w.anim === 'slide-out');
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = { ...winner, _id: `${winner.name}-${Date.now()}-${Math.random()}`, anim: 'slide-in' };
          return next;
        });
      }, 420);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderCategoryCard = (cat, sizeClass, i) => (
    <div
      key={cat.key}
      className={`category-card ${sizeClass}`}
      style={{ backgroundImage: `url('${cat.bg}')`, '--i': i }}
      onClick={() => handleCategoryClick(cat.key)}
    >
      <img src={cat.icon} alt={cat.label} className="category-icon" />
      <span className="category-label">{t(`cat_${cat.key}`)}</span>
    </div>
  );

  // Splash covers the whole screen for 5s + exit animation, then Home
  // mounts normally below. Only fires right after login/register.
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="home-page">
      <WelcomePopup />

      {/* HEADER */}
      <header className={`header${heroReady ? ' is-in' : ''}`}>
        <div className="logo">
          <img src="/image/ultraalf9.png" alt="Alfa9 Logo" id="logo-img" />
        </div>
        <div className="header-icon">
          <div className="lang-icon" onClick={() => setShowLangSwitcher(true)} title={t('language')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="msg-icon" onClick={() => navigate('/notification')}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
        </div>
      </header>

      {/* SLIDER */}
      <div className={`slider-container${heroReady ? ' is-in' : ''}`}>
        <div className="slider" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {SLIDES.map((src, i) => (
            <div key={src} className={`slide ${i === currentSlide ? 'active' : ''}`}>
              <img src={src} alt={`Banner ${i + 1}`} />
            </div>
          ))}
        </div>
        <div className="slider-dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => goToSlide(i)}></div>
          ))}
        </div>
      </div>

      {/* ANNOUNCEMENT */}
      <div className={`announcement${heroReady ? ' is-in' : ''}`}>
        <div className="announce-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4af37">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <div className="announce-text-wrapper">
          <div className="announce-text" key={annKey}>
            <span>{t(ANNOUNCEMENT_KEYS[annIndex])}</span>
          </div>
        </div>
        <button className="detail-btn" onClick={() => navigate('/notification')}>{t('detail')}</button>
      </div>

      {/* CATEGORY GRID */}
      <div className={`category-grid${heroReady ? ' is-in' : ''}`}>
        <div className="category-row-2">{CATEGORIES_ROW1.map((c, i) => renderCategoryCard(c, 'cat-large', i))}</div>
        <div className="category-row-3">{CATEGORIES_ROW2.map((c, i) => renderCategoryCard(c, 'cat-medium', i))}</div>
        <div className="category-row-3">{CATEGORIES_ROW3.map((c, i) => renderCategoryCard(c, 'cat-medium', i))}</div>
      </div>

      {/* PLATFORM RECOMMENDATION */}
      <Reveal as="section" className="section" id="section-popular">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Platform recommendation</span></div>
          <button className="all-btn">All 6 <span className="arrow">›</span></button>
        </div>
        <div className="games-grid">
          {PLATFORM_GAMES.map((g, i) => (
            <div
              className={`game-card${g.route ? '' : ' is-locked'}`}
              key={g.alt}
              style={{ '--i': i }}
              onClick={() => (g.route ? navigate(g.route) : showComingSoon(`platform-${i}`))}
            >
              <img src={g.img} alt={g.alt} className="game-img" />
              <div className="rtp-bar"><span>RTP</span><span>{g.rtp}</span></div>
              {!g.route && <ComingSoonOverlay active={!!activeLocked[`platform-${i}`]} />}
            </div>
          ))}
        </div>
      </Reveal>

      {/* LOTTERY */}
      <Reveal as="section" className="section" id="section-lottery">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Lottery</span></div>
          <button className="all-btn">All <span className="arrow">›</span></button>
        </div>
        <div className="lottery-grid">
          {LOTTERY_GAMES.map((g, i) => (
            <div className="lottery-card" key={g.name} style={{ '--i': i }} onClick={() => handleLotteryClick(g.name)}>
              <span className="lottery-name">{g.name}</span>
              <img src={g.img} alt={g.name} className="lottery-img" />
            </div>
          ))}
        </div>
      </Reveal>

      {/* ORIGINAL */}
      <Reveal as="section" className="section" id="section-original">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Original</span></div>
          <button className="all-btn">All 6 <span className="arrow">›</span></button>
        </div>
        <div className="games-grid">
          {ORIGINAL_GAMES.map((g, i) => (
            <div className="game-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`original-${i}`)}>
              <img src={g.img} alt={g.alt} className="game-img" />
              <ComingSoonOverlay active={!!activeLocked[`original-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* SLOTS */}
      <Reveal as="section" className="section" id="section-slots">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Slots</span></div>
          <button className="all-btn">All 5 <span className="arrow">›</span></button>
        </div>
        <div className="providers-grid">
          {SLOT_PROVIDERS.map((p, i) => (
            <div className="provider-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`slots-${i}`)}>
              <img src={p.img} alt={p.alt} className="provider-img" />
              <ComingSoonOverlay active={!!activeLocked[`slots-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* SPORTS */}
      <Reveal as="section" className="section" id="section-sports">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Sports</span></div>
          <button className="all-btn">All 2 <span className="arrow">›</span></button>
        </div>
        <div className="sports-grid">
          {SPORTS_GAMES.map((s, i) => (
            <div className="sports-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`sports-${i}`)}>
              <img src={s.img} alt={s.alt} className="sports-img" />
              <ComingSoonOverlay active={!!activeLocked[`sports-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* CASINO */}
      <Reveal as="section" className="section" id="section-casino">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Casino</span></div>
          <button className="all-btn">All <span className="arrow">›</span></button>
        </div>
        <div className="games-grid">
          {CASINO_GAMES.map((g, i) => (
            <div className="game-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`casino-${i}`)}>
              <img src={g.img} alt={g.alt} className="game-img" />
              <ComingSoonOverlay active={!!activeLocked[`casino-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* FISHING */}
      <Reveal as="section" className="section" id="section-fishing">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Fishing</span></div>
          <button className="all-btn">All <span className="arrow">›</span></button>
        </div>
        <div className="games-grid">
          {FISHING_GAMES.map((g, i) => (
            <div className="game-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`fishing-${i}`)}>
              <img src={g.img} alt={g.alt} className="game-img" />
              <ComingSoonOverlay active={!!activeLocked[`fishing-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* RUMMY */}
      <Reveal as="section" className="section" id="section-rummy">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Rummy</span></div>
          <button className="all-btn">All 2 <span className="arrow">›</span></button>
        </div>
        <div className="sports-grid">
          {RUMMY_GAMES.map((g, i) => (
            <div className="sports-card is-locked" key={i} style={{ '--i': i }} onClick={() => showComingSoon(`rummy-${i}`)}>
              <img src={g.img} alt={g.alt} className="sports-img" />
              <ComingSoonOverlay active={!!activeLocked[`rummy-${i}`]} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* WINNING INFORMATION */}
      <Reveal as="section" className="section">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Winning information</span></div>
          <span className="live-badge"><span className="live-dot"></span>LIVE</span>
        </div>
        <div className="winning-list">
          {visibleWinners.map((w) => (
            <div className={`winning-item ${w.anim}`} key={w._id}>
              <img src={w.avatar} alt="Avatar" className="winning-avatar" onError={(e) => { e.target.style.opacity = '0'; }} />
              <span className="winning-name">{w.name}</span>
              <img src={w.game} alt="Game" className="winning-game" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="winning-amount">
                <span className="amount">Receive {w.amount}</span>
                <span className="label">Winning amount</span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* TODAY'S EARNINGS CHART */}
      <Reveal as="section" className="section">
        <div className="section-header">
          <div className="section-title"><span className="title-bar"></span><span>Today's earnings chart</span></div>
        </div>
        <div className="podium-container">
          <div className="podium-col second-col" style={{ '--i': 0 }}>
            <img src="/image/king2.webp" alt="NO2 badge" className="podium-badge-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <img src="/image/winner1.webp" alt="2nd place" className="podium-face second-face" />
            <div className="podium-box-wrap">
              <img src="/image/podium-box-2.png" alt="2nd box" className="podium-box-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="podium-box-overlay">
                <span className="rank-badge-text">NO2</span>
                <span className="podium-name">Mem***ZNA</span>
                <span className="podium-amount">Rs3,055,240.16</span>
              </div>
            </div>
          </div>
          <div className="podium-col first-col" style={{ '--i': 1 }}>
            <img src="/image/king1.webp" alt="NO1 crown" className="podium-badge-img crown-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <img src="/image/ava-1.webp" alt="1st place" className="podium-face first-face" />
            <div className="podium-box-wrap">
              <img src="/image/podium-box-1.png" alt="1st box" className="podium-box-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="podium-box-overlay">
                <span className="rank-badge-text">NO1</span>
                <span className="podium-name gold-text">Mem***ZCX</span>
                <span className="podium-amount gold-text">Rs5,441,921.17</span>
              </div>
            </div>
          </div>
          <div className="podium-col third-col" style={{ '--i': 2 }}>
            <img src="/image/king3.webp" alt="NO3 badge" className="podium-badge-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <img src="/image/winner5.webp" alt="3rd place" className="podium-face second-face" />
            <div className="podium-box-wrap">
              <img src="/image/podium-box-3.png" alt="3rd box" className="podium-box-img" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="podium-box-overlay">
                <span className="rank-badge-text">NO3</span>
                <span className="podium-name">Mem***PSY</span>
                <span className="podium-amount">Rs1,990,975.00</span>
              </div>
            </div>
          </div>
        </div>
        <div className="leaderboard">
          {LEADERBOARD.map((l, i) => (
            <div className="leader-item" key={l.rank} style={{ '--i': i }}>
              <span className="leader-rank">{l.rank}</span>
              <img src={l.avatar} alt="Avatar" className="leader-avatar" />
              <span className="leader-name">{l.name}</span>
              <span className="leader-amount">{l.amount}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* INFORMATION SECTION */}
      <Reveal as="section" className="section info-section">
        <div className="info-providers-grid">
          {['ultraalf9.png', '18+.png', 'call icon.webp', 'CQ9.png', 'icon image.png', 'JDB.png'].map((img, i) => (
            <div className="info-provider-card" key={i} style={{ '--i': i }}>
              <img
                src={`/image/${img}`}
                alt={`Provider ${i + 1}`}
                className="info-provider-img"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
              />
              <div className="info-provider-placeholder">Provider {i + 1}</div>
            </div>
          ))}
        </div>
        <div className="info-points">
          <div className="info-point"><span className="info-diamond">◆</span><span>The platform advocates fairness, justice, and openness. We mainly operate fair lottery, blockchain games, live casinos, and slot machine games.</span></div>
          <div className="info-point"><span className="info-diamond">◆</span><span>Alfa9 works with more than 10,000 online live game dealers and slot games, all of which are verified fair games.</span></div>
          <div className="info-point"><span className="info-diamond">◆</span><span>Alfa9 supports fast deposit and withdrawal, and looks forward to your visit.</span></div>
        </div>
        <div className="info-warning">
          <p>Gambling can be addictive, please play rationally.</p>
          <p>Alfa9 only accepts customers above the age of 18.</p>
        </div>
      </Reveal>

      {/* PAGE MENU LIST */}
      <Reveal as="div" className="page-menu">
        <div className="menu-item" style={{ '--i': 0 }}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <span className="menu-label">Language</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div className="menu-item" style={{ '--i': 1 }} onClick={() => navigate('/notification')}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
          </div>
          <span className="menu-label">Announcement</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div className="menu-item" style={{ '--i': 2 }} onClick={() => navigate('/customer-service')}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span className="menu-label">24/7 Customer service</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div className="menu-item" style={{ '--i': 3 }} onClick={() => navigate('/account/beginner-guide')}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <span className="menu-label">Beginner's Guide</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div className="menu-item" style={{ '--i': 4 }} onClick={() => navigate('/account/about-us')}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <span className="menu-label">About us</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div className="menu-item" style={{ '--i': 5 }}>
          <div className="menu-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <span className="menu-label">Download APP</span>
          <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b7355" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </Reveal>

      <div className="bottom-spacer"></div>

      <Footer active="home" />

      <LanguageSwitcher open={showLangSwitcher} onClose={() => setShowLangSwitcher(false)} />
    </div>
  );
}

export default Home;