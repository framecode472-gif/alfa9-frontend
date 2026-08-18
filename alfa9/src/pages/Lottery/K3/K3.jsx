import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io as socketIOClient } from 'socket.io-client';
import { apiFetch } from '../../../utils/api';
import ResultPopup from '../../../components/ResultPopup/ResultPopup';
import './K3.css';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const DURATIONS = [
  { key: '1m', seconds: 60, line1: 'K3', line2: '1 Min' },
  { key: '3m', seconds: 180, line1: 'K3', line2: '3 Min' },
  { key: '5m', seconds: 300, line1: 'K3', line2: '5 Min' },
];

const FACES = [1, 2, 3, 4, 5, 6];
const MULTIPLIERS = ['X1', 'X5', 'X10', 'X20', 'X50', 'X100'];
const BALANCE_OPTIONS = [1, 10, 100, 1000];

// odds for each possible dice sum, 3..18
const SUM_ODDS = {
  3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74, 7: 13.83, 8: 9.88, 9: 8.3, 10: 7.68,
  11: 7.68, 12: 8.3, 13: 9.88, 14: 13.83, 15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36,
};
const SUMS = Object.keys(SUM_ODDS).map(Number);

const HOW_TO_PLAY_TEXT = [
  '1. Three dice are rolled every round. The total is the sum of all three faces (3 to 18).',
  '2. Total: pick an exact sum (3-18), or bet Small (3-10) / Big (11-18) / Even / Odd.',
  '3. 2 same: bet on two dice landing on a matching pair, or a matching pair plus one different number.',
  '4. 3 same: bet on all three dice landing on the same chosen number, or any triple at all.',
  '5. Different: bet on three different numbers, three numbers in a row, or two different numbers appearing together.',
  '6. Odds shown next to each option are multiplied by your stake if the bet wins.',
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

function rollDice() {
  return [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6));
}

function sumOf(dice) {
  return dice[0] + dice[1] + dice[2];
}

function sumColor(sum) {
  return sum % 2 === 0 ? 'green' : 'red';
}

function getBigSmall(sum) {
  return sum <= 10 ? 'Small' : 'Big';
}

function getEvenOdd(sum) {
  return sum % 2 === 0 ? 'Even' : 'Odd';
}

// classifies a roll for the chart tab: 3 same / 2 same / 3 continuous / 3 different
function classify(dice) {
  const sorted = [...dice].sort((a, b) => a - b);
  if (sorted[0] === sorted[1] && sorted[1] === sorted[2]) return '3 same numbers';
  if (sorted[0] === sorted[1] || sorted[1] === sorted[2]) return '2 same numbers';
  if (sorted[1] - sorted[0] === 1 && sorted[2] - sorted[1] === 1) return '3 continuous numbers';
  return '3 different numbers';
}

// big tray dice (glossy 3D face images), file names num-1.png .. num-6.png
function trayDieImg(v) {
  return `/image/num-${v}.png`;
}

// small history/chart dice icons, file names n1.png .. n6.png
function cellDieImg(v) {
  return `/image/n${v}.png`;
}

function totalBallImg(sum) {
  return sumColor(sum) === 'green' ? '/image/greenball.png' : '/image/redball.png';
}

function multValue(m) {
  return parseInt(m.replace('X', ''), 10);
}

