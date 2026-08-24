import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './ActivityAward.css';

const MISSIONS = [
  { deposit: [0, 500], bet: [0, 5000], award: 'Rs5.00~Rs50.00' },
  { deposit: [0, 1000], bet: [0, 10000], award: 'Rs5.00~Rs100.00' },
  { deposit: [0, 5000], bet: [0, 50000], award: 'Rs50.00~Rs500.00' },
  { deposit: [0, 10000], bet: [0, 100000], award: 'Rs50.00~Rs1,000.00' },
  { deposit: [0, 50000], bet: [0, 500000], award: 'Rs50.00~Rs2,000.00' },
  { deposit: [0, 100000], bet: [0, 1000000], award: 'Rs50.00~Rs3,000.00' },
];

function ChestIcon() {
  return (
    <svg className="chest-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cbg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E8A020" /><stop offset="100%" stopColor="#7A3800" /></linearGradient>
        <linearGradient id="clg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD060" /><stop offset="100%" stopColor="#C97010" /></linearGradient>
        <linearGradient id="crg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7A3800" /><stop offset="30%" stopColor="#D4AF37" /><stop offset="70%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#7A3800" /></linearGradient>
      </defs>
      <rect x="4" y="16" width="24" height="13" rx="2" fill="url(#cbg)" />
      <path d="M4 18 Q4 9 16 9 Q28 9 28 18 Z" fill="url(#clg)" />
      <rect x="3" y="16.5" width="26" height="3" rx="1" fill="url(#crg)" />
      <rect x="13" y="18" width="6" height="5" rx="1.5" fill="#5A3A00" />
      <path d="M14 20 Q14 17.5 16 17.5 Q18 17.5 18 20" stroke="#D4AF37" strokeWidth="1.5" fill="none" />
      <ellipse cx="13" cy="13" rx="3" ry="1.5" fill="rgba(255,243,205,0.25)" transform="rotate(-15,13,13)" />
      <circle cx="10" cy="15" r="2.2" fill="#F0C040" />
      <circle cx="22" cy="14.5" r="2" fill="#F0C040" />
      <circle cx="16" cy="13" r="2.5" fill="#FFD700" />
      <circle cx="16" cy="13" r="1.2" fill="#FFF0A0" opacity="0.6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="wallet-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="wbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F0A020" /><stop offset="100%" stopColor="#7A3800" /></linearGradient></defs>
      <path d="M3 9 Q3 6 6 6 L14 6 Q17 6 17 9 L17 15 Q17 17 14.5 17 L5.5 17 Q3 17 3 15 Z" fill="url(#wbg)" />
      <path d="M7 6 Q7 3.5 10 3.5 Q13 3.5 13 6" stroke="#D4AF37" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <ellipse cx="8.5" cy="10.5" rx="2" ry="1.2" fill="rgba(255,243,205,0.22)" transform="rotate(-10,8.5,10.5)" />
      <rect x="8" y="11.5" width="4" height="1" rx="0.5" fill="#7A3800" opacity="0.7" />
      <circle cx="10" cy="14" r="1.3" fill="#FFD700" />
      <circle cx="10" cy="14" r="0.65" fill="#FFF0A0" opacity="0.7" />
    </svg>
  );
}

function EmptySvg() {
  return (
    <svg className="empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="140" rx="80" ry="12" fill="#C3A675" opacity="0.3" />
      <rect x="70" y="40" width="60" height="90" rx="4" fill="#7A581C" />
      <polygon points="60,80 100,20 140,80" fill="#B8860B" />
      <polygon points="20,120 60,60 100,120" fill="#C9971F" opacity="0.7" />
      <polygon points="100,120 140,60 180,120" fill="#C9971F" opacity="0.7" />
      <rect x="85" y="100" width="30" height="30" fill="#B8860B" />
      <circle cx="40" cy="80" r="8" fill="#D4AF37" opacity="0.5" />
      <rect x="155" y="100" width="15" height="22" rx="2" fill="#7A581C" />
    </svg>
  );
}

