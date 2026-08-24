import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './VipRewards.css';

function VipRewards() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="ad-page">
      <header className="ad-header">
        <button className="ad-back" onClick={() => navigate(-1)} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="ad-title">{t('act_details_header')}</h1>
      </header>

      <div className="ad-banner">
        <img src="/image/activity-7.png" alt="VIP REWARDS AND BENEFITS" />
      </div>

      <div className="ad-section-title">{t('act_vip_rewards')}</div>

      <div className="ad-body">
        {/* Placeholder — replace with the real info graphic for this activity */}
        <img src="/image/alfa-coming-soon.png" alt="VIP REWARDS AND BENEFITS details" />
      </div>
    </div>
  );
}

export default VipRewards;