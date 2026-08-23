import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './Transaction.css';

const TX_TYPES = [
  'All', 'Bet', 'Agent commission', 'Win', 'Red envelope', 'Deposit', 'Withdraw',
  'Cancel withdrawal', 'Attendance bonus', "Agent's red envelope", 'Withdrawal rejected',
  'Deposit Gift', 'Manual deposit', 'Sign up bonus', 'Bonus', 'First deposit bonus',
  'First deposit rebate', 'Investment and financial management', 'Financial income',
  'Financial capital', 'Capital', 'Invite bonus', 'Game moved in', 'Game moved out',
  'Winning slots', 'Bank binding bonus', 'Game refunded', 'USDT deposit', 'Betting rebate',
  'VIP level up reward', 'VIP monthly reward', 'VIP deposit bonus', 'Bonus deduction',
  'Manual withdrawal', 'One-Click rebate', 'Slots Jackpot', 'Bind mobile phone rewards',
  'XOSO issue canceled', 'Bind email rewards', 'Weekly Award', 'C2C Withdraw Awards',
  'C2C Withdraw', 'C2C Withdraw Back', 'C2C Recharge', 'C2C Recharge Awards',
  'Newbie gift pack', 'Tournament Rewards', 'Return Awards',
  'New members receive bonuses on their first deposit', 'Lucky Wheel', 'Partner rewards',
  'ARPay Cash Back', 'Join channel rewards', 'Recharge Replenishment',
  'Withdrawal Reward', 'Invite Wheel Reward', 'Download Bonus', 'Top-up Rewards',
  'VIP Rewards', 'Returning Member New Recharge Bonus',
];

const NOW = new Date();
const TODAY_Y = NOW.getFullYear();
const TODAY_M = NOW.getMonth() + 1;
const TODAY_D = NOW.getDate();

function pad2(n) { return String(n).padStart(2, '0'); }
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

function getIconCls(type) {
  const t = type.toLowerCase();
  if (t.includes('deposit') || t.includes('recharge') || t.includes('top-up') || t.includes('capital') || t.includes('sign up') || t.includes('manual deposit')) return 'deposit';
  if (t.includes('withdraw')) return 'withdraw';
  if (t.includes('bonus') || t.includes('reward') || t.includes('gift') || t.includes('invite') || t.includes('attendance') || t.includes('vip') || t.includes('rebate') || t.includes('jackpot') || t.includes('award') || t.includes('win') || t.includes('envelope') || t.includes('lucky') || t.includes('tournament') || t.includes('return') || t.includes('wheel') || t.includes('first deposit') || t.includes('newbie')) return 'bonus';
  if (t.includes('bet') || t.includes('game')) return 'bet';
  return 'other';
}

function IconSVG({ cls }) {
  const stroke = 'rgba(10,5,0,0.85)';
  if (cls === 'deposit') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v14" /><polyline points="6 9 12 15 18 9" /><path d="M4 20h16" /></svg>;
  if (cls === 'withdraw') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"><path d="M12 22V8" /><polyline points="18 15 12 9 6 15" /><path d="M4 4h16" /></svg>;
  if (cls === 'bonus') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
  if (cls === 'bet') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>;
}

