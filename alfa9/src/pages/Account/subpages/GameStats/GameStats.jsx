import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './GameStats.css';

const GAME_KEYS = ['lottery', 'video', 'slot', 'fish', 'sport', 'chess'];
const GAME_NAME_KEYS = { lottery: 'gs_lottery', video: 'gs_video', slot: 'gs_slot', fish: 'gs_fish', sport: 'gs_sport', chess: 'gs_chess' };
const GAME_ICON_SRC = {
  lottery: '/image/iconLottery.webp',
  video: '/image/iconRealPerson.webp',
  slot: '/image/iconSlots.webp',
  fish: '/image/iconFishing.webp',
  sport: '/image/iconPhysics.webp',
  chess: '/image/iconChess.webp',
};
const PERIOD_KEYS = { today: 'gs_today', yesterday: 'gs_yesterday', week: 'gs_this_week', month: 'gs_this_month' };
const PERIODS = ['today', 'yesterday', 'week', 'month'];

const RING_R = 74;
const RING_CIRC = 2 * Math.PI * RING_R;
const RING_GAP = 3;

function formatMoney(v) {
  return (v < 0 ? 0 : v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatInt(v) {
  return (v < 0 ? 0 : v).toLocaleString('en-US');
}

function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  const cx = e.clientX || rect.left + rect.width / 2;
  const cy = e.clientY || rect.top + rect.height / 2;
  ripple.style.left = cx - rect.left - size / 2 + 'px';
  ripple.style.top = cy - rect.top - size / 2 + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function vibrate(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* noop */ }
}

function GameStats() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [period, setPeriod] = useState('today');
  const [periodStats, setPeriodStats] = useState({});
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    apiFetch(`/game-stats/my-stats?period=${period}`)
      .then((data) => setPeriodStats(data.stats || {}))
      .catch(() => setPeriodStats({}));
  }, [period]);

  const positionPill = () => {
    const tabs = tabsRef.current;
    const btn = activeTabRef.current;
    if (!tabs || !btn) return;
    const tabsRect = tabs.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPillStyle({ width: btnRect.width, left: btnRect.left - tabsRect.left });
  };

  useEffect(() => {
    positionPill();
    window.addEventListener('resize', positionPill);
    return () => window.removeEventListener('resize', positionPill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const selectPeriod = (p, e) => {
    addRipple(e);
    vibrate(8);
    setPeriod(p);
  };

  const computed = useMemo(() => {
    const data = periodStats || {};
    let totalBet = 0, totalBets = 0, totalWin = 0;
    const vals = {};

    GAME_KEYS.forEach((key) => {
      const d = data[key] || { bet: 0, count: 0, win: 0 };
      const bet = parseFloat(d.bet || 0);
      const count = parseInt(d.count || 0, 10);
      const win = parseFloat(d.win || 0);
      vals[key] = { bet, count, win };
      totalBet += bet; totalBets += count; totalWin += win;
    });

    let topKey = null, topBet = 0;
    GAME_KEYS.forEach((k) => { if (vals[k].bet > topBet) { topBet = vals[k].bet; topKey = k; } });

    let cumulative = 0;
    const segments = {};
    const shares = {};
    GAME_KEYS.forEach((key) => {
      const { bet } = vals[key];
      const share = totalBet > 0 ? bet / totalBet : 0;
      shares[key] = share;
      const rawArc = share * RING_CIRC;
      const arc = Math.max(rawArc - RING_GAP, 0);
      segments[key] = {
        dasharray: `${arc.toFixed(2)} ${(RING_CIRC - arc).toFixed(2)}`,
        dashoffset: (-cumulative).toFixed(2),
      };
      cumulative += rawArc;
    });

    return { vals, totalBet, totalBets, totalWin, topKey, shares, segments };
  }, [periodStats]);

  return (
    <div className="gamestats-page">
      <div className="page-header">
        <div className="header-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <span className="header-title">{t('gs_title')}</span>
        <div style={{ width: 36 }}></div>
      </div>

      <div className="period-tabs" ref={tabsRef}>
        <div className="period-pill" style={{ width: pillStyle.width, left: pillStyle.left }}></div>
        {PERIODS.map((p) => (
          <button
            key={p}
            ref={period === p ? activeTabRef : null}
            className={`period-tab${period === p ? ' active' : ''}`}
            onClick={(e) => selectPeriod(p, e)}
          >
            {t(PERIOD_KEYS[p])}
          </button>
        ))}
      </div>

      <div className="ring-card">
        <div className="ring-title-row">
          <span className="ring-title">{t('gs_bet_distribution')}</span>
          <span className="ring-period-echo">{t(PERIOD_KEYS[period])}</span>
        </div>

        <div className="ring-wrap">
          <svg viewBox="0 0 178 178">
            <circle cx="89" cy="89" r="74" stroke="rgba(212,175,55,0.07)" />
            {GAME_KEYS.map((key) => (
              <circle
                key={key}
                cx="89" cy="89" r="74"
                stroke={`var(--c-${key})`}
                strokeDasharray={computed.segments[key].dasharray}
                strokeDashoffset={computed.segments[key].dashoffset}
              />
            ))}
          </svg>
          <div className="ring-center">
            {computed.totalBet > 0 ? (
              <>
                <div className="ring-total-label">{t('gs_total_bet')}</div>
                <div className="ring-total-amount">
                  <span style={{ fontSize: 14, opacity: 0.7 }}>Rs</span>{formatMoney(computed.totalBet)}
                </div>
              </>
            ) : (
              <div className="ring-empty-msg show">{t('gs_no_games_played')}<br />{t('gs_in_this_period')}</div>
            )}
          </div>
        </div>

        <div className="ring-legend">
          {GAME_KEYS.map((key) => (
            <div className="legend-chip" key={key}>
              <div className="legend-dot" style={{ background: `var(--c-${key})` }}></div>{t(GAME_NAME_KEYS[key])}
            </div>
          ))}
        </div>

        <div className="ring-meta">
          <div className="ring-meta-pill">
            <div className="ring-meta-val">{formatInt(computed.totalBets)}</div>
            <div className="ring-meta-lbl">{t('gs_number_of_bets')}</div>
          </div>
          <div className="ring-meta-pill">
            <div className="ring-meta-val green">{formatMoney(computed.totalWin)}</div>
            <div className="ring-meta-lbl">{t('gs_total_winning')}</div>
          </div>
        </div>
      </div>

      <div className="section-title">{t('gs_games_breakdown')}</div>

      {GAME_KEYS.map((key, i) => {
        const { bet, count, win } = computed.vals[key];
        const share = computed.shares[key];
        const isTop = key === computed.topKey && bet > 0;
        return (
          <div className="game-block" style={{ animationDelay: `${0.02 + i * 0.04}s` }} key={key}>
            <div className="game-header">
              <div className={`game-icon ${key}`}><img src={GAME_ICON_SRC[key]} alt={key} /></div>
              <div className="game-name-col">
                <div className="game-name-row">
                  <span className="game-name">{t(GAME_NAME_KEYS[key])}</span>
                  <span className={`top-badge${isTop ? ' show' : ''}`}>{t('gs_top')}</span>
                </div>
                <div className="game-share-line">
                  {computed.totalBet > 0 ? `${(share * 100).toFixed(1)}% ${t('gs_of_total_bets')}` : t('gs_no_bets_yet')}
                </div>
              </div>
              <div className="game-win-badge">
                <span className="game-win-label">{t('gs_winning')}</span>
                <span className="game-win-val">{formatMoney(win)}</span>
                <span className="game-return">{bet > 0 ? `${((win / bet) * 100).toFixed(1)}% ${t('gs_return')}` : '\u2014'}</span>
              </div>
            </div>
            <div className="share-bar-track">
              <div className="share-bar-fill" style={{ width: `${(share * 100).toFixed(1)}%`, background: `var(--c-${key})` }}></div>
            </div>
            <div className="stat-rows">
              <div className="stat-row">
                <div className="timeline-col"><div className="tl-dot"></div><div className="tl-line"></div></div>
                <div className="stat-content"><span className="stat-label">{t('gs_total_bet_row')}</span><span className="stat-value gold-val">{formatMoney(bet)}</span></div>
              </div>
              <div className="stat-row">
                <div className="timeline-col"><div className="tl-dot"></div><div className="tl-line"></div></div>
                <div className="stat-content"><span className="stat-label">{t('gs_number_of_bets_row')}</span><span className="stat-value">{formatInt(count)}</span></div>
              </div>
              <div className="stat-row">
                <div className="timeline-col"><div className="tl-dot"></div></div>
                <div className="stat-content"><span className="stat-label">{t('gs_winning_amount')}</span><span className="stat-value win">{formatMoney(win)}</span></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GameStats;