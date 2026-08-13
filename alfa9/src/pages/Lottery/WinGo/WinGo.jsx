import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import ResultPopup from '../../../components/ResultPopup/ResultPopup';
import './WinGo.css';

const DURATIONS = [
  { key: '30s', seconds: 30, line1: 'WinGo', line2: '30sec' },
  { key: '1m', seconds: 60, line1: 'WinGo 1', line2: 'Min' },
  { key: '3m', seconds: 180, line1: 'WinGo 3', line2: 'Min' },
  { key: '5m', seconds: 300, line1: 'WinGo 5', line2: 'Min' },
];

const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = ['X1', 'X5', 'X10', 'X20', 'X50', 'X100'];
const BALANCE_OPTIONS = [1, 10, 100, 1000];
const COLOR_HEX = { green: '#17d97a', red: '#ff5876', violet: '#c084fc' };

// Rows visible per page, for both Game history and Chart tabs
const PAGE_SIZE = 10;

const HOW_TO_PLAY_TEXT = [
  '1. Select green: if the result shows 1,3,7,9 you will get (98*2) 196; If the result shows 5, you will get (98*1.5) 147',
  '2. Select red: if the result shows 2,4,6,8 you will get (98*2) 196; If the result shows 0, you will get (98*1.5) 147',
  '3. Select violet: if the result shows 0 or 5, you will get (98*4.5) 441',
  '4. Select number: if the result is the same as the number you selected, you will get (98*9) 882',
  '5. Select big: if the result shows 5,6,7,8,9 you will get (98*2) 196',
  '6. Select small: if the result shows 0,1,2,3,4 you will get (98*2) 196',
];

function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function getColors(n) {
  if (n === 0) return ['violet', 'red'];
  if (n === 5) return ['violet', 'green'];
  if ([1, 3, 7, 9].includes(n)) return ['green'];
  return ['red'];
}

function ballBg(n) {
  return COLOR_HEX[getColors(n)[0]];
}

function getBigSmall(n) {
  return n >= 5 ? 'Big' : 'Small';
}

// Badge background for a "My history" row — reflects the ACTUAL thing bet on
// (red/green/violet number, or a neutral gold for Big/Small bets), not win/loss.
function myHistBadgeStyle(bet) {
  if (bet.betType === 'color') return { background: COLOR_HEX[bet.betValue] || '#8a6a17' };
  if (bet.betType === 'number') {
    const n = Number(bet.betValue);
    const colors = getColors(n);
    if (colors.length === 2) {
      return { background: `linear-gradient(135deg, ${COLOR_HEX[colors[0]]} 50%, ${COLOR_HEX[colors[1]]} 50%)` };
    }
    return { background: COLOR_HEX[colors[0]] };
  }
  return { background: 'linear-gradient(150deg, #f3da95, #d4af37 55%, #8a6a17)' }; // Big/Small bets
}

// 0 counts as Even for the E/O badge
function isEven(n) {
  return n % 2 === 0;
}

// The number-8 ball asset is named "s8.png" in /public/image, all others are "0.png".."9.png"
function ballImg(n) {
  return n === 8 ? '/image/s8.png' : `/image/${n}.png`;
}

function makePeriod(counter) {
  return `${todayStr()}${pad(counter, 9)}`;
}

function multValue(m) {
  return parseInt(m.replace('X', ''), 10);
}

// Returns the CSS accent key used to color the bet popup (green/violet/red/big/small/number)
function accentKey(betModal) {
  if (!betModal) return '';
  if (betModal.type === 'color') return betModal.value;
  if (betModal.type === 'size') return betModal.value.toLowerCase();
  return 'number';
}

// Decides whether a placed bet wins against a drawn round, and by what odds multiplier.
// Odds match the in-app "How to play" rules (98 unit -> 196/147/441/882 payouts).
function evaluateBet(bet, resultEntry) {
  if (!bet || !resultEntry) return { win: false, oddsMultiplier: 0 };
  const n = resultEntry.number;
  const colors = resultEntry.colors;
  const isZeroOrFive = n === 0 || n === 5;

  if (bet.type === 'color') {
    if (bet.value === 'violet') {
      return isZeroOrFive ? { win: true, oddsMultiplier: 4.5 } : { win: false, oddsMultiplier: 0 };
    }
    if (colors.includes(bet.value)) {
      return { win: true, oddsMultiplier: isZeroOrFive ? 1.5 : 2 };
    }
    return { win: false, oddsMultiplier: 0 };
  }

  if (bet.type === 'number') {
    return n === bet.value ? { win: true, oddsMultiplier: 9 } : { win: false, oddsMultiplier: 0 };
  }

  if (bet.type === 'size') {
    return resultEntry.big === bet.value ? { win: true, oddsMultiplier: 2 } : { win: false, oddsMultiplier: 0 };
  }

  return { win: false, oddsMultiplier: 0 };
}

