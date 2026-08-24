import { useState, useEffect } from 'react';
import { apiFetch } from '../../../../utils/api';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './InvitationBonus.css';

const rechargeMap = (i) => (i <= 5 ? 2000 : i <= 10 ? 2000 : i <= 15 ? 3000 : i <= 20 ? 3000 : i <= 25 ? 5000 : i <= 30 ? 5000 : i <= 35 ? 8000 : i <= 40 ? 10000 : 15000);
const amountMap = (i) => (i <= 5 ? 100 : i <= 10 ? 120 : i <= 15 ? 150 : i <= 20 ? 200 : i <= 25 ? 250 : i <= 30 ? 300 : i <= 35 ? 400 : i <= 40 ? 500 : 600);

const RULES_DATA = [
  [1, 2000, 100], [2, 2000, 100], [3, 2000, 120], [5, 2000, 200], [7, 2000, 240],
  [10, 2000, 320], [13, 2000, 340], [16, 2000, 360], [20, 2000, 480], [25, 2000, 560],
  [30, 2000, 600], [35, 2000, 640], [40, 2000, 680], [45, 2000, 720], [50, 2000, 760],
  [60, 2000, 1200], [70, 2000, 1300], [80, 2000, 1400], [100, 2000, 2400], [120, 2000, 2800],
  [150, 2000, 3600], [200, 2000, 6000], [250, 2000, 6400], [300, 2000, 6800],
  [500, 2000, 10000], [700, 2000, 18000], [1000, 2000, 30000], [1200, 2000, 40000],
  [1500, 2000, 60000], [2000, 2000, 80000], [2500, 2000, 100000], [3000, 2000, 130000],
  [4000, 2000, 160000], [5000, 2000, 190000], [7000, 2000, 220000], [10000, 2000, 300000],
  [12000, 2000, 330000], [15000, 2000, 400000], [18000, 2000, 450000],
  [20000, 2000, 600000], [25000, 2000, 1000000],
];

const PAGE_TITLE_KEYS = { main: 'act_invitation_bonus_1', rules: 'ib_reward_rules', record: 'ib_record' };
const HERO_TITLE_KEYS = { main: 'ib_hero_main_title', rules: 'ib_hero_rules_title', record: 'ib_hero_record_title' };
const HERO_DESC_KEYS = { main: 'ib_hero_main_desc', rules: 'ib_hero_rules_desc', record: 'ib_hero_record_desc' };

