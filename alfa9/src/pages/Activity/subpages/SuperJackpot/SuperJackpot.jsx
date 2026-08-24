import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './SuperJackpot.css';

const TITLE_KEYS = { main: 'act_super_jackpot', rule: 'sj_rule', star: 'sj_winning_star' };

const WINNERS = [
  { rank: 1, medal: 'gold', avatar: '/image/winner1.webp', name: '923***545', mult: '80X WIN', game: 'Boom Legend', wins: '80X', bonus: 'Rs2.00', time: '2026-06-04 02:21:00' },
  { rank: 2, medal: 'silver', avatar: '/image/winner6.webp', name: '923***447', mult: '62X WIN', game: 'Mines', wins: '62X', bonus: 'Rs50.00', time: '2026-06-02 22:10:00' },
  { rank: 3, medal: 'bronze', avatar: '/image/mem1.webp', name: '923***312', mult: '55X WIN', game: 'Boom Legend', wins: '55X', bonus: 'Rs20.00', time: '2026-06-03 14:45:00' },
  { rank: 4, medal: 'plain', avatar: '/image/mem3.webp', name: '923***881', mult: '38X WIN', game: 'Fortune Tiger', wins: '38X', bonus: 'Rs10.00', time: '2026-06-03 11:30:00' },
  { rank: 5, medal: 'plain', avatar: '/image/winner2.webp', name: '923***928', mult: '25X WIN', game: 'Fortune Gems 2', wins: '25X', bonus: 'Rs5.00', time: '2026-06-04 02:21:00' },
  { rank: 6, medal: 'plain', avatar: '/image/winner2.webp', name: '923***674', mult: '24X WIN', game: 'Fortune Gems', wins: '24X', bonus: 'Rs5.00', time: '2026-06-04 02:21:00' },
];

const BONUS_TABLE = [
  ['50X-99999X', 'Rs10000-Rs99999', 'Rs1,000.00'], ['50X-99999X', 'Rs1000-Rs99999', 'Rs500.00'],
  ['50X-99999X', 'Rs100-Rs999', 'Rs50.00'], ['50X-99999X', 'Rs10-Rs99', 'Rs20.00'],
  ['50X-99999X', 'Rs1-Rs9.9', 'Rs2.00'], ['35X-49X', 'Rs10000-Rs99999', 'Rs500.00'],
  ['35X-49X', 'Rs1000-Rs9999', 'Rs200.00'], ['35X-49X', 'Rs100-Rs999', 'Rs30.00'],
  ['35X-49X', 'Rs10-Rs99', 'Rs10.00'], ['35X-49X', 'Rs1-Rs9.9', 'Rs1.00'],
  ['20X-34X', 'Rs10000-Rs99999', 'Rs150.00'], ['20X-34X', 'Rs1000-Rs9999', 'Rs50.00'],
  ['20X-34X', 'Rs100-Rs999', 'Rs10.00'], ['20X-34X', 'Rs10-Rs99', 'Rs5.00'],
  ['20X-34X', 'Rs1-Rs9.9', 'Rs0.50'],
];

