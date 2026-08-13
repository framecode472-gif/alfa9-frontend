import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Boom.css';
import i18n from './boomLang';
import { apiFetch } from '../../../utils/api';

const GRID_SIZE = 25;
const LOAD_DURATION = 2200;
const PRESETS = [1, 2, 5, 8, 10, 20, 50, 100, 200, 500, 1000, 5000, 10000, 20000];
const MINES_OPTIONS = [1, 2, 3, 5, 8, 10];
const MAX_BET = 20000;
const MIN_BET = 1;
const MAX_WIN = 2000000;

const STAR_SVG = (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bmStarFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff6cf" />
        <stop offset="35%" stopColor="#ffd93b" />
        <stop offset="70%" stopColor="#f5a70e" />
        <stop offset="100%" stopColor="#c76e05" />
      </linearGradient>
      <linearGradient id="bmStarShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon points="50,4 62,36 97,38 69,59 79,94 50,73 21,94 31,59 3,38 38,36" fill="url(#bmStarFill)" stroke="#a85c04" strokeWidth="3" strokeLinejoin="round" />
    <polygon points="50,4 62,36 50,45 38,36" fill="url(#bmStarShine)" />
  </svg>
);
const BOMB_SVG = (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    <defs>
      <radialGradient id="bmBombBody" cx="34%" cy="26%" r="75%">
        <stop offset="0%" stopColor="#b0b0b0" />
        <stop offset="18%" stopColor="#6a6a6a" />
        <stop offset="45%" stopColor="#2c2c2c" />
        <stop offset="75%" stopColor="#0c0c0c" />
        <stop offset="100%" stopColor="#000000" />
      </radialGradient>
      <linearGradient id="bmCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8a8a8a" />
        <stop offset="50%" stopColor="#4a4a4a" />
        <stop offset="100%" stopColor="#1a1a1a" />
      </linearGradient>
      <linearGradient id="bmRopeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8c07a" />
        <stop offset="50%" stopColor="#c99a4e" />
        <stop offset="100%" stopColor="#8a6428" />
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="90" rx="26" ry="5" fill="#000000" opacity="0.3" />
    <g transform="translate(4,0)">
      <ellipse cx="58" cy="22" rx="7" ry="5" fill="url(#bmCapGrad)" transform="rotate(-20 58 22)" />
      <ellipse cx="58" cy="22" rx="3.2" ry="2" fill="#000000" transform="rotate(-20 58 22)" />
      <path d="M56 17 C 62 8, 74 10, 72 20 C 70 28, 80 26, 82 18" fill="none" stroke="url(#bmRopeGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 17 C 62 8, 74 10, 72 20 C 70 28, 80 26, 82 18" fill="none" stroke="#5a3f16" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
      <g transform="translate(84,17)">
        <polygon points="0,-9 2,-2 9,0 2,2 0,9 -2,2 -9,0 -2,-2" fill="#ffcf3a" />
        <polygon points="0,-5 1.2,-1 5,0 1.2,1 0,5 -1.2,1 -5,0 -1.2,-1" fill="#fff2b0" />
      </g>
    </g>
    <circle cx="46" cy="54" r="34" fill="url(#bmBombBody)" />
    <ellipse cx="32" cy="38" rx="9" ry="6" fill="#ffffff" opacity="0.5" />
    <ellipse cx="30" cy="34" rx="3.5" ry="2.2" fill="#ffffff" opacity="0.8" />
  </svg>
);

/* ---------- synthesized sound engine (no audio files) ---------- */
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function envGain(ac, t0, dur, peak) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}
function randomGameId() {
  let id = '';
  for (let i = 0; i < 11; i++) id += Math.floor(Math.random() * 10);
  return id;
}
function randomHex(len) {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function Boom() {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  /* loader */
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  /* balance & lang */
  const [balance, setBalance] = useState(0);
  const [lang, setLang] = useState('en');
  const t = i18n[lang];

  /* sound */
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const playClick = useCallback(() => {
    if (!soundOnRef.current) return;
    const ac = getCtx(); const t0 = ac.currentTime;
    const osc = ac.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(720, t0);
    const g = envGain(ac, t0, 0.06, 0.05);
    osc.connect(g); g.connect(ac.destination); osc.start(t0); osc.stop(t0 + 0.07);
  }, []);
  const playGem = useCallback(() => {
    if (!soundOnRef.current) return;
    const ac = getCtx(); const t0 = ac.currentTime;
    const osc = ac.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t0);
    osc.frequency.exponentialRampToValueAtTime(1400, t0 + 0.12);
    const g = envGain(ac, t0, 0.18, 0.12);
    osc.connect(g); g.connect(ac.destination); osc.start(t0); osc.stop(t0 + 0.2);
  }, []);
  const playBoom = useCallback(() => {
    if (!soundOnRef.current) return;
    const ac = getCtx(); const t0 = ac.currentTime;
    const bufferSize = ac.sampleRate * 0.5;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    const noise = ac.createBufferSource(); noise.buffer = buffer;
    const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1200, t0);
    filter.frequency.exponentialRampToValueAtTime(80, t0 + 0.45);
    const g = ac.createGain(); g.gain.setValueAtTime(0.5, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    noise.connect(filter); filter.connect(g); g.connect(ac.destination);
    const osc = ac.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(35, t0 + 0.4);
    const g2 = envGain(ac, t0, 0.4, 0.5);
    osc.connect(g2); g2.connect(ac.destination);
    noise.start(t0); noise.stop(t0 + 0.5); osc.start(t0); osc.stop(t0 + 0.42);
  }, []);
  const playCashout = useCallback(() => {
    if (!soundOnRef.current) return;
    const ac = getCtx(); const notes = [520, 660, 780, 1040];
    notes.forEach((f, i) => {
      const t0 = ac.currentTime + i * 0.08;
      const osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(f, t0);
      const g = envGain(ac, t0, 0.16, 0.09);
      osc.connect(g); g.connect(ac.destination); osc.start(t0); osc.stop(t0 + 0.18);
    });
  }, []);
  const playBet = useCallback(() => {
    if (!soundOnRef.current) return;
    const ac = getCtx(); const t0 = ac.currentTime;
    const osc = ac.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(340, t0);
    osc.frequency.exponentialRampToValueAtTime(500, t0 + 0.08);
    const g = envGain(ac, t0, 0.12, 0.08);
    osc.connect(g); g.connect(ac.destination); osc.start(t0); osc.stop(t0 + 0.13);
  }, []);

  /* loader progress */
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.floor((elapsed / LOAD_DURATION) * 100));
      setLoadPct(pct);
      if (pct >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setLoading(false), 650);
        }, 250);
      }
    }, 30);
    return () => clearInterval(id);
  }, []);

  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 6 + Math.random() * 6,
    delay: Math.random() * 6,
    drift: (Math.random() * 60 - 30) + 'px',
  })), []);

  /* ---------- game state ---------- */
  const [gameId] = useState(randomGameId);
  const [betAmount, setBetAmount] = useState(100);
  const [mines, setMines] = useState(3);
  const [betActive, setBetActive] = useState(false);
  const [tiles, setTiles] = useState(() => Array.from({ length: GRID_SIZE }, () => ({ state: 'hidden' })));
  const [revealedSafe, setRevealedSafe] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [nextMultiplier, setNextMultiplier] = useState(1);
  const [autoGame, setAutoGame] = useState(false);
  const [betHistory, setBetHistory] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [busy, setBusy] = useState(false); // guards against double-taps while a request is in flight
  const busyRef = useRef(false);
  const [pendingTile, setPendingTile] = useState(null); // tile index waiting on the server's reveal response

  // Same curve as the backend's calcMultiplier — used only to show a live
  // estimate before the server confirms each reveal.
  const estimateMultiplier = (safeRevealed, minesN) => {
    let mult = 1;
    for (let i = 0; i < safeRevealed; i++) {
      const safeLeft = GRID_SIZE - minesN - i;
      const tilesLeft = GRID_SIZE - i;
      mult *= tilesLeft / safeLeft;
    }
    return mult * 0.97;
  };

  const loadHistory = useCallback(async () => {
    try {
      const rows = await apiFetch('/boom/history');
      setBetHistory(rows.map((r) => {
        const d = new Date(r.time);
        const pad = (n) => String(n).padStart(2, '0');
        return {
          id: r.id,
          time: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
          bet: r.bet, cashout: r.won ? r.cashout : 0, mult: r.won ? r.mult : 0, won: r.won,
        };
      }));
    } catch { /* history is a nice-to-have — a failed fetch shouldn't block play */ }
  }, []);

  // On mount: pull the real balance from the server, and resume any round
  // left active (e.g. the tab was closed or refreshed mid-round) so the
  // player's board picks up exactly where it was — no lost stake, no
  // "please refresh" needed.
  useEffect(() => {
    (async () => {
      try {
        const profile = await apiFetch('/user/profile');
        setBalance(profile.user?.balance ?? profile.balance ?? 0);
      } catch { /* not logged in / offline — balance stays 0, bet button disables itself */ }

      try {
        const active = await apiFetch('/boom/active');
        if (active.active) {
          setRoundId(active.roundId);
          setCurrentBet(active.betAmount);
          setBetAmount(active.betAmount);
          setMines(active.minesCount);
          setBetActive(true);
          setRevealedSafe(active.revealedTiles.length);
          setNextMultiplier(active.multiplier || estimateMultiplier(active.revealedTiles.length + 1, active.minesCount));
          setTiles((prev) => prev.map((tl, idx) => (active.revealedTiles.includes(idx) ? { state: 'gem' } : tl)));
        }
      } catch { /* no active round — normal case */ }

      loadHistory();
    })();
  }, [loadHistory]);

  const startRound = async () => {
    if (busyRef.current) return;
    const betVal = Math.max(MIN_BET, betAmount || MIN_BET);
    if (betVal > balance) return;
    busyRef.current = true; setBusy(true);
    try {
      const res = await apiFetch('/boom/start', { method: 'POST', body: { betAmount: betVal, minesCount: mines } });
      playBet();
      setRoundId(res.roundId);
      setCurrentBet(res.betAmount);
      setBalance(res.balance);
      setRevealedSafe(0);
      setTiles(Array.from({ length: GRID_SIZE }, () => ({ state: 'hidden' })));
      setBetActive(true);
      setNextMultiplier(estimateMultiplier(1, mines));
    } catch (err) {
      console.error('Boom start failed:', err.message);
    } finally {
      busyRef.current = false; setBusy(false);
    }
  };

  const logHistory = (won, mult, betVal) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setBetHistory((h) => [
      { id: Date.now(), time: timeStr, bet: betVal, cashout: won ? betVal * mult : 0, mult: won ? mult : 0, won },
      ...h,
    ].slice(0, 30));
  };

  // Finishes the round on the CLIENT side once the server has already
  // confirmed the outcome — never decides win/loss itself. `bombTile`
  // (if any) is the single tile the server told us was a bomb; every
  // other still-hidden tile just stays hidden, since the server never
  // reveals bomb positions the player didn't actually hit.
  const finishRound = (won, mult, betVal, bombTile) => {
    setBetActive(false);
    setRoundId(null);
    if (bombTile !== undefined && bombTile !== null) {
      setTiles((prev) => prev.map((tl, idx) => (idx === bombTile ? { state: 'bomb' } : tl)));
    }
    logHistory(won, mult, betVal);
    if (won) playCashout();
  };

  const onTileClick = async (i) => {
    if (!betActive || !roundId || tiles[i].state !== 'hidden' || busyRef.current) return;
    busyRef.current = true; setBusy(true); setPendingTile(i);
    try {
      const res = await apiFetch(`/boom/${roundId}/reveal`, { method: 'POST', body: { tileIndex: i } });
      if (res.busted) {
        setTiles((prev) => prev.map((tl, idx) => (idx === i ? { state: 'bomb' } : tl)));
        playBoom();
        setBalance(res.balance);
        finishRound(false, 0, currentBet);
      } else {
        setTiles((prev) => prev.map((tl, idx) => (idx === i ? { state: 'gem' } : tl)));
        playGem();
        const nextSafe = revealedSafe + 1;
        setRevealedSafe(nextSafe);
        setNextMultiplier(res.multiplier);
        if (res.autoWin) {
          setBalance(res.balance);
          finishRound(true, res.multiplier, currentBet);
        }
      }
    } catch (err) {
      console.error('Boom reveal failed:', err.message);
    } finally {
      busyRef.current = false; setBusy(false); setPendingTile(null);
    }
  };

  const cashOutNow = async () => {
    if (!roundId || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const res = await apiFetch(`/boom/${roundId}/cashout`, { method: 'POST' });
      setBalance(res.balance);
      finishRound(true, res.multiplier ?? nextMultiplier, currentBet);
    } catch (err) {
      console.error('Boom cashout failed:', err.message);
    } finally {
      busyRef.current = false; setBusy(false);
    }
  };

  const handleMainBtn = () => {
    if (!betActive) startRound();
    else cashOutNow();
  };

  const handleRandom = () => {
    if (!betActive) return;
    const hiddenIdx = tiles.map((tl, idx) => (tl.state === 'hidden' ? idx : -1)).filter((x) => x >= 0);
    if (hiddenIdx.length) onTileClick(hiddenIdx[Math.floor(Math.random() * hiddenIdx.length)]);
  };

  const handleReset = async () => {
    playClick();
    if (betActive && roundId) {
      if (revealedSafe > 0) {
        // Already has a safe tile revealed — reset button cashes out at the
        // current multiplier rather than throwing the stake away.
        await cashOutNow();
      } else {
        try { await apiFetch(`/boom/${roundId}/giveup`, { method: 'POST' }); } catch { /* best-effort */ }
        finishRound(false, 0, currentBet);
      }
    }
    setTiles(Array.from({ length: GRID_SIZE }, () => ({ state: 'hidden' })));
  };

  /* ---------- UI popups ---------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [minesDdOpen, setMinesDdOpen] = useState(false);
  const [howtoOpen, setHowtoOpen] = useState(false);
  const [pfOpen, setPfOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState('0');
  const [langChoice, setLangChoice] = useState('en');
  const [imgBroken, setImgBroken] = useState(false);
  const [gameIdOpen, setGameIdOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const pf = useMemo(() => {
    const seed = randomHex(40);
    let positions = '';
    for (let i = 0; i < GRID_SIZE; i++) positions += tiles[i]?.state === 'bomb' ? '1' : '0';
    return { seed, positions, combined: seed + positions, hash: randomHex(64) };
  }, [tiles]);

  useEffect(() => {
    if (!menuOpen && !minesDdOpen) return undefined;
    const close = (e) => {
      if (!rootRef.current) return;
      const menuEl = rootRef.current.querySelector('.bm-menu-anchor');
      const minesEl = rootRef.current.querySelector('.bm-mines-select');
      if (menuOpen && menuEl && !menuEl.contains(e.target)) setMenuOpen(false);
      if (minesDdOpen && minesEl && !minesEl.contains(e.target)) setMinesDdOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpen, minesDdOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
    setMenuOpen(false);
  };

  const copyGameId = () => {
    playClick();
    const text = `Game ID: ${gameId}\nOriginal Seed: ${pf.seed}\nGame Result: ${pf.positions}\nEncrypted Result: ${pf.hash}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1500);
  };

  const openKeypad = () => {
    playClick();
    setKeypadValue(String(betAmount || 0));
    setKeypadOpen(true);
  };
  const pressKey = (k) => {
    playClick();
    setKeypadValue((v) => {
      if (k === 'back') return v.slice(0, -1) || '0';
      if (k === '.') return v.includes('.') ? v : `${v || '0'}.`;
      return v === '0' ? k : v + k;
    });
  };
  const confirmKeypad = () => {
    playClick();
    setBetAmount(Math.max(MIN_BET, parseFloat(keypadValue) || MIN_BET));
    setKeypadOpen(false);
  };

  const potentialPayout = currentBet * nextMultiplier;
  const canBet = !betActive && betAmount >= MIN_BET && betAmount <= balance;

  return (
    <div className={`bm-root${lang === 'ur' ? ' lang-ur' : ''}`} ref={rootRef}>
      {loading && (
        <div className={`bm-loader-screen${fadeOut ? ' fade-out' : ''}`}>
          <div className="bm-rays" />
          <div className="bm-vignette" />
          <div>
            {particles.map((p) => (
              <span
                key={p.id}
                className="bm-particle"
                style={{
                  left: `${p.left}vw`, bottom: '-10px', width: p.size, height: p.size,
                  '--drift': p.drift, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>
          <div className="bm-loader-content">
            <div className="bm-loader-logo-wrap">
              <div className="bm-loader-logo-glow" />
              <img className="bm-loader-logo" src="/image/Booms-loader.png" alt="Booms Mines" />
            </div>
            <div className="bm-loader-bar-wrap">
              <svg className="bm-gem-icon" viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 9 L12 22 L4 9 Z" fill="#3fc7ff" /></svg>
              <div className="bm-loader-bar-frame">
                <div className="bm-loader-bar-track">
                  <div className="bm-loader-bar-fill" style={{ width: `${loadPct}%` }} />
                  <div className="bm-loader-bar-label">
                    <span className="bm-loader-bar-text">LOADING</span>
                    <span className="bm-loader-percent">{loadPct}%</span>
                  </div>
                </div>
              </div>
              <svg className="bm-gem-icon right" viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 9 L12 22 L4 9 Z" fill="#3fc7ff" /></svg>
            </div>
            <p className="bm-loader-fair"><span className="bm-loader-fair-brand">Booms Mines</span> is a 100% provably fair game.</p>
            <p className="bm-loader-disclaimer">
              If you find that the game has modified the game results and submit relevant evidence to customer service,
              you can receive a maximum compensation of 100000 USDT
            </p>
          </div>
        </div>
      )}

      <div className={`bm-game-screen${!loading ? ' visible' : ''}`}>
        <div className="bm-topbar">
          <div className="bm-topbar-left">
            <button className="bm-back-btn" onClick={() => navigate(-1)} aria-label="Back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="bm-brand">{t.brand}</span>
            <button className="bm-howto-btn" onClick={() => { playClick(); setImgBroken(false); setHowtoOpen(true); }}>
              <span className="bm-howto-icon">?</span><span className="bm-howto-label">{t.howtoLabel}</span>
            </button>
          </div>
          <div className="bm-topbar-right">
            <span className="bm-balance">Rs{balance.toFixed(2)}</span>
            <div className="bm-menu-anchor" style={{ position: 'relative' }}>
              <div className="bm-menu-btn" onClick={(e) => { e.stopPropagation(); playClick(); setMenuOpen((o) => !o); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <div className={`bm-menu-dropdown${menuOpen ? ' open' : ''}`}>
                <div className="bm-menu-gameid">{gameId}</div>
                <div className="bm-menu-item">
                  <span className="bm-menu-icon">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M4 9V15H8L13 19V5L8 9H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M16.5 8.5C17.5 9.5 18 10.7 18 12C18 13.3 17.5 14.5 16.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </span>
                  <span>{t.sound}</span>
                  <div className={`bm-switch${soundOn ? ' on' : ''}`} onClick={(e) => { e.stopPropagation(); const next = !soundOn; setSoundOn(next); if (next) playClick(); }}><div className="bm-switch-knob" /></div>
                </div>
                <div className="bm-menu-item" onClick={() => { playClick(); setHistoryOpen(true); setMenuOpen(false); }}>
                  <span className="bm-menu-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" /><path d="M12 7.5V12L15.2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <span>{t.betsHistory}</span>
                  <svg className="bm-menu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="bm-menu-item" onClick={() => { playClick(); setRulesOpen(true); setMenuOpen(false); }}>
                  <span className="bm-menu-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M5 5.5C5 4.7 5.7 4 6.5 4H17C17.6 4 18 4.4 18 5V19C18 19.6 17.6 20 17 20H6.5C5.7 20 5 19.3 5 18.5V5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M5 18C5 17.2 5.7 16.5 6.5 16.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                  <span>{t.gameRules}</span>
                  <svg className="bm-menu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="bm-menu-item" onClick={() => { playClick(); setLimitsOpen(true); setMenuOpen(false); }}>
                  <span className="bm-menu-icon"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="7" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.5" /></svg></span>
                  <span>{t.gameLimits}</span>
                  <svg className="bm-menu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="bm-menu-item" onClick={() => { playClick(); setLangChoice(lang); setLanguageOpen(true); setMenuOpen(false); }}>
                  <span className="bm-menu-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3.5 12H20.5" stroke="currentColor" strokeWidth="1.3" /></svg></span>
                  <span>{t.language}</span>
                  <svg className="bm-menu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="bm-menu-item" onClick={toggleFullscreen}>
                  <span className="bm-menu-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M9 4.5H4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 4.5H19.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 19.5H4.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 19.5H19.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <span>{t.fullScreen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bm-game-wrap">
          <div className="bm-controls-row-top">
            <div className="bm-game-id-select" onClick={() => { playClick(); setGameIdOpen(true); }}>
              <span>{t.gameId}</span> <svg className="bm-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="bm-next-badge"><span>{t.next}</span> <span>{nextMultiplier.toFixed(2)}x</span></div>
          </div>

          <div className="bm-grid-frame">
            <div className={`bm-grid${busy ? ' bm-grid-busy' : ''}`}>
              {tiles.map((tl, i) => (
                <div key={i} className={`bm-tile${tl.state !== 'hidden' ? ` revealed ${tl.state}` : ''}${pendingTile === i ? ' pending' : ''}`} onClick={() => onTileClick(i)}>
                  {tl.state === 'hidden' && pendingTile !== i && <div className="bm-tile-dot" />}
                  {pendingTile === i && <div className="bm-tile-spinner" />}
                  {tl.state === 'gem' && (
                    <div className="bm-tile-icon-wrap" key={`gem-${i}`}>
                      <div className="bm-star-glow" />
                      <div className="bm-tile-icon">{STAR_SVG}</div>
                    </div>
                  )}
                  {tl.state === 'bomb' && (
                    <div className="bm-tile-icon-wrap" key={`bomb-${i}`}>
                      <div className="bm-mine-glow" />
                      <div className="bm-tile-icon">{BOMB_SVG}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bm-controls-row">
            <button className="bm-btn-pill" disabled={!betActive || busy} onClick={() => { playClick(); handleRandom(); }}>{t.random}</button>
            <div className="bm-toggle-row" onClick={() => { playClick(); setAutoGame((a) => !a); }}>
              <div className={`bm-switch${autoGame ? ' on' : ''}`}><div className="bm-switch-knob" /></div>
              <span className="bm-toggle-label">{t.autoGame}</span>
            </div>
            <div className="bm-mines-select" onClick={(e) => { e.stopPropagation(); playClick(); setMinesDdOpen((o) => !o); }}>
              <span>{t.mines} {mines}</span>
              <svg className="bm-chevron" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className={`bm-mines-dropdown${minesDdOpen ? ' open' : ''}`}>
                {MINES_OPTIONS.map((v) => (
                  <div
                    key={v}
                    className={`bm-mines-dd-option${v === mines ? ' active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); playClick(); setMines(v); setMinesDdOpen(false); }}
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bm-bet-bar">
          <div className="bm-bet-bar-inner">
            <div className="bm-bet-amount-box" onClick={openKeypad}>
              <div className="bm-bet-amount-label">{t.bet}</div>
              <div className="bm-bet-amount-value">{betAmount.toFixed(2)}</div>
            </div>
            <button className="bm-round-btn" disabled={betActive} onClick={() => { playClick(); setBetAmount((a) => Math.max(MIN_BET, a - 1)); }}>&minus;</button>
            <button className="bm-round-btn bm-coin-btn" onClick={() => { playClick(); setPresetOpen(true); }}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="url(#bmCoinGrad)" stroke="#7a4a1e" strokeWidth="1" /><circle cx="12" cy="12" r="7" fill="none" stroke="#7a4a1e" strokeWidth="1" opacity="0.6" /><text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7a4a1e">$</text><defs><linearGradient id="bmCoinGrad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe9a8" /><stop offset="1" stopColor="#ff9200" /></linearGradient></defs></svg>
            </button>
            <button className="bm-round-btn" disabled={betActive} onClick={() => { playClick(); setBetAmount((a) => a + 1); }}>&#43;</button>
            <button className="bm-refresh-btn" onClick={handleReset}>&#8635;</button>
            <button className={`bm-bet-btn${busy ? ' bm-bet-btn-busy' : ''}`} disabled={busy || (!betActive && !canBet)} onClick={handleMainBtn}>
              {busy ? (
                <span className="bm-btn-spinner" />
              ) : betActive ? (
                `\u2713 ${t.cashOut}${revealedSafe > 0 ? `  Rs${potentialPayout.toFixed(2)}` : ''}`
              ) : (
                `\u25B6 ${t.bet2}`
              )}
            </button>
          </div>
        </div>

        {/* ===== GAME ID ===== */}
        <div className={`bm-modal-overlay${gameIdOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setGameIdOpen(false); }}>
          <div className="bm-modal-box small">
            <div className="bm-modal-header"><span>{t.gameId}</span><div className="bm-modal-close" onClick={() => { playClick(); setGameIdOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body left">
              <div className="bm-gameid-panel">
                <div className="bm-gameid-row"><span>{t.gameId}</span><b>{gameId}</b></div>
                <div className="bm-gameid-row"><span>Original Seed:</span><b>{pf.seed}</b></div>
                <div className="bm-gameid-row"><span>Game Result:</span><b>{pf.positions}</b></div>
                <div className="bm-gameid-row"><span>Encrypted Result:</span><b>{pf.hash}</b></div>
              </div>
              <div className="bm-gameid-actions">
                <button className="bm-gameid-copy" onClick={copyGameId}>{copyDone ? '\u2713 Copied' : 'Copy'}</button>
                <button className="bm-gameid-validate" onClick={() => { playClick(); setGameIdOpen(false); setPfOpen(true); }}>Validate</button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BET PRESET ===== */}
        <div className={`bm-modal-overlay${presetOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setPresetOpen(false); }}>
          <div className="bm-modal-box small">
            <div className="bm-modal-header"><span>{t.selectBet}</span><div className="bm-modal-close" onClick={() => { playClick(); setPresetOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body">
              <div className="bm-preset-grid">
                {PRESETS.map((v) => (
                  <div key={v} className={`bm-preset-btn${v === betAmount ? ' active' : ''}`} onClick={() => { playClick(); setBetAmount(v); setPresetOpen(false); }}>{v}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== KEYPAD ===== */}
        <div className={`bm-modal-overlay${keypadOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setKeypadOpen(false); }}>
          <div className="bm-modal-box small">
            <div className="bm-modal-header"><span>{t.enterBet}</span><div className="bm-modal-close" onClick={() => { playClick(); setKeypadOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body">
              <div className="bm-keypad-display">{keypadValue}</div>
              <div className="bm-keypad-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((k) => (
                  <div key={k} className="bm-keypad-btn" onClick={() => pressKey(k)}>{k === 'back' ? '\u2423' : k}</div>
                ))}
              </div>
              <button className="bm-keypad-confirm" onClick={confirmKeypad}>&#10003;</button>
            </div>
          </div>
        </div>

        {/* ===== HOW TO PLAY ===== */}
        <div className={`bm-modal-overlay${howtoOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setHowtoOpen(false); }}>
          <div className="bm-modal-box">
            <div className="bm-modal-header"><span>{t.howToPlay}</span><div className="bm-modal-close" onClick={() => { playClick(); setHowtoOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body">
              <div className="bm-howto-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 8.5 L21.5 9 L16 13.3 L17.8 20.2 L12 16.3 L6.2 20.2 L8 13.3 L2.5 9 L9.5 8.5 Z" stroke="#3fc7ff" strokeWidth="1.2" fill="none" /></svg>
                <span>MINES</span>
              </div>
              {!imgBroken ? (
                <img className="bm-howto-img" src="https://game.tbgameloader.com/100/v40/unjzp/help/100/img/how-mines.png" alt="How to play Mines" referrerPolicy="no-referrer" onError={() => setImgBroken(true)} />
              ) : (
                <div className="bm-howto-img-fallback">&#9733; Tutorial image unavailable &#9733;</div>
              )}
              <p className="bm-howto-text">{t.howtoText1}</p>
              <p className="bm-howto-text">{t.howtoText2}</p>
              <button className="bm-pf-btn" onClick={() => { playClick(); setPfOpen(true); }}>{t.whatIsProvablyFair}</button>
            </div>
          </div>
        </div>

        {/* ===== PROVABLY FAIR ===== */}
        <div className={`bm-fullpage-overlay${pfOpen ? ' open' : ''}`}>
          <div className="bm-fullpage-header"><span>{t.aboutProvablyFair}</span><div className="bm-modal-close" onClick={() => { playClick(); setPfOpen(false); }}>&times;</div></div>
          <div className="bm-fullpage-body">
            <div className="bm-pf-inner">
              <div className="bm-pf-badge">
                <div className="bm-pf-badge-ring">
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 5 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V5 Z" stroke="#fff" strokeWidth="1.3" /><path d="M8.5 12 L11 14.5 L16 9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="bm-pf-badge-title">PROVABLY FAIR</div>
              </div>
              <p className="bm-pf-text">
                This game is based on cryptographic technology called &quot;Provably Fair&quot;. This technology guarantees 100% fairness
                of game result. With this technology, it&apos;s impossible for any third party to interfere in the game process.
              </p>
              <div className="bm-pf-subhead">HOW IT WORKS</div>
              <p className="bm-pf-text">
                Result of each round (the position of mines) is generated when the game starts, the encrypted data has been sent to
                players and it is fully transparent. This way, it&apos;s impossible for anyone to manipulate game output.
              </p>
              <div className="bm-pf-box"><div className="bm-pf-box-title">ORIGINAL SEED:</div><div className="bm-pf-value">{pf.seed}</div></div>
              <div className="bm-pf-arrow">&#8595;</div>
              <div className="bm-pf-box"><div className="bm-pf-box-title">THE POSITION OF MINES:</div><div className="bm-pf-value">{pf.positions}</div><div className="bm-pf-note">0 represents stars, 1 represents landmines</div></div>
              <div className="bm-pf-arrow">&#8595;</div>
              <div className="bm-pf-box"><div className="bm-pf-box-title">ORIGINAL SEED PLUS GAME RESULT CHARACTERS</div><div className="bm-pf-value">{pf.combined}</div></div>
              <div className="bm-pf-arrow">&#8595;</div>
              <div className="bm-pf-box"><div className="bm-pf-box-title">RESULT DATA (ENCRYPTED BY SHA256)</div><div className="bm-pf-value">{pf.hash}</div></div>
              <p className="bm-pf-text" style={{ marginTop: 18 }}>
                The correctness of encryption results can be checked through online encryption websites, such as{' '}
                <a className="bm-pf-link" href="https://www.miniwebtool.com/sha256-hash-generator/" target="_blank" rel="noopener noreferrer">miniwebtool.com/sha256-hash-generator</a>
              </p>
            </div>
          </div>
        </div>

        {/* ===== HISTORY ===== */}
        <div className={`bm-modal-overlay${historyOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setHistoryOpen(false); }}>
          <div className="bm-modal-box">
            <div className="bm-modal-header"><span>{t.gameHistory}</span><div className="bm-modal-close" onClick={() => { playClick(); setHistoryOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body left">
              <div className="bm-history-row-head"><span>{t.hTime}</span><span>{t.hBet}</span><span>{t.hCashout}</span><span>{t.hMult}</span><span /></div>
              {betHistory.length === 0 && <div className="bm-history-empty">{t.noHistory}</div>}
              {betHistory.map((h) => (
                <div key={h.id} className="bm-history-row">
                  <span>{h.time}</span>
                  <span>{h.bet.toFixed(0)} Rs.</span>
                  <span className={h.won ? 'h-win' : ''}>{h.won ? `+${h.cashout.toFixed(2)}` : '0.00'} Rs.</span>
                  <span className="h-mult">{h.won ? `${h.mult.toFixed(2)}x` : '-'}</span>
                  <svg className="bm-history-shield" viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 5 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V5 Z" stroke="currentColor" strokeWidth="1.4" /><path d="M8.5 12 L11 14.5 L16 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== RULES ===== */}
        <div className={`bm-modal-overlay${rulesOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setRulesOpen(false); }}>
          <div className="bm-modal-box">
            <div className="bm-modal-header"><span>{t.gameRulesTitle}</span><div className="bm-modal-close" onClick={() => { playClick(); setRulesOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body left">
              <div className="bm-rules-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14.5 8.5 L21.5 9 L16 13.3 L17.8 20.2 L12 16.3 L6.2 20.2 L8 13.3 L2.5 9 L9.5 8.5 Z" stroke="#3fc7ff" strokeWidth="1.2" fill="none" /></svg>
                <span>MINES</span>
              </div>
              <p className="bm-rules-text">{t.rule1}</p>
              <p className="bm-rules-text">{t.rule2}</p>
              <p className="bm-rules-text">{t.rule3}</p>
              <p className="bm-rules-text">{t.rule4}</p>
              <div className="bm-rules-subhead">{t.gameInterface}</div>
              <p className="bm-rules-text">{t.rule5}</p>
              <p className="bm-rules-text">{t.rule6}</p>
              <p className="bm-rules-text">{t.rule7}</p>
              <p className="bm-rules-text">{t.rule8}</p>
              <p className="bm-rules-text">{t.rule9}</p>
              <div className="bm-rules-subhead">{t.autoPlay}</div>
              <p className="bm-rules-text">{t.rule10}</p>
              <div className="bm-rules-subhead">{t.additionalInfo}</div>
              <p className="bm-rules-text">{t.rule11}</p>
            </div>
          </div>
        </div>

        {/* ===== LIMITS ===== */}
        <div className={`bm-modal-overlay${limitsOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setLimitsOpen(false); }}>
          <div className="bm-modal-box small">
            <div className="bm-modal-header"><span>{t.gameLimitsTitle}</span><div className="bm-modal-close" onClick={() => { playClick(); setLimitsOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body">
              <div className="bm-limits-list">
                <div className="bm-limit-row"><span className="bm-limit-label">{t.maxBet}</span><span className="bm-limit-value">{MAX_BET} Rs.</span></div>
                <div className="bm-limit-row"><span className="bm-limit-label">{t.minBet}</span><span className="bm-limit-value">{MIN_BET} Rs.</span></div>
                <div className="bm-limit-row"><span className="bm-limit-label">{t.maxWin}</span><span className="bm-limit-value">{MAX_WIN} Rs.</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== LANGUAGE ===== */}
        <div className={`bm-modal-overlay${languageOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setLanguageOpen(false); }}>
          <div className="bm-modal-box small">
            <div className="bm-modal-header"><span>{t.languageTitle}</span><div className="bm-modal-close" onClick={() => { playClick(); setLanguageOpen(false); }}>&times;</div></div>
            <div className="bm-modal-body">
              <div className="bm-lang-grid">
                {Object.keys(i18n).map((code) => (
                  <div key={code} className={`bm-lang-option${code === langChoice ? ' active' : ''}`} onClick={() => { playClick(); setLangChoice(code); }}>
                    <span className="bm-lang-radio" /><span>{i18n[code].label}</span>
                  </div>
                ))}
              </div>
              <button className="bm-lang-ok-btn" onClick={() => { playClick(); setLang(langChoice); setLanguageOpen(false); }}>{t.ok}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Boom;