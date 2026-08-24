import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './BonusDetails.css';

const CATEGORY_KEYS = [
  'bd_cat_all',
  'bd_cat_red_envelope',
  'bd_cat_attendance',
  'bd_cat_deposit_gift',
  'bd_cat_bonus',
  'bd_cat_invitation',
  'bd_cat_vip_level_up',
  'bd_cat_vip_monthly',
  'bd_cat_washing_rebate',
  'bd_cat_super_jackpot',
  'bd_cat_weekly_award',
  'bd_cat_newbie_pack',
  'bd_cat_tournament',
  'bd_cat_return_awards',
  'bd_cat_new_members_loss',
  'bd_cat_new_members_play',
  'bd_cat_daily_rewards',
  'bd_cat_lucky_wheel',
  'bd_cat_partner_rewards',
  'bd_cat_withdrawal_rewards',
  'bd_cat_invite_wheel',
  'bd_cat_download_bonus',
];

const DATE_OPTION_KEYS = [
  'bd_date_all_time',
  'bd_date_today',
  'bd_date_yesterday',
  'bd_date_this_week',
  'bd_date_this_month',
  'bd_date_last_30',
];

// English values the backend expects — index-aligned with the *_KEYS
// arrays above. Translation keys are for display only; API calls always
// send these canonical English strings.
const CATEGORY_EN = {
  bd_cat_all: 'All',
  bd_cat_red_envelope: 'Red envelope',
  bd_cat_attendance: 'Attendance bonus',
  bd_cat_deposit_gift: 'Deposit Gift',
  bd_cat_bonus: 'Bonus',
  bd_cat_invitation: 'Invitation bonus',
  bd_cat_vip_level_up: 'VIP level up reward',
  bd_cat_vip_monthly: 'VIP monthly reward',
  bd_cat_washing_rebate: 'Washing Code Rebate',
  bd_cat_super_jackpot: 'Super Jackpot',
  bd_cat_weekly_award: 'Weekly Award',
  bd_cat_newbie_pack: 'Newbie gift pack',
  bd_cat_tournament: 'Tournament Rewards',
  bd_cat_return_awards: 'Return Awards',
  bd_cat_new_members_loss: 'New Members Bonus for Losing Profits',
  bd_cat_new_members_play: 'New members get bonuses by playing games',
  bd_cat_daily_rewards: 'Daily rewards',
  bd_cat_lucky_wheel: 'Lucky Wheel',
  bd_cat_partner_rewards: 'Partner rewards',
  bd_cat_withdrawal_rewards: 'Withdrawal Rewards',
  bd_cat_invite_wheel: 'Invite Wheel Reward',
  bd_cat_download_bonus: 'Download Bonus',
};
const DATE_OPTION_EN = {
  bd_date_all_time: 'All time',
  bd_date_today: 'Today',
  bd_date_yesterday: 'Yesterday',
  bd_date_this_week: 'This week',
  bd_date_this_month: 'This month',
  bd_date_last_30: 'Last 30 days',
};

const TABS = [
  { key: 'collected', labelKey: 'bd_tab_collected' },
  { key: 'received', labelKey: 'bd_tab_received' },
  { key: 'expired', labelKey: 'bd_tab_expired' },
];