function isCredit(type) {
  const t = type.toLowerCase();
  if (t.includes('withdraw') || t.includes('bet') || t.includes('deduction') || t.includes('moved out')) return false;
  return true;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDateLabel(str) {
  const [y, m, d] = str.split('-');
  return `${d} ${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`;
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem('alfa9_transactions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function Transaction() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [selectedType, setSelectedType] = useState('All');
  const [tempType, setTempType] = useState('All');
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [pYear, setPYear] = useState(TODAY_Y);
  const [pMonth, setPMonth] = useState(TODAY_M);
  const [pDay, setPDay] = useState(TODAY_D);

  const yearColRef = useRef(null);
  const monthColRef = useRef(null);
  const dayColRef = useRef(null);

  const years = useMemo(() => {
    const ys = [];
    for (let y = 2020; y <= TODAY_Y; y++) ys.push(y);
    return ys;
  }, []);
  const months = useMemo(() => {
    const max = pYear === TODAY_Y ? TODAY_M : 12;
    const ms = [];
    for (let m = 1; m <= max; m++) ms.push(m);
    return ms;
  }, [pYear]);
  const days = useMemo(() => {
    const maxPossible = daysInMonth(pYear, pMonth);
    const max = pYear === TODAY_Y && pMonth === TODAY_M ? TODAY_D : maxPossible;
    const ds = [];
    for (let d = 1; d <= max; d++) ds.push(d);
    return ds;
  }, [pYear, pMonth]);

  useEffect(() => {
    if (pMonth > months[months.length - 1]) setPMonth(months[months.length - 1]);
  }, [months, pMonth]);
  useEffect(() => {
    if (pDay > days[days.length - 1]) setPDay(days[days.length - 1]);
  }, [days, pDay]);

  const openDateSheet = () => {
    setDateSheetOpen(true);
    setTimeout(() => {
      [yearColRef, monthColRef, dayColRef].forEach((ref) => {
        const sel = ref.current?.querySelector('.sel');
        if (sel) sel.scrollIntoView({ block: 'center' });
      });
    }, 0);
  };

  function getCenter(colEl) {
    if (!colEl) return null;
    const items = colEl.querySelectorAll('.picker-item');
    const mid = colEl.scrollTop + colEl.offsetHeight / 2;
    let closest = null, minDist = Infinity;
    items.forEach((item) => {
      const dist = Math.abs(item.offsetTop + item.offsetHeight / 2 - mid);
      if (dist < minDist) { minDist = dist; closest = item; }
    });
    return closest;
  }

  const confirmDate = () => {
    const yItem = getCenter(yearColRef.current);
    const mItem = getCenter(monthColRef.current);
    const dItem = getCenter(dayColRef.current);
    const y = yItem ? parseInt(yItem.dataset.val, 10) : pYear;
    const m = mItem ? parseInt(mItem.dataset.val, 10) : pMonth;
    const d = dItem ? parseInt(dItem.dataset.val, 10) : pDay;
    setPYear(y); setPMonth(m); setPDay(d);
    setSelectedDate({ y, m, d });
    setDateSheetOpen(false);
  };

  const openTypeSheet = () => { setTempType(selectedType); setTypeSheetOpen(true); };
  const confirmType = () => { setSelectedType(tempType); setTypeSheetOpen(false); };

  const allTx = useMemo(() => loadTransactions(), []);

  const filtered = useMemo(() => {
    let txs = allTx;
    if (selectedType !== 'All') txs = txs.filter((t) => t.type === selectedType);
    if (selectedDate) {
      const ds = `${selectedDate.y}-${pad2(selectedDate.m)}-${pad2(selectedDate.d)}`;
      txs = txs.filter((t) => (t.time || '').startsWith(ds));
    }
    return txs;
  }, [allTx, selectedType, selectedDate]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((t) => {
      const d = (t.time || '').split(' ')[0] || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const dateLabel = selectedDate ? `${TODAY_Y}-${pad2(selectedDate.m)}-${pad2(selectedDate.d)}` : t('tx_choose_date');

  return (
    <div className="transaction-page">
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </div>
        <div className="header-title">{t('tx_title')}</div>
      </div>

      <div className="filter-bar">
        <div className="filter-btn" onClick={openTypeSheet}>
          <div>
            <div className="filter-btn-text">{selectedType}</div>
            <div className="filter-btn-sub">{t('tx_type_label')}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        <div className="filter-btn" onClick={openDateSheet}>
          <div>
            <div className="filter-btn-text">{dateLabel}</div>
            <div className="filter-btn-sub">{t('tx_filter_by_date')}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>
      <div className="divider"></div>

      {grouped.length > 0 ? (
        <div className="tx-list">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="date-group-label">{formatDateLabel(date)}</div>
              {items.map((tx, i) => {
                const credit = isCredit(tx.type || '');
                const cls = getIconCls(tx.type || '');
                const status = tx.status || 'success';
                return (
                  <div className="tx-card" key={i}>
                    <div className={`tx-icon-wrap ${cls}`}><IconSVG cls={cls} /></div>
                    <div className="tx-info">
                      <div className="tx-name">{tx.type || 'Transaction'}</div>
                      <div className="tx-time">{(tx.time || '').split(' ')[1] || ''}</div>
                      <span className={`tx-status ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                    <div className={`tx-amount ${credit ? 'credit' : 'debit'}`}>{credit ? '+' : '-'}Rs{parseFloat(tx.amount || 0).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state show">
          <svg className="empty-svg" viewBox="0 0 130 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 90 L28 52 L51 90Z" fill="rgba(212,175,55,0.13)" />
            <path d="M35 90 L72 28 L109 90Z" fill="rgba(212,175,55,0.18)" />
            <path d="M80 90 L103 56 L126 90Z" fill="rgba(212,175,55,0.11)" />
            <rect x="42" y="22" width="46" height="58" rx="6" fill="rgba(212,175,55,0.22)" stroke="rgba(212,175,55,0.38)" strokeWidth="1.5" />
            <rect x="49" y="32" width="22" height="3" rx="1.5" fill="rgba(212,175,55,0.45)" />
            <rect x="49" y="41" width="32" height="2.5" rx="1.25" fill="rgba(212,175,55,0.25)" />
            <rect x="49" y="48" width="28" height="2.5" rx="1.25" fill="rgba(212,175,55,0.22)" />
            <rect x="49" y="55" width="32" height="2.5" rx="1.25" fill="rgba(212,175,55,0.25)" />
            <rect x="49" y="62" width="20" height="2.5" rx="1.25" fill="rgba(212,175,55,0.2)" />
            <circle cx="16" cy="80" r="9" fill="rgba(212,175,55,0.18)" />
            <rect x="14.5" y="84" width="3" height="6" rx="1" fill="rgba(212,175,55,0.28)" />
            <rect x="98" y="76" width="16" height="14" rx="2" fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.32)" strokeWidth="1" />
          </svg>
          <div className="empty-text">{t('tx_no_data')}</div>
        </div>
      )}

      {/* TYPE SHEET */}
      {typeSheetOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setTypeSheetOpen(false); }}>
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <span className="sheet-cancel" onClick={() => setTypeSheetOpen(false)}>{t('hist_cancel')}</span>
              <span className="sheet-title">{t('tx_select_type')}</span>
              <span className="sheet-confirm" onClick={confirmType}>{t('hist_confirm')}</span>
            </div>
            <div className="sheet-list">
              {TX_TYPES.map((t) => (
                <div
                  key={t}
                  className={`sheet-option${tempType === t ? ' active' : ''}`}
                  onClick={(e) => {
                    setTempType(t);
                    e.currentTarget.scrollIntoView({ block: 'start', behavior: 'smooth' });
                  }}
                >
                  <span className="sheet-option-text">{t}</span>
                  {tempType === t && <span className="sheet-check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DATE SHEET */}
      {dateSheetOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setDateSheetOpen(false); }}>
          <div className="date-sheet">
            <div className="sheet-header">
              <span className="sheet-cancel" onClick={() => setDateSheetOpen(false)}>{t('hist_cancel')}</span>
              <span className="sheet-title">{t('tx_choose_date')}</span>
              <span className="sheet-confirm" onClick={confirmDate}>{t('hist_confirm')}</span>
            </div>
            <div className="picker-labels">
              <div className="picker-label">{t('tx_year')}</div>
              <div className="picker-label">{t('tx_month')}</div>
              <div className="picker-label">{t('tx_day')}</div>
            </div>
            <div className="picker-outer">
              <div className="picker-cols">
                <div className="picker-col" ref={yearColRef}>
                  <div className="picker-spacer"></div>
                  {years.map((y) => (
                    <div key={y} className={`picker-item${y === pYear ? ' sel' : ''}`} data-val={y}>{y}</div>
                  ))}
                  <div className="picker-spacer"></div>
                </div>
                <div className="picker-col" ref={monthColRef}>
                  <div className="picker-spacer"></div>
                  {months.map((m) => (
                    <div key={m} className={`picker-item${m === pMonth ? ' sel' : ''}`} data-val={m}>{pad2(m)}</div>
                  ))}
                  <div className="picker-spacer"></div>
                </div>
                <div className="picker-col" ref={dayColRef}>
                  <div className="picker-spacer"></div>
                  {days.map((d) => (
                    <div key={d} className={`picker-item${d === pDay ? ' sel' : ''}`} data-val={d}>{pad2(d)}</div>
                  ))}
                  <div className="picker-spacer"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transaction;