function RecordEmptySvg() {
  return (
    <svg className="record-empty-svg" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function InvitationBonus() {
  const { t } = useLanguage();
  const [page, setPage] = useState('main'); // 'main' | 'rules' | 'record'
  const [bonusCards, setBonusCards] = useState(
    Array.from({ length: 45 }, (_, idx) => {
      const i = idx + 1;
      return { i, r: rechargeMap(i), a: amountMap(i), inviteesProgress: 0, depositProgress: 0, eligible: false, claimed: false };
    })
  );

  const loadMilestones = () => {
    apiFetch('/activity/invitation-bonus/status')
      .then((data) => {
        setBonusCards((data.milestones || []).map((m) => ({
          i: m.milestone, r: m.requiredPerPerson, a: m.rewardAmount,
          inviteesProgress: m.inviteesProgress, depositProgress: m.depositProgress,
          eligible: m.eligible, claimed: m.claimed
        })));
      })
      .catch(() => {});
  };

  useEffect(() => { loadMilestones(); }, []);

  const claimMilestone = (milestone) => {
    apiFetch('/activity/invitation-bonus/claim', { method: 'POST', body: { milestone } })
      .then(() => loadMilestones())
      .catch((err) => alert(err.message || t('ib_toast_requirements')));
  };

  return (
    <div className="invitation-bonus-page">
      <div className="top-bar">
        {page === 'main' ? (
          <Link to="/activity" className="back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        ) : (
          <button className="back-btn" onClick={() => setPage('main')} style={{ background: 'rgba(255,255,255,0.08)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
        <span className="top-title">{page === 'main' ? t('act_invitation_bonus_1') + ' ' + t('act_invitation_bonus_2') : t(PAGE_TITLE_KEYS[page])}</span>
      </div>

      <div className="hero-banner">
        <img src="/image/bouns.webp" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="hero-overlay">
          <div className="hero-title">{t(HERO_TITLE_KEYS[page])}</div>
          <div className="hero-desc">{t(HERO_DESC_KEYS[page])}</div>
          {page === 'main' && (
            <>
              <div className="hero-date-label">{t('ib_activity_date')}</div>
              <div className="hero-date">2026-05-28 — 2031-01-01</div>
            </>
          )}
        </div>
      </div>

      {page === 'main' && (
        <div>
          <div className="icon-btns">
            <button className="icon-btn" onClick={() => setPage('rules')}>
              <div className="icon-box" style={{ background: 'linear-gradient(135deg,#1C4A8C,#2E6BBF)' }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="3" width="22" height="28" rx="3" fill="#EAF4FF" />
                  <rect x="10" y="10" width="14" height="2" rx="1" fill="#2E6BBF" opacity="0.5" />
                  <rect x="10" y="14.5" width="14" height="1.5" rx="0.75" fill="#2E6BBF" opacity="0.35" />
                  <rect x="10" y="18.5" width="10" height="1.5" rx="0.75" fill="#2E6BBF" opacity="0.35" />
                  <circle cx="24" cy="25" r="6" fill="#1DB97A" />
                  <path d="M21 25 L23 27 L27 23" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="icon-btn-label">{t('ib_reward_rules')}</span>
            </button>

            <button className="icon-btn" onClick={() => setPage('record')}>
              <div className="icon-box" style={{ background: 'linear-gradient(135deg,#0E6655,#1DB97A)' }}>
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="22" height="26" rx="3" fill="#1DB97A" />
                  <rect x="12" y="3" width="10" height="6" rx="2" fill="#0D5C4A" />
                  <rect x="14" y="4.5" width="6" height="3" rx="1" fill="#1DB97A" opacity="0.6" />
                  <rect x="22" y="6" width="6" height="10" rx="1" fill="#F0A020" />
                  <path d="M22 16 L25 19 L28 16" fill="#0E6655" />
                  <rect x="10" y="16" width="9" height="1.8" rx="0.9" fill="rgba(255,255,255,0.45)" />
                  <rect x="10" y="20" width="12" height="1.8" rx="0.9" fill="rgba(255,255,255,0.3)" />
                  <rect x="10" y="24" width="7" height="1.8" rx="0.9" fill="rgba(255,255,255,0.2)" />
                </svg>
              </div>
              <span className="icon-btn-label">{t('ib_record')}</span>
            </button>
          </div>

          <div className="cards-wrap">
            {bonusCards.map(({ i, r, a, inviteesProgress, depositProgress, eligible, claimed }) => (
              <div className="bonus-card" key={i}>
                <div className="bonus-header">
                  <div className="bonus-tag">
                    <span className="bonus-tag-main">{t('ib_bonus_tag')}</span>
                    <span className="bonus-tag-num">{i}</span>
                    <div className="bonus-tag-x">
                      <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L8 8M8 2L2 8" stroke="rgba(255,243,205,0.7)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </div>
                  </div>
                  <span className="bonus-amount">Rs{a}.00</span>
                </div>
                <div className="bonus-body">
                  <div className="info-row"><span className="info-label">{t('ib_number_of_invitees')}</span><span className="info-val">{i}</span></div>
                  <div className="info-row"><span className="info-label">{t('ib_recharge_per_people')}</span><span className="info-val gold">Rs{r.toLocaleString()}.00</span></div>
                  <hr className="divider" />
                  <div className="progress-row">
                    <div className="progress-cell"><div className="progress-frac">{inviteesProgress} / {i}</div><div className="progress-lbl">{t('ib_number_of_invitees')}</div></div>
                    <div className="progress-cell"><div className="progress-frac">{depositProgress} / {i}</div><div className="progress-lbl">{t('ib_deposit_number')}</div></div>
                  </div>
                  <button
                    className={claimed ? 'unfinished-btn' : eligible ? 'unfinished-btn eligible' : 'unfinished-btn'}
                    disabled={!eligible || claimed}
                    onClick={() => claimMilestone(i)}
                  >
                    {claimed ? t('ib_claimed') : eligible ? t('ib_claim') : t('ib_unfinished')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bottom-spacer"></div>
        </div>
      )}

      {page === 'rules' && (
        <div>
          <div className="rules-info-box">
            <div className="rules-info-text">
              {t('ib_rules_info')}<br />
              {t('ib_rules_info_2')}
            </div>
          </div>
          <div className="rules-table-wrap">
            <table className="rules-table">
              <thead><tr><th>{t('ib_invite_account')}</th><th>{t('ib_deposit_amount')}</th><th>{t('ib_bonus_col')}</th></tr></thead>
              <tbody>
                {RULES_DATA.map(([p, d, b], idx) => (
                  <tr key={idx}>
                    <td>{p}{t('ib_people_suffix')}</td>
                    <td>Rs{d.toLocaleString()}.00</td>
                    <td>Rs{b.toLocaleString()}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rules-section-header"><span className="rules-section-title">{t('ib_rules_header')}</span></div>
          <div className="rules-points">
            <div className="rules-point"><span className="rules-diamond">◆</span><span className="rules-point-text">{t('ib_rule_1')}</span></div>
            <div className="rules-point"><span className="rules-diamond">◆</span><span className="rules-point-text">{t('ib_rule_2')}</span></div>
            <div className="rules-point"><span className="rules-diamond">◆</span><span className="rules-point-text">{t('ib_rule_3')}</span></div>
            <div className="rules-point"><span className="rules-diamond">◆</span><span className="rules-point-text">{t('ib_rule_4')}</span></div>
          </div>
          <div className="bottom-spacer"></div>
        </div>
      )}

      {page === 'record' && (
        <div>
          <div className="record-empty">
            <RecordEmptySvg />
            <div className="record-empty-text">{t('ib_no_more')}</div>
          </div>
          <div className="bottom-spacer"></div>
        </div>
      )}
    </div>
  );
}

export default InvitationBonus;