function BottomSheet({ title, items, selected, onConfirm, onCancel, cancelLabel, confirmLabel }) {
  const [temp, setTemp] = useState(selected);

  return (
    <div className="bd-sheet-overlay" onClick={onCancel}>
      <div className="bd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bd-sheet-handle" />
        <div className="bd-sheet-head">
          <button className="bd-sheet-cancel" onClick={onCancel}>{cancelLabel}</button>
          <span className="bd-sheet-title">{title}</span>
          <button className="bd-sheet-confirm" onClick={() => onConfirm(temp)}>{confirmLabel}</button>
        </div>
        <div className="bd-sheet-list">
          {items.map((item) => (
            <div
              key={item.key}
              className={`bd-sheet-item ${temp === item.key ? 'active' : ''}`}
              onClick={(e) => {
                setTemp(item.key);
                e.currentTarget.scrollIntoView({ block: 'start', behavior: 'smooth' });
              }}
            >
              <span className="bd-sheet-item-text">{item.label}</span>
              {temp === item.key && <span className="bd-sheet-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BonusDetails() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('collected');
  const [category, setCategory] = useState('bd_cat_all');
  const [dateRange, setDateRange] = useState('Choose a date');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ tab: activeTab, category: CATEGORY_EN[category] || category });
    if (dateRange !== 'Choose a date') params.set('dateRange', DATE_OPTION_EN[dateRange] || dateRange);
    apiFetch(`/activity/bonus-details?${params}`)
      .then((data) => setRecords(data.records || []))
      .catch(() => setRecords([]));
  }, [activeTab, category, dateRange]);

  return (
    <div className="bd-page">
      <header className="bd-header">
        <button className="bd-back" onClick={() => navigate(-1)} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="bd-title">{t('bd_title')}</h1>
        <span className="bd-header-spacer" />
      </header>

      <div className="bd-filters">
        <button className="bd-filter-btn" onClick={() => setCategoryOpen(true)}>
          <span>{t(category)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button className="bd-filter-btn" onClick={() => setDateOpen(true)}>
          <span>{dateRange === 'Choose a date' ? t('bd_choose_date') : t(dateRange)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

      <div className="bd-tabs">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            className={`bd-tab ${activeTab === tb.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tb.key)}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      <div className="bd-content">
        {records.length > 0 ? (
          <div className="bd-list">
            {records.map((r, idx) => (
              <div className="bd-item" key={idx}>
                <div className="bd-item-left">
                  <span className="bd-item-category">{r.category || t(category)}</span>
                  <span className="bd-item-date">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <span className="bd-item-amount">Rs{Number(r.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
        <div className="bd-empty">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <ellipse cx="60" cy="98" rx="34" ry="6" fill="rgba(212,175,55,0.08)" />
            <path d="M38 30h44a4 4 0 0 1 4 4v50a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4V34a4 4 0 0 1 4-4z" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" />
            <path d="M38 30c0-6 4-10 10-10h24c6 0 10 4 10 10" stroke="rgba(212,175,55,0.35)" strokeWidth="1.5" fill="none" />
            <line x1="46" y1="46" x2="74" y2="46" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeLinecap="round" />
            <line x1="46" y1="56" x2="74" y2="56" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeLinecap="round" />
            <line x1="46" y1="66" x2="62" y2="66" stroke="rgba(212,175,55,0.3)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="60" cy="85" r="3" fill="#d4af37" opacity="0.6" />
          </svg>
          <p className="bd-empty-text">{t('bd_no_data')}</p>
        </div>
        )}
      </div>

      {categoryOpen && (
        <BottomSheet
          title={t('bd_select_category')}
          items={CATEGORY_KEYS.map((k) => ({ key: k, label: t(k) }))}
          selected={category}
          cancelLabel={t('hist_cancel')}
          confirmLabel={t('hist_confirm')}
          onCancel={() => setCategoryOpen(false)}
          onConfirm={(val) => { setCategory(val); setCategoryOpen(false); }}
        />
      )}

      {dateOpen && (
        <BottomSheet
          title={t('bd_select_date')}
          items={DATE_OPTION_KEYS.map((k) => ({ key: k, label: t(k) }))}
          selected={dateRange === 'Choose a date' ? 'bd_date_all_time' : dateRange}
          cancelLabel={t('hist_cancel')}
          confirmLabel={t('hist_confirm')}
          onCancel={() => setDateOpen(false)}
          onConfirm={(val) => { setDateRange(val); setDateOpen(false); }}
        />
      )}
    </div>
  );
}

export default BonusDetails;