import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './BettingRebate.css';

const REBATE_RATES = { lottery: 0.0020, casino: 0.0015, rummy: 0.0015, slots: 0.0018 };

const TAB_META = {
  all: { catKey: null, llKey: 'br_today_rebate', rlKey: 'br_total_rebate' },
  lottery: { catKey: 'cat_lottery', llKey: 'br_rebate_rate', rlKey: 'br_total_rebate', rate: '0.20%' },
  casino: { catKey: 'cat_casino', llKey: 'br_rebate_rate', rlKey: 'br_total_rebate', rate: '0.15%' },
  rummy: { catKey: 'cat_rummy', llKey: 'br_rebate_rate', rlKey: 'br_total_rebate', rate: '0.15%' },
  slots: { catKey: 'cat_slots', llKey: 'br_rebate_rate', rlKey: 'br_total_rebate', rate: '0.18%' },
};

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function rateLabel(c) { return REBATE_RATES[c] ? (REBATE_RATES[c] * 100).toFixed(2) + '%' : '-'; }

function BettingRebate() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('all');
  const [state, setState] = useState({ totalRebate: 0, todayRebate: 0, pendingRebate: 0, history: [] });
  const [toast, setToast] = useState({ msg: '', type: '', show: false });

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const loadStatus = useCallback(() => {
    apiFetch(`/activity/betting-rebate/status?category=${tab}`)
      .then((data) => setState((s) => ({
        ...s, pendingRebate: data.pendingRebate, todayRebate: data.todayRebate, totalRebate: data.totalRebate
      })))
      .catch(() => {});
    apiFetch(`/activity/betting-rebate/history?category=${tab}`)
      .then((data) => setState((s) => ({
        ...s,
        history: (data.history || []).map((h, i) => ({
          id: i, game: h.game, category: h.category, betAmount: h.betAmount,
          rebateAmount: h.rebateAmount, date: new Date(h.date).toLocaleString(), status: h.status
        }))
      })))
      .catch(() => {});
  }, [tab]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const collectRebate = () => {
    apiFetch('/activity/betting-rebate/collect', { method: 'POST' })
      .then((data) => {
        loadStatus();
        showToast('\ud83c\udf89 Rs' + data.amount.toFixed(2) + ' ' + t('br_toast_collected'), 'success');
      })
      .catch((err) => showToast(err.message || t('br_toast_no_pending'), 'error'));
  };

  const meta = TAB_META[tab];
  let bigVal, leftLbl, leftVal, rightVal;
  if (tab === 'all') {
    bigVal = state.pendingRebate.toFixed(2);
    leftLbl = meta.llKey;
    leftVal = 'Rs' + state.todayRebate.toFixed(2);
    rightVal = 'Rs' + state.totalRebate.toFixed(2);
  } else {
    const catH = state.history.filter((h) => h.category === tab);
    const catPending = catH.filter((h) => h.status === 'Pending').reduce((a, h) => a + h.rebateAmount, 0);
    const catTotal = catH.reduce((a, h) => a + h.rebateAmount, 0);
    bigVal = catPending.toFixed(2);
    leftLbl = meta.rate || '0%';
    leftVal = null;
    rightVal = 'Rs' + catTotal.toFixed(2);
  }

  const filtered = tab === 'all' ? state.history : state.history.filter((h) => h.category === tab);

  return (
    <div className="betting-rebate-page">
      <div className="top-bar">
        <Link to="/activity" className="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="top-title">{t('br_title')}</span>
      </div>

      <div className="tabs-wrap">
        <button className={`tab-pill ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          {t('all')}
        </button>
        <button className={`tab-pill ${tab === 'lottery' ? 'active' : ''}`} onClick={() => setTab('lottery')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 3-2.5 3" /><circle cx="12" cy="17" r=".5" fill="currentColor" /></svg>
          {t('cat_lottery')}
        </button>
        <button className={`tab-pill ${tab === 'casino' ? 'active' : ''}`} onClick={() => setTab('casino')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M12 11v4M10 13h4" /></svg>
          {t('cat_casino')}
        </button>
        <button className={`tab-pill ${tab === 'rummy' ? 'active' : ''}`} onClick={() => setTab('rummy')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="10" height="14" rx="2" /><rect x="10" y="8" width="10" height="14" rx="2" /></svg>
          {t('cat_rummy')}
        </button>
        <button className={`tab-pill ${tab === 'slots' ? 'active' : ''}`} onClick={() => setTab('slots')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
          {t('cat_slots')}
        </button>
      </div>

      <div className="stats-card">
        <div className="stats-title">{meta.catKey ? `${t(meta.catKey)} \u2014 ${t('br_total_betting_rebate_suffix')}` : `${t('all')} \u2014 ${t('br_total_betting_rebate_suffix')}`}</div>
        <div className="realtime-badge"><div className="rt-dot"></div> {t('br_realtime_count')}</div>
        <div className="big-amount">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19" cy="19" r="19" fill="url(#cg1)" />
            <circle cx="19" cy="19" r="15" fill="url(#cg2)" />
            <circle cx="19" cy="19" r="13" fill="none" stroke="url(#cg3)" strokeWidth="1.2" />
            <text x="19" y="24" textAnchor="middle" fontSize="14" fontWeight="900" fill="#7A4800" fontFamily="Segoe UI,sans-serif">₨</text>
            <defs>
              <radialGradient id="cg1" cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFE566" /><stop offset="60%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#7A5810" /></radialGradient>
              <radialGradient id="cg2" cx="40%" cy="30%" r="65%"><stop offset="0%" stopColor="#FFF3A0" /><stop offset="50%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#AA7C11" /></radialGradient>
              <linearGradient id="cg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFE566" /><stop offset="100%" stopColor="#7A5810" /></linearGradient>
            </defs>
          </svg>
          <span>{bigVal}</span>
        </div>
        <div className="vip-hint">{t('br_vip_hint')}</div>
        <div className="two-cols">
          <div className="stat-box">
            <div className="stat-box-label">{t(leftLbl)}</div>
            <div className="stat-box-val">{leftVal || ''}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">{t(meta.rlKey)}</div>
            <div className="stat-box-val">{rightVal}</div>
          </div>
        </div>
        <div className="stat-note">{t('br_auto_wash')}</div>
      </div>

      <div className="collect-wrap">
        <button className="collect-btn" disabled={state.pendingRebate <= 0} onClick={collectRebate}>
          {state.pendingRebate > 0 ? `${t('br_collect')}${state.pendingRebate.toFixed(2)}` : t('br_no_pending')}
        </button>
      </div>

      <div className="history-section">
        <div className="history-title"><div className="history-bar"></div> {t('br_history_title')}</div>
        {filtered.length === 0 ? (
          <div className="no-data"><div className="no-data-icon">\ud83d\udccb</div>{t('br_no_history')}</div>
        ) : (
          filtered.map((h) => (
            <div className="history-entry" key={h.id}>
              <div className="entry-header">
                <div>
                  <div className="entry-game">{h.game}<span className="game-tag">{t(`cat_${h.category}`) !== `cat_${h.category}` ? t(`cat_${h.category}`) : cap(h.category)}</span></div>
                  <div className="entry-date">{h.date}</div>
                </div>
                <div className={h.status === 'Collected' ? 'entry-status-collected' : 'entry-status-pending'}>{h.status === 'Collected' ? t('br_status_collected') : t('br_status_pending')}</div>
              </div>
              <div className="entry-rows">
                <div className="entry-row"><span className="entry-row-label">{t('br_bet_amount')}</span><span className="entry-row-val">Rs{(+h.betAmount).toFixed(2)}</span></div>
                <div className="entry-row"><span className="entry-row-label">{t('br_rebate_rate')}</span><span className="entry-row-val">{rateLabel(h.category)}</span></div>
                <div className="entry-row"><span className="entry-row-label">{t('br_rebate_amount')}</span><span className="entry-row-val gold">Rs{(+h.rebateAmount).toFixed(2)}</span></div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bottom-spacer"></div>

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default BettingRebate;