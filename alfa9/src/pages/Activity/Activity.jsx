import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import Footer from '../../components/Footer/Footer.jsx';
import './Activity.css';

const ICON_ROW1 = [
  { to: '/activity/activity-award', img: '/image/Reward.webp', label: 'Activity Award' },
  { to: '/activity/invitation-bonus', img: '/image/Invite Bouns.webp', label: <>Invitation<br />bonus</> },
  { to: '/activity/betting-rebate', img: '/image/Betting rebate.webp', label: 'Betting rebate' },
  { to: '/activity/super-jackpot', img: '/image/Super Jackpot.webp', label: 'Super Jackpot' },
];

const PROMO_CARDS = [
  { to: '/activity/new-member-deposit', img: '/image/activity-1.png', title: 'NEW MEMBER 1st DEPOSIT' },
  { to: '/activity/other-platform', img: '/image/activity-8.png', title: 'Click to explore our other platform' },
  { to: '/activity/vip-rewards', img: '/image/activity-7.png', title: 'VIP REWARDS AND BENEFITS' },
  { to: '/activity/aviator-award', img: '/image/activity-6.png', title: 'AVIATOR ADDITIONAL AWARD' },
  { to: '/activity/win-streak', img: '/image/activity-5.png', title: 'WIN STREAK BONUS' },
  { to: '/activity/creative-video', img: '/image/activity-3.png', title: 'CREATIVE VIDEO BONUS' },
  { to: '/activity/lucky10-days', img: '/image/activity-4.png', title: 'Lucky 10 Days of Interest' },
  { to: '/activity/additional-rewards', img: '/image/activity-2.png', title: 'ADDITIONAL REWARDS' },
];

function Activity() {
  const navigate = useNavigate();
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
            <div className="bonus-label">Today's bonus</div>
            <div className="bonus-amount">Rs{summary.todayBonus.toFixed(2)}</div>
          </div>
          <div className="bonus-divider"></div>
          <div className="bonus-cell">
            <div className="bonus-label">Total bonus</div>
            <div className="bonus-amount">Rs{summary.totalBonus.toFixed(2)}</div>
          </div>
        </div>
        <button className="bonus-btn" onClick={() => navigate('/activity/bonus-details')}>Bonus details</button>
      </div>

      {/* ICON GRID */}
      <div className="icon-section">
        <div className="icon-row">
          {ICON_ROW1.map((item) => (
            <Link to={item.to} className="icon-item" key={item.to}>
              <img src={item.img} className="icon-img" alt={typeof item.label === 'string' ? item.label : 'icon'} />
              <span className="icon-label">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="icon-row-single">
          <Link to="/spin" className="icon-item">
            <img src="/image/Invite Wheel.webp" className="icon-img" alt="Invite Wheel" />
            <span className="icon-label">Invite Wheel</span>
          </Link>
        </div>
      </div>

      {/* PROMO CARDS */}
      <div className="promo-section">
        <div className="promo-row-2">
          <Link to="/gifts" className="promo-card">
            <img src="/image/Gift.png" className="promo-img" style={{ height: '120px' }} alt="Gifts" />
            <div className="promo-title" style={{ fontSize: '14px', fontWeight: 800 }}>Gifts</div>
            <div className="promo-desc">Enter the redemption code to receive gift rewards</div>
          </Link>
          <Link to="/activity/attendance-bonus" className="promo-card">
            <img src="/image/Attendence.png" className="promo-img" style={{ height: '120px' }} alt="Attendance bonus" />
            <div className="promo-title" style={{ fontSize: '14px', fontWeight: 800 }}>Attendance bonus</div>
            <div className="promo-desc">The more consecutive days you sign in, the higher the reward will be.</div>
          </Link>
        </div>

        {PROMO_CARDS.map((card) => (
          <Link to={card.to} className="promo-card" key={card.to}>
            <img src={card.img} className="promo-img" alt={card.title} />
            <div className="promo-title">{card.title}</div>
          </Link>
        ))}
      </div>

      <div className="bottom-spacer"></div>

      <Footer active="activity" />
    </div>
  );
}

export default Activity;