function seedHistory(counterStart, count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const dice = rollDice();
    const sum = sumOf(dice);
    const counter = counterStart - count + i;
    arr.push({
      period: makePeriod(counter),
      dice,
      sum,
      bigSmall: getBigSmall(sum),
      evenOdd: getEvenOdd(sum),
      classification: classify(dice),
    });
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

// Breaks a roll down into the shape info every bet type needs to be evaluated against.
function rollShape(dice) {
  const sorted = [...dice].sort((a, b) => a - b);
  const isTriple = sorted[0] === sorted[1] && sorted[1] === sorted[2];
  const isPair = !isTriple && (sorted[0] === sorted[1] || sorted[1] === sorted[2]);
  const pairValue = isPair ? (sorted[0] === sorted[1] ? sorted[0] : sorted[1]) : null;
  const singleValue = isPair ? (sorted[0] === sorted[1] ? sorted[2] : sorted[0]) : null;
  const isContinuous = !isPair && !isTriple && sorted[1] - sorted[0] === 1 && sorted[2] - sorted[1] === 1;
  const isAllDifferent = !isPair && !isTriple;
  return { sorted, isTriple, isPair, pairValue, singleValue, isContinuous, isAllDifferent };
}

// Decides whether a placed bet wins against a drawn round, and by what odds multiplier.
// `bet.key` mirrors the key used to open the bet popup (e.g. "total-7", "pair-4", "triple-6").
function evaluateBet(bet, resultEntry) {
  if (!bet || !resultEntry) return { win: false, oddsMultiplier: 0 };
  const dice = resultEntry.dice;
  const sum = resultEntry.sum;
  const shape = rollShape(dice);
  const [kind, rawVal] = bet.key.split('-');
  const v = rawVal !== undefined ? Number(rawVal) : null;

  switch (kind) {
    case 'total':
      return sum === v ? { win: true, oddsMultiplier: SUM_ODDS[v] } : { win: false, oddsMultiplier: 0 };
    case 'small':
      return sum <= 10 ? { win: true, oddsMultiplier: 2 } : { win: false, oddsMultiplier: 0 };
    case 'big':
      return sum > 10 ? { win: true, oddsMultiplier: 2 } : { win: false, oddsMultiplier: 0 };
    case 'even':
      return sum % 2 === 0 ? { win: true, oddsMultiplier: 2 } : { win: false, oddsMultiplier: 0 };
    case 'odd':
      return sum % 2 !== 0 ? { win: true, oddsMultiplier: 2 } : { win: false, oddsMultiplier: 0 };
    case 'pair':
      return shape.isPair && shape.pairValue === v ? { win: true, oddsMultiplier: 13.83 } : { win: false, oddsMultiplier: 0 };
    case 'uniqpair':
      return shape.isPair && shape.pairValue === v ? { win: true, oddsMultiplier: 69.12 } : { win: false, oddsMultiplier: 0 };
    case 'uniqsingle':
      return shape.isPair && shape.singleValue === v ? { win: true, oddsMultiplier: 69.12 } : { win: false, oddsMultiplier: 0 };
    case 'triple':
      return shape.isTriple && dice[0] === v ? { win: true, oddsMultiplier: 207.36 } : { win: false, oddsMultiplier: 0 };
    case 'any':
      return shape.isTriple ? { win: true, oddsMultiplier: 34.56 } : { win: false, oddsMultiplier: 0 };
    case 'diff3':
      return shape.isAllDifferent && dice.includes(v) ? { win: true, oddsMultiplier: 34.56 } : { win: false, oddsMultiplier: 0 };
    case 'continuous':
      return shape.isContinuous ? { win: true, oddsMultiplier: 8.64 } : { win: false, oddsMultiplier: 0 };
    case 'diff2':
      return shape.isPair && (shape.pairValue === v || shape.singleValue === v)
        ? { win: true, oddsMultiplier: 6.91 }
        : { win: false, oddsMultiplier: 0 };
    default:
      return { win: false, oddsMultiplier: 0 };
  }
}

function K3() {
  const navigate = useNavigate();

  const [activeDuration, setActiveDuration] = useState('1m');
  const [gameStates, setGameStates] = useState(buildInitialStates);
  const [activeCat, setActiveCat] = useState('total');
  const [activeTab, setActiveTab] = useState('history');
  const [page, setPage] = useState(1);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const [selectedKey, setSelectedKey] = useState(null);
  const [multiplier, setMultiplier] = useState('X1');
  const [betModal, setBetModal] = useState(null); // { key, label, odds, accent }
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
      if (payload.game !== 'k3') return;
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
          dice: payload.result?.dice,
          sum: payload.result?.sum,
          period: payload.period,
          durationLabel: durCfg ? `${durCfg.line1} ${durCfg.line2}` : '',
          betLabel: pb.label,
        });
        return null;
      });
    });

    socket.on('roundSettled', (payload) => {
      if (payload.game !== 'k3') return;
      setGameStates((prev) => {
        const entry = prev[payload.duration];
        if (!entry) return prev;
        if (entry.history.some((r) => r.period === payload.period)) return prev;
        const newRow = { period: payload.period, dice: payload.result?.dice, sum: payload.result?.sum };
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
    apiFetch(`/game-round/my-bets/k3?duration=${activeDuration}&page=${myPage}`)
      .then((data) => { setMyBets(data.bets || []); setMyTotalPages(data.totalPages || 1); })
      .catch(() => { setMyBets([]); setMyTotalPages(1); })
      .finally(() => setMyBetsLoading(false));
  }, [activeTab, activeDuration, myPage]);
  useEffect(() => { setMyPage(1); }, [activeTab, activeDuration]);

  const refreshRef = useRef(null);

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

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      apiFetch(`/game-round/current/k3?duration=${activeDuration}`)
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
                apiFetch(`/game-round/history/k3?duration=${activeDuration}`)
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
                          period: r.period, dice: r.result?.dice, sum: r.result?.sum,
                          bigSmall: r.result?.bigSmall, evenOdd: r.result?.evenOdd,
                          classification: r.result?.dice ? classify(r.result.dice) : null,
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
    apiFetch(`/game-round/history/k3?duration=${activeDuration}`)
      .then((data) => {
        setGameStates((prev) => ({
          ...prev,
          [activeDuration]: {
            ...prev[activeDuration],
            history: (data.rounds || []).map((r) => ({
              period: r.period, dice: r.result?.dice, sum: r.result?.sum,
              bigSmall: r.result?.bigSmall, evenOdd: r.result?.evenOdd,
              classification: r.result?.dice ? classify(r.result.dice) : null,
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
  const lastResult = current.history[0];

  // trigger the dice "roll" animation whenever a new result lands
  useEffect(() => {
    setIsRolling(true);
    const t = setTimeout(() => setIsRolling(false), 550);
    return () => clearTimeout(t);
  }, [current.period, activeDuration]);

  // clear selections whenever the duration, category, or round changes
  useEffect(() => {
    setSelectedKey(null);
    setBetModal(null);
  }, [activeDuration, activeCat, current.period]);

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
            dice: detail.result?.dice,
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

  const openBet = (key, label, odds, accent) => {
    if (locked) return;
    setSelectedKey(key);
    setMultiplier('X1');
    setBetModal({ key, label, odds, accent });
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

    apiFetch('/game-round/bet', {
      method: 'POST',
      body: {
        gameName: 'k3',
        duration: activeDuration,
        betType: 'k3',
        betValue: betModal.key,
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
          key: betModal.key,
          label: betModal.label,
          odds: betModal.odds,
          amount: data.bet.amount,
        });
        if (activeTab === 'my') {
          setMyBets((prev) => [{
            id: data.bet.id, orderNumber: data.bet.orderNumber, period: data.bet.period,
            betType: 'k3', betValue: betModal.key, betLane: null,
            status: 'Pending', winLose: 0, amount: data.bet.amount, createdAt: new Date().toISOString(),
          }, ...prev]);
        }
        closeBetModal();
        setBetConfirmToast(true);
        setTimeout(() => setBetConfirmToast(false), 1400);
      })
      .catch((err) => {
        closeBetModal();
        alert(err.message || 'Could not place bet');
      });
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

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(current.history.length / PAGE_SIZE));
  const pageRows = current.history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAmount = balanceOption * (Number(quantity) || 0) * multValue(multiplier);

  return (
    <div className="k3-page">
      {/* HEADER — same layout as WinGo: back button, centered logo only, support/sound icons */}
      <header className="k3-header">
        <button className="k3-back" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="k3-logo-wrap">
          <img src="/image/ultraalf9.png" alt="Alfa9" className="k3-logo-img" />
        </div>
        <div className="k3-header-icons">
          <div className="k3-icon-btn" onClick={() => navigate('/customer-service')} title="Support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="k3-icon-btn" onClick={handleToggleMute} title="Sound">
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
      <div className="k3-wallet-card">
        <div className="k3-wallet-top">
          <span className="k3-balance">Rs{balance.toFixed(2)}</span>
          <svg ref={refreshRef} className="k3-refresh" onClick={handleRefresh} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </div>
        <div className="k3-wallet-label">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#d4af37"><path d="M21 7H3a1 1 0 0 0-1 1v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM3 5h15a2 2 0 0 1 2 2H3a2 2 0 0 1 0-2z"/></svg>
          Wallet balance
        </div>
        <div className="k3-wallet-btns">
          <button className="k3-withdraw-btn" onClick={() => navigate('/account/withdraw')}>Withdraw</button>
          <button className="k3-deposit-btn" onClick={() => navigate('/account/deposit')}>Deposit</button>
        </div>
      </div>

      {/* NOTICE */}
      <div className="k3-notice">
        <svg className="k3-notice-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        <span className="k3-notice-text">Welcome to Alfa9! Wish all our players a great experience playing K3.</span>
        <span className="k3-notice-detail" onClick={() => setShowHowToPlay(true)}>Detail</span>
      </div>

      {/* DURATION TABS */}
      <div className="k3-duration-tabs" style={{ marginTop: 12 }}>
        {DURATIONS.map((d) => (
          <div
            key={d.key}
            className={`k3-duration-card ${activeDuration === d.key ? 'active' : ''}`}
            onClick={() => setActiveDuration(d.key)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeDuration === d.key ? '#1a1204' : '#8b7355'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{d.line1} {d.line2}</span>
          </div>
        ))}
      </div>

      {/* PERIOD / TIMER BAR */}
      <div className="k3-period-bar">
        <div className="k3-period-left">
          <button className="k3-howtoplay-btn" onClick={() => setShowHowToPlay(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="14" rx="2"></rect><line x1="7" y1="9" x2="17" y2="9"></line><line x1="7" y1="13" x2="13" y2="13"></line>
            </svg>
            How to play
          </button>
          <span className="k3-period-id">{current.period}</span>
        </div>
        <div className="k3-period-right">
          <span className="k3-time-label">Time remaining</span>
          <div className="k3-time-digits">
            <span className="k3-digit">{timeDigits[0]}</span>
            <span className="k3-digit">{timeDigits[1]}</span>
            <span className="k3-colon">:</span>
            <span className="k3-digit">{timeDigits[2]}</span>
            <span className="k3-digit">{timeDigits[3]}</span>
          </div>
        </div>
      </div>

      {/* DICE TRAY */}
      <div className="k3-tray-wrap">
        <svg className="k3-tray-arrow" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 4l-8 8 8 8V4z"/></svg>
        <div className="k3-tray">
          {(lastResult?.dice || [1, 1, 1]).map((v, i) => (
            <div className="k3-die-slot" key={i}>
              <img src={trayDieImg(v)} alt={v} className={`k3-die-img ${isRolling ? 'rolling' : ''}`} />
            </div>
          ))}
        </div>
        <svg className="k3-tray-arrow" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 4l8 8-8 8V4z"/></svg>
        <span className="k3-sum-badge">Sum {lastResult?.sum ?? '--'}</span>
      </div>

      {/* CATEGORY TABS */}
      <div className="k3-cat-tabs">
        <button className={`k3-cat-btn ${activeCat === 'total' ? 'active' : ''}`} onClick={() => setActiveCat('total')}>Total</button>
        <button className={`k3-cat-btn ${activeCat === '2same' ? 'active' : ''}`} onClick={() => setActiveCat('2same')}>2 same</button>
        <button className={`k3-cat-btn ${activeCat === '3same' ? 'active' : ''}`} onClick={() => setActiveCat('3same')}>3 same</button>
        <button className={`k3-cat-btn ${activeCat === 'diff' ? 'active' : ''}`} onClick={() => setActiveCat('diff')}>Different</button>
      </div>

      {/* BET PANEL — wrapped so the premium 5-second lock overlay (same style as WinGo) can sit on top */}
      <div className="k3-bet-panel-wrap">
        <div className={`k3-bet-panel ${locked ? 'dim' : ''}`}>
          {activeCat === 'total' && (
            <>
              <div className="k3-bet-section">
                <div className="k3-total-grid">
                  {SUMS.map((n) => (
                    <div className="k3-total-item" key={n} onClick={() => openBet(`total-${n}`, String(n), SUM_ODDS[n], sumColor(n) === 'green' ? 'green' : 'red')}>
                      <div
                        className="k3-total-ball"
                        style={{
                          backgroundImage: `url(${totalBallImg(n)})`,
                          boxShadow: selectedKey === `total-${n}` ? '0 0 0 3px #d4af37, 0 0 16px rgba(212,175,55,0.6)' : 'none',
                          borderRadius: '50%',
                        }}
                      >
                        <span className="k3-total-num">{n}</span>
                      </div>
                      <span className="k3-total-odds">{SUM_ODDS[n]}X</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="k3-bet-section">
                <div className="k3-bse-row">
                  <button className="k3-bse-btn small" disabled={locked} onClick={() => openBet('small', 'Small', 2, 'blue')}>Small<span className="sub">2X</span></button>
                  <button className="k3-bse-btn big" disabled={locked} onClick={() => openBet('big', 'Big', 2, 'amber')}>Big<span className="sub">2X</span></button>
                  <button className="k3-bse-btn even" disabled={locked} onClick={() => openBet('even', 'Even', 2, 'green')}>Even<span className="sub">2X</span></button>
                  <button className="k3-bse-btn odd" disabled={locked} onClick={() => openBet('odd', 'Odd', 2, 'red')}>Odd<span className="sub">2X</span></button>
                </div>
              </div>
            </>
          )}

          {activeCat === '2same' && (
            <>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">2 matching numbers <span className="odds">odds(13.83)</span></div>
                <div className="k3-badge-grid">
                  {FACES.map((v) => {
                    const key = `pair-${v}`;
                    return (
                      <button key={v} className={`k3-badge violet ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `${v}${v}`, 13.83, 'violet')}>
                        {v}{v}
                        {selectedKey === key && <span className="k3-badge-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a1204" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">A pair of unique numbers <span className="odds">odds(69.12)</span></div>
                <div className="k3-badge-grid" style={{ marginBottom: 7 }}>
                  {FACES.map((v) => {
                    const key = `uniqpair-${v}`;
                    return (
                      <button key={v} className={`k3-badge pink ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `${v}${v} + any`, 69.12, 'pink')}>{v}{v}</button>
                    );
                  })}
                </div>
                <div className="k3-badge-grid">
                  {FACES.map((v) => {
                    const key = `uniqsingle-${v}`;
                    return (
                      <button key={v} className={`k3-badge green ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `pair + ${v}`, 69.12, 'green')}>{v}</button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeCat === '3same' && (
            <>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">3 of the same number <span className="odds">odds(207.36)</span></div>
                <div className="k3-badge-grid">
                  {FACES.map((v) => {
                    const key = `triple-${v}`;
                    return (
                      <button key={v} className={`k3-badge violet ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `${v}${v}${v}`, 207.36, 'violet')}>{v}{v}{v}</button>
                    );
                  })}
                </div>
              </div>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">Any 3 of the same number <span className="odds">odds(34.56)</span></div>
                <div className="k3-badge-grid">
                  <button className={`k3-badge pink wide ${selectedKey === 'any-triple' ? 'sel' : ''}`} disabled={locked} onClick={() => openBet('any-triple', 'Any 3 of the same number', 34.56, 'pink')}>Any 3 of the same number</button>
                </div>
              </div>
            </>
          )}

          {activeCat === 'diff' && (
            <>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">3 different numbers <span className="odds">odds(34.56)</span></div>
                <div className="k3-badge-grid">
                  {FACES.map((v) => {
                    const key = `diff3-${v}`;
                    return (
                      <button key={v} className={`k3-badge violet ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `Contains ${v}`, 34.56, 'violet')}>{v}</button>
                    );
                  })}
                </div>
              </div>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">3 continuous numbers <span className="odds">odds(8.64)</span></div>
                <div className="k3-badge-grid">
                  <button className={`k3-badge pink wide ${selectedKey === 'continuous' ? 'sel' : ''}`} disabled={locked} onClick={() => openBet('continuous', '3 continuous numbers', 8.64, 'pink')}>3 continuous numbers</button>
                </div>
              </div>
              <div className="k3-bet-section">
                <div className="k3-bet-section-title">2 different numbers <span className="odds">odds(6.91)</span></div>
                <div className="k3-badge-grid">
                  {FACES.map((v) => {
                    const key = `diff2-${v}`;
                    return (
                      <button key={v} className={`k3-badge green ${selectedKey === key ? 'sel' : ''}`} disabled={locked} onClick={() => openBet(key, `Contains ${v}`, 6.91, 'green')}>
                        {v}
                        {selectedKey === key && <span className="k3-badge-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a1204" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {locked && (
          <div className="k3-lock-overlay">
            <span className="k3-lock-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f3da95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Betting closes in
            </span>
            <div className="k3-lock-digits">
              <span className="k3-lock-ring"></span>
              <span className={`k3-lock-card ${urgent ? 'k3-lock-urgent' : ''}`}>{pad(current.timeLeft)[0]}</span>
              <span className="k3-lock-colon">:</span>
              <span className={`k3-lock-card ${urgent ? 'k3-lock-urgent' : ''}`}>{pad(current.timeLeft)[1]}</span>
            </div>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="k3-tabs-row">
        <button className={`k3-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Game history</button>
        <button className={`k3-tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>Chart</button>
        <button className={`k3-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My history</button>
      </div>

      {activeTab === 'history' && (
        <div className="k3-table-wrap">
          <div className="k3-table-header">
            <span>Period</span><span style={{ textAlign: 'center' }}>Sum</span><span style={{ textAlign: 'right' }}>Results</span>
          </div>
          {pageRows.map((r) => (
            <div className="k3-table-row" key={r.period}>
              <span className="k3-cell-period">{r.period}</span>
              <span className="k3-cell-sum" style={{ fontWeight: 800, fontFamily: 'var(--k3-mono)', color: sumColor(r.sum) === 'green' ? 'var(--k3-green)' : '#ff5876' }}>{r.sum}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <span className="k3-cell-tags">
                  <span>{r.bigSmall}</span>
                  <span>{r.evenOdd}</span>
                </span>
                <span className="k3-cell-dice">
                  {r.dice.map((v, i) => <img key={i} src={cellDieImg(v)} alt={v} className="k3-cell-die" />)}
                </span>
              </span>
            </div>
          ))}
          <div className="k3-pagination">
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
        <div className="k3-table-wrap">
          <div className="k3-table-header chart">
            <span>Period</span><span style={{ textAlign: 'center' }}>Results</span><span style={{ textAlign: 'right' }}>Number</span>
          </div>
          {pageRows.map((r) => (
            <div className="k3-table-row chart" key={r.period}>
              <span className="k3-cell-period">{r.period}</span>
              <span className="k3-cell-dice">
                {r.dice.map((v, i) => <img key={i} src={cellDieImg(v)} alt={v} className="k3-cell-die" />)}
              </span>
              <span className="k3-cell-class">{r.classification}</span>
            </div>
          ))}
          <div className="k3-pagination">
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
          <div className="k3-empty-wrap">
            <span>Loading…</span>
          </div>
        ) : myBets.length > 0 ? (
          <div className="k3-myhist-list">
            {myBets.map((b) => {
              const cls = b.status === 'Succeed' ? 'win' : b.status === 'Pending' ? 'pending' : 'lose';
              const isOpen = expandedBetId === b.id;
              const detail = betDetails[b.id];
              return (
                <div className={`k3-myhist-card ${isOpen ? 'open' : ''}`} key={b.id}>
                  <div className="k3-myhist-row" onClick={() => toggleBetDetail(b.id)}>
                    <div className={`k3-myhist-badge ${cls}`}>{b.betValue}</div>
                    <div className="k3-myhist-main">
                      <div>{b.period}</div>
                      <div className="k3-myhist-date">{new Date(b.createdAt).toLocaleString()}</div>
                    </div>
                    {b.status === 'Pending' ? (
                      <div className="k3-myhist-amt pending">Pending</div>
                    ) : (
                      <div className={`k3-myhist-amt ${cls}`}>
                        {b.winLose >= 0 ? '+' : ''}Rs{Math.abs(b.winLose).toFixed(2)}
                      </div>
                    )}
                    <svg className={`k3-myhist-chevron ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  {isOpen && (
                    <div className="k3-myhist-detail">
                      {detailLoadingId === b.id ? (
                        <div className="k3-myhist-detail-loading">Loading…</div>
                      ) : detail && !detail.error ? (
                        <>
                          <div className="k3-myhist-detail-row"><span>Order number</span><span>{detail.orderNumber}</span></div>
                          <div className="k3-myhist-detail-row"><span>Period</span><span>{detail.period}</span></div>
                          <div className="k3-myhist-detail-row"><span>Purchase amount</span><span>Rs{detail.purchaseAmount?.toFixed(2)}</span></div>
                          <div className="k3-myhist-detail-row"><span>Quantity</span><span>{detail.quantity}</span></div>
                          <div className="k3-myhist-detail-row"><span>Amount after tax</span><span>Rs{detail.amountAfterTax?.toFixed(2)}</span></div>
                          <div className="k3-myhist-detail-row"><span>Tax</span><span>Rs{detail.tax?.toFixed(2)}</span></div>
                          {detail.result && (
                            <div className="k3-myhist-detail-row">
                              <span>Result</span>
                              <span>{detail.result.dice?.join('-')} · Sum {detail.result.sum} · {detail.result.bigSmall} · {detail.result.evenOdd}</span>
                            </div>
                          )}
                          <div className="k3-myhist-detail-row"><span>Select</span><span style={{ textTransform: 'capitalize' }}>{detail.select?.value}</span></div>
                          <div className="k3-myhist-detail-row"><span>Status</span><span className={cls}>{detail.status}</span></div>
                          <div className="k3-myhist-detail-row"><span>Win/lose</span><span className={cls}>{detail.winLose >= 0 ? '+' : '-'}Rs{Math.abs(detail.winLose).toFixed(2)}</span></div>
                          <div className="k3-myhist-detail-row"><span>Order time</span><span>{new Date(detail.orderTime).toLocaleString()}</span></div>
                        </>
                      ) : (
                        <div className="k3-myhist-detail-loading">Could not load details.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="k3-empty-wrap">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="#5a4020" strokeWidth="1.5"><rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>No data</span>
          </div>
        )
      )}
      {activeTab === 'my' && !myBetsLoading && myBets.length > 0 && myTotalPages > 1 && (
        <div className="k3-pagination">
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
        <div className="k3-modal-backdrop" onClick={() => setShowHowToPlay(false)}>
          <div className="k3-modal" onClick={(e) => e.stopPropagation()}>
            <div className="k3-modal-header">· {durationCfg.line1} {durationCfg.line2} ·</div>
            <div className="k3-modal-body">
              {HOW_TO_PLAY_TEXT.map((t, i) => <p key={i}>{t}</p>)}
            </div>
            <button className="k3-modal-close" onClick={() => setShowHowToPlay(false)}>Close</button>
          </div>
        </div>
      )}

      {/* BET POPUP MODAL (same style/behaviour as WinGo/5D) */}
      {betModal && (
        <div className="k3-betmodal-backdrop" onClick={closeBetModal}>
          <div className={`k3-betmodal k3-accent-${betModal.accent}`} onClick={(e) => e.stopPropagation()}>
            <div className="k3-betmodal-header">
              <span className="k3-betmodal-titleline">{durationCfg.line1} {durationCfg.line2}</span>
              <div className="k3-betmodal-pill">Select {betModal.label} · {betModal.odds}X</div>
            </div>

            <div className="k3-betmodal-body">
              <div className="k3-betmodal-row">
                <span className="k3-betmodal-rowlabel">Balance</span>
                <div className="k3-balance-chips">
                  {BALANCE_OPTIONS.map((b) => (
                    <button key={b} className={`k3-balance-chip ${balanceOption === b ? 'active' : ''}`} onClick={() => setBalanceOption(b)}>{b}</button>
                  ))}
                </div>
              </div>

              <div className="k3-betmodal-row">
                <span className="k3-betmodal-rowlabel">Quantity</span>
                <div className="k3-qty-control">
                  <button className="k3-qty-btn" onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 1) - 1))}>-</button>
                  <input
                    className="k3-qty-input"
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
                  <button className="k3-qty-btn" onClick={() => setQuantity((q) => (Number(q) || 0) + 1)}>+</button>
                </div>
              </div>

              <div className="k3-betmodal-mult-row">
                {MULTIPLIERS.map((m) => (
                  <button key={m} className={`k3-betmodal-mult ${multiplier === m ? 'active' : ''}`} onClick={() => setMultiplier(m)}>{m}</button>
                ))}
              </div>

              <div className="k3-agree-row" onClick={() => setAgree((a) => !a)}>
                <span className={`k3-agree-check ${agree ? 'checked' : ''}`}>
                  {agree && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </span>
                <span className="k3-agree-text">I agree <span className="k3-agree-link">《Pre-sale rules》</span></span>
              </div>
            </div>

            <div className="k3-betmodal-footer">
              <button className="k3-betmodal-cancel" onClick={closeBetModal}>Cancel</button>
              <button className="k3-betmodal-confirm" disabled={!agree} onClick={handleConfirmBet}>Total amount Rs{totalAmount.toFixed(2)}</button>
            </div>
          </div>
        </div>
      )}

      {/* INSUFFICIENT BALANCE MODAL */}
      {showInsufficient && (
        <div className="k3-insuff-backdrop" onClick={() => setShowInsufficient(false)}>
          <div className="k3-insuff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="k3-insuff-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1204" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="2"></rect>
                <path d="M2 10h20"></path>
                <circle cx="16" cy="15" r="1"></circle>
              </svg>
            </div>
            <div className="k3-insuff-title">Insufficient Balance</div>
            <p className="k3-insuff-text">Your wallet balance is too low to place this bet. Please deposit first to continue playing.</p>
            <div className="k3-insuff-footer">
              <button className="k3-insuff-cancel" onClick={() => setShowInsufficient(false)}>Cancel</button>
              <button className="k3-insuff-deposit" onClick={() => { setShowInsufficient(false); navigate('/account/deposit'); }}>Deposit Now</button>
            </div>
          </div>
        </div>
      )}

      {/* WIN / LOSS RESULT POPUP — same shared component as WinGo/5D so it feels identical everywhere */}
      <ResultPopup
        open={!!resultPopup}
        status={resultPopup?.status}
        amount={resultPopup?.amount ?? 0}
        resultBadges={resultPopup ? [resultPopup.dice.join('-'), `Sum ${resultPopup.sum}`] : []}
        period={resultPopup?.period ?? ''}
        durationLabel={resultPopup?.durationLabel ?? ''}
        betLabel={resultPopup?.betLabel ?? ''}
        onClose={() => setResultPopup(null)}
      />

      {/* BET PLACED CONFIRMATION — small centered toast, separate from the win/loss popup */}
      {betConfirmToast && (
        <div className="k3-betok-overlay">
          <div className="k3-betok-card">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#17d97a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12.5 11 15.5 16 9"></polyline></svg>
            <span>Bet placed successfully</span>
          </div>
        </div>
      )}

      <div className="k3-bottom-spacer"></div>
    </div>
  );
}

export default K3;