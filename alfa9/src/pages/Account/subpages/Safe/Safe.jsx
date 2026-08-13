import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './Safe.css';

const DAILY_RATE = 0.001; // 0.1%
const INTERVAL_MS = 60000; // 1 min
const EACH_AMOUNT = 100; // minimum unit
const MULTIPLIERS = [2, 5, 10, 50, 100, 200, 500, 1000];

function formatMoney(v) {
  return (v < 0 ? 0 : v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Odometer DOM helpers (imperative rolling-digit effect) ───
function buildOdometer(container, str) {
  container.innerHTML = '';
  const odo = document.createElement('span');
  odo.className = 'odo';
  for (const ch of str) {
    if (/[0-9]/.test(ch)) {
      const slot = document.createElement('span');
      slot.className = 'odo-slot';
      const strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (let d = 0; d <= 9; d++) {
        const s = document.createElement('span');
        s.textContent = d;
        strip.appendChild(s);
      }
      strip.style.transform = `translateY(-${parseInt(ch, 10)}em)`;
      slot.appendChild(strip);
      odo.appendChild(slot);
    } else {
      const st = document.createElement('span');
      st.className = 'odo-static';
      st.textContent = ch;
      odo.appendChild(st);
    }
  }
  container.appendChild(odo);
}

function updateOdometer(container, str) {
  const odo = container.querySelector('.odo');
  if (!odo || odo.children.length !== str.length) {
    buildOdometer(container, str);
    return;
  }
  let i = 0;
  for (const ch of str) {
    const slot = odo.children[i];
    if (/[0-9]/.test(ch)) {
      const strip = slot.querySelector('.odo-strip');
      if (strip) strip.style.transform = `translateY(-${parseInt(ch, 10)}em)`;
    } else if (slot.textContent !== ch) {
      slot.textContent = ch;
    }
    i++;
  }
}

function Odometer({ value }) {
  const ref = useRef(null);
  const builtRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!builtRef.current) {
      buildOdometer(el, value);
      builtRef.current = true;
    } else {
      updateOdometer(el, value);
    }
  }, [value]);

  return <span ref={ref}></span>;
}

function historyIconSvg(type) {
  if (type === 'in') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
    );
  }
  if (type === 'out') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2.5" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
  );
}

