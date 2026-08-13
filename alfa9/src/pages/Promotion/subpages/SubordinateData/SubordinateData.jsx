import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './SubordinateData.css';

const TIERS = ['All', 'Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6'];
const YEARS = [2023, 2024, 2025, 2026, 2027, 2028];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const STATS = [
  { label: 'Deposit number', val: 0 },
  { label: 'Deposit amount', val: 0 },
  { label: 'Number of bettors', val: 0 },
  { label: 'Total bet', val: 0 },
  { label: 'Number of people making first deposit', val: 0 },
  { label: 'First deposit amount', val: 0 },
];

function getCenter(colEl) {
  if (!colEl) return null;
  const items = colEl.querySelectorAll('.picker-item');
  const mid = colEl.scrollTop + colEl.offsetHeight / 2;
  let closest = null, minDist = Infinity;
  items.forEach((item) => {
    const dist = Math.abs(item.offsetTop + item.offsetHeight / 2 - mid);
    if (dist < minDist) { minDist = dist; closest = item; }
  });
  return closest;
}

function PickerColumn({ items, selected, onSelect, formatter, colRef }) {
  const scrollToSelected = (val) => {
    const el = colRef.current?.querySelector(`[data-val="${val}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <div className="picker-col" ref={colRef}>
      {items.map((item) => (
        <div
          key={item}
          className={`picker-item${item === selected ? ' selected' : ''}`}
          data-val={item}
          onClick={() => { onSelect(item); scrollToSelected(item); }}
        >
          {formatter ? formatter(item) : item}
        </div>
      ))}
    </div>
  );
}

function SubordinateData() {
  const navigate = useNavigate();

  const [tierLabel, setTierLabel] = useState('All');
  const [dateLabel, setDateLabel] = useState('2026-06-29');

  const [tierOpen, setTierOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedDate, setSelectedDate] = useState({ year: 2026, month: 6, day: 29 });

  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(STATS);

  useEffect(() => {
    const tierParam = selectedTier === 'All' ? 'All' : selectedTier.replace('Tier ', '');
    const params = new URLSearchParams({
      tier: tierParam,
      year: selectedDate.year,
      month: selectedDate.month,
      day: selectedDate.day,
      search
    });
    apiFetch(`/promotion/subordinate-data?${params}`)
      .then((data) => {
        const s = data.stats || {};
        setStats([
          { label: 'Deposit number', val: s.depositNumber || 0 },
          { label: 'Deposit amount', val: s.depositAmount || 0 },
          { label: 'Number of bettors', val: s.numberOfBettors || 0 },
          { label: 'Total bet', val: s.totalBet || 0 },
          { label: 'Number of people making first deposit', val: s.firstDepositCount || 0 },
          { label: 'First deposit amount', val: s.firstDepositAmount || 0 },
        ]);
      })
      .catch(() => {});
  }, [selectedTier, selectedDate, search]);

  const tierColRef = useRef(null);
  const yearColRef = useRef(null);
  const monthColRef = useRef(null);
  const dayColRef = useRef(null);

  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const openTierSheet = () => {
    setTierOpen(true);
    setTimeout(() => {
      const sel = tierColRef.current?.querySelector('.selected');
      if (sel) sel.scrollIntoView({ block: 'center' });
    }, 0);
  };

  const openDateSheet = () => {
    setDateOpen(true);
    setTimeout(() => {
      [yearColRef, monthColRef, dayColRef].forEach((ref) => {
        const sel = ref.current?.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'center' });
      });
    }, 0);
  };

  const confirmTier = () => {
    const sel = getCenter(tierColRef.current);
    if (sel) setSelectedTier(sel.dataset.val);
    setTierLabel(sel ? sel.dataset.val : selectedTier);
    setTierOpen(false);
  };

  const confirmDate = () => {
    const yItem = getCenter(yearColRef.current);
    const mItem = getCenter(monthColRef.current);
    const dItem = getCenter(dayColRef.current);
    const next = { ...selectedDate };
    if (yItem) next.year = parseInt(yItem.dataset.val, 10);
    if (mItem) next.month = parseInt(mItem.dataset.val, 10);
    if (dItem) next.day = parseInt(dItem.dataset.val, 10);
    setSelectedDate(next);
    setDateLabel(`${next.year}-${String(next.month).padStart(2, '0')}-${String(next.day).padStart(2, '0')}`);
    setDateOpen(false);
  };

  return (
    <div className="page-wrapper subordinate-data-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">Subordinate data</span>
      </div>

      <div className="search-bar">
        <input className="search-input" placeholder="Search subordinate UID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="search-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-select" onClick={openTierSheet}>
          <span>{tierLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
        <div className="filter-select" onClick={openDateSheet}>
          <span>{dateLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      <div className="stats-card2">
        <div className="stats-grid2">
          {stats.map((s) => (
            <div className="sc2-cell" key={s.label}>
              <div className="sc2-num">{s.val}</div>
              <div className="sc2-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="empty-state">
        <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
          <path d="M10 90 Q20 60 35 90" stroke="#2A1A08" strokeWidth="3" fill="none" />
          <path d="M85 90 Q95 65 108 90" stroke="#2A1A08" strokeWidth="3" fill="none" />
          <rect x="40" y="30" width="40" height="55" rx="3" fill="#221408" stroke="#2A1A08" strokeWidth="2" />
          <path d="M40 30 L55 18 L80 30" fill="#221408" stroke="#2A1A08" strokeWidth="2" />
          <rect x="20" y="70" width="14" height="16" fill="#221408" stroke="#2A1A08" strokeWidth="2" />
          <rect x="86" y="70" width="14" height="16" fill="#221408" stroke="#2A1A08" strokeWidth="2" />
        </svg>
        <span className="empty-text">No data</span>
      </div>

      {/* TIER SHEET */}
      {tierOpen && (
        <div className="sheet-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setTierOpen(false); }}>
          <div className="sheet-panel">
            <div className="sheet-header">
              <span className="sheet-cancel" onClick={() => setTierOpen(false)}>Cancel</span>
              <span className="sheet-title">Select Tier</span>
              <span className="sheet-confirm" onClick={confirmTier}>Confirm</span>
            </div>
            <div className="picker-columns single">
              <div className="picker-highlight"></div>
              <PickerColumn items={TIERS} selected={selectedTier} onSelect={setSelectedTier} colRef={tierColRef} />
            </div>
          </div>
        </div>
      )}

      {/* DATE SHEET */}
      {dateOpen && (
        <div className="sheet-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setDateOpen(false); }}>
          <div className="sheet-panel">
            <div className="sheet-header">
              <span className="sheet-cancel" onClick={() => setDateOpen(false)}>Cancel</span>
              <span className="sheet-title">Choose a date</span>
              <span className="sheet-confirm" onClick={confirmDate}>Confirm</span>
            </div>
            <div className="picker-columns triple">
              <div className="picker-highlight"></div>
              <PickerColumn items={YEARS} selected={selectedDate.year} onSelect={(y) => setSelectedDate((d) => ({ ...d, year: y }))} colRef={yearColRef} />
              <PickerColumn items={MONTHS} selected={selectedDate.month} onSelect={(m) => setSelectedDate((d) => ({ ...d, month: m }))} formatter={(m) => String(m).padStart(2, '0')} colRef={monthColRef} />
              <PickerColumn items={DAYS} selected={selectedDate.day} onSelect={(day) => setSelectedDate((d) => ({ ...d, day }))} formatter={(d) => String(d).padStart(2, '0')} colRef={dayColRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubordinateData;