import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './AttendanceBonus.css';

const DAY_REWARDS = [15, 30, 40, 60, 80, 90, 120];

function AttendanceBonus() {
  const [state, setState] = useState({ consecutiveDays: 0, accumulated: 0, collectedDays: [], hasCollectedToday: false });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '', show: false });

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  const loadStatus = useCallback(() => {
    apiFetch('/activity/attendance/status')
      .then((data) => setState({
        consecutiveDays: data.consecutiveDays, accumulated: data.accumulated,
        collectedDays: data.collectedDays || [], hasCollectedToday: data.hasCollectedToday
      }))
      .catch(() => {});
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const hasCollectedToday = state.hasCollectedToday;

  const doAttendance = () => {
    apiFetch('/activity/attendance/claim', { method: 'POST' })
      .then((data) => {
        loadStatus();
        showToast('🎉 Day ' + data.day + ' — Rs' + data.amount.toFixed(2) + ' added!', 'success');
      })
      .catch((err) => showToast(err.message || 'Could not collect attendance bonus', 'error'));
  };

  const day7Collected = state.collectedDays.includes(7);

  return (
    <div className="attendance-bonus-page">
      <div className="page-header">
        <Link to="/activity" className="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="page-title">Attendance</span>
      </div>

      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-title">Attendance bonus</div>
          <div className="hero-sub">Get rewards based on consecutive login days</div>
          <div className="consec-badge">Attended consecutively <span className="day-num">{state.consecutiveDays}</span> Day</div>
          <div className="hero-acc-label">Accumulated</div>
          <div className="hero-amount">Rs{state.accumulated.toFixed(2)}</div>
          <div className="hero-btns">
            <button className="hero-btn" onClick={() => setRulesOpen(true)}>Game Rules</button>
            <button className="hero-btn" onClick={() => showToast('No history yet.', 'warning')}>Attendance history</button>
          </div>
        </div>
        <div className="hero-right">
          <img src="/image/attendencebg.webp" alt="Attendance" />
        </div>
      </div>

      <div className="days-section">
        <div className="days-grid">
          {DAY_REWARDS.slice(0, 6).map((amount, i) => {
            const dayNum = i + 1;
            const isCollected = state.collectedDays.includes(dayNum);
            const isLastRow = i >= 3;
            return (
              <div className={`day-cell ${isCollected ? 'collected' : ''} ${isLastRow ? 'last-row' : ''}`} key={dayNum}>
                <div className="day-amount">Rs{amount}.00</div>
                <img className="coin-img" src="/image/awardicon.webp" alt="coin" />
                <div className="day-label">{dayNum} Day</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`day7-section ${day7Collected ? 'collected' : ''}`}>
        <img className="day7-gift-img" src="/image/gftimage.webp" alt="7 Day Gift" />
        <div className="day7-info">
          <div className="day7-row">
            <div className="day7-dash"></div>
            <div className="day7-amount">Rs120.00</div>
            <div className="day7-dash"></div>
          </div>
          <div className="day7-label">7 Day{day7Collected ? ' ✓' : ''}</div>
        </div>
      </div>

      <div className="attend-btn-wrap">
        <button className="attend-btn" onClick={doAttendance} disabled={hasCollectedToday}>
          {hasCollectedToday ? 'Already Collected Today' : 'Attendance'}
        </button>
      </div>

      <div className="bottom-spacer"></div>

      <div className={`modal-overlay ${rulesOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setRulesOpen(false); }}>
        <div className="modal-sheet">
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setRulesOpen(false)}>×</button>
          <div className="modal-title">Game Rules</div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">You must make a deposit on that day to be eligible to collect the attendance bonus.</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">Each player can only collect the attendance bonus once per day.</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">The more consecutive days you attend, the higher the reward — up to Rs120.00 on Day 7.</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">If you miss a day, your consecutive streak resets from Day 1 again.</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">Rewards are credited instantly to your wallet balance.</div></div>
        </div>
      </div>

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default AttendanceBonus;