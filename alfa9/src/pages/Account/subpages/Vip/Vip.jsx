import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './Vip.css';

const IMG = {
  cardAfter: (lvl) => `/image/vip-after${lvl}.webp`,
  lockIcon: `/image/unlocked-image.webp`,
  cardStar: (lvl) => `/image/star-${lvl}.webp`,
  benefitLevelup: `/image/level-up-reward.png`,
  benefitMonthly: `/image/monthly-reward.png`,
  benefitSafe: `/image/safe-benefits.png`,
  benefitRebate: `/image/rebate-rate.png`,
  tagCoin: `/image/REPLACEcoin.webp`,
  tagFreespin: `/image/REPLACE_freespin.webp`,
  tagSafeRate: `/image/REPLACE_saferate.webp`,
  tagRebateRate: `/image/REPLACE_rebaterate.webp`,
  gem: `/image/REPLACE_gem.webp`,
};

const VIP_LEVELS = [
  { level: 1, expReq: 60, levelUpCoins: 60, levelUpFreeSpins: 5, monthlyCoins: 20, monthlyFreeSpins: 1, safe: '0.2%', rebate: '0.3%' },
  { level: 2, expReq: 500, levelUpCoins: 200, levelUpFreeSpins: 15, monthlyCoins: 100, monthlyFreeSpins: 5, safe: '0.2%', rebate: '0.3%' },
  { level: 3, expReq: 5000, levelUpCoins: 700, levelUpFreeSpins: 50, monthlyCoins: 350, monthlyFreeSpins: 25, safe: '0.25%', rebate: '0.35%' },
  { level: 4, expReq: 50000, levelUpCoins: 2000, levelUpFreeSpins: 300, monthlyCoins: 1000, monthlyFreeSpins: 150, safe: '0.25%', rebate: '0.35%' },
  { level: 5, expReq: 200000, levelUpCoins: 7000, levelUpFreeSpins: 1000, monthlyCoins: 2500, monthlyFreeSpins: 500, safe: '0.3%', rebate: '0.4%' },
  { level: 6, expReq: 800000, levelUpCoins: 16900, levelUpFreeSpins: 2000, monthlyCoins: 7000, monthlyFreeSpins: 1500, safe: '0.3%', rebate: '0.45%' },
  { level: 7, expReq: 5000000, levelUpCoins: 70000, levelUpFreeSpins: 5000, monthlyCoins: 25000, monthlyFreeSpins: 2500, safe: '0.35%', rebate: '0.475%' },
  { level: 8, expReq: 10000000, levelUpCoins: 169000, levelUpFreeSpins: 15000, monthlyCoins: 70000, monthlyFreeSpins: 5000, safe: '0.35%', rebate: '0.5%' },
  { level: 9, expReq: 100000000, levelUpCoins: 880000, levelUpFreeSpins: 30000, monthlyCoins: 369000, monthlyFreeSpins: 15000, safe: '0.4%', rebate: '0.55%' },
  { level: 10, expReq: 2000000000, levelUpCoins: 1890000, levelUpFreeSpins: 100000, monthlyCoins: 890000, monthlyFreeSpins: 50000, safe: '0.45%', rebate: '0.6%' },
];

function getPayoutDays() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