function Safe() {
  const navigate = useNavigate();

  const [safeBalance, setSafeBalance] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [generatedRevenue, setGeneratedRevenue] = useState(0);
  const [accumulatedRevenue, setAccumulatedRevenue] = useState(0);

  useEffect(() => {
    apiFetch('/safe/status')
      .then((data) => {
        setSafeBalance(data.safeBalance);
        setWalletBalance(data.walletBalance);
        setGeneratedRevenue(data.generatedRevenue);
        setAccumulatedRevenue(data.accumulatedRevenue);
      })
      .catch(() => {}); // guest — page still renders with zeros
  }, []);

  const safeBalanceRef = useRef(safeBalance);
  const generatedRevenueRef = useRef(generatedRevenue);
  const accumulatedRevenueRef = useRef(accumulatedRevenue);
  useEffect(() => { safeBalanceRef.current = safeBalance; }, [safeBalance]);
  useEffect(() => { generatedRevenueRef.current = generatedRevenue; }, [generatedRevenue]);
  useEffect(() => { accumulatedRevenueRef.current = accumulatedRevenue; }, [accumulatedRevenue]);

  const intervalRef = useRef(null);
  const safeCardRef = useRef(null);
  const vaultRotorRef = useRef(null);
  const coinRainRef = useRef(null);

  // Modal states
  const [transferOutOpen, setTransferOutOpen] = useState(false);
  const [transferInOpen, setTransferInOpen] = useState(false);
  const [noIncomeOpen, setNoIncomeOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successRing, setSuccessRing] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Transfer Complete');
  const [successAmt, setSuccessAmt] = useState('0.00');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  // Transfer Out state
  const [outAmount, setOutAmount] = useState('');
  const [outInsuff, setOutInsuff] = useState(false);

  // Transfer In state
  const [inAmount, setInAmount] = useState('');
  const [inInsuff, setInInsuff] = useState(false);
  const [multiplier, setMultiplierState] = useState(2);

  // History
  const [histYear, setHistYear] = useState(new Date().getFullYear());
  const [histMonth, setHistMonth] = useState(new Date().getMonth() + 1);
  const [histRecords, setHistRecords] = useState([]);

  // Date picker
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth() + 1);
  const dpYearColRef = useRef(null);
  const dpMonthColRef = useRef(null);

  const [toast, setToast] = useState({ msg: '', show: false, error: false });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg, isError) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true, error: !!isError });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  }, []);

  const vibrate = (ms) => {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* noop */ }
  };

  const saveState = useCallback((sb, wb, gr, ar) => {
    localStorage.setItem('alfa9_safe_balance', sb.toString());
    localStorage.setItem('alfa9_balance', wb.toString());
    localStorage.setItem('alfa9_safe_generated', gr.toString());
    localStorage.setItem('alfa9_safe_accumulated', ar.toString());
  }, []);

  const startInterest = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (safeBalanceRef.current <= 0) return;
    const perMinute = (safeBalanceRef.current * DAILY_RATE) / (24 * 60);
    intervalRef.current = setInterval(() => {
      const newGen = generatedRevenueRef.current + perMinute;
      const newAcc = accumulatedRevenueRef.current + perMinute;
      setGeneratedRevenue(newGen);
      setAccumulatedRevenue(newAcc);
      localStorage.setItem('alfa9_safe_generated', newGen.toString());
      localStorage.setItem('alfa9_safe_accumulated', newAcc.toString());
    }, INTERVAL_MS);
  }, []);

  const spawnGoldDust = useCallback(() => {
    const card = safeCardRef.current;
    if (!card) return;
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'gold-dust';
      const size = 2 + Math.random() * 2;
      d.style.width = size + 'px';
      d.style.height = size + 'px';
      d.style.left = (10 + Math.random() * 80) + '%';
      d.style.bottom = (Math.random() * 30) + '%';
      d.style.animation = `dustFloat ${5 + Math.random() * 4}s ease-in infinite`;
      d.style.animationDelay = (Math.random() * 5) + 's';
      card.appendChild(d);
    }
  }, []);

  const spinVault = useCallback(() => {
    const rotor = vaultRotorRef.current;
    if (!rotor) return;
    rotor.classList.remove('idle');
    rotor.classList.remove('spin-lock');
    void rotor.offsetWidth;
    rotor.classList.add('spin-lock');
    const handler = () => {
      rotor.classList.remove('spin-lock');
      rotor.classList.add('idle');
      rotor.removeEventListener('animationend', handler);
    };
    rotor.addEventListener('animationend', handler);
  }, []);

  const spawnCoinRain = useCallback(() => {
    const container = coinRainRef.current;
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 18; i++) {
      const c = document.createElement('div');
      c.className = 'coin-particle';
      c.style.left = (Math.random() * 100) + '%';
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      c.style.animationDuration = (1.1 + Math.random() * 0.6) + 's';
      c.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      container.appendChild(c);
    }
    setTimeout(() => { if (container) container.innerHTML = ''; }, 2200);
  }, []);

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    const clientX = e.clientX || (rect.left + rect.width / 2);
    const clientY = e.clientY || (rect.top + rect.height / 2);
    ripple.style.left = (clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  };

  useEffect(() => {
    startInterest();
    spawnGoldDust();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dailyRevenue = safeBalance * DAILY_RATE;

  // ─── TRANSFER OUT ───
  const outMax = Math.floor(safeBalance / EACH_AMOUNT) * EACH_AMOUNT;
  const outAmountNum = parseFloat(outAmount) || 0;

  const openTransferOut = () => {
    if (safeBalance <= 0) {
      setNoIncomeOpen(true);
      return;
    }
    setOutAmount(outMax.toString());
    setOutInsuff(false);
    setTransferOutOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const proceedTransferOut = () => {
    setNoIncomeOpen(false);
    openTransferOut();
  };
  const clearOutAmount = () => {
    setOutAmount('');
    setOutInsuff(false);
  };
  const handleOutAmountChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setOutAmount(e.target.value);
    setOutInsuff(val > safeBalance && val > 0);
  };
  const handleOutSlider = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setOutAmount(val.toString());
    setOutInsuff(false);
  };
  const outSliderPct = outMax > 0 ? Math.min((Math.min(outAmountNum, outMax) / outMax) * 100, 100) : 0;

  const closeTransferOut = () => {
    setTransferOutOpen(false);
    document.body.style.overflow = '';
  };

  const logHistory = (type, amount) => {
    const key = 'alfa9_safe_history';
    const hist = JSON.parse(localStorage.getItem(key) || '[]');
    const now = new Date();
    hist.unshift({ type, amount, date: now.toISOString() });
    localStorage.setItem(key, JSON.stringify(hist.slice(0, 200)));
  };

  const showSuccessModal = (amount, type) => {
    setSuccessTitle(type === 'in' ? 'Transferred to Safe' : 'Transferred to Wallet');
    setSuccessAmt(amount.toFixed(2));
    setSuccessRing(false);
    setTimeout(() => setSuccessRing(true), 10);
    setSuccessOpen(true);
    spawnCoinRain();
    setTimeout(() => setSuccessOpen(false), 1900);
  };

  const confirmTransferOut = () => {
    const val = outAmountNum;
    if (val <= 0) { showToast('Enter amount to transfer', true); return; }
    if (val > safeBalance) { showToast('Insufficient safe balance', true); return; }
    const rounded = Math.floor(val / EACH_AMOUNT) * EACH_AMOUNT;
    if (rounded <= 0) { showToast('Minimum transfer is Rs' + EACH_AMOUNT, true); return; }

    apiFetch('/safe/transfer-out', { method: 'POST', body: { amount: rounded } })
      .then((data) => {
        setSafeBalance(data.safeBalance);
        setWalletBalance(data.walletBalance);
        setGeneratedRevenue(0);
        closeTransferOut();
        spinVault();
        vibrate(15);
        showSuccessModal(data.amount, 'out');
        setTimeout(startInterest, 0);
      })
      .catch((err) => showToast(err.message || 'Transfer failed', true));
  };

  // ─── TRANSFER IN ───
  const inAmountNum = parseFloat(inAmount) || 0;

  const openTransferIn = () => {
    const wb = parseFloat(localStorage.getItem('alfa9_balance') || '0');
    setWalletBalance(wb);
    setInAmount((multiplier * EACH_AMOUNT).toString());
    setInInsuff(false);
    setTransferInOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeTransferIn = () => {
    setTransferInOpen(false);
    document.body.style.overflow = '';
  };
  const setInAll = () => {
    const maxUnits = Math.floor(walletBalance / EACH_AMOUNT);
    setInAmount((maxUnits * EACH_AMOUNT).toString());
    setInInsuff(false);
  };
  const setMultiplier = (m) => {
    setMultiplierState(m);
    setInAmount((m * EACH_AMOUNT).toString());
    setInInsuff((m * EACH_AMOUNT) > walletBalance);
  };
  const handleInAmountChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setInAmount(e.target.value);
    setInInsuff(val > walletBalance && val > 0);
  };
  const [refreshSpin, setRefreshSpin] = useState(false);
  const refreshInBalance = () => {
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 550);
    const wb = parseFloat(localStorage.getItem('alfa9_balance') || '0');
    setWalletBalance(wb);
  };
  const inEstimated = (inAmountNum * DAILY_RATE).toFixed(2);

  const confirmTransferIn = () => {
    const val = inAmountNum;
    if (val <= 0) { showToast('Enter amount to transfer', true); return; }
    if (val > walletBalance) { showToast('Insufficient wallet balance', true); return; }
    const rounded = Math.floor(val / EACH_AMOUNT) * EACH_AMOUNT;
    if (rounded <= 0) { showToast('Minimum transfer is Rs' + EACH_AMOUNT, true); return; }

    apiFetch('/safe/transfer-in', { method: 'POST', body: { amount: rounded } })
      .then((data) => {
        setSafeBalance(data.safeBalance);
        setWalletBalance(data.walletBalance);
        closeTransferIn();
        spinVault();
        vibrate(15);
        showSuccessModal(data.amount, 'in');
        setTimeout(startInterest, 0);
      })
      .catch((err) => showToast(err.message || 'Transfer failed', true));
  };

  // ─── HISTORY PAGE ───
  const renderHistory = useCallback((yr, mo) => {
    apiFetch(`/safe/history?year=${yr}&month=${mo}`)
      .then((data) => {
        setHistRecords((data.records || []).map((r) => ({ type: r.type, amount: r.amount, date: r.createdAt })));
      })
      .catch(() => setHistRecords([]));
  }, []);

  const openHistoryPage = () => {
    renderHistory(histYear, histMonth);
    setHistoryOpen(true);
    document.body.style.overflow = 'hidden';
  };
  const closeHistoryPage = () => {
    setHistoryOpen(false);
    document.body.style.overflow = '';
  };

  let histIn = 0, histOut = 0, histIncome = 0;
  histRecords.forEach((h) => {
    if (h.type === 'in') histIn++;
    else if (h.type === 'out') histOut++;
    else if (h.type === 'income') histIncome += h.amount;
  });

  const histGroups = (() => {
    const groups = [];
    const map = {};
    histRecords.forEach((h) => {
      const d = new Date(h.date);
      const key = d.toDateString();
      if (!map[key]) {
        map[key] = { label: d.toLocaleDateString(undefined, { day: '2-digit', month: 'long' }), items: [] };
        groups.push(map[key]);
      }
      map[key].items.push(h);
    });
    return groups;
  })();

  // ─── DATE PICKER ───
  const openDatePicker = () => {
    setDpYear(histYear);
    setDpMonth(histMonth);
    setDatePickerOpen(true);
    setTimeout(() => {
      const yCol = dpYearColRef.current;
      const mCol = dpMonthColRef.current;
      const yItem = yCol && yCol.querySelector(`.dp-item[data-val="${histYear}"]`);
      const mItem = mCol && mCol.querySelector(`.dp-item[data-val="${histMonth}"]`);
      if (yItem) yItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (mItem) mItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
  };
  const closeDatePicker = () => setDatePickerOpen(false);

  const confirmDatePicker = () => {
    const yearCol = dpYearColRef.current;
    const monthCol = dpMonthColRef.current;
    const getCenter = (col) => {
      if (!col) return null;
      const items = col.querySelectorAll('.dp-item');
      const colMid = col.scrollTop + col.offsetHeight / 2;
      let closest = null, minDist = Infinity;
      items.forEach((item) => {
        const itemMid = item.offsetTop + item.offsetHeight / 2;
        const dist = Math.abs(itemMid - colMid);
        if (dist < minDist) { minDist = dist; closest = item; }
      });
      return closest;
    };
    const selY = getCenter(yearCol);
    const selM = getCenter(monthCol);
    const newYear = selY ? parseInt(selY.dataset.val, 10) : dpYear;
    const newMonth = selM ? parseInt(selM.dataset.val, 10) : dpMonth;
    setDpYear(newYear);
    setDpMonth(newMonth);
    setHistYear(newYear);
    setHistMonth(newMonth);
    setDatePickerOpen(false);
    renderHistory(newYear, newMonth);
  };

  const years = [2023, 2024, 2025, 2026, 2027, 2028];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const closeModal = (setter) => {
    setter(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="safe-page">
      {/* ── TOP BAR ── */}
      <div className="top-bar">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </div>
        <div className="page-title">⚜ SAFE</div>
        <div className="top-right"></div>
      </div>

      {/* ── INTEREST BADGE ── */}
      <div className="interest-badge-wrap">
        <div className="interest-badge">
          <div className="interest-dot"></div>
          Interest rate &nbsp;<strong>0.10%</strong>&nbsp; daily
        </div>
      </div>

      {/* ── SAFE BALANCE CARD (VAULT DOOR) ── */}
      <div className="safe-card" ref={safeCardRef}>
        <div className="safe-shimmer"></div>
        <div className="safe-card-top">
          <div className="safe-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(20,10,3,0.3)" strokeWidth="1" />
              <g stroke="rgba(20,10,3,0.55)" strokeWidth="1.4" strokeLinecap="round">
                <line x1="20" y1="4" x2="20" y2="7.5" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(30 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(60 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(90 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(120 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(150 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(180 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(210 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(240 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(270 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(300 20 20)" />
                <line x1="20" y1="4" x2="20" y2="7.5" transform="rotate(330 20 20)" />
              </g>
              <g className="vault-dial-rotor idle" ref={vaultRotorRef}>
                <circle cx="20" cy="20" r="10" fill="rgba(20,10,3,0.16)" stroke="rgba(20,10,3,0.65)" strokeWidth="1.4" />
                <line x1="20" y1="20" x2="20" y2="10.5" stroke="#140A03" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="20" cy="20" r="2.4" fill="#140A03" />
              </g>
            </svg>
          </div>
          <div className="fin-security-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Financial security
          </div>
        </div>
        <div className="safe-balance-label">Safe Balance</div>
        <div className="safe-balance-amt">
          <span style={{ fontSize: 18, opacity: 0.7 }}>Rs</span>
          <Odometer value={formatMoney(safeBalance)} />
        </div>
        <div className="safe-revenue-row">
          <span className="safe-revenue-label"><span className="tick-pulse"></span>24-hour estimated revenue</span>
          <span className="safe-revenue-val">Rs <Odometer value={formatMoney(dailyRevenue)} /></span>
        </div>
        <div className="safe-card-dots">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className={`safe-dot${i === 0 ? ' active' : ''}`}></div>
          ))}
        </div>
      </div>

      {/* ── STATS CARD ── */}
      <div className="stats-card">
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-val red"><Odometer value={formatMoney(generatedRevenue)} /></div>
            <div className="stat-label">Generated revenue</div>
          </div>
          <div className="stats-divider"></div>
          <div className="stat-item">
            <div className="stat-val gold"><Odometer value={formatMoney(accumulatedRevenue)} /></div>
            <div className="stat-label">Accumulated revenue</div>
          </div>
        </div>

        <div className="my-rate-row">
          <div className="my-rate-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            My interest rate &nbsp;<span className="my-rate-val">0.1%</span>
          </div>
        </div>

        <div className="transfer-btns">
          <button className="btn-transfer-out" onClick={(e) => { addRipple(e); openTransferOut(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 5, verticalAlign: -2 }}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            Transfer Out
          </button>
          <button className="btn-transfer-in" onClick={(e) => { addRipple(e); openTransferIn(); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 5, verticalAlign: -2 }}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            Transfer In
          </button>
        </div>

        <div className="safe-info-row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span className="safe-info-text">Funds are safe and secure, and can be transferred at any time</span>
        </div>

        <div className="learn-link" onClick={() => { setLearnOpen(true); document.body.style.overflow = 'hidden'; }}>
          Learn about safes
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2"><polyline points="9 18 15 12 9 6" /><polyline points="15 18 21 12 15 6" /></svg>
        </div>
      </div>

      {/* ── HISTORICAL RECORDS ── */}
      <div className="section-label">
        <div className="section-label-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        </div>
        <span className="section-label-text">Historical Records</span>
      </div>
      <button className="all-history-btn" onClick={(e) => { addRipple(e); openHistoryPage(); }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        All History
      </button>

      {/* ═══ TRANSFER OUT MODAL ═══ */}
      <div className={`modal-overlay${transferOutOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeTransferOut(); }}>
        <div className="transfer-modal">
          <div className="modal-handle"></div>
          <div className="modal-title">Transfer Out</div>
          <div className="each-amount-row">
            <span className="each-amount-label">Each amount</span>
            <span className="each-amount-val">{EACH_AMOUNT}</span>
          </div>
          <div className="amount-input-wrap">
            <input className="amount-input" type="number" placeholder="0" min="0" value={outAmount} onChange={handleOutAmountChange} />
            <div className="amount-clear-btn" onClick={clearOutAmount}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
          </div>
          <div className={`insuff-error${outInsuff ? ' show' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Insufficient amount available
          </div>
          <div className="slider-wrap">
            <input
              className="custom-slider"
              type="range"
              min="0"
              max={outMax}
              value={Math.min(outAmountNum, outMax)}
              onChange={handleOutSlider}
              style={{ '--slider-pct': `${outSliderPct}%` }}
            />
            <div className="slider-labels">
              <span className="slider-lbl">0</span>
              <span className="slider-lbl">{outMax}</span>
            </div>
          </div>
          <div className="details-table">
            <div className="detail-row">
              <span className="detail-label">Amount available</span>
              <span className="detail-val">{safeBalance.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount transferred</span>
              <span className="detail-val red">{outAmountNum.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Daily interest rate</span>
              <span className="detail-val gold">0.1%</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Income</span>
              <span className="detail-val green">{generatedRevenue.toFixed(2)}</span>
            </div>
          </div>
          <button className="modal-cta-btn" onClick={(e) => { addRipple(e); confirmTransferOut(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6, verticalAlign: -3 }}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            Transfer Out
          </button>
        </div>
      </div>

      {/* ═══ TRANSFER IN MODAL ═══ */}
      <div className={`modal-overlay${transferInOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeTransferIn(); }}>
        <div className="transfer-modal">
          <div className="modal-handle"></div>
          <div className="modal-title">Transfer In</div>
          <div className="each-amount-row">
            <span className="each-amount-label">Each amount</span>
            <span className="each-amount-val">{EACH_AMOUNT}</span>
          </div>
          <div className="amount-input-wrap">
            <input className="amount-input" type="number" placeholder="0" min="0" value={inAmount} onChange={handleInAmountChange} />
            <div className="amount-all-btn" onClick={setInAll}>All</div>
          </div>
          <div className={`insuff-error${inInsuff ? ' show' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Insufficient amount available
          </div>
          <div className="multi-grid">
            {MULTIPLIERS.map((m) => (
              <div key={m} className={`multi-chip${multiplier === m ? ' active' : ''}`} onClick={() => setMultiplier(m)}>{m}x</div>
            ))}
          </div>
          <div className="details-table">
            <div className="detail-row">
              <span className="detail-label">Amount available</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="detail-val">{walletBalance.toFixed(2)}</span>
                <div onClick={refreshInBalance} style={{ cursor: 'pointer', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" style={{ transition: refreshSpin ? 'transform 0.5s' : 'none', transform: refreshSpin ? 'rotate(360deg)' : 'none' }}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                </div>
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount transferred</span>
              <span className="detail-val red">{inAmountNum.toFixed(2)}</span>
            </div>
          </div>
          <div className="detail-estimated">
            24-hour estimated revenue
            <span>{inEstimated}</span>
          </div>
          <button className="modal-cta-btn" disabled={inInsuff || inAmountNum <= 0} onClick={(e) => { addRipple(e); confirmTransferIn(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6, verticalAlign: -3 }}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            Transfer In
          </button>
        </div>
      </div>

      {/* ═══ NO INCOME POPUP ═══ */}
      <div className={`modal-overlay center${noIncomeOpen ? ' open' : ''}`}>
        <div className="popup-box">
          <div className="popup-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#E74C3C" opacity="0.9" />
              <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="popup-title">No income</div>
          <div className="popup-desc">No income at the moment, want to transfer out?</div>
          <button className="popup-btn-primary" onClick={(e) => { addRipple(e); proceedTransferOut(); }}>Transfer Out</button>
          <button className="popup-btn-cancel" onClick={() => closeModal(setNoIncomeOpen)}>Cancel</button>
        </div>
      </div>

      {/* ═══ SUCCESS CELEBRATION MODAL ═══ */}
      <div className={`modal-overlay center${successOpen ? ' open' : ''}`}>
        <div className="success-box">
          <div className="coin-rain" ref={coinRainRef}></div>
          <div className={`success-ring${successRing ? ' play' : ''}`}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" />
              <path d="M20 33l8 8 16-16" />
            </svg>
          </div>
          <div className="success-title">{successTitle}</div>
          <div className="success-amount">Rs {successAmt}</div>
        </div>
      </div>

      {/* ═══ HISTORY PAGE ═══ */}
      <div className={`history-page${historyOpen ? ' open' : ''}`}>
        <div className="hist-header">
          <div className="back-btn" onClick={closeHistoryPage}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </div>
          <div className="page-title" style={{ fontSize: 15 }}>Safes History</div>
          <div style={{ width: 36 }}></div>
        </div>
        <div className="hist-banner">
          <div style={{ overflow: 'hidden' }}>
            <button className="hist-month-btn" onClick={openDatePicker}>
              <span>{histYear} Year {String(histMonth).padStart(2, '0')} Month</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F3DA95" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
          <div className="hist-stats-row">
            <div className="hist-stat">
              <div className="hist-stat-val">{histIn}</div>
              <div className="hist-stat-label">Transfer In</div>
            </div>
            <div style={{ width: 1, background: 'rgba(212,175,55,0.2)', margin: '4px 0' }}></div>
            <div className="hist-stat">
              <div className="hist-stat-val">{histOut}</div>
              <div className="hist-stat-label">Transfer Out</div>
            </div>
            <div style={{ width: 1, background: 'rgba(212,175,55,0.2)', margin: '4px 0' }}></div>
            <div className="hist-stat">
              <div className="hist-stat-val">{histIncome.toFixed(2)}</div>
              <div className="hist-stat-label">Income</div>
            </div>
          </div>
        </div>
        {histRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M8 8h5M8 16h3" />
              </svg>
            </div>
            <div className="empty-text">No data available</div>
          </div>
        ) : (
          <div style={{ padding: '0 14px 8px' }}>
            {histGroups.map((g, gi) => (
              <div key={gi}>
                <div className="hist-day-label">{g.label}</div>
                {g.items.map((h, hi) => {
                  const d = new Date(h.date);
                  const label = h.type === 'in' ? 'Transfer In' : h.type === 'out' ? 'Transfer Out' : 'Interest Income';
                  const color = h.type === 'in' ? 'var(--gold)' : h.type === 'out' ? 'var(--red)' : 'var(--green)';
                  const sign = h.type === 'out' ? '-' : '+';
                  return (
                    <div className="hist-entry" key={hi}>
                      <div className={`hist-icon ${h.type}`}>{historyIconSvg(h.type)}</div>
                      <div className="hist-entry-body">
                        <div className="hist-entry-label">{label}</div>
                        <div className="hist-entry-date">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="hist-entry-amt" style={{ color }}>{sign}Rs{h.amount.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ DATE PICKER ═══ */}
      <div className={`modal-overlay datepicker-z${datePickerOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeDatePicker(); }}>
        <div className="datepicker-modal">
          <div className="datepicker-top">
            <span className="dp-cancel" onClick={closeDatePicker}>Cancel</span>
            <span className="dp-title">Choose a date</span>
            <span className="dp-confirm" onClick={confirmDatePicker}>Confirm</span>
          </div>
          <div className="dp-columns">
            <div className="dp-highlight"></div>
            <div className="dp-col" ref={dpYearColRef}>
              {years.map((y) => (
                <div key={y} className={`dp-item${dpYear === y ? ' selected' : ''}`} data-val={y}>Year {y}</div>
              ))}
            </div>
            <div className="dp-col" ref={dpMonthColRef}>
              {months.map((m) => (
                <div key={m} className={`dp-item${dpMonth === m ? ' selected' : ''}`} data-val={m}>Month {String(m).padStart(2, '0')}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LEARN ABOUT SAFES PAGE ═══ */}
      <div className={`learn-page${learnOpen ? ' open' : ''}`}>
        <div className="hist-header">
          <div className="back-btn" onClick={() => { setLearnOpen(false); document.body.style.overflow = ''; }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </div>
          <div className="page-title" style={{ fontSize: 14 }}>Learn about safes</div>
          <div style={{ width: 36 }}></div>
        </div>
        <div className="learn-banner">
          <div className="learn-interest-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF8A80" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            Minimum return, daily interest &nbsp;<strong>0.1%</strong>
          </div>
        </div>

        <div style={{ padding: '16px 0 20px', overflowY: 'auto' }}>
          <div className="learn-section">
            <div className="learn-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="learn-section-title">Income</span>
            </div>
            <div className="learn-section-body">
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">The Income Calculation Method is the Base Interest Rate plus the VIP Level Extra Interest Rate.</p>
              </div>
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">After the balance is transferred in, profit will be calculated once every 1 minute.</p>
              </div>
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">Profit will be paid on the 2nd transfer or transfer out and the previous profit will be transferred to the wallet balance.</p>
              </div>
            </div>
          </div>

          <div className="learn-section">
            <div className="learn-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
              <span className="learn-section-title">Transfer In</span>
            </div>
            <div className="learn-section-body">
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">Wallet balance transferred to the safe must be transferred in points.</p>
              </div>
              <div className="learn-example-box">
                <div className="learn-example-label">FOR EXAMPLE</div>
                <p className="learn-example-text">1 point is 1000, transfer in 2 points is 2000, 10 points is 10000, 50 points is 50000. Transfer amount must be a multiple of 1000.</p>
              </div>
            </div>
          </div>

          <div className="learn-section">
            <div className="learn-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              <span className="learn-section-title">Transfer Out</span>
            </div>
            <div className="learn-section-body">
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">Provided your income is guaranteed, you can transfer out at any time, from the balance of the safe to the balance of the wallet. The amount transferred must be a multiple of the number of copies.</p>
              </div>
              <div className="learn-example-box">
                <div className="learn-reminder">⚠ Reminder</div>
                <p className="learn-reminder-text">Please do not transfer in and out frequently. Earnings will be calculated from 1 minute after deposit. If the cumulative amount of an earned amount is less than 0.01, the amount will not be counted in &quot;earnings&quot;.</p>
              </div>
            </div>
          </div>

          <div className="learn-section">
            <div className="learn-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span className="learn-section-title">Safe</span>
            </div>
            <div className="learn-section-body">
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">Security technical team to ensure the safety of your money.</p>
              </div>
              <div className="learn-item">
                <div className="learn-arrow"></div>
                <p className="learn-item-text">To keep your funds safe, it is recommended that you transfer money to the safe.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      <div className={`toast${toast.show ? ' show' : ''}${toast.error ? ' error' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Safe;