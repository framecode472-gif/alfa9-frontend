import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './CommissionDetail.css';

const YEARS = [2023, 2024, 2025, 2026, 2027, 2028];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

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

function CommissionDetail() {
  const navigate = useNavigate();
  const [dateLabel, setDateLabel] = useState('2026-06-29');
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ year: 2026, month: 6, day: 29 });

  const yearColRef = useRef(null);
  const monthColRef = useRef(null);
  const dayColRef = useRef(null);

  const daysInMonth = new Date(selectedDate.year, selectedDate.month, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const openDateSheet = () => {
    setDateOpen(true);
    setTimeout(() => {
      [yearColRef, monthColRef, dayColRef].forEach((ref) => {
        const sel = ref.current?.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'center' });
      });
    }, 0);
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

  const [commissionList, setCommissionList] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams({ year: selectedDate.year, month: selectedDate.month, day: selectedDate.day });
    apiFetch(`/promotion/commission-detail?${params}`)
      .then((data) => {
        setCommissionList((data.commissionList || []).map((c) => ({
          name: c.name,
          time: new Date(c.time).toLocaleString(),
          amount: `Rs${Number(c.amount).toFixed(2)}`
        })));
      })
      .catch(() => setCommissionList([]));
  }, [selectedDate]);

  return (
    <div className="page-wrapper commission-detail-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">Commission Details</span>
      </div>

      <div className="date-select" onClick={openDateSheet}>
        <span>{dateLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </div>

      {commissionList.length === 0 ? (
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
      ) : (
        <div className="commission-list">
          {commissionList.map((item, i) => (
            <div className="commission-item" key={i}>
              <div className="ci-left">
                <span className="ci-name">{item.name}</span>
                <span className="ci-time">{item.time}</span>
              </div>
              <span className="ci-amount">{item.amount}</span>
            </div>
          ))}
        </div>
      )}

      {dateOpen && (
        <div className="sheet-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setDateOpen(false); }}>
          <div className="sheet-panel">
            <div className="sheet-header">
              <span className="sheet-cancel" onClick={() => setDateOpen(false)}>Cancel</span>
              <span className="sheet-title">Choose a date</span>
              <span className="sheet-confirm" onClick={confirmDate}>Confirm</span>
            </div>
            <div className="picker-columns">
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

export default CommissionDetail;