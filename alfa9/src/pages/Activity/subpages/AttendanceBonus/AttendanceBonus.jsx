import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './AttendanceBonus.css';

const DAY_REWARDS = [15, 30, 40, 60, 80, 90, 120];

function AttendanceBonus() {
  const { t } = useLanguage();
  const [state, setState] = useState({ consecutiveDays: 0, accumulated: 0, collectedDays: [], hasCollectedToday: false });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '', show: false });

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3200);
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
        showToast('\ud83c\udf89 ' + t('atb_day') + ' ' + data.day + ' \u2014 Rs' + data.amount.toFixed(2) + ' ' + t('atb_toast_added'), 'success');
      })
      .catch((err) => showToast(err.message || t('atb_toast_error'), 'error'));
  };

  const day7Collected = state.collectedDays.includes(7);

  return (
    <div className="attendance-bonus-page">
      <div className="page-header">
        <Link to="/activity" className="back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="page-title">{t('atb_title')}</span>
      </div>

      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-title">{t('act_attendance_bonus')}</div>
          <div className="hero-sub">{t('atb_hero_sub')}</div>
          <div className="consec-badge">{t('atb_consec_1')} <span className="day-num">{state.consecutiveDays}</span> {t('atb_day')}</div>
          <div className="hero-acc-label">{t('atb_accumulated')}</div>
          <div className="hero-amount">Rs{state.accumulated.toFixed(2)}</div>
          <div className="hero-btns">
            <button className="hero-btn" onClick={() => setRulesOpen(true)}>{t('atb_game_rules')}</button>
            <button className="hero-btn" onClick={() => showToast(t('atb_toast_no_history'), 'warning')}>{t('atb_history_link')}</button>
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
                <div className="day-label">{dayNum} {t('atb_day')}</div>
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
          <div className="day7-label">7 {t('atb_day')}{day7Collected ? ' \u2713' : ''}</div>
        </div>
      </div>

      <div className="attend-btn-wrap">
        <button className="attend-btn" onClick={doAttendance} disabled={hasCollectedToday}>
          {hasCollectedToday ? t('atb_already_collected') : t('atb_attendance_btn')}
        </button>
      </div>

      <div className="bottom-spacer"></div>

      <div className={`modal-overlay ${rulesOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setRulesOpen(false); }}>
        <div className="modal-sheet">
          <div className="modal-handle"></div>
          <button className="modal-close" onClick={() => setRulesOpen(false)}>×</button>
          <div className="modal-title">{t('atb_game_rules')}</div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('atb_rule_1')}</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('atb_rule_2')}</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('atb_rule_3')}</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('atb_rule_4')}</div></div>
          <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('atb_rule_5')}</div></div>
        </div>
      </div>

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default AttendanceBonus;