function SuperJackpot() {
  const { t } = useLanguage();
  const [page, setPage] = useState('main'); // 'main' | 'rule' | 'star'
  const navigate = useNavigate();

  return (
    <div className="super-jackpot-page">
      <div className="top-bar">
        <Link to="/activity" className="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="rgb(197, 147, 27)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="top-title">{t(TITLE_KEYS[page])}</span>
      </div>

      <div className="hero-banner">
        <div className="hero-bg-layer"><img src="/image/jackpotbg.webp" alt="" onError={(e) => { e.target.style.display = 'none'; }} /></div>
        <div className="hero-rays"></div>
        <div className="hero-scrim"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A2600" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 5H4a2 2 0 0 0 0 4h1M17 5h3a2 2 0 0 1 0 4h-1" /></svg>
            {t('sj_slots_bonus')}
          </div>
          <div className="hero-coin-wrap">
            <svg width="66" height="66" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="coinGrad" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#FFF3CD" /><stop offset="40%" stopColor="#F3DA95" /><stop offset="70%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#7A581C" /></radialGradient>
                <linearGradient id="coinRim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFF3CD" /><stop offset="50%" stopColor="#C9971F" /><stop offset="100%" stopColor="#7A581C" /></linearGradient>
              </defs>
              <ellipse cx="50" cy="88" rx="30" ry="5" fill="#000" opacity="0.35" />
              <circle cx="50" cy="50" r="42" fill="url(#coinRim)" />
              <circle cx="50" cy="50" r="35" fill="url(#coinGrad)" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#7A581C" strokeWidth="1.5" opacity="0.5" />
              <text x="50" y="60" textAnchor="middle" fontSize="30" fontWeight="900" fill="#5A3F14" fontFamily="Segoe UI">7</text>
              <circle cx="35" cy="34" r="5" fill="#FFF3CD" opacity="0.55" />
            </svg>
          </div>
          <div className="hero-title">{t('act_super_jackpot')}</div>
          <div className="hero-desc-wrap">
            <div className="hero-desc">{t('sj_hero_desc_1')}<br />{t('sj_hero_desc_2')}</div>
          </div>
        </div>
      </div>

      <button className="receive-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
        {t('sj_receive_batches')}
      </button>

      {/* ACTION TABS — icons now use currentColor so they flip to a dark
          tone on the active (solid-gold) tab for proper contrast, and
          stay soft-gold with a subtle glow on inactive tabs. */}
      <div className="action-btns">
        <button className={`action-btn ${page === 'main' ? 'active-tab' : ''}`} onClick={() => setPage('main')}>
          <span className="action-btn-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <rect x="6.5" y="7.5" width="2.6" height="7" rx="1" fill="currentColor" stroke="none" />
              <rect x="10.7" y="7.5" width="2.6" height="7" rx="1" fill="currentColor" stroke="none" />
              <rect x="14.9" y="7.5" width="2.6" height="7" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
          {t('sj_my_jackpot')}
        </button>
        <button className={`action-btn ${page === 'rule' ? 'active-tab' : ''}`} onClick={() => setPage('rule')}>
          <span className="action-btn-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h8.5L19 6.5V21H7z" strokeLinejoin="round" />
              <path d="M15.5 3v3.5H19" strokeLinejoin="round" />
              <path d="M9.5 11h6M9.5 14.3h6M9.5 17.6h3.8" strokeWidth="1.6" />
            </svg>
          </span>
          {t('sj_rule')}
        </button>
        <button className={`action-btn ${page === 'star' ? 'active-tab' : ''}`} onClick={() => setPage('star')}>
          <span className="action-btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2.5l2.9 6.3 6.8.6-5.2 4.6 1.6 6.7L12 17.1l-6.1 3.6 1.6-6.7-5.2-4.6 6.8-.6z" />
            </svg>
          </span>
          {t('sj_winning_star')}
        </button>
      </div>

      <div className="gold-divider"></div>

      {page === 'main' && (
        <div>
          <div className="empty-card">
            <svg className="empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="chestGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F3DA95" /><stop offset="50%" stopColor="#C9971F" /><stop offset="100%" stopColor="#7A581C" /></linearGradient>
                <linearGradient id="coinStackGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFF3CD" /><stop offset="100%" stopColor="#B8860B" /></linearGradient>
              </defs>
              <ellipse cx="100" cy="142" rx="78" ry="10" fill="#000" opacity="0.3" />
              <rect x="65" y="70" width="70" height="55" rx="6" fill="url(#chestGrad)" opacity="0.9" />
              <rect x="65" y="70" width="70" height="14" rx="4" fill="#F3DA95" />
              <circle cx="100" cy="90" r="7" fill="#7A581C" />
              <ellipse cx="55" cy="120" rx="20" ry="8" fill="url(#coinStackGrad)" />
              <ellipse cx="55" cy="113" rx="20" ry="8" fill="url(#coinStackGrad)" opacity="0.85" />
              <ellipse cx="145" cy="122" rx="18" ry="7" fill="url(#coinStackGrad)" />
              <ellipse cx="145" cy="116" rx="18" ry="7" fill="url(#coinStackGrad)" opacity="0.85" />
              <circle cx="100" cy="50" r="16" fill="url(#coinStackGrad)" opacity="0.35" />
              <circle cx="130" cy="45" r="9" fill="#F3DA95" opacity="0.3" />
            </svg>
            <div className="empty-text">{t('sj_no_jackpot_yet')}</div>
          </div>
          <button className="go-bet-btn" onClick={() => navigate('/home')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" /><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            {t('sj_go_bet')}
          </button>
        </div>
      )}

      {page === 'rule' && (
        <div>
          <div className="warning-box">
            <div className="warning-icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            </div>
            <span className="warning-text">{t('sj_warning')}</span>
          </div>

          <div className="bonus-section">
            <div className="bonus-section-title">
              <div className="bonus-section-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 15.5c.5.7 1.3 1 2.5 1s2.2-.5 2.2-1.4c0-1-1-1.3-2.3-1.6-1.6-.4-2.6-.9-2.6-2.1 0-1 1-1.6 2.3-1.6 1 0 1.8.3 2.4 1" /><line x1="12" y1="6.5" x2="12" y2="8" /><line x1="12" y1="16.5" x2="12" y2="18" /></svg>
              </div>
              {t('sj_bonus_table')}
            </div>
            <div className="bonus-table-wrap">
              <table className="bonus-table">
                <thead><tr><th>{t('sj_winning_rate')}</th><th>{t('sj_bet_amount')}</th><th>{t('sj_bonus_col')}</th></tr></thead>
                <tbody>
                  {BONUS_TABLE.map(([rate, bet, bonus], i) => (
                    <tr key={i}><td>{rate}</td><td>{bet}</td><td>{bonus}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="footer-note">
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></span>
            <span className="note-text">{t('sj_footer_note')}</span>
          </div>

          <button className="contact-btn" onClick={() => navigate('/customer-service')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            {t('sj_contact_service')}
          </button>
        </div>
      )}

      {page === 'star' && (
        <div>
          <div className="star-lead-note">{t('sj_top_winners')}</div>
          <div className="cards-wrap">
            {WINNERS.map((w) => (
              <div className={`winner-card ${w.rank === 1 ? 'rank-1' : ''}`} key={w.rank}>
                <div className="winner-top">
                  <div className={`medal ${w.medal}`}>{w.rank}</div>
                  <img src={w.avatar} className="winner-avatar" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                  <div className="winner-name-wrap">
                    <span className="winner-name">{w.name}</span>
                    <span className="winner-multiplier-badge">{w.mult}</span>
                  </div>
                </div>
                <div className="info-row"><span className="info-label">{t('sj_game_name')}</span><span className="info-val">{w.game}</span></div>
                <div className="info-row"><span className="info-label">{t('sj_number_of_wins')}</span><span className="info-val orange">{w.wins}</span></div>
                <div className="info-row"><span className="info-label">{t('sj_bonus_row')}</span><span className="info-val red">{w.bonus}</span></div>
                <div className="info-row"><span className="info-label">{t('sj_winning_time')}</span><span className="info-val">{w.time}</span></div>
              </div>
            ))}
          </div>
          <div className="bottom-spacer"></div>
        </div>
      )}
    </div>
  );
}

export default SuperJackpot;