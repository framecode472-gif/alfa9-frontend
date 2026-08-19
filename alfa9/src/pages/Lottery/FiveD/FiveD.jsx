import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io as socketIOClient } from 'socket.io-client';
import { apiFetch } from '../../../utils/api';
import ResultPopup from '../../../components/ResultPopup/ResultPopup';
import './FiveD.css';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const DURATIONS = [
  { key: '1m', seconds: 60, line1: '5D 1', line2: 'Min' },
  { key: '3m', seconds: 180, line1: '5D 3', line2: 'Min' },
  { key: '5m', seconds: 300, line1: '5D 5', line2: 'Min' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const TABS = [...LETTERS, 'SUM'];
const NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLIERS = ['X1', 'X5', 'X10', 'X20', 'X50', 'X100'];
const BALANCE_OPTIONS = [1, 10, 100, 1000];

// Rows visible per page in Game history / Chart tabs
const PAGE_SIZE = 10;

const HOW_TO_PLAY_TEXT = [
  '1. Each round draws 5 numbers (A, B, C, D, E), every number between 0-9.',
  '2. Select a single number (A-E): if it matches the draw you get (98*9) 882.',
  '3. Select Big2 (5-9) or Small2 (0-4) on any letter: correct guess pays (98*2) 196.',
  '4. Select Odd2 or Even2 on any letter: correct guess pays (98*2) 196.',
  '5. SUM tab: A+B+C+D+E total decides Big (23-45) / Small (0-22) and Odd / Even, pays (98*2) 196.',
  '6. All bets lock 5 seconds before the round ends.',
];

function pad(num, size = 2) {
  return String(num).padStart(size, '0');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function makePeriod(counter) {
  return `${todayStr()}${pad(counter, 9)}`;
}

function isEven(n) {
  return n % 2 === 0;
}

function digitBigSmall(n) {
  return n >= 5 ? 'Big' : 'Small';
}

function sumBigSmall(sum) {
  return sum >= 23 ? 'Big' : 'Small';
}

function multValue(m) {
  return parseInt(m.replace('X', ''), 10);
}

function randomDigit() {
  return Math.floor(Math.random() * 10);
}

function makeRoundDigits() {
  return LETTERS.map(() => randomDigit());
}

function seedHistory(counterStart, count = 200) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const counter = counterStart - count + i;
    const digits = makeRoundDigits();
    const sum = digits.reduce((a, b) => a + b, 0);
    arr.push({ period: makePeriod(counter), digits, sum });
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

// Stats for a single letter's digit across a history window (Missing / Avg missing / Frequency / Max consecutive)
function computeDigitStats(historyWindow, letterIndex) {
  const total = historyWindow.length || 1;
  return NUMBERS.map((n) => {
    let missing = historyWindow.findIndex((h) => h.digits[letterIndex] === n);
    if (missing === -1) missing = historyWindow.length;
    const freq = historyWindow.filter((h) => h.digits[letterIndex] === n).length;
    const avgMissing = freq > 0 ? Math.round(total / freq) : historyWindow.length;
    let max = 0;
    let cur = 0;
    historyWindow.forEach((h) => {
      if (h.digits[letterIndex] === n) {
        cur += 1;
        max = Math.max(max, cur);
      } else {
        cur = 0;
      }
    });
    return { n, missing, avgMissing, freq, max };
  });
}

// Odds table matching the "How to play" rules (98 unit stake -> payout)
function oddsFor(kind) {
  if (kind === 'number') return 9;
  return 2; // big / small / odd / even
}

// Decides whether a placed bet wins against a drawn round, and by what odds multiplier.
function evaluateBet(bet, resultEntry) {
  if (!bet || !resultEntry) return { win: false, oddsMultiplier: 0 };

  if (bet.lane === 'SUM') {
    const sum = resultEntry.sum;
    if (bet.kind === 'big' || bet.kind === 'small') {
      const label = sumBigSmall(sum);
      return label === bet.value ? { win: true, oddsMultiplier: oddsFor(bet.kind) } : { win: false, oddsMultiplier: 0 };
    }
    if (bet.kind === 'odd' || bet.kind === 'even') {
      const label = isEven(sum) ? 'Even' : 'Odd';
      return label === bet.value ? { win: true, oddsMultiplier: oddsFor(bet.kind) } : { win: false, oddsMultiplier: 0 };
    }
    return { win: false, oddsMultiplier: 0 };
  }

  const idx = LETTERS.indexOf(bet.lane);
  const digit = resultEntry.digits[idx];

  if (bet.kind === 'number') {
    return digit === bet.value ? { win: true, oddsMultiplier: oddsFor('number') } : { win: false, oddsMultiplier: 0 };
  }
  if (bet.kind === 'big' || bet.kind === 'small') {
    return digitBigSmall(digit) === bet.value ? { win: true, oddsMultiplier: oddsFor(bet.kind) } : { win: false, oddsMultiplier: 0 };
  }
  if (bet.kind === 'odd' || bet.kind === 'even') {
    const label = isEven(digit) ? 'Even' : 'Odd';
    return label === bet.value ? { win: true, oddsMultiplier: oddsFor(bet.kind) } : { win: false, oddsMultiplier: 0 };
  }
  return { win: false, oddsMultiplier: 0 };
}

// CSS accent key used to color the bet popup and header pill
function accentKey(betModal) {
  if (!betModal) return '';
  return betModal.kind; // 'number' | 'big' | 'small' | 'odd' | 'even'
}

function FiveD() {
  const navigate = useNavigate();

  const [activeDuration, setActiveDuration] = useState('1m');
  const [gameStates, setGameStates] = useState(buildInitialStates);
  const [activeTab, setActiveTab] = useState('history');
  const [page, setPage] = useState(1);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [muted, setMuted] = useState(false);

  // Which lane (A-E or SUM) is currently selected for betting
  const [betLane, setBetLane] = useState('A');
  const [multiplier, setMultiplier] = useState('X1');

  // Chart tab: which letter's digit statistics/trend are shown
  const [chartLetter, setChartLetter] = useState('A');

  // Bet popup state
  const [betModal, setBetModal] = useState(null); // { lane, kind: 'number'|'big'|'small'|'odd'|'even', value, label }
  const [balanceOption, setBalanceOption] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [agree, setAgree] = useState(true);

  // Wallet balance (starts at 0 until the user deposits). Bets are deducted on confirm and
  // winnings are credited back when a pending bet resolves in the player's favor.
  const [balance, setBalance] = useState(0);
  // Shown instead of placing a bet when the wallet doesn't have enough balance for it.
  const [showInsufficient, setShowInsufficient] = useState(false);

  // Bet that has been confirmed and is waiting for its round to resolve
  const [pendingBet, setPendingBet] = useState(null);
  // Data shown in the win/loss popup once a pending bet resolves
  const [resultPopup, setResultPopup] = useState(null);
  const [betConfirmToast, setBetConfirmToast] = useState(false);
  const [betErrorToast, setBetErrorToast] = useState(null);

  const userIdRef = useRef(null);
  useEffect(() => {
    apiFetch('/user/profile')
      .then((data) => {
        setBalance(data.user.balance);
        userIdRef.current = data.user._id;
        socketRef.current?.emit('joinUser', data.user._id);
      })
      .catch(() => {});
  }, []);

  // ===== REAL-TIME RESULTS (socket.io) — see WinGo.jsx for the full
  // explanation of why this replaced duration-tab-dependent polling. =====
  const socketRef = useRef(null);
  useEffect(() => {
    const socket = socketIOClient(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    if (userIdRef.current) socket.emit('joinUser', userIdRef.current);

    socket.on('betSettled', (payload) => {
      if (payload.game !== '5d') return;
      setBalance(payload.newBalance);
      setMyBets((prev) => prev.map((b) => (
        b.id === payload.betId ? { ...b, status: payload.status, winLose: payload.winLose } : b
      )));
      setPendingBet((pb) => {
        if (!pb || pb.betId !== payload.betId) return pb;
        const durCfg = DURATIONS.find((d) => d.key === payload.duration);
        setResultPopup({
          status: payload.status === 'Succeed' ? 'win' : 'loss',
          amount: payload.status === 'Succeed' ? payload.winLose : payload.amount,
          digits: payload.result?.digits,
          sum: payload.result?.sum,
          period: payload.period,
          durationLabel: durCfg ? `${durCfg.line1} ${durCfg.line2}` : '',
          betLabel: pb.label,
        });
        return null;
      });
    });

    socket.on('roundSettled', (payload) => {
      if (payload.game !== '5d') return;
      setGameStates((prev) => {
        const entry = prev[payload.duration];
        if (!entry) return prev;
        if (entry.history.some((r) => r.period === payload.period)) return prev;
        const newRow = { period: payload.period, digits: payload.result?.digits, sum: payload.result?.sum };
        return { ...prev, [payload.duration]: { ...entry, history: [newRow, ...entry.history] } };
      });
      if (payload.duration === activeDuration) setPage(1);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [myBets, setMyBets] = useState([]);
  const [myBetsLoading, setMyBetsLoading] = useState(false);
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);
  const [expandedBetId, setExpandedBetId] = useState(null);
  const [betDetails, setBetDetails] = useState({});
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
    apiFetch(`/game-round/my-bets/5d?duration=${activeDuration}&page=${myPage}`)
      .then((data) => { setMyBets(data.bets || []); setMyTotalPages(data.totalPages || 1); })
      .catch(() => { setMyBets([]); setMyTotalPages(1); })
      .finally(() => setMyBetsLoading(false));
  }, [activeTab, activeDuration, myPage]);
  useEffect(() => { setMyPage(1); }, [activeTab, activeDuration]);

  // Slot-machine style reveal animation for the reel: spins for ~3.4s right after a round
  // completes, then settles on the real result. Purely cosmetic, separate from the single
  // countdown timer in the period bar.
  const [spinning, setSpinning] = useState(false);
  const [spinDigits, setSpinDigits] = useState(() => makeRoundDigits());
  const [spinTick, setSpinTick] = useState(0);

  const refreshRef = useRef(null);
  const periodBodyRef = useRef(null);
  const periodSvgRef = useRef(null);
  const activeBadgeRefs = useRef({});

  // Lazily-created Web Audio context used for the last-5-seconds countdown tick.
  const audioCtxRef = useRef(null);
  const lastTickKeyRef = useRef('');
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Polls the real backend for the active duration's round every second
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      apiFetch(`/game-round/current/5d?duration=${activeDuration}`)
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
                apiFetch(`/game-round/history/5d?duration=${activeDuration}`)
                  .then((histData) => {
                    if (cancelled) return;
                    const rounds = histData.rounds || [];
                    const hasNewest = rounds.some((r) => r.period === justEndedPeriod);
                    if (!hasNewest && histAttempts < 15) {
                      histAttempts += 1;
                      setTimeout(pollHistory, 200);
                      return;
                    }
                    setGameStates((p2) => ({
                      ...p2,
                      [activeDuration]: {
                        ...p2[activeDuration],
                        history: rounds.map((r) => ({
                          period: r.period, digits: r.result?.digits, sum: r.result?.sum,
                        })),
                      },
                    }));
                    setPage(1);
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

  useEffect(() => {
    apiFetch(`/game-round/history/5d?duration=${activeDuration}`)
      .then((data) => {
        setGameStates((prev) => ({
          ...prev,
          [activeDuration]: {
            ...prev[activeDuration],
            history: (data.rounds || []).map((r) => ({
              period: r.period, digits: r.result?.digits, sum: r.result?.sum,
            })),
          },
        }));
      })
      .catch(() => {});
  }, [activeDuration]);

  const current = gameStates[activeDuration];
  const durationCfg = DURATIONS.find((d) => d.key === activeDuration);
  const locked = current.timeLeft <= 5;
  const urgent = current.timeLeft <= 3;
  const latestRound = current.history[0];

  useEffect(() => {
    setBetModal(null);
  }, [activeDuration, current.period]);

  // Slot-machine reveal: every time the round counter advances, spin random digits for ~3.4s
  // then land on the real drawn numbers (single source of truth stays in current.history).
  useEffect(() => {
    setSpinning(true);
    const frameInterval = setInterval(() => {
      setSpinDigits(makeRoundDigits());
      setSpinTick((t) => t + 1);
    }, 90);
    const stopTimeout = setTimeout(() => {
      clearInterval(frameInterval);
      setSpinning(false);
    }, 3400);
    return () => {
      clearInterval(frameInterval);
      clearTimeout(stopTimeout);
    };
  }, [activeDuration, current.period]);

  useEffect(() => {
    setPage(1);
  }, [activeDuration, activeTab, chartLetter]);

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

  useEffect(() => {
    if (!pendingBet) return;
    const st = gameStates[pendingBet.duration];
    if (!st || !st.period || st.period === pendingBet.period) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 70;

    const poll = () => {
      if (cancelled) return;
      apiFetch(`/game-round/bet-detail/${pendingBet.betId}`)
        .then((detail) => {
          if (cancelled) return;
          if (detail.status === 'Pending') {
            if (attempts < MAX_ATTEMPTS) {
              attempts += 1;
              setTimeout(poll, 200);
              return;
            }
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
            digits: detail.result?.digits,
            sum: detail.result?.sum,
            period: detail.period,
            durationLabel,
            betLabel: pendingBet.label,
          });
          setPendingBet(null);
        })
        .catch(() => { if (!cancelled) setPendingBet(null); });
    };

    poll();
    return () => { cancelled = true; };
  }, [gameStates, pendingBet]);

  const openBetModal = (kind, value, label) => {
    if (locked) return;
    setBetModal({ lane: betLane, kind, value, label });
    setBalanceOption(1);
    setQuantity(1);
    setAgree(true);
  };
  const closeBetModal = () => setBetModal(null);

  const handleConfirmBet = () => {
    if (!agree || !betModal) return;
    const safeQuantity = Number(quantity) || 1;
    const totalAmount = balanceOption * safeQuantity * multValue(multiplier);

    if (totalAmount > balance) {
      closeBetModal();
      setShowInsufficient(true);
      return;
    }

    const snapshot = { lane: betModal.lane, kind: betModal.kind, value: betModal.value, label: betModal.label, duration: activeDuration };
    setBalance((b) => Math.round((b - totalAmount) * 100) / 100);
    closeBetModal();
    setBetConfirmToast(true);
    setTimeout(() => setBetConfirmToast(false), 1400);

    apiFetch('/game-round/bet', {
      method: 'POST',
      body: {
        gameName: '5d',
        duration: snapshot.duration,
        betType: snapshot.kind,
        betValue: String(snapshot.value),
        betLane: snapshot.lane,
        unitAmount: balanceOption,
        quantity: safeQuantity,
        multiplier: multValue(multiplier),
      },
    })
      .then((data) => {
        setPendingBet({
          betId: data.bet.id,
          duration: snapshot.duration,
          period: data.bet.period,
          lane: snapshot.lane,
          kind: snapshot.kind,
          value: snapshot.value,
          label: snapshot.label,
          amount: data.bet.amount,
        });
        if (activeTab === 'my') {
          setMyBets((prev) => [{
            id: data.bet.id, orderNumber: data.bet.orderNumber, period: data.bet.period,
            betType: snapshot.kind, betValue: String(snapshot.value), betLane: snapshot.lane,
            status: 'Pending', winLose: 0, amount: data.bet.amount, createdAt: new Date().toISOString(),
          }, ...prev]);
        }
      })
      .catch((err) => {
        setBalance((b) => Math.round((b + totalAmount) * 100) / 100);
        setBetConfirmToast(false);
        setBetErrorToast(err.message || 'Could not place bet — please try again');
        setTimeout(() => setBetErrorToast(null), 2400);
      });
  };

  const handleNumberClick = (n) => openBetModal('number', n, `${betLane} = ${n}`);
  const handleBigSmall = (v) => openBetModal(v.toLowerCase(), v, `${betLane} ${v}2`);
  const handleOddEven = (v) => openBetModal(v.toLowerCase(), v, `${betLane} ${v}2`);

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

  const totalPages = Math.max(1, Math.ceil(current.history.length / PAGE_SIZE));
  const pageRows = current.history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const chartLetterIndex = LETTERS.indexOf(chartLetter);
  const statsWindow = current.history.slice(0, 100);
  const stats = activeTab === 'chart' ? computeDigitStats(statsWindow, chartLetterIndex) : [];
  const maxFreq = Math.max(1, ...stats.map((s) => s.freq));
  const sortedByFreq = activeTab === 'chart'
    ? [...stats].sort((a, b) => b.freq - a.freq || a.missing - b.missing)
    : [];
  const hotNumbers = sortedByFreq.slice(0, 3);
  const coldNumbers = sortedByFreq.slice(-3).reverse();

  // Draw the glowing connector line across each row's digit badge (for the selected chart letter)
  // in the premium period table.
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
      grad.setAttribute('id', 'fdPeriodTrendGrad');
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
      path.setAttribute('stroke', 'url(#fdPeriodTrendGrad)');
      path.setAttribute('stroke-width', '2.2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    };

    const raf = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', draw);
    };
  }, [activeTab, page, activeDuration, current.history, chartLetter]);

  const accent = accentKey(betModal);
  const totalAmount = balanceOption * (Number(quantity) || 0) * multValue(multiplier);

  return (
    <div className="fd-page">
      {/* HEADER */}
      <header className="fd-header">
        <button className="fd-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="fd-logo-wrap">
          <img src="/image/ultraalf9.png" alt="Alfa9" className="fd-logo-img" />
        </div>
        <div className="fd-header-icons">
          <div className="fd-icon-btn" onClick={() => navigate('/customer-service')} title="Support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="fd-icon-btn" onClick={handleToggleMute} title="Sound">
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
      <div className="fd-wallet-card">
        <div className="fd-wallet-top">
          <span className="fd-balance">Rs{balance.toFixed(2)}</span>
          <svg ref={refreshRef} className="fd-refresh" onClick={handleRefresh} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </div>
        <div className="fd-wallet-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#d4af37"><path d="M21 7H3a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM3 5h15a2 2 0 0 1 2 2H3a2 2 0 0 1 0-2z"/></svg>
          Wallet balance
        </div>
        <div className="fd-wallet-btns">
          <button className="fd-withdraw-btn" onClick={() => navigate('/account/withdraw')}>Withdraw</button>
          <button className="fd-deposit-btn" onClick={() => navigate('/account/deposit')}>Deposit</button>
        </div>
      </div>

      {/* DURATION TABS */}
      <div className="fd-duration-tabs">
        {DURATIONS.map((d) => (
          <div
            key={d.key}
            className={`fd-duration-card ${activeDuration === d.key ? 'active' : ''}`}
            onClick={() => setActiveDuration(d.key)}
          >
            <div className="fd-duration-icon">
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

      {/* LOTTERY RESULT STRIP */}
      <div className="fd-lottery-card">
        <span className="fd-lottery-label">Lottery results</span>
        <div className="fd-lottery-row">
          {(latestRound?.digits || [0, 0, 0, 0, 0]).map((n, i) => (
            <div className="fd-lottery-ball-wrap" key={i}>
              <span className="fd-lottery-ball">{n}</span>
              <span className="fd-lottery-letter">{LETTERS[i]}</span>
            </div>
          ))}
          <span className="fd-lottery-eq">=</span>
          <span className="fd-lottery-sum">{latestRound?.sum ?? '--'}</span>
        </div>
      </div>

      {/* PERIOD / TIMER BAR */}
      <div className="fd-period-bar">
        <div className="fd-period-left">
          <button className="fd-howtoplay-btn" onClick={() => setShowHowToPlay(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="14" rx="2"></rect><line x1="7" y1="9" x2="17" y2="9"></line><line x1="7" y1="13" x2="13" y2="13"></line>
            </svg>
            How to play
          </button>
          <span className="fd-period-name">{durationCfg.line1} {durationCfg.line2}</span>
          <span className="fd-period-id">{current.period}</span>
        </div>
        <div className="fd-period-right">
          <span className="fd-time-label">Time remaining</span>
          <div className="fd-time-digits">
            <span className="fd-digit">{timeDigits[0]}</span>
            <span className="fd-digit">{timeDigits[1]}</span>
            <span className="fd-colon">:</span>
            <span className="fd-digit">{timeDigits[2]}</span>
            <span className="fd-digit">{timeDigits[3]}</span>
          </div>
        </div>
      </div>

      {/* REEL (single source of truth for the result reveal — spins briefly like a slot machine, then settles) */}
      <div className="fd-reel-wrap">
        <div className={`fd-reel ${spinning ? 'spinning' : ''}`}>
          {(spinning ? spinDigits : (latestRound?.digits || [0, 0, 0, 0, 0])).map((n, i) => (
            <div key={i} className={`fd-reel-cell ${i === 0 && !spinning ? 'featured' : ''}`}>
              <span key={spinning ? `spin-${i}-${spinTick}` : 'settled'} className={`fd-reel-digit ${spinning ? 'rising' : ''}`}>
                {n}
              </span>
            </div>
          ))}
        </div>
        <span className="fd-reel-caption">{spinning ? 'Drawing…' : `Result · ${latestRound ? latestRound.period : ''}`}</span>
      </div>

      {/* LANE TABS A-E / SUM */}
      <div className="fd-lane-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`fd-lane-tab ${betLane === t ? 'active' : ''}`}
            onClick={() => setBetLane(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* BETTING PANEL */}
      <div className="fd-betting-panel">
        <div className="fd-bigsmall-row">
          <button className="fd-bs-btn fd-bs-big" disabled={locked} onClick={() => handleBigSmall('Big')}>Big2</button>
          <button className="fd-bs-btn fd-bs-small" disabled={locked} onClick={() => handleBigSmall('Small')}>Small2</button>
          <button className="fd-bs-btn fd-bs-odd" disabled={locked} onClick={() => handleOddEven('Odd')}>Odd2</button>
          <button className="fd-bs-btn fd-bs-even" disabled={locked} onClick={() => handleOddEven('Even')}>Even2</button>
        </div>

        {betLane !== 'SUM' && (
          <div className="fd-number-wrap">
            <div className={`fd-number-grid ${locked ? 'dim' : ''}`}>
              {NUMBERS.map((n) => (
                <div key={n} className="fd-number-cell" onClick={() => handleNumberClick(n)}>
                  <span className="fd-number-ball">{n}</span>
                  <span className="fd-number-odds">9X</span>
                </div>
              ))}
            </div>
            {locked && (
              <div className="fd-lock-overlay">
                <span className="fd-lock-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f3da95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Betting closes in
                </span>
                <div className="fd-lock-digits">
                  <span className="fd-lock-ring"></span>
                  <span className={`fd-lock-card ${urgent ? 'fd-lock-urgent' : ''}`}>{pad(current.timeLeft)[0]}</span>
                  <span className="fd-lock-colon">:</span>
                  <span className={`fd-lock-card ${urgent ? 'fd-lock-urgent' : ''}`}>{pad(current.timeLeft)[1]}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {betLane === 'SUM' && (
          <div className="fd-sum-note">Sum range 0-45 · Big is 23-45, Small is 0-22</div>
        )}

        <div className="fd-mult-row">
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              className={`fd-mult-btn ${multiplier === m ? 'active' : ''}`}
              disabled={locked}
              onClick={() => setMultiplier(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="fd-tabs-row">
        <button className={`fd-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Game history</button>
        <button className={`fd-tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>Chart</button>
        <button className={`fd-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My history</button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="fd-table-wrap">
          <div className="fd-table-header">
            <span>Period</span><span>Result</span><span>Total</span>
          </div>
          {pageRows.map((r) => (
            <div className="fd-table-row" key={r.period}>
              <span className="fd-cell-period">{r.period}</span>
              <span className="fd-cell-result">
                {r.digits.map((n, i) => <span key={i} className="fd-result-ball">{n}</span>)}
              </span>
              <span className="fd-cell-total">{r.sum}</span>
            </div>
          ))}
          <div className="fd-pagination">
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
        <div className="fd-chart-wrap">
          {/* LETTER SELECTOR */}
          <div className="fd-chartletter-tabs">
            {LETTERS.map((l) => (
              <button
                key={l}
                className={`fd-chartletter-tab ${chartLetter === l ? 'active' : ''}`}
                onClick={() => setChartLetter(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {/* HOT / COLD NUMBERS (for the selected letter) */}
          <div className="fd-hotcold">
            <div className="fd-hotcold-card">
              <div className="fd-hotcold-label hot">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff8a5c"><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1 2 2 2 5a8 8 0 0 1-16 0C4 8 9 7 12 2z"/></svg>
                Hot numbers · {chartLetter}
              </div>
              <div className="fd-hotcold-balls">
                {hotNumbers.map((s) => (
                  <span key={s.n} className="fd-hotcold-ball hot">{s.n}</span>
                ))}
              </div>
            </div>
            <div className="fd-hotcold-card">
              <div className="fd-hotcold-label cold">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6fb8ff" strokeWidth="2"><path d="M12 2v20M4 7l16 10M20 7L4 17"/></svg>
                Cold numbers · {chartLetter}
              </div>
              <div className="fd-hotcold-balls">
                {coldNumbers.map((s) => (
                  <span key={s.n} className="fd-hotcold-ball cold">{s.n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* STATISTIC MATRIX */}
          <div className="fd-statmatrix-wrap">
            <div className="fd-chart-section-title">
              <span>Statistic</span>
              <span>last {statsWindow.length} periods</span>
            </div>
            <div className="fd-statmatrix">
              <div className="fd-statmatrix-row fd-statmatrix-headrow">
                <span className="fd-statmatrix-label"></span>
                {stats.map((s) => <span key={s.n} className="fd-statmatrix-num">{s.n}</span>)}
              </div>
              <div className="fd-statmatrix-row">
                <span className="fd-statmatrix-label">Missing</span>
                {stats.map((s) => <span key={s.n}>{s.missing}</span>)}
              </div>
              <div className="fd-statmatrix-row">
                <span className="fd-statmatrix-label">Avg missing</span>
                {stats.map((s) => <span key={s.n}>{s.avgMissing}</span>)}
              </div>
              <div className="fd-statmatrix-row">
                <span className="fd-statmatrix-label">Frequency</span>
                {stats.map((s) => <span key={s.n}>{s.freq}</span>)}
              </div>
              <div className="fd-statmatrix-row">
                <span className="fd-statmatrix-label">Max consecutive</span>
                {stats.map((s) => <span key={s.n}>{s.max}</span>)}
              </div>
            </div>
          </div>

          {/* PREMIUM PERIOD TREND TABLE */}
          <div>
            <div className="fd-chart-section-title" style={{ marginBottom: 8 }}>
              <span>Round trend · {chartLetter}</span>
              <span>page {page}/{totalPages}</span>
            </div>
            <div className="fd-periodtable">
              <div className="fd-periodtable-header">
                <span>Period</span>
                <span>Number</span>
              </div>
              <div className="fd-periodtable-body" ref={periodBodyRef}>
                <svg ref={periodSvgRef} className="fd-periodtable-svg"></svg>
                {pageRows.map((r) => {
                  const digit = r.digits[chartLetterIndex];
                  return (
                    <div className="fd-periodtable-row" key={r.period}>
                      <span className="fd-periodtable-period" title={r.period}>...{r.period.slice(-6)}</span>
                      <div className="fd-periodtable-badges">
                        {NUMBERS.map((n) => (
                          <span
                            key={n}
                            ref={(el) => {
                              if (n === digit) activeBadgeRefs.current[r.period] = el;
                            }}
                            className={`fd-numbadge ${n === digit ? 'active' : ''}`}
                          >
                            {n}
                          </span>
                        ))}
                        <span className={`fd-utilbadge ${digitBigSmall(digit) === 'Big' ? 'fd-ub-b' : 'fd-ub-s'}`}>
                          {digitBigSmall(digit) === 'Big' ? 'B' : 'S'}
                        </span>
                        <span className={`fd-utilbadge ${isEven(digit) ? 'fd-ub-e' : 'fd-ub-o'}`}>
                          {isEven(digit) ? 'E' : 'O'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="fd-pagination">
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
          <div className="fd-empty-wrap">
            <span>Loading…</span>
          </div>
        ) : myBets.length > 0 ? (
          <div className="fd-myhist-list">
            {myBets.map((b) => {
              const cls = b.status === 'Succeed' ? 'win' : b.status === 'Pending' ? 'pending' : 'lose';
              const isOpen = expandedBetId === b.id;
              const detail = betDetails[b.id];
              return (
                <div className={`fd-myhist-card ${isOpen ? 'open' : ''}`} key={b.id}>
                  <div className="fd-myhist-row" onClick={() => toggleBetDetail(b.id)}>
                    <div className={`fd-myhist-badge ${cls}`}>{b.betLane ? `${b.betLane}:` : ''}{b.betValue}</div>
                    <div className="fd-myhist-main">
                      <div>{b.period}</div>
                      <div className="fd-myhist-date">{new Date(b.createdAt).toLocaleString()}</div>
                    </div>
                    {b.status === 'Pending' ? (
                      <div className="fd-myhist-amt pending">Pending</div>
                    ) : (
                      <div className={`fd-myhist-amt ${cls}`}>
                        {b.winLose >= 0 ? '+' : ''}Rs{Math.abs(b.winLose).toFixed(2)}
                      </div>
                    )}
                    <svg className={`fd-myhist-chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  {isOpen && (
                    <div className="fd-myhist-detail">
                      {detailLoadingId === b.id ? (
                        <div className="fd-myhist-detail-loading">Loading…</div>
                      ) : detail && !detail.error ? (
                        <>
                          <div className="fd-myhist-detail-row"><span>Order number</span><span>{detail.orderNumber}</span></div>
                          <div className="fd-myhist-detail-row"><span>Period</span><span>{detail.period}</span></div>
                          <div className="fd-myhist-detail-row"><span>Purchase amount</span><span>Rs{detail.purchaseAmount?.toFixed(2)}</span></div>
                          <div className="fd-myhist-detail-row"><span>Quantity</span><span>{detail.quantity}</span></div>
                          <div className="fd-myhist-detail-row"><span>Amount after tax</span><span>Rs{detail.amountAfterTax?.toFixed(2)}</span></div>
                          <div className="fd-myhist-detail-row"><span>Tax</span><span>Rs{detail.tax?.toFixed(2)}</span></div>
                          {detail.result && (
                            <div className="fd-myhist-detail-row">
                              <span>Result</span>
                              <span>{detail.result.digits?.join('')} · Sum {detail.result.sum}</span>
                            </div>
                          )}
                          <div className="fd-myhist-detail-row"><span>Select</span><span style={{ textTransform: 'capitalize' }}>{detail.select?.lane ? `${detail.select.lane}: ` : ''}{detail.select?.value}</span></div>
                          <div className="fd-myhist-detail-row"><span>Status</span><span className={cls}>{detail.status}</span></div>
                          <div className="fd-myhist-detail-row"><span>Win/lose</span><span className={cls}>{detail.winLose >= 0 ? '+' : '-'}Rs{Math.abs(detail.winLose).toFixed(2)}</span></div>
                          <div className="fd-myhist-detail-row"><span>Order time</span><span>{new Date(detail.orderTime).toLocaleString()}</span></div>
                        </>
                      ) : (
                        <div className="fd-myhist-detail-loading">Could not load details.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="fd-empty-wrap">
            <div className="fd-empty-icon">
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#5a4020" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <span>No data</span>
          </div>
        )
      )}
      {activeTab === 'my' && !myBetsLoading && myBets.length > 0 && myTotalPages > 1 && (
        <div className="fd-pagination">
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
        <div className="fd-modal-backdrop" onClick={() => setShowHowToPlay(false)}>
          <div className="fd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal-header">· {durationCfg.line1}{durationCfg.line2} ·</div>
            <div className="fd-modal-body">
              {HOW_TO_PLAY_TEXT.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
            <button className="fd-modal-close" onClick={() => setShowHowToPlay(false)}>Close</button>
          </div>
        </div>
      )}

      {/* BET POPUP MODAL (same style/behaviour as WinGo's) */}
      {betModal && (
        <div className="fd-betmodal-backdrop" onClick={closeBetModal}>
          <div className={`fd-betmodal fd-accent-${accent}`} onClick={(e) => e.stopPropagation()}>
            <div className="fd-betmodal-header">
              <span className="fd-betmodal-titleline">{durationCfg.line1} {durationCfg.line2}</span>
              <div className="fd-betmodal-pill">Select {betModal.label}</div>
            </div>

            <div className="fd-betmodal-body">
              <div className="fd-betmodal-row">
                <span className="fd-betmodal-rowlabel">Balance</span>
                <div className="fd-balance-chips">
                  {BALANCE_OPTIONS.map((b) => (
                    <button
                      key={b}
                      className={`fd-balance-chip ${balanceOption === b ? 'active' : ''}`}
                      onClick={() => setBalanceOption(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fd-betmodal-row">
                <span className="fd-betmodal-rowlabel">Quantity</span>
                <div className="fd-qty-control">
                  <button className="fd-qty-btn" onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}>-</button>
                  <input
                    className="fd-qty-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                      setQuantity(digitsOnly === '' ? '' : Math.min(9999, parseInt(digitsOnly, 10)));
                    }}
                    onBlur={() => setQuantity((q) => (q === '' || Number(q) < 1 ? 1 : Number(q)))}
                  />
                  <button className="fd-qty-btn" onClick={() => setQuantity((q) => (Number(q) || 0) + 1)}>+</button>
                </div>
              </div>

              <div className="fd-betmodal-mult-row">
                {MULTIPLIERS.map((m) => (
                  <button
                    key={m}
                    className={`fd-betmodal-mult ${multiplier === m ? 'active' : ''}`}
                    onClick={() => setMultiplier(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="fd-agree-row" onClick={() => setAgree((a) => !a)}>
                <span className={`fd-agree-check ${agree ? 'checked' : ''}`}>
                  {agree && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </span>
                <span className="fd-agree-text">I agree <span className="fd-agree-link">《Pre-sale rules》</span></span>
              </div>
            </div>

            <div className="fd-betmodal-footer">
              <button className="fd-betmodal-cancel" onClick={closeBetModal}>Cancel</button>
              <button className="fd-betmodal-confirm" disabled={!agree} onClick={handleConfirmBet}>
                Total amount Rs{totalAmount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSUFFICIENT BALANCE MODAL */}
      {showInsufficient && (
        <div className="fd-insuff-backdrop" onClick={() => setShowInsufficient(false)}>
          <div className="fd-insuff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fd-insuff-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1204" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2"></rect>
                <path d="M2 10h20"></path>
                <circle cx="16" cy="15" r="1"></circle>
              </svg>
            </div>
            <div className="fd-insuff-title">Insufficient Balance</div>
            <p className="fd-insuff-text">Your wallet balance is too low to place this bet. Please deposit first to continue playing.</p>
            <div className="fd-insuff-footer">
              <button className="fd-insuff-cancel" onClick={() => setShowInsufficient(false)}>Cancel</button>
              <button className="fd-insuff-deposit" onClick={() => { setShowInsufficient(false); navigate('/account/deposit'); }}>Deposit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* WIN / LOSS RESULT POPUP — same shared component as WinGo/K3 so it feels identical everywhere */}
      <ResultPopup
        open={!!resultPopup}
        status={resultPopup?.status}
        amount={resultPopup?.amount ?? 0}
        resultBadges={resultPopup ? [resultPopup.digits.join(''), `Sum ${resultPopup.sum}`] : []}
        period={resultPopup?.period ?? ''}
        durationLabel={resultPopup?.durationLabel ?? ''}
        betLabel={resultPopup?.betLabel ?? ''}
        onClose={() => setResultPopup(null)}
      />

      {/* BET PLACED CONFIRMATION — small centered toast, separate from the win/loss popup */}
      {betConfirmToast && (
        <div className="fd-betok-overlay">
          <div className="fd-betok-card">
            <div className="fd-betok-icon-ring">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17d97a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12.5 11 15.5 16 9"></polyline></svg>
            </div>
            <span>Bet placed successfully</span>
          </div>
        </div>
      )}

      {/* BET ERROR — themed toast instead of the browser's native alert() popup */}
      {betErrorToast && (
        <div className="fd-betok-overlay">
          <div className="fd-betok-card fd-betok-card--error">
            <div className="fd-betok-icon-ring fd-betok-icon-ring--error">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff5c5c" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="13"></line><circle cx="12" cy="16" r="1" fill="#ff5c5c" stroke="none"></circle></svg>
            </div>
            <span>{betErrorToast}</span>
          </div>
        </div>
      )}

      <div className="fd-bottom-spacer"></div>
    </div>
  );
}

export default FiveD;