function getCurrentLevel(exp) {
  let lvl = 0;
  for (let i = 0; i < VIP_LEVELS.length; i++) {
    if (exp >= VIP_LEVELS[i].expReq) lvl = VIP_LEVELS[i].level;
  }
  return lvl;
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function Vip() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [profileName, setProfileName] = useState('USER');
  const [exp, setExp] = useState(0);
  const currentLevel = getCurrentLevel(exp);

  const [activeIndex, setActiveIndex] = useState(Math.max(0, currentLevel - 1 >= 0 ? currentLevel : 0));
  const [activeTab, setActiveTab] = useState('history');

  const [betHistory, setBetHistory] = useState([]);

  useEffect(() => {
    apiFetch('/vip/my-status')
      .then((data) => setExp(data.exp || 0))
      .catch(() => {}); // guest / not logged in — page still renders with exp 0

    apiFetch('/vip/exp-history')
      .then((data) => {
        // API returns newest-first; reverse so slice(-20).reverse() in the render below shows newest-first again
        setBetHistory((data.history || []).slice().reverse());
      })
      .catch(() => {});
  }, []);

  const [toast, setToast] = useState({ msg: '', show: false });
  const toastTimerRef = useRef(null);

  const sliderRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    const name = localStorage.getItem('alfa9_username') || localStorage.getItem('alfa9_name');
    if (name) setProfileName(name.trim().toUpperCase());
  }, []);

  useEffect(() => {
    const targetIdx = Math.max(0, currentLevel);
    const slider = sliderRef.current;
    if (slider) {
      setTimeout(() => scrollToCard(Math.min(targetIdx, VIP_LEVELS.length - 1)), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2000);
  };

  const scrollToCard = (idx) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const cards = slider.querySelectorAll('.vip-card');
    if (cards[idx]) cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIndex(idx);
  };

  const handleSliderScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const firstCard = slider.querySelector('.vip-card');
    if (!firstCard) return;
    const cardW = firstCard.offsetWidth + 12;
    const idx = Math.round(slider.scrollLeft / cardW);
    setActiveIndex(idx);
  };

  const handleMouseDown = (e) => {
    dragState.current.isDragging = true;
    dragState.current.startX = e.pageX;
    dragState.current.startScroll = sliderRef.current.scrollLeft;
  };
  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging) return;
    sliderRef.current.scrollLeft = dragState.current.startScroll - (e.pageX - dragState.current.startX);
  };
  const handleMouseUp = () => { dragState.current.isDragging = false; };

  const v = VIP_LEVELS[activeIndex] || VIP_LEVELS[0];

  return (
    <div
      className="vip-page"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="vip-header">
        <div className="top-bar">
          <div className="back-btn" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1b044" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
          <div className="top-title">{t('vip_title')}</div>
        </div>

        <div className="profile-row">
          <div className="avatar-ring">
            <img className="avatar-img" src="/image/ava-1.webp" alt="Avatar" />
          </div>
          <div className="profile-info">
            <div className="vip-badge-row">
              <img className="vip-badge-img" src="/image/REPLACE_vip_badge.webp" alt="VIP" onError={(e) => { e.target.style.display = 'none'; }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-mid)' }}>VIP {currentLevel}</span>
            </div>
            <div className="profile-name">{profileName}</div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-val">{exp.toLocaleString()} EXP</div>
          <div className="stat-label">{t('vip_my_experience')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{getPayoutDays()} {t('vip_days')}</div>
          <div className="stat-label">{t('vip_payout_time')}</div>
        </div>
      </div>

      <div className="notice-bar">{t('vip_notice')}</div>

      <div className="card-slider-wrap">
        <div
          className="card-slider"
          ref={sliderRef}
          onScroll={handleSliderScroll}
          onMouseDown={handleMouseDown}
        >
          {VIP_LEVELS.map((lvl, i) => {
            const progress = Math.min(exp, lvl.expReq);
            const pct = Math.min((exp / lvl.expReq) * 100, 100);
            const unlocked = exp >= lvl.expReq;
            return (
              <div
                className="vip-card"
                data-level={lvl.level}
                key={lvl.level}
                onClick={() => scrollToCard(i)}
              >
                <div className="card-top">
                  <div className="card-left">
                    <div className="card-level-row">
                      <img className="card-level-icon" src={IMG.cardAfter(lvl.level)} alt={`VIP${lvl.level}`} onError={(e) => { e.target.style.display = 'none'; }} />
                      <span className="card-level-txt">VIP{lvl.level}</span>
                      <div className="card-lock-row">
                        <img className="card-lock-icon" src={IMG.lockIcon} alt="lock" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="card-lock-txt">{unlocked ? t('vip_unlocked') : t('vip_not_open_yet')}</span>
                      </div>
                    </div>
                    <div className="card-req">{t('vip_req_1')} VIP{lvl.level} {t('vip_req_2')} {formatNum(lvl.expReq)} {t('vip_req_3')}</div>
                  </div>
                  <img className="card-star-img" src={IMG.cardStar(lvl.level)} alt={`VIP${lvl.level}`} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="card-bottom">
                  <div className="card-bet-badge">{t('vip_bet_badge')}</div>
                  <div className="card-level-label">VIP{lvl.level}</div>
                  <div className="card-progress-bar">
                    <div className="card-progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="card-progress-txt">
                    <span>{formatNum(progress)}/{formatNum(lvl.expReq)}</span>
                    <span>{formatNum(lvl.expReq)} {t('vip_can_level_up')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="slider-dots">
        {VIP_LEVELS.map((_, i) => (
          <div key={i} className={`slider-dot${activeIndex === i ? ' active' : ''}`} onClick={() => scrollToCard(i)}></div>
        ))}
      </div>

      <div className="benefits-section">
        <div className="benefits-title">
          <img className="benefits-gem" src={IMG.gem} alt="gem" onError={(e) => { e.target.style.display = 'none'; }} />
          <span className="benefits-heading">VIP{v.level} {t('vip_benefits_level')}</span>
          <span className="benefits-link" onClick={() => navigate('/account/my-benefits')}>{t('vip_my_benefits_link')}</span>
        </div>

        <div className="benefit-row">
          <img className="benefit-icon" src={IMG.benefitLevelup} alt="Level up" onError={(e) => { e.target.style.opacity = '0.3'; }} />
          <div className="benefit-info">
            <div className="benefit-name">{t('vip_level_up_rewards')}</div>
            <div className="benefit-desc">{t('vip_received_once')}</div>
          </div>
          <div className="benefit-tags">
            <div className="benefit-tag gold-tag">
              <img className="benefit-tag-icon" src={IMG.tagCoin} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.levelUpCoins.toLocaleString()}
            </div>
            <div className="benefit-tag green-tag">
              <img className="benefit-tag-icon" src={IMG.tagFreespin} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.levelUpFreeSpins.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="benefit-row">
          <img className="benefit-icon" src={IMG.benefitMonthly} alt="Monthly" onError={(e) => { e.target.style.opacity = '0.3'; }} />
          <div className="benefit-info">
            <div className="benefit-name">{t('vip_monthly_reward')}</div>
            <div className="benefit-desc">{t('vip_received_monthly')}</div>
          </div>
          <div className="benefit-tags">
            <div className="benefit-tag gold-tag">
              <img className="benefit-tag-icon" src={IMG.tagCoin} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.monthlyCoins.toLocaleString()}
            </div>
            <div className="benefit-tag green-tag">
              <img className="benefit-tag-icon" src={IMG.tagFreespin} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.monthlyFreeSpins.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="benefit-row">
          <img className="benefit-icon" src={IMG.benefitSafe} alt="Safe" onError={(e) => { e.target.style.opacity = '0.3'; }} />
          <div className="benefit-info">
            <div className="benefit-name">{t('vip_safe')}</div>
            <div className="benefit-desc">{t('vip_safe_desc')}</div>
          </div>
          <div className="benefit-tags">
            <div className="benefit-tag green-tag">
              <img className="benefit-tag-icon" src={IMG.tagSafeRate} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.safe}
            </div>
          </div>
        </div>

        <div className="benefit-row">
          <img className="benefit-icon" src={IMG.benefitRebate} alt="Rebate" onError={(e) => { e.target.style.opacity = '0.3'; }} />
          <div className="benefit-info">
            <div className="benefit-name">{t('vip_rebate_rate')}</div>
            <div className="benefit-desc">{t('vip_rebate_desc')}</div>
          </div>
          <div className="benefit-tags">
            <div className="benefit-tag green-tag">
              <img className="benefit-tag-icon" src={IMG.tagRebateRate} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
              {v.rebate}
            </div>
          </div>
        </div>
      </div>

      <div className="tab-section">
        <div className="tab-bar">
          <button className={`tab-btn${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>{t('vip_history')}</button>
          <button className={`tab-btn${activeTab === 'rules' ? ' active' : ''}`} onClick={() => setActiveTab('rules')}>{t('vip_rules')}</button>
        </div>

        {activeTab === 'history' && (
          <div className="tab-content active">
            {betHistory.length === 0 ? (
              <div className="empty-state">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <rect x="20" y="15" width="60" height="70" rx="8" fill="#8B7355" opacity="0.3" />
                  <rect x="30" y="35" width="40" height="4" rx="2" fill="#8B7355" opacity="0.5" />
                  <rect x="30" y="48" width="30" height="4" rx="2" fill="#8B7355" opacity="0.5" />
                  <rect x="30" y="61" width="20" height="4" rx="2" fill="#8B7355" opacity="0.5" />
                </svg>
                <p>{t('vip_no_data')}</p>
              </div>
            ) : (
              <div>
                {betHistory.slice(-20).reverse().map((b, i) => (
                  <div className="hist-item" key={i}>
                    <div className="hist-item-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div className="hist-item-info">
                      <div className="hist-item-name">{t('vip_bet')}{b.amount.toLocaleString()}</div>
                      <div className="hist-item-time">{b.time}</div>
                    </div>
                    <div className="hist-item-exp">+{Math.floor(b.amount / 100)} EXP</div>
                  </div>
                ))}
              </div>
            )}
            <button className="view-all-btn" onClick={() => showToast(t('vip_no_more_history'))}>{t('vip_view_all')}</button>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="tab-content active">
            <div className="rules-title-block">
              <h2>{t('vip_privileges')}</h2>
              <p>{t('vip_rule_desc')}</p>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r1_title')}</div>
              <div className="rule-body">{t('vip_r1_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r2_title')}</div>
              <div className="rule-body">{t('vip_r2_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r3_title')}</div>
              <div className="rule-body">{t('vip_r3_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r4_title')}</div>
              <div className="rule-body">{t('vip_r4_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r5_title')}</div>
              <div className="rule-body">{t('vip_r5_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r6_title')}</div>
              <div className="rule-body">{t('vip_r6_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r7_title')}</div>
              <div className="rule-body">{t('vip_r7_body')}</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">{t('vip_r8_title')}</div>
              <div className="rule-body">{t('vip_r8_body')}</div>
            </div>
          </div>
        )}
      </div>

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Vip;