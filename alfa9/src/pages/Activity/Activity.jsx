import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import Footer from '../../components/Footer/Footer.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Activity.css';

const ICON_ROW1 = [
  { to: '/activity/activity-award', img: '/image/Reward.webp', key: 'act_activity_award' },
  { to: '/activity/invitation-bonus', img: '/image/Invite Bouns.webp', key: 'invite' },
  { to: '/activity/betting-rebate', img: '/image/Betting rebate.webp', key: 'act_betting_rebate' },
  { to: '/activity/super-jackpot', img: '/image/Super Jackpot.webp', key: 'act_super_jackpot' },
];

const PROMO_CARDS = [
  { to: '/activity/new-member-deposit', img: '/image/activity-1.png', key: 'act_new_member_deposit' },
  { to: '/activity/other-platform', img: '/image/activity-8.png', key: 'act_other_platform' },
  { to: '/activity/vip-rewards', img: '/image/activity-7.png', key: 'act_vip_rewards' },
  { to: '/activity/aviator-award', img: '/image/activity-6.png', key: 'act_aviator_award' },
  { to: '/activity/win-streak', img: '/image/activity-5.png', key: 'act_win_streak' },
  { to: '/activity/creative-video', img: '/image/activity-3.png', key: 'act_creative_video' },
  { to: '/activity/lucky10-days', img: '/image/activity-4.png', key: 'act_lucky10_days' },
  { to: '/activity/additional-rewards', img: '/image/activity-2.png', key: 'act_additional_rewards' },
];

function Activity() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [summary, setSummary] = useState({ todayBonus: 0, totalBonus: 0 });

  useEffect(() => {
    apiFetch('/activity/summary')
      .then((data) => setSummary({ todayBonus: data.todayBonus || 0, totalBonus: data.totalBonus || 0 }))
      .catch(() => {});
  }, []);

  return (
    <div className="activity-page">
      {/* BONUS TOP SECTION */}
      <div className="bonus-top">
        <div className="bonus-logo">
          <img src="/image/ultraalf9.png" alt="Alfa9" />
        </div>
        <div className="bonus-row">
          <div className="bonus-cell">
            <div className="bonus-label">{t('act_todays_bonus')}</div>
            <div className="bonus-amount">Rs{summary.todayBonus.toFixed(2)}</div>
          </div>
          <div className="bonus-divider"></div>
          <div className="bonus-cell">
            <div className="bonus-label">{t('act_total_bonus')}</div>
            <div className="bonus-amount">Rs{summary.totalBonus.toFixed(2)}</div>
          </div>
        </div>
        <button className="bonus-btn" onClick={() => navigate('/activity/bonus-details')}>{t('act_bonus_details')}</button>
      </div>

      {/* ICON GRID */}
      <div className="icon-section">
        <div className="icon-row">
          {ICON_ROW1.map((item) => (
            <Link to={item.to} className="icon-item" key={item.to}>
              <img src={item.img} className="icon-img" alt={t(item.key)} />
              <span className="icon-label">
                {item.key === 'invite' ? (
                  <>{t('act_invitation_bonus_1')}<br />{t('act_invitation_bonus_2')}</>
                ) : (
                  t(item.key)
                )}
              </span>
            </Link>
          ))}
        </div>
        <div className="icon-row-single">
          <Link to="/spin" className="icon-item">
            <img src="/image/Invite Wheel.webp" className="icon-img" alt="Invite Wheel" />
            <span className="icon-label">{t('act_invite_wheel')}</span>
          </Link>
        </div>
      </div>

      {/* PROMO CARDS */}
      <div className="promo-section">
        <div className="promo-row-2">
          <Link to="/gifts" className="promo-card">
            <img src="/image/Gift.png" className="promo-img" style={{ height: '120px' }} alt="Gifts" />
            <div className="promo-title" style={{ fontSize: '14px', fontWeight: 800 }}>{t('acc_gifts')}</div>
            <div className="promo-desc">{t('act_gifts_desc')}</div>
          </Link>
          <Link to="/activity/attendance-bonus" className="promo-card">
            <img src="/image/Attendence.png" className="promo-img" style={{ height: '120px' }} alt="Attendance bonus" />
            <div className="promo-title" style={{ fontSize: '14px', fontWeight: 800 }}>{t('act_attendance_bonus')}</div>
            <div className="promo-desc">{t('act_attendance_desc')}</div>
          </Link>
        </div>

        {PROMO_CARDS.map((card) => (
          <Link to={card.to} className="promo-card" key={card.to}>
            <img src={card.img} className="promo-img" alt={t(card.key)} />
            <div className="promo-title">{t(card.key)}</div>
          </Link>
        ))}
      </div>

      <div className="bottom-spacer"></div>

      <Footer active="activity" />
    </div>
  );
}

export default Activity;