import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './BonusDetails.css';

const CATEGORIES = [
  'All',
  'Red envelope',
  'Attendance bonus',
  'Deposit Gift',
  'Bonus',
  'Invitation bonus',
  'VIP level up reward',
  'VIP monthly reward',
  'Washing Code Rebate',
  'Super Jackpot',
  'Weekly Award',
  'Newbie gift pack',
  'Tournament Rewards',
  'Return Awards',
  'New Members Bonus for Losing Profits',
  'New members get bonuses by playing games',
  'Daily rewards',
  'Lucky Wheel',
  'Partner rewards',
  'Withdrawal Rewards',
  'Invite Wheel Reward',
  'Download Bonus',
];

const DATE_OPTIONS = [
  'All time',
  'Today',
  'Yesterday',
  'This week',
  'This month',
  'Last 30 days',
];

const TABS = [
  { key: 'collected', label: 'To be collected' },
  { key: 'received', label: 'Received' },
  { key: 'expired', label: 'Expired' },
];

function BottomSheet({ title, items, selected, onConfirm, onCancel }) {
  const [temp, setTemp] = useState(selected);

  return (
    <div className="bd-sheet-overlay" onClick={onCancel}>
      <div className="bd-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bd-sheet-handle" />
        <div className="bd-sheet-head">
          <button className="bd-sheet-cancel" onClick={onCancel}>Cancel</button>
          <span className="bd-sheet-title">{title}</span>
          <button className="bd-sheet-confirm" onClick={() => onConfirm(temp)}>Confirm</button>
        </div>
        <div className="bd-sheet-list">
          {items.map((item) => (
            <div
              key={item}
              className={`bd-sheet-item ${temp === item ? 'active' : ''}`}
              onClick={(e) => {
                setTemp(item);
                e.currentTarget.scrollIntoView({ block: 'start', behavior: 'smooth' });
              }}
            >
              <span className="bd-sheet-item-text">{item}</span>
              {temp === item && <span className="bd-sheet-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BonusDetails() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('collected');
  const [category, setCategory] = useState('All');
  const [dateRange, setDateRange] = useState('Choose a date');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ tab: activeTab, category });
    if (dateRange !== 'Choose a date') params.set('dateRange', dateRange);
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
        <h1 className="bd-title">Bonus Details</h1>
        <span className="bd-header-spacer" />
      </header>

      <div className="bd-filters">
        <button className="bd-filter-btn" onClick={() => setCategoryOpen(true)}>
          <span>{category}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <button className="bd-filter-btn" onClick={() => setDateOpen(true)}>
          <span>{dateRange}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      </div>

      <div className="bd-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`bd-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bd-content">
        {records.length > 0 ? (
          <div className="bd-list">
            {records.map((r, idx) => (
              <div className="bd-item" key={idx}>
                <div className="bd-item-left">
                  <span className="bd-item-category">{r.category || category}</span>
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
          <p className="bd-empty-text">No data</p>
        </div>
        )}
      </div>

      {categoryOpen && (
        <BottomSheet
          title="Select category"
          items={CATEGORIES}
          selected={category}
          onCancel={() => setCategoryOpen(false)}
          onConfirm={(val) => { setCategory(val); setCategoryOpen(false); }}
        />
      )}

      {dateOpen && (
        <BottomSheet
          title="Select date"
          items={DATE_OPTIONS}
          selected={dateRange === 'Choose a date' ? 'All time' : dateRange}
          onCancel={() => setDateOpen(false)}
          onConfirm={(val) => { setDateRange(val); setDateOpen(false); }}
        />
      )}
    </div>
  );
}

export default BonusDetails;