function seedHistory(counterStart, count = 200) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const n = Math.floor(Math.random() * 10);
    const counter = counterStart - count + i;
    arr.push({ period: makePeriod(counter), number: n, big: getBigSmall(n), colors: getColors(n) });
  }
  return arr.reverse();
}

function buildInitialStates() {
  const states = {};
  DURATIONS.forEach((d) => {
    states[d.key] = {
      period: null,
      timeLeft: d.seconds,
      history: [],
    };
  });
  return states;
}

function computeStats(historyWindow) {
  const total = historyWindow.length || 1;
  return NUMBERS.map((n) => {
    let missing = historyWindow.findIndex((h) => h.number === n);
    if (missing === -1) missing = historyWindow.length;
    const freq = historyWindow.filter((h) => h.number === n).length;
    const avgMissing = freq > 0 ? Math.round(total / freq) : historyWindow.length;
    let max = 0;
    let cur = 0;
    historyWindow.forEach((h) => {
      if (h.number === n) {
        cur += 1;
        max = Math.max(max, cur);
      } else {
        cur = 0;
      }
    });
    return { n, missing, avgMissing, freq, max };
  });
}

function WinGo() {
  const navigate = useNavigate();

  const [activeDuration, setActiveDuration] = useState('30s');
  const [gameStates, setGameStates] = useState(buildInitialStates);
  const [activeTab, setActiveTab] = useState('history');
  const [page, setPage] = useState(1);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [muted, setMuted] = useState(false);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [multiplier, setMultiplier] = useState('X1');

  // Bet popup state
  const [betModal, setBetModal] = useState(null); // { type: 'color'|'number'|'size', value, label }
  const [balanceOption, setBalanceOption] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [agree, setAgree] = useState(true);

  // Wallet balance (starts at 0 until the user deposits). Bets are deducted on confirm and
  // winnings are credited back when a pending bet resolves in the player's favor.
  const [balance, setBalance] = useState(0);
  // Shown instead of placing a bet when the wallet doesn't have enough balance for it.
  const [showInsufficient, setShowInsufficient] = useState(false);

  // Bet that has been confirmed and is waiting for its round to resolve, e.g.
  // { duration: '30s', period: '20260716100052641', type: 'color', value: 'green', label: 'Green', amount: 100 }
  const [pendingBet, setPendingBet] = useState(null);
  // Data shown in the win/loss popup once a pending bet resolves
  const [resultPopup, setResultPopup] = useState(null);
  const [betConfirmToast, setBetConfirmToast] = useState(false);

  const refreshRef = useRef(null);

  // Refs for the premium period trend table (chart tab): body wrapper, the connecting-line SVG,
  // and a map of period -> the DOM node of that row's "active" (winning) number badge.
  const periodBodyRef = useRef(null);
  const periodSvgRef = useRef(null);
  const activeBadgeRefs = useRef({});

  // Lazily-created Web Audio context used for the last-5-seconds countdown tick. Created on first
  // use (not at mount) so browsers' autoplay-restriction policies don't block it.
  const audioCtxRef = useRef(null);
  // Prevents the same second from firing its tick more than once (e.g. on re-renders).
  const lastTickKeyRef = useRef('');
  // Always-fresh mirror of `muted` so the tick can be triggered from effects without stale closures.
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Polls the ACTIVE duration's round from the real backend every second
  // (server-authoritative — same period + timeLeft for every user, at every
  // moment, regardless of when this page was opened). When the period
  // changes (a new round started), that means the previous one just
  // settled, so we refetch its result history too.
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      apiFetch(`/game-round/current/wingo?duration=${activeDuration}`)
        .then((data) => {
          if (cancelled) return;
          setGameStates((prev) => {
            const prevEntry = prev[activeDuration];
            const periodChanged = prevEntry.period && prevEntry.period !== data.period;
            if (periodChanged) {
              const justEndedPeriod = prevEntry.period;
              let histAttempts = 0;
              const pollHistory = () => {
                if (cancelled) return;
                apiFetch(`/game-round/history/wingo?duration=${activeDuration}`)
                  .then((histData) => {
                    if (cancelled) return;
                    const rounds = histData.rounds || [];
                    const hasNewest = rounds.some((r) => r.period === justEndedPeriod);
                    if (!hasNewest && histAttempts < 15) {
                      // Backend hasn't finished settling this round yet — check again shortly
                      // (fast retry instead of a fixed wait, so the result shows up the moment
                      // it's actually ready rather than always waiting the same amount of time).
                      histAttempts += 1;
                      setTimeout(pollHistory, 200);
                      return;
                    }
                    setGameStates((p2) => ({
                      ...p2,
                      [activeDuration]: {
                        ...p2[activeDuration],
                        history: rounds.map((r) => ({
                          period: r.period, number: r.result?.number,
                          big: r.result?.big, colors: r.result?.colors || []
                        })),
                      },
                    }));
                    setPage(1); // jump back to the newest result instead of leaving the user stuck deep in old pages
                  })
                  .catch(() => {});
              };
              pollHistory();
            }
            return { ...prev, [activeDuration]: { ...prevEntry, period: data.period, timeLeft: data.timeLeft } };
          });
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [activeDuration]);

  // Initial history load for a duration the first time it's viewed
  useEffect(() => {
    apiFetch(`/game-round/history/wingo?duration=${activeDuration}`)
      .then((data) => {
        setGameStates((prev) => ({
          ...prev,
          [activeDuration]: {
            ...prev[activeDuration],
            history: (data.rounds || []).map((r) => ({
              period: r.period, number: r.result?.number,
              big: r.result?.big, colors: r.result?.colors || []
            })),
          },
        }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDuration]);

  useEffect(() => {
    apiFetch('/user/profile')
      .then((data) => setBalance(data.user.balance))
      .catch(() => {});
  }, []);

  const [myBets, setMyBets] = useState([]);
  const [myBetsLoading, setMyBetsLoading] = useState(false);
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);
  const [expandedBetId, setExpandedBetId] = useState(null);
  const [betDetails, setBetDetails] = useState({}); // cache: betId -> detail object
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const toggleBetDetail = (betId) => {
    if (expandedBetId === betId) { setExpandedBetId(null); return; }
    setExpandedBetId(betId);
    if (!betDetails[betId]) {
      setDetailLoadingId(betId);
      apiFetch(`/game-round/bet-detail/${betId}`)
        .then((data) => setBetDetails((prev) => ({ ...prev, [betId]: data })))
        .catch(() => setBetDetails((prev) => ({ ...prev, [betId]: { error: true } })))
        .finally(() => setDetailLoadingId(null));
    }
  };
  useEffect(() => {
    if (activeTab !== 'my') return;
    setMyBetsLoading(true);
    apiFetch(`/game-round/my-bets/wingo?duration=${activeDuration}&page=${myPage}`)
      .then((data) => { setMyBets(data.bets || []); setMyTotalPages(data.totalPages || 1); })
      .catch(() => { setMyBets([]); setMyTotalPages(1); })
      .finally(() => setMyBetsLoading(false));
  }, [activeTab, activeDuration, myPage]);

  // Duration/tab changed — start back at page 1 so we don't end up on a
  // stale page number that no longer has data for the new filter.
  useEffect(() => { setMyPage(1); }, [activeTab, activeDuration]);

  const current = gameStates[activeDuration];
  const durationCfg = DURATIONS.find((d) => d.key === activeDuration);
  const locked = current.timeLeft <= 5;
  const urgent = current.timeLeft <= 3;

  // Clear selections whenever the tab or the round changes
  useEffect(() => {
    setSelectedColor(null);
    setSelectedNumbers([]);
    setSelectedSize(null);
    setBetModal(null);
  }, [activeDuration, current.period]);

  useEffect(() => {
    setPage(1);
  }, [activeDuration, activeTab]);

  // Plays a short countdown "tick" beep via Web Audio (no external sound file needed). The final
  // tick (timeLeft === 1) gets a slightly higher pitch so the round-closing moment stands out.
  const playTick = (isFinal) => {
    if (mutedRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = isFinal ? 1046.5 : 880;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Ignore audio failures (e.g. autoplay restrictions before any user gesture) — the visual
      // countdown still works fine without sound.
    }
  };

  // Fires the countdown tick once per second while the active duration's round is locked
  // (timeLeft 5..1), respecting the header mute toggle.
  useEffect(() => {
    if (current.timeLeft >= 1 && current.timeLeft <= 5) {
      const key = `${activeDuration}-${current.period}-${current.timeLeft}`;
      if (lastTickKeyRef.current !== key) {
        lastTickKeyRef.current = key;
        playTick(current.timeLeft === 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.timeLeft, activeDuration, current.period]);

  // Watches the active duration's period for a change. Once the period our
  // pending bet was placed on has settled (round moved on), fetch the real
  // result from the backend and show the win/loss popup.
  //
  // The frontend's own countdown can tick over to a new period a moment
  // BEFORE the backend scheduler has actually finished settling the old
  // round (it runs on its own ~1s tick). Fetching bet-detail immediately at
  // that instant could catch the bet still 'Pending' and briefly show a
  // wrong Loss popup that then "fixes itself" a second later. We now poll
  // bet-detail until it's actually settled (Succeed/Failed) before showing
  // anything, so the popup is only ever shown once, with the correct result.
  useEffect(() => {
    if (!pendingBet) return;
    const st = gameStates[pendingBet.duration];
    if (!st || !st.period || st.period === pendingBet.period) return; // still same round, not settled yet

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 70; // ~15s total (200ms apart) — generous now that settlement can't get permanently stuck

    const poll = () => {
      if (cancelled) return;
      apiFetch(`/game-round/bet-detail/${pendingBet.betId}`)
        .then((detail) => {
          if (cancelled) return;
          if (detail.status === 'Pending') {
            if (attempts < MAX_ATTEMPTS) {
              attempts += 1;
              setTimeout(poll, 200); // backend hasn't settled this bet yet — check again shortly
              return;
            }
            // Genuinely never settled in a reasonable window — rather than guessing
            // and showing a WRONG "Loss" popup, just drop it quietly. The bet still
            // shows correctly as "Pending" in My history once it does resolve.
            setPendingBet(null);
            return;
          }

          const win = detail.status === 'Succeed';
          const durationLabel = `${DURATIONS.find((d) => d.key === pendingBet.duration).line1} ${DURATIONS.find((d) => d.key === pendingBet.duration).line2}`;

          if (win) {
            apiFetch('/user/profile').then((data) => setBalance(data.user.balance)).catch(() => {});
          }

          setResultPopup({
            status: win ? 'win' : 'loss',
            amount: win ? detail.winLose : pendingBet.amount,
            resultNumber: detail.result?.number,
            resultColors: detail.result?.colors,
            resultBig: detail.result?.big,
            period: detail.period,
            durationLabel,
          });
          setPendingBet(null);
        })
        .catch(() => { if (!cancelled) setPendingBet(null); });
    };

    poll();
    return () => { cancelled = true; };
  }, [gameStates, pendingBet]);

  const openBetModal = (type, value, label) => {
    if (locked) return;
    setBetModal({ type, value, label });
    setBalanceOption(1);
    setQuantity(1);
    setAgree(true);
  };
  const closeBetModal = () => setBetModal(null);

  const handleConfirmBet = () => {
    if (!agree || !betModal) return;
    const safeQuantity = Number(quantity) || 1;
    const totalAmount = balanceOption * safeQuantity * multValue(multiplier);

    // Not enough wallet balance for this bet — close the bet sheet and prompt a deposit
    // instead of silently placing (or failing to place) the bet.
    if (totalAmount > balance) {
      closeBetModal();
      setShowInsufficient(true);
      return;
    }

    apiFetch('/game-round/bet', {
      method: 'POST',
      body: {
        gameName: 'wingo',
        duration: activeDuration,
        betType: betModal.type,
        betValue: String(betModal.value),
        unitAmount: balanceOption,
        quantity: safeQuantity,
        multiplier: multValue(multiplier),
      },
    })
      .then((data) => {
        setBalance((b) => Math.round((b - data.bet.amount) * 100) / 100);
        setPendingBet({
          betId: data.bet.id,
          duration: activeDuration,
          period: data.bet.period,
          type: betModal.type,
          value: betModal.value,
          label: betModal.label,
          amount: data.bet.amount,
        });
        closeBetModal();
        setBetConfirmToast(true);
        setTimeout(() => setBetConfirmToast(false), 1400);
      })
      .catch((err) => {
        closeBetModal();
        alert(err.message || 'Could not place bet');
      });
  };

  const handleColorClick = (c) => {
    if (locked) return;
    setSelectedColor(c);
    setSelectedNumbers([]);
    setSelectedSize(null);
    openBetModal('color', c, cap(c));
  };
  const handleNumberClick = (n) => {
    if (locked) return;
    setSelectedNumbers([n]);
    setSelectedColor(null);
    setSelectedSize(null);
    openBetModal('number', n, String(n));
  };
  const handleSizeClick = (s) => {
    if (locked) return;
    setSelectedSize(s);
    setSelectedColor(null);
    setSelectedNumbers([]);
    openBetModal('size', s, s);
  };
  const handleRandom = () => {
    if (locked) return;
    const n = Math.floor(Math.random() * 10);
    handleNumberClick(n);
  };

  const handleRefresh = () => {
    if (refreshRef.current) {
      refreshRef.current.classList.remove('spin');
      void refreshRef.current.offsetWidth;
      refreshRef.current.classList.add('spin');
    }
  };

  // Unmuting is a user gesture, so use it to unlock/resume the audio context too —
  // otherwise the very next tick could still be blocked by autoplay restrictions.
  const handleToggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (!next && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return next;
    });
  };

  const minutes = Math.floor(current.timeLeft / 60);
  const seconds = current.timeLeft % 60;
  const timeDigits = `${pad(minutes)}${pad(seconds)}`.split('');
  // Most recent result first (left), matching the newest-on-top order used by the
  // Game history table and the Chart tab's round-trend table below.
  const recentBalls = current.history.slice(0, 5);

  const totalPages = Math.max(1, Math.ceil(current.history.length / PAGE_SIZE));
  const pageRows = current.history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statsWindow = current.history.slice(0, 100);
  const stats = activeTab === 'chart' ? computeStats(statsWindow) : [];
  const maxFreq = Math.max(1, ...stats.map((s) => s.freq));
  const sortedByFreq = activeTab === 'chart'
    ? [...stats].sort((a, b) => b.freq - a.freq || a.missing - b.missing)
    : [];
  const hotNumbers = sortedByFreq.slice(0, 3);
  const coldNumbers = sortedByFreq.slice(-3).reverse();

  // Draw the glowing connector line across each row's winning-number badge in the premium period table.
  useEffect(() => {
    if (activeTab !== 'chart') return;
    const svg = periodSvgRef.current;
    const body = periodBodyRef.current;
    if (!svg || !body) return;

    const draw = () => {
      svg.innerHTML = '';
      const bodyRect = body.getBoundingClientRect();
      const points = pageRows
        .map((r) => {
          const el = activeBadgeRefs.current[r.period];
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2 - bodyRect.left,
            y: rect.top + rect.height / 2 - bodyRect.top + body.scrollTop,
          };
        })
        .filter(Boolean);

      if (points.length < 2) return;

      const ns = 'http://www.w3.org/2000/svg';
      const defs = document.createElementNS(ns, 'defs');
      const grad = document.createElementNS(ns, 'linearGradient');
      grad.setAttribute('id', 'wgPeriodTrendGrad');
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '0%');
      grad.setAttribute('y2', '100%');
      const stop1 = document.createElementNS(ns, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#f3da95');
      const stop2 = document.createElementNS(ns, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#8a6a17');
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
      svg.appendChild(defs);

      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'url(#wgPeriodTrendGrad)');
      path.setAttribute('stroke-width', '2.2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    };

    // Wait a tick so the row badges have actually painted before measuring them
    const raf = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', draw);
    };
  }, [activeTab, page, activeDuration, current.history]);

  const accent = accentKey(betModal);
  const totalAmount = balanceOption * (Number(quantity) || 0) * multValue(multiplier);

  return (
    <div className="wg-page">
      {/* HEADER */}
      <header className="wg-header">
        <button className="wg-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="wg-logo-wrap">
          <img src="/image/ultraalf9.png" alt="Alfa9" className="wg-logo-img" />
        </div>
        <div className="wg-header-icons">
          <div className="wg-icon-btn" onClick={() => navigate('/customer-service')} title="Support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="wg-icon-btn" onClick={handleToggleMute} title="Sound">
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* WALLET CARD */}
      <div className="wg-wallet-card">
        <div className="wg-wallet-top">
          <span className="wg-balance">Rs{balance.toFixed(2)}</span>
          <svg ref={refreshRef} className="wg-refresh" onClick={handleRefresh} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </div>
        <div className="wg-wallet-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#d4af37"><path d="M21 7H3a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM3 5h15a2 2 0 0 1 2 2H3a2 2 0 0 1 0-2z"/></svg>
          Wallet balance
        </div>
        <div className="wg-wallet-btns">
          <button className="wg-withdraw-btn" onClick={() => navigate('/account/withdraw')}>Withdraw</button>
          <button className="wg-deposit-btn" onClick={() => navigate('/account/deposit')}>Deposit</button>
        </div>
      </div>

      {/* DURATION TABS */}
      <div className="wg-duration-tabs">
        {DURATIONS.map((d) => (
          <div
            key={d.key}
            className={`wg-duration-card ${activeDuration === d.key ? 'active' : ''}`}
            onClick={() => setActiveDuration(d.key)}
          >
            <div className="wg-duration-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeDuration === d.key ? '#1a1204' : '#8b7355'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span>{d.line1}</span>
            <span>{d.line2}</span>
          </div>
        ))}
      </div>

      {/* PERIOD / TIMER BAR */}
      <div className="wg-period-bar">
        <div className="wg-period-left">
          <button className="wg-howtoplay-btn" onClick={() => setShowHowToPlay(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="14" rx="2"></rect><line x1="7" y1="9" x2="17" y2="9"></line><line x1="7" y1="13" x2="13" y2="13"></line>
            </svg>
            How to play
          </button>
          <span className="wg-period-name">{durationCfg.line1} {durationCfg.line2}</span>
          <div className="wg-recent-balls">
            {recentBalls.map((r, i) => (
              <img key={i} src={ballImg(r.number)} alt={r.number} className="wg-ball" />
            ))}
          </div>
        </div>
        <div className="wg-period-right">
          <span className="wg-time-label">Time remaining</span>
          <div className="wg-time-digits">
            <span className="wg-digit">{timeDigits[0]}</span>
            <span className="wg-digit">{timeDigits[1]}</span>
            <span className="wg-colon">:</span>
            <span className="wg-digit">{timeDigits[2]}</span>
            <span className="wg-digit">{timeDigits[3]}</span>
          </div>
          <span className="wg-period-id">{current.period}</span>
        </div>
      </div>

      {/* BETTING PANEL */}
      <div className="wg-betting-panel">
        <div className="wg-color-row">
          <button className={`wg-color-btn wg-green ${selectedColor === 'green' ? 'sel' : ''}`} disabled={locked} onClick={() => handleColorClick('green')}>Green</button>
          <button className={`wg-color-btn wg-violet ${selectedColor === 'violet' ? 'sel' : ''}`} disabled={locked} onClick={() => handleColorClick('violet')}>Violet</button>
          <button className={`wg-color-btn wg-red ${selectedColor === 'red' ? 'sel' : ''}`} disabled={locked} onClick={() => handleColorClick('red')}>Red</button>
        </div>

        <div className="wg-number-wrap">
          <div className={`wg-number-grid ${locked ? 'dim' : ''}`}>
            {NUMBERS.map((n) => (
              <img
                key={n}
                src={ballImg(n)}
                alt={n}
                className={`wg-number-ball ${selectedNumbers.includes(n) ? 'sel' : ''}`}
                onClick={() => handleNumberClick(n)}
              />
            ))}
          </div>
          {locked && (
            <div className="wg-lock-overlay">
              <span className="wg-lock-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f3da95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Betting closes in
              </span>
              <div className="wg-lock-digits">
                <span className="wg-lock-ring"></span>
                <span className={`wg-lock-card ${urgent ? 'wg-lock-urgent' : ''}`}>{pad(current.timeLeft)[0]}</span>
                <span className="wg-lock-colon">:</span>
                <span className={`wg-lock-card ${urgent ? 'wg-lock-urgent' : ''}`}>{pad(current.timeLeft)[1]}</span>
              </div>
            </div>
          )}
        </div>

        <div className="wg-mult-row">
          <button className="wg-random-btn" disabled={locked} onClick={handleRandom}>Random</button>
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              className={`wg-mult-btn ${multiplier === m ? 'active' : ''}`}
              disabled={locked}
              onClick={() => setMultiplier(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="wg-bigsmall-row">
          <button className={`wg-big-btn ${selectedSize === 'Big' ? 'sel' : ''}`} disabled={locked} onClick={() => handleSizeClick('Big')}>Big</button>
          <button className={`wg-small-btn ${selectedSize === 'Small' ? 'sel' : ''}`} disabled={locked} onClick={() => handleSizeClick('Small')}>Small</button>
        </div>
      </div>

      {/* TABS */}
      <div className="wg-tabs-row">
        <button className={`wg-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Game history</button>
        <button className={`wg-tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>Chart</button>
        <button className={`wg-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My history</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="wg-table-wrap">
          <div className="wg-table-header">
            <span>Period</span><span>Number</span><span>Big Small</span><span>Color</span>
          </div>
          {pageRows.map((r) => (
            <div className="wg-table-row" key={r.period}>
              <span className="wg-cell-period">{r.period}</span>
              <span className={`wg-cell-number wg-c-${r.colors[0]}`}>{r.number}</span>
              <span>{r.big}</span>
              <span className="wg-cell-dots">
                {r.colors.map((c) => <i key={c} className={`wg-dot wg-dot-${c}`}></i>)}
              </span>
            </div>
          ))}
          <div className="wg-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span>{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="wg-chart-wrap">
          {/* HOT / COLD NUMBERS */}
          <div className="wg-hotcold">
            <div className="wg-hotcold-card">
              <div className="wg-hotcold-label hot">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff8a5c"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1 2 2 2 5a8 8 0 0 1-16 0C4 8 9 7 12 2z"/></svg>
                Hot numbers
              </div>
              <div className="wg-hotcold-balls">
                {hotNumbers.map((s) => (
                  <span key={s.n} className="wg-hotcold-ball hot">{s.n}</span>
                ))}
              </div>
            </div>
            <div className="wg-hotcold-card">
              <div className="wg-hotcold-label cold">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6fb8ff" strokeWidth="2"><path d="M12 2v20M4 7l16 10M20 7L4 17"/></svg>
                Cold numbers
              </div>
              <div className="wg-hotcold-balls">
                {coldNumbers.map((s) => (
                  <span key={s.n} className="wg-hotcold-ball cold">{s.n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* FREQUENCY BARS */}
          <div className="wg-freqchart">
            <div className="wg-chart-section-title">
              <span>Number frequency</span>
              <span>last {statsWindow.length} periods</span>
            </div>
            <div className="wg-freqbars" style={{ marginTop: 10 }}>
              {stats.map((s) => (
                <div className="wg-freqbar-col" key={s.n}>
                  <span className="wg-freqbar-count">{s.freq}</span>
                  <div className="wg-freqbar" style={{ height: `${Math.max(6, (s.freq / maxFreq) * 100)}%` }}></div>
                  <span className="wg-freqbar-label" style={{ background: ballBg(s.n) }}>{s.n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PREMIUM PERIOD TREND TABLE */}
          <div>
            <div className="wg-chart-section-title" style={{ marginBottom: 8 }}>
              <span>Round trend</span>
              <span>page {page}/{totalPages}</span>
            </div>
            <div className="wg-periodtable">
              <div className="wg-periodtable-header">
                <span>Period</span>
                <span>Number</span>
              </div>
              <div className="wg-periodtable-body" ref={periodBodyRef}>
                <svg ref={periodSvgRef} className="wg-periodtable-svg"></svg>
                {pageRows.map((r) => (
                  <div className="wg-periodtable-row" key={r.period}>
                    <span className="wg-periodtable-period" title={r.period}>...{r.period.slice(-6)}</span>
                    <div className="wg-periodtable-badges">
                      {NUMBERS.map((n) => (
                        <span
                          key={n}
                          ref={(el) => {
                            if (n === r.number) activeBadgeRefs.current[r.period] = el;
                          }}
                          className={`wg-numbadge ${n === r.number ? `active wg-nb-${getColors(n)[0]}` : ''}`}
                        >
                          {n}
                        </span>
                      ))}
                      <span className={`wg-utilbadge ${r.big === 'Big' ? 'wg-utilbadge-b' : 'wg-utilbadge-s'}`}>
                        {r.big === 'Big' ? 'B' : 'S'}
                      </span>
                      <span className={`wg-utilbadge ${isEven(r.number) ? 'wg-utilbadge-e' : 'wg-utilbadge-o'}`}>
                        {isEven(r.number) ? 'E' : 'O'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="wg-pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span>{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'my' && (
        myBetsLoading ? (
          <div className="wg-empty-wrap">
            <span>Loading…</span>
          </div>
        ) : myBets.length > 0 ? (
          <div className="wg-myhist-list">
            {myBets.map((b) => {
              const cls = b.status === 'Succeed' ? 'win' : b.status === 'Pending' ? 'pending' : 'lose';
              const isOpen = expandedBetId === b.id;
              const detail = betDetails[b.id];
              return (
                <div className={`wg-myhist-card ${isOpen ? 'open' : ''}`} key={b.id}>
                  <div className="wg-myhist-row" onClick={() => toggleBetDetail(b.id)}>
                    <div className="wg-myhist-badge" style={myHistBadgeStyle(b)}>{b.betValue}</div>
                    <div className="wg-myhist-main">
                      <div>{b.period}</div>
                      <div className="wg-myhist-date">{new Date(b.createdAt).toLocaleString()}</div>
                    </div>
                    {b.status === 'Pending' ? (
                      <div className="wg-myhist-amt pending">Pending</div>
                    ) : (
                      <div className={`wg-myhist-amt ${cls}`}>
                        {b.winLose >= 0 ? '+' : ''}Rs{Math.abs(b.winLose).toFixed(2)}
                      </div>
                    )}
                    <svg className={`wg-myhist-chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  {isOpen && (
                    <div className="wg-myhist-detail">
                      {detailLoadingId === b.id ? (
                        <div className="wg-myhist-detail-loading">Loading…</div>
                      ) : detail && !detail.error ? (
                        <>
                          <div className="wg-myhist-detail-row"><span>Order number</span><span>{detail.orderNumber}</span></div>
                          <div className="wg-myhist-detail-row"><span>Period</span><span>{detail.period}</span></div>
                          <div className="wg-myhist-detail-row"><span>Purchase amount</span><span>Rs{detail.purchaseAmount?.toFixed(2)}</span></div>
                          <div className="wg-myhist-detail-row"><span>Quantity</span><span>{detail.quantity}</span></div>
                          <div className="wg-myhist-detail-row"><span>Amount after tax</span><span>Rs{detail.amountAfterTax?.toFixed(2)}</span></div>
                          <div className="wg-myhist-detail-row"><span>Tax</span><span>Rs{detail.tax?.toFixed(2)}</span></div>
                          {detail.result !== null && detail.result !== undefined && (
                            <div className="wg-myhist-detail-row">
                              <span>Result</span>
                              <span>{detail.result.number} {detail.result.colors?.join('/')} {detail.result.big}</span>
                            </div>
                          )}
                          <div className="wg-myhist-detail-row"><span>Select</span><span style={{ textTransform: 'capitalize' }}>{detail.select?.value}</span></div>
                          <div className="wg-myhist-detail-row"><span>Status</span><span className={cls}>{detail.status}</span></div>
                          <div className="wg-myhist-detail-row"><span>Win/lose</span><span className={cls}>{detail.winLose >= 0 ? '+' : '-'}Rs{Math.abs(detail.winLose).toFixed(2)}</span></div>
                          <div className="wg-myhist-detail-row"><span>Order time</span><span>{new Date(detail.orderTime).toLocaleString()}</span></div>
                        </>
                      ) : (
                        <div className="wg-myhist-detail-loading">Could not load details.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="wg-empty-wrap">
            <div className="wg-empty-icon">
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#5a4020" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <span>No data</span>
          </div>
        )
      )}
      {activeTab === 'my' && !myBetsLoading && myBets.length > 0 && myTotalPages > 1 && (
        <div className="wg-pagination">
          <button disabled={myPage <= 1} onClick={() => setMyPage((p) => Math.max(1, p - 1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span>{myPage}/{myTotalPages}</span>
          <button disabled={myPage >= myTotalPages} onClick={() => setMyPage((p) => Math.min(myTotalPages, p + 1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="wg-modal-backdrop" onClick={() => setShowHowToPlay(false)}>
          <div className="wg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wg-modal-header">· {durationCfg.line1}{durationCfg.line2} ·</div>
            <div className="wg-modal-body">
              {HOW_TO_PLAY_TEXT.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
            <button className="wg-modal-close" onClick={() => setShowHowToPlay(false)}>Close</button>
          </div>
        </div>
      )}

      {/* BET POPUP MODAL */}
      {betModal && (
        <div className="wg-betmodal-backdrop" onClick={closeBetModal}>
          <div className={`wg-betmodal wg-accent-${accent}`} onClick={(e) => e.stopPropagation()}>
            <div className="wg-betmodal-header">
              <span className="wg-betmodal-titleline">{durationCfg.line1} {durationCfg.line2}</span>
              <div className="wg-betmodal-pill">Select {betModal.label}</div>
            </div>

            <div className="wg-betmodal-body">
              <div className="wg-betmodal-row">
                <span className="wg-betmodal-rowlabel">Balance</span>
                <div className="wg-balance-chips">
                  {BALANCE_OPTIONS.map((b) => (
                    <button
                      key={b}
                      className={`wg-balance-chip ${balanceOption === b ? 'active' : ''}`}
                      onClick={() => setBalanceOption(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wg-betmodal-row">
                <span className="wg-betmodal-rowlabel">Quantity</span>
                <div className="wg-qty-control">
                  <button className="wg-qty-btn" onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}>-</button>
                  <input
                    className="wg-qty-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                      // Allow the field to be briefly empty while typing/deleting; blur clamps it.
                      setQuantity(digitsOnly === '' ? '' : Math.min(9999, parseInt(digitsOnly, 10)));
                    }}
                    onBlur={() => setQuantity((q) => (q === '' || Number(q) < 1 ? 1 : Number(q)))}
                  />
                  <button className="wg-qty-btn" onClick={() => setQuantity((q) => (Number(q) || 0) + 1)}>+</button>
                </div>
              </div>

              <div className="wg-betmodal-mult-row">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    className={`wg-betmodal-mult ${multiplier === m ? 'active' : ''}`}
                    onClick={() => setMultiplier(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="wg-agree-row" onClick={() => setAgree((a) => !a)}>
                <span className={`wg-agree-check ${agree ? 'checked' : ''}`}>
                  {agree && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </span>
                <span className="wg-agree-text">I agree <span className="wg-agree-link">《Pre-sale rules》</span></span>
              </div>
            </div>

            <div className="wg-betmodal-footer">
              <button className="wg-betmodal-cancel" onClick={closeBetModal}>Cancel</button>
              <button className="wg-betmodal-confirm" disabled={!agree} onClick={handleConfirmBet}>
                Total amount Rs{totalAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSUFFICIENT BALANCE MODAL */}
      {showInsufficient && (
        <div className="wg-insuff-backdrop" onClick={() => setShowInsufficient(false)}>
          <div className="wg-insuff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wg-insuff-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1204" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2"></rect>
                <path d="M2 10h20"></path>
                <circle cx="16" cy="15" r="1"></circle>
              </svg>
            </div>
            <div className="wg-insuff-title">Insufficient Balance</div>
            <p className="wg-insuff-text">Your wallet balance is too low to place this bet. Please deposit first to continue playing.</p>
            <div className="wg-insuff-footer">
              <button className="wg-insuff-cancel" onClick={() => setShowInsufficient(false)}>Cancel</button>
              <button className="wg-insuff-deposit" onClick={() => { setShowInsufficient(false); navigate('/account/deposit'); }}>Deposit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* WIN / LOSS RESULT POPUP */}
      <ResultPopup
        open={!!resultPopup}
        status={resultPopup?.status}
        amount={resultPopup?.amount ?? 0}
        resultNumber={resultPopup?.resultNumber ?? 0}
        resultColors={resultPopup?.resultColors ?? ['green']}
        resultBig={resultPopup?.resultBig ?? 'Big'}
        period={resultPopup?.period ?? ''}
        durationLabel={resultPopup?.durationLabel ?? ''}
        onClose={() => setResultPopup(null)}
      />

      {/* BET PLACED CONFIRMATION — small centered toast, separate from the win/loss popup */}
      {betConfirmToast && (
        <div className="wg-betok-overlay">
          <div className="wg-betok-card">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#17d97a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12.5 11 15.5 16 9"></polyline></svg>
            <span>Bet placed successfully</span>
          </div>
        </div>
      )}

      <div className="wg-bottom-spacer"></div>
    </div>
  );
}

export default WinGo;