function ActivityAward() {
  const { t } = useLanguage();
  const [page, setPage] = useState('award'); // 'award' | 'collection'
  const [tab, setTab] = useState('weekly'); // 'weekly' | 'daily'
  const [missions, setMissions] = useState(MISSIONS.map((m, i) => ({
    index: i, depositProgress: 0, depositTarget: m.deposit[1], betProgress: 0, betTarget: m.bet[1],
    rewardLabel: m.award, eligible: false, claimed: false
  })));
  const [history, setHistory] = useState([]);

  const loadMissions = () => {
    apiFetch('/activity/mission-award/status')
      .then((data) => {
        setMissions((data.missions || []).map((m, i) => ({
          index: i,
          depositProgress: m.depositProgress, depositTarget: m.depositTarget,
          betProgress: m.betProgress, betTarget: m.betTarget,
          rewardLabel: `Rs${m.rewardRange.min.toFixed(2)}~Rs${m.rewardRange.max.toFixed(2)}`,
          eligible: m.eligible, claimed: m.claimed
        })));
      })
      .catch(() => {});
  };

  useEffect(() => { loadMissions(); }, []);

  useEffect(() => {
    if (page === 'collection') {
      apiFetch('/activity/mission-award/history')
        .then((data) => setHistory(data.history || []))
        .catch(() => setHistory([]));
    }
  }, [page]);

  const tryComplete = (i) => {
    const m = missions[i];
    if (!m.eligible) { alert(t('aa_toast_requirements')); return; }
    apiFetch('/activity/mission-award/claim', { method: 'POST', body: { index: i } })
      .then(() => loadMissions())
      .catch((err) => alert(err.message || t('aa_toast_claim_error')));
  };

  return (
    <div className="activity-award-page">
      <div className="top-bar">
        <Link to="/activity" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        {page === 'award' ? (
          <button className="collection-btn" onClick={() => setPage('collection')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {t('aa_collection_record')}
          </button>
        ) : (
          <span className="top-title">{t('aa_collection_record')}</span>
        )}
      </div>

      <div className="hero-banner">
        <img src="/image/Award.webp" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="hero-overlay">
          <div className="hero-title">{page === 'award' ? t('act_activity_award') : t('aa_collection_record')}</div>
          <div className="hero-desc">
            {page === 'award'
              ? <>{t('aa_hero_desc')}<br />{t('aa_hero_desc_2')}<br />{t('aa_hero_desc_3')}</>
              : t('aa_view_history')}
          </div>
        </div>
      </div>

      {page === 'award' && (
        <div className="missions-wrap">
          {missions.map((m, i) => (
            <div className="mission-card" key={i}>
              <div className="mission-header">
                <span className="mission-tag">{t('aa_daily_mission')}</span>
                <span className={`mission-status ${m.claimed ? 'done' : ''}`}>{m.claimed ? t('aa_finished') : t('aa_unfinished')}</span>
              </div>
              <div className="mission-body">
                <div className="mission-name-row">
                  <ChestIcon />
                  <span className="mission-name">{t('aa_mission_name')}</span>
                </div>
                <div className="stat-row"><span className="stat-label">{t('aa_deposit')}</span><span className="stat-val">{m.depositProgress}/{m.depositTarget}</span></div>
                <div className="stat-row"><span className="stat-label">{t('aa_bet')}</span><span className="stat-val">{m.betProgress}/{m.betTarget}</span></div>
                <div className="progress-wrap"><div className="progress-bg"><div className="progress-fill"></div></div></div>
                <div className="mission-desc-box">{t('aa_mission_desc')}</div>
                <div className="award-row">
                  <span className="award-label">{t('aa_award_amount')}</span>
                  <span className="award-val"><WalletIcon /> {m.rewardLabel}</span>
                </div>
                <button className="complete-btn" disabled={m.claimed} onClick={() => tryComplete(i)}>
                  {m.claimed ? t('aa_claimed') : t('aa_to_complete')}
                </button>
              </div>
            </div>
          ))}
          <div className="bottom-spacer"></div>
        </div>
      )}

      {page === 'collection' && (
        <div>
          <div className="tabs-row">
            <button className={`tab-btn ${tab === 'weekly' ? 'active' : ''}`} onClick={() => setTab('weekly')}>{t('aa_weekly')}</button>
            <button className={`tab-btn ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>{t('aa_daily')}</button>
          </div>
          <div className="tab-content">
            {history.length > 0 ? (
              <div className="history-list">
                {history.map((h) => (
                  <div className="mission-card" key={h._id}>
                    <div className="mission-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t('aa_mission_label')} {(h.refIndex ?? 0) + 1}</span>
                      <span className="award-val">Rs{Number(h.amount).toFixed(2)}</span>
                      <span className="stat-label">{new Date(h.claimedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <EmptySvg />
                <span className="empty-text">{t('bd_no_data')}</span>
              </div>
            )}
          </div>
          <div className="bottom-spacer"></div>
        </div>
      )}
    </div>
  );
}

export default ActivityAward;