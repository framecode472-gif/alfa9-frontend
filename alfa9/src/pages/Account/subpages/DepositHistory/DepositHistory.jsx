import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './DepositHistory.css';

const STATUS_KEYS = { all: 'hist_all', pending: 'hist_to_be_paid', success: 'hist_completed', failed: 'hist_failed' };

// Backend status values ('pending' | 'approved' | 'rejected') -> the labels this page already uses
const BACKEND_STATUS_MAP = { pending: 'pending', approved: 'success', rejected: 'failed' };

function pad2(n) { return String(n).padStart(2, '0'); }

function DepositHistory() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [curMethod, setCurMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pendingStatus, setPendingStatus] = useState('all');
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  const [selDate, setSelDate] = useState(null); // { start, end }
  const [calOpen, setCalOpen] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calStart, setCalStart] = useState(null);
  const [calEnd, setCalEnd] = useState(null);

  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    apiFetch('/deposit/my-deposits')
      .then((data) => {
        const mapped = (data.deposits || []).map((d) => {
          const dt = new Date(d.createdAt);
          const pad = (n) => String(n).padStart(2, '0');
          const time = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
          return {
            method: d.method === 'jazzcash' ? 'JazzCash' : d.method === 'easypaisa' ? 'Easypaisa' : d.method,
            status: BACKEND_STATUS_MAP[d.status] || 'success',
            amount: d.amount,
            time,
          };
        });
        setDeposits(mapped);
      })
      .catch(() => setDeposits([]));
  }, []);

  const filtered = useMemo(() => {
    let txs = deposits;
    if (curMethod !== 'all') txs = txs.filter((t) => t.method === curMethod);
    if (selectedStatus !== 'all') txs = txs.filter((t) => (t.status || 'success') === selectedStatus);
    if (selDate) {
      txs = txs.filter((t) => {
        const d = (t.time || '').split(' ')[0];
        if (!d) return false;
        if (selDate.end) return d >= selDate.start && d <= selDate.end;
        return d === selDate.start;
      });
    }
    return txs;
  }, [deposits, curMethod, selectedStatus, selDate]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((t) => {
      const d = (t.time || '').split(' ')[0] || 'Unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatGroupLabel = (date) => {
    const parts = date.split('-');
    return parts.length === 3 ? `${parts[2]} ${MONTHS_SHORT[parseInt(parts[1], 10) - 1]} ${parts[0]}` : date;
  };

  const openStatusSheet = () => { setPendingStatus(selectedStatus); setStatusSheetOpen(true); };
  const confirmStatus = () => { setSelectedStatus(pendingStatus); setStatusSheetOpen(false); };

  const openCalendar = () => setCalOpen(true);
  const calPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); };
  const calNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); };

  const pickDate = (d) => {
    if (!calStart || (calStart && calEnd)) {
      setCalStart({ d, m: calMonth, y: calYear });
      setCalEnd(null);
    } else {
      const startTs = new Date(calStart.y, calStart.m, calStart.d).getTime();
      const thisTs = new Date(calYear, calMonth, d).getTime();
      if (thisTs < startTs) { setCalEnd({ ...calStart }); setCalStart({ d, m: calMonth, y: calYear }); }
      else setCalEnd({ d, m: calMonth, y: calYear });
    }
  };

  const fmtDate = (o) => `${o.y}-${pad2(o.m + 1)}-${pad2(o.d)}`;
  const fmtLabel = (o) => `${o.y}/${o.m + 1}/${o.d}`;

  const confirmDateRange = () => {
    if (!calStart) { setCalOpen(false); return; }
    setSelDate({ start: fmtDate(calStart), end: calEnd ? fmtDate(calEnd) : null });
    setCalOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    setSelDate(null); setCalStart(null); setCalEnd(null);
  };

  const dateLabel = (() => {
    if (!selDate) return t('hist_choose_date');
    const [sy, sm, sd] = selDate.start.split('-');
    let label = `${sy}/${parseInt(sm, 10)}/${parseInt(sd, 10)}`;
    if (selDate.end && selDate.end !== selDate.start) {
      const [ey, em, ed] = selDate.end.split('-');
      label += ` – ${ey}/${parseInt(em, 10)}/${parseInt(ed, 10)}`;
    }
    return label;
  })();

  const renderCalDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div className="cal-day empty" key={`e${i}`}></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(calYear, calMonth, d);
      const isFuture = thisDate > today;
      const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
      const isStart = calStart && calStart.d === d && calStart.m === calMonth && calStart.y === calYear;
      const isEnd = calEnd && calEnd.d === d && calEnd.m === calMonth && calEnd.y === calYear;
      let inRange = false;
      if (calStart && calEnd) {
        const sTs = new Date(calStart.y, calStart.m, calStart.d).getTime();
        const eTs = new Date(calEnd.y, calEnd.m, calEnd.d).getTime();
        inRange = thisDate.getTime() > sTs && thisDate.getTime() < eTs;
      }
      const classes = ['cal-day'];
      if (isFuture) classes.push('disabled');
      if (isToday) classes.push('today');
      if (isStart) classes.push('start');
      if (isEnd) classes.push('end');
      if (inRange) classes.push('in-range');
      cells.push(
        <div className={classes.join(' ')} key={d} onClick={!isFuture ? () => pickDate(d) : undefined}>
          <span>{d}</span>
          {isStart && <span className="cal-day-label">Start</span>}
          {isEnd && <span className="cal-day-label">End</span>}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="deposit-history-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="header-back" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="header-title">{t('dep_history_title')}</span>
        <div style={{ width: 36 }}></div>
      </div>

      <div className="history-filter-row">
        <div className={`filter-chip${curMethod === 'all' ? ' active' : ''}`} onClick={() => setCurMethod('all')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          {t('hist_all')}
        </div>
        <div className={`filter-chip${curMethod === 'JazzCash' ? ' active' : ''}`} onClick={() => setCurMethod('JazzCash')}>
          <img src="/image/Jazzcash.png" alt="JazzCash" />
          JAZZCASH
        </div>
        <div className={`filter-chip${curMethod === 'Easypaisa' ? ' active' : ''}`} onClick={() => setCurMethod('Easypaisa')}>
          <img src="/image/Easypaisa.png" alt="Easypaisa" />
          EASYPAISA
        </div>
      </div>

      <div className="history-controls">
        <button className={`dropdown-btn${selectedStatus !== 'all' ? ' active-filter' : ''}`} onClick={openStatusSheet}>
          <span className="dropdown-btn-text">{t(STATUS_KEYS[selectedStatus])}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        <button className={`dropdown-btn${selDate ? ' active-filter' : ''}`} onClick={openCalendar} style={{ position: 'relative' }}>
          <span className="dropdown-btn-text">{dateLabel}</span>
          {selDate && (
            <button className="date-clear-btn show" onClick={clearDate}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </button>
      </div>

      {grouped.length > 0 ? (
        <div className="tx-list">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="date-group-label">{formatGroupLabel(date)}</div>
              {items.map((tx, i) => {
                const isJC = tx.method === 'JazzCash';
                const statusKey = tx.status || 'success';
                return (
                  <div className="tx-card" key={i}>
                    <div className={`tx-icon ${isJC ? 'jc' : 'ep'}`}>
                      <img src={isJC ? '/image/Jazzcash.png' : '/image/Easypaisa.png'} alt={isJC ? 'JC' : 'EP'} />
                    </div>
                    <div className="tx-info">
                      <div className="tx-name">{tx.method || 'Deposit'}</div>
                      <div className="tx-time">{(tx.time || '').split(' ')[1] || ''}</div>
                      <span className={`tx-status ${statusKey}`}>{t(STATUS_KEYS[statusKey] || 'hist_completed')}</span>
                    </div>
                    <div className="tx-amount">+Rs{parseFloat(tx.amount || 0).toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon-box">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
            </svg>
          </div>
          <div className="empty-title">{t('hist_no_history_found')}</div>
          <p className="empty-desc">{t('dep_history_empty_desc')}</p>
          <button className="empty-action-btn" onClick={() => navigate('/account/deposit')}>{t('dep_go_to_deposit')}</button>
        </div>
      )}

      {/* STATUS SHEET */}
      {statusSheetOpen && (
        <div className="sheet-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setStatusSheetOpen(false); }}>
          <div className="bottom-sheet">
            <div className="modal-handle"></div>
            <div className="sheet-topbar">
              <button className="sheet-cancel-btn" onClick={() => setStatusSheetOpen(false)}>{t('hist_cancel')}</button>
              <span className="sheet-title-text">{t('hist_payment_status')}</span>
              <button className="sheet-confirm-btn" onClick={confirmStatus}>{t('hist_confirm')}</button>
            </div>
            <div className="sheet-options">
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  className={`sheet-option${pendingStatus === val ? ' selected' : ''}`}
                  onClick={() => setPendingStatus(val)}
                >
                  {t(STATUS_KEYS[val])}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR MODAL */}
      {calOpen && (
        <div className="cal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setCalOpen(false); }}>
          <div className="cal-modal">
            <div className="cal-header">
              <span className="cal-title">{t('hist_choose_date_title')}</span>
              <div className="cal-close-btn" onClick={() => setCalOpen(false)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
            </div>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={calPrevMonth}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className="cal-month-label">{calYear}/{calMonth + 1}</span>
              <button className="cal-nav-btn" onClick={calNextMonth}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <div className="cal-weekdays">
              <div className="cal-weekday">Sun</div><div className="cal-weekday">Mon</div>
              <div className="cal-weekday">Tue</div><div className="cal-weekday">Wed</div>
              <div className="cal-weekday">Thu</div><div className="cal-weekday">Fri</div>
              <div className="cal-weekday">Sat</div>
            </div>
            <div className="cal-days">{renderCalDays()}</div>
            <button className="cal-confirm-btn" onClick={confirmDateRange}>{t('hist_confirm')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepositHistory;