import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import Footer from '../../components/Footer/Footer.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Promotion.css';

const INVITE_CODE = '856761184061';

const MENU_ITEMS = [
  {
    labelKey: 'promo_partner_rewards',
    to: '/promotion/partner-rewards',
    gradId: 'ig1',
    icon: (
      <>
        <circle cx="9" cy="7" r="4" stroke="url(#ig1)" strokeWidth="2" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="url(#ig1)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="11" r="2" stroke="url(#ig1)" strokeWidth="2" />
        <path d="M23 21v-1a2 2 0 0 0-2-2h-2" stroke="url(#ig1)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    labelKey: 'promo_subordinate_data',
    to: '/promotion/subordinate-data',
    gradId: 'ig3',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="url(#ig3)" strokeWidth="2" />
        <path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h6" stroke="url(#ig3)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    labelKey: 'promo_commission_detail',
    to: '/promotion/commission-detail',
    gradId: 'ig4',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="url(#ig4)" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="url(#ig4)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    labelKey: 'promo_invitation_rules',
    to: '/promotion/invitation-rules',
    gradId: 'ig5',
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="url(#ig5)" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 2v6h6M8 13h8M8 17h5" stroke="url(#ig5)" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    labelKey: 'promo_agent_customer_service',
    to: '/customer-service',
    gradId: 'ig6',
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#ig6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="10" r="1" fill="url(#ig6)" />
        <circle cx="12" cy="10" r="1" fill="url(#ig6)" />
        <circle cx="15" cy="10" r="1" fill="url(#ig6)" />
      </>
    ),
  },
  {
    labelKey: 'promo_rebate_ratio',
    to: '/promotion/rebate-ratio',
    gradId: 'ig7',
    icon: (
      <>
        <ellipse cx="12" cy="17" rx="7" ry="4" stroke="url(#ig7)" strokeWidth="2" />
        <path d="M5 17V7a7 4 0 0 1 14 0v10" stroke="url(#ig7)" strokeWidth="2" />
        <path d="M5 12a7 4 0 0 0 14 0" stroke="url(#ig7)" strokeWidth="2" />
      </>
    ),
  },
];

const STATS_ROWS = [
  { labelKey: 'promo_number_of_register', vals: [0, 0], gold: false },
  { labelKey: 'promo_deposit_number', vals: [0, 0], gold: true },
  { labelKey: 'promo_deposit_amount', vals: [0, 0], gold: true },
  { labelKey: 'promo_first_deposit_people', vals: [0, 0], gold: false },
];

const PROMO_DATA = [
  { labelKey: 'promo_this_week', val: 0, gold: false },
  { labelKey: 'promo_total_commission', val: 0, gold: true },
  { labelKey: 'promo_direct_subordinate', val: 0, gold: false },
  { labelKey: 'promo_total_team_subordinates', val: 0, gold: false },
];

function Promotion() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [inviteCode, setInviteCode] = useState(INVITE_CODE);
  const [statsRows, setStatsRows] = useState(STATS_ROWS);
  const [promoData, setPromoData] = useState(PROMO_DATA);

  useEffect(() => {
    apiFetch('/promotion/summary')
      .then((data) => {
        setInviteCode(data.inviteCode || INVITE_CODE);
        setStatsRows([
          { labelKey: 'promo_number_of_register', vals: [data.stats.register.direct, data.stats.register.team], gold: false },
          { labelKey: 'promo_deposit_number', vals: [data.stats.depositNumber.direct, data.stats.depositNumber.team], gold: true },
          { labelKey: 'promo_deposit_amount', vals: [data.stats.depositAmount.direct, data.stats.depositAmount.team], gold: true },
          { labelKey: 'promo_first_deposit_people', vals: [data.stats.firstDeposit.direct, data.stats.firstDeposit.team], gold: false },
        ]);
        setPromoData([
          { labelKey: 'promo_this_week', val: data.promoData.thisWeekCommission, gold: false },
          { labelKey: 'promo_total_commission', val: data.promoData.totalCommission, gold: true },
          { labelKey: 'promo_direct_subordinate', val: data.promoData.directSubordinateCount, gold: false },
          { labelKey: 'promo_total_team_subordinates', val: data.promoData.teamSubordinateCount, gold: false },
        ]);
      })
      .catch(() => {}); // guest — page still renders with zeros
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const copyLink = () => {
    // Must point at /auth (the real register route) — the root "/" is the
    // Landing page, which never reads the `ref` param, so links copied from
    // here previously dropped the referral code entirely.
    const url = `${window.location.origin}/auth?ref=${inviteCode}`;
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('✓ ' + t('promo_toast_link_copied')))
      .catch(() => showToast('✓ ' + t('promo_toast_link_copied')));
  };

  const copyCode = () => {
    navigator.clipboard
      .writeText(inviteCode)
      .then(() => showToast(`✓ ${inviteCode} — ${t('promo_toast_code_copied')}`))
      .catch(() => showToast('✓ ' + t('promo_toast_code_copied')));
  };

  return (
    <div className="promotion-page">
      {/* HEADER */}
      <div className="top-bar">
        <span className="top-title">{t('promo_agency')}</span>
        <Link to="/promotion/new-subordinates" className="header-icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </Link>
      </div>

      {/* HERO */}
      <div className="hero-section">
        <img className="hero-bg" src="/image/prmotionbg.png" alt="" />
        <div className="hero-ring"></div>
        <div className="hero-shine"></div>
        <div className="hero-content">
          <div className="hero-crown">
            <svg width="30" height="24" viewBox="0 0 24 20" fill="none">
              <path d="M2 6L6.5 10L12 3L17.5 10L22 6L20 17H4L2 6Z" fill="#140A03" fillOpacity="0.85" />
              <circle cx="2" cy="4.5" r="1.8" fill="#140A03" fillOpacity="0.85" />
              <circle cx="12" cy="1.8" r="1.8" fill="#140A03" fillOpacity="0.85" />
              <circle cx="22" cy="4.5" r="1.8" fill="#140A03" fillOpacity="0.85" />
            </svg>
          </div>
          <div className="hero-eyebrow">{t('promo_vip_earnings')}</div>
          <div className="hero-amount-row">
            <span className="hero-currency">Rs</span>
            <span className="hero-amount">0</span>
          </div>
          <div className="commission-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 20V10M18 20V4M6 20v-6" />
            </svg>
            {t('promo_yesterday_commission')}
          </div>
          <div className="commission-hint">{t('promo_upgrade_hint')}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-wrap">
        <button className={`tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>
          {t('promo_direct_subordinates')}
        </button>
        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
          {t('promo_team_subordinates')}
        </button>
      </div>

      {/* STATS */}
      <div className="stats-card">
        {statsRows.map((row) => (
          <div className="stats-row" key={row.label}>
            {row.vals.map((v, i) => (
              <div className="stat-cell" key={i}>
                <div className={`stat-num ${row.gold ? 'gold' : ''}`}>{v}</div>
                <div className="stat-label">{t(row.labelKey)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* COPY LINK BTN */}
      <button className="copy-link-btn" onClick={copyLink}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {t('promo_copy_invitation_link')}
      </button>

      {/* MENU LIST */}
      <div className="menu-section">
        {MENU_ITEMS.slice(0, 2).map((item) => (
          <MenuLink key={item.label} item={item} />
        ))}

        <div className="menu-item" onClick={copyCode}>
          <div className="menu-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="url(#ig2)" strokeWidth="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="url(#ig2)" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="ig2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF3CD" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="menu-label">{t('promo_copy_invitation_code')}</span>
          <span className="menu-extra">{inviteCode}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </div>

        {MENU_ITEMS.slice(2).map((item) => (
          <MenuLink key={item.label} item={item} />
        ))}
      </div>

      {/* PROMOTION DATA */}
      <div className="promo-data-wrap">
        <div className="section-title-row">
          <div className="section-title-bar"></div>
          <span className="section-title-text">{t('promo_promotion_data')}</span>
        </div>
        <div className="promo-data-card">
          <div className="promo-data-grid">
            {promoData.map((d) => (
              <div className="pd-cell" key={d.label}>
                <div className={`pd-num ${d.gold ? 'gold' : ''}`}>{d.val}</div>
                <div className="pd-label">{t(d.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-spacer"></div>

      {/* shared gradient defs used by menu icons above */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ig1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="ig3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="ig4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="ig5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="ig6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="ig7" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3CD" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
      </svg>

      {toast.show && <div className="toast show">{toast.msg}</div>}

      <Footer active="promotion" />
    </div>
  );
}

function MenuLink({ item }) {
  const { t } = useLanguage();
  return (
    <Link to={item.to} className="menu-item">
      <div className="menu-icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          {item.icon}
        </svg>
      </div>
      <span className="menu-label">{t(item.labelKey)}</span>
      <span className="menu-arrow">›</span>
    </Link>
  );
}

export default Promotion;