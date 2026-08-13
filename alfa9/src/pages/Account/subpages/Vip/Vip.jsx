import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
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
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
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
          <div className="top-title">VIP</div>
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
          <div className="stat-label">My experience</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{getPayoutDays()} Days</div>
          <div className="stat-label">Payout time</div>
        </div>
      </div>

      <div className="notice-bar">VIP level rewards are settled at 2:00 am on the 1st of every month</div>

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
                        <span className="card-lock-txt">{unlocked ? '✓ Unlocked' : 'Not open yet'}</span>
                      </div>
                    </div>
                    <div className="card-req">Upgrading VIP{lvl.level} requires {formatNum(lvl.expReq)} EXP</div>
                  </div>
                  <img className="card-star-img" src={IMG.cardStar(lvl.level)} alt={`VIP${lvl.level}`} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div className="card-bottom">
                  <div className="card-bet-badge">Bet Rs100=1EXP</div>
                  <div className="card-level-label">VIP{lvl.level}</div>
                  <div className="card-progress-bar">
                    <div className="card-progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="card-progress-txt">
                    <span>{formatNum(progress)}/{formatNum(lvl.expReq)}</span>
                    <span>{formatNum(lvl.expReq)} EXP can be leveled up</span>
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
          <span className="benefits-heading">VIP{v.level} Benefits level</span>
          <span className="benefits-link" onClick={() => navigate('/account/my-benefits')}>My Benefits ›</span>
        </div>

        <div className="benefit-row">
          <img className="benefit-icon" src={IMG.benefitLevelup} alt="Level up" onError={(e) => { e.target.style.opacity = '0.3'; }} />
          <div className="benefit-info">
            <div className="benefit-name">Level up rewards</div>
            <div className="benefit-desc">Each account can only receive 1 time</div>
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
            <div className="benefit-name">Monthly reward</div>
            <div className="benefit-desc">Each account can only receive 1 time per month</div>
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
            <div className="benefit-name">Safe</div>
            <div className="benefit-desc">Increase the extra income of the safe</div>
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
            <div className="benefit-name">Rebate rate</div>
            <div className="benefit-desc">Increase income of rebate</div>
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
          <button className={`tab-btn${activeTab === 'history' ? ' active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
          <button className={`tab-btn${activeTab === 'rules' ? ' active' : ''}`} onClick={() => setActiveTab('rules')}>Rules</button>
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
                <p>No data</p>
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
                      <div className="hist-item-name">Bet Rs{b.amount.toLocaleString()}</div>
                      <div className="hist-item-time">{b.time}</div>
                    </div>
                    <div className="hist-item-exp">+{Math.floor(b.amount / 100)} EXP</div>
                  </div>
                ))}
              </div>
            )}
            <button className="view-all-btn" onClick={() => showToast('No more history')}>View All</button>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="tab-content active">
            <div className="rules-title-block">
              <h2>VIP privileges</h2>
              <p>VIP rule description</p>
            </div>
            <div className="rule-block">
              <div className="rule-header">Upgrade standard</div>
              <div className="rule-body">The VIP member&apos;s experience points (valid bet amount) that meet the requirements of the corresponding rank will be promoted to the corresponding VIP level. The member&apos;s VIP data statistics period starts from 00:00:00 days VIP system launched. VIP level calculation is refreshed every 10 minutes! The corresponding experience level is calculated according to valid odds 100:1 — Bet Rs100 = 1 EXP.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Upgrade order</div>
              <div className="rule-body">The VIP level that meets the corresponding requirements can be promoted by one level every day, but the VIP level cannot be promoted by leapfrogging.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Level maintenance</div>
              <div className="rule-body">VIP members need to complete the maintenance requirements of the corresponding level within 30 days after the &quot;VIP level change&quot;; if the promotion is completed during this period, the maintenance requirements will be calculated according to the current level.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Downgrade standard</div>
              <div className="rule-body">If a VIP member fails to complete the corresponding level maintenance requirements within 30 days, the system will automatically deduct the experience points corresponding to the level. If the experience points are insufficient, the level will be downgraded, and the corresponding discounts will be adjusted to the downgraded level accordingly.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Upgrade Bonus</div>
              <div className="rule-body">The upgrade benefits can be claimed on the VIP page after the member reaches the VIP membership level, and each VIP member can only get the upgrade reward of each level once.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Monthly reward</div>
              <div className="rule-body">VIP members can earn the highest level of VIP rewards once a month. Can only be received once a month. Prizes cannot be accumulated. Any unclaimed rewards will be refreshed on the next settlement day.</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Real-time rebate</div>
              <div className="rule-body">The higher the VIP level, the higher the return rate. All the games are calculated in real time and can be self-rewarded!</div>
            </div>
            <div className="rule-block">
              <div className="rule-header">Safe</div>
              <div className="rule-body">VIP members who have reached the corresponding level will get additional benefits on safe deposit based on the member&apos;s VIP level.</div>
            </div>
          </div>
        )}
      </div>

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Vip;