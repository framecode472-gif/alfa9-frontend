import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './Withdraw.css';

const GATEWAYS = ['Easypaisa', 'JazzCash'];
const GATEWAY_LOGOS = {
  Easypaisa: '/image/Easypaisa.png',
  JazzCash: '/image/Jazzcash.png',
};

const STATUS_OPTIONS = [
  { val: 'all', labelKey: 'hist_all' },
  { val: 'pending', labelKey: 'hist_pending' },
  { val: 'completed', labelKey: 'hist_completed' },
];

// Default shape before the real (per-user) accounts load from the backend.
// Previously this read from a non-user-scoped localStorage key, so a saved
// Easypaisa/JazzCash account leaked into every account logged into on the
// same browser — including brand new ones. Now it always starts empty and
// fetchWithdrawAccounts() below fills it in from the logged-in user's data.
function loadAccounts() {
  return { Easypaisa: null, JazzCash: null };
}

function Withdraw() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [view, setView] = useState('main'); // 'main' | 'history'
  const [currentGateway, setCurrentGateway] = useState('Easypaisa');
  const [modalGateway, setModalGateway] = useState('Easypaisa');
  const [accounts, setAccounts] = useState(loadAccounts);

  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem('alfa9_balance') || '0'));
  const [withdrawInput, setWithdrawInput] = useState('');
  const [refreshSpin, setRefreshSpin] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Fund password (6-digit PIN backend requires before any withdrawal is allowed)
  const [hasFundPassword, setHasFundPassword] = useState(true); // assume true until we know otherwise, to avoid a flash
  const [pinModalOpen, setPinModalOpen] = useState(false); // set-up modal (first time)
  const [pinModalStep, setPinModalStep] = useState('create'); // 'create' | 'confirm'
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirmDraft, setPinConfirmDraft] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  const [confirmPinOpen, setConfirmPinOpen] = useState(false); // entry modal (every withdrawal)
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');

  const fetchSafeStatus = async () => {
    try {
      const data = await apiFetch('/safe/status');
      setHasFundPassword(!!data.hasFundPassword);
    } catch (err) {
      // not logged in yet, or backend unreachable — ignore
    }
  };
  useEffect(() => { fetchSafeStatus(); }, []);

  // Pull the real balance from the backend so it's never stale
  const fetchBalance = async () => {
    try {
      const data = await apiFetch('/user/profile');
      setBalance(data.user.balance);
      localStorage.setItem('alfa9_balance', String(data.user.balance));
    } catch (err) {
      // not logged in yet, or backend unreachable — fall back to cached value silently
    }
  };
  useEffect(() => { fetchBalance(); }, []);

  // Load THIS user's saved payment accounts from the backend, not from a
  // shared browser-wide localStorage key (see loadAccounts() note above).
  const fetchWithdrawAccounts = async () => {
    try {
      const data = await apiFetch('/user/withdraw-accounts');
      setAccounts({
        Easypaisa: data.accounts?.Easypaisa || null,
        JazzCash: data.accounts?.JazzCash || null
      });
    } catch (err) {
      // not logged in yet, or backend unreachable — keep the empty defaults
    }
  };
  useEffect(() => { fetchWithdrawAccounts(); }, []);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalFullName, setModalFullName] = useState('');
  const [modalAccountNum, setModalAccountNum] = useState('');

  const [methodFilter, setMethodFilter] = useState('all');

  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pendingStatus, setPendingStatus] = useState('all');

  const [calOpen, setCalOpen] = useState(false);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calStart, setCalStart] = useState(null);
  const [calEnd, setCalEnd] = useState(null);
  const [dateLabel, setDateLabel] = useState('');

  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = '') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type, show: true });
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  };

  // Real wagering (turnover) requirement + today's per-method withdrawal
  // count — was hardcoded ("Need to bet Rs0.00" / "3") before; now pulled
  // live from the backend so it actually matches what the withdraw button
  // will enforce.
  const [turnover, setTurnover] = useState({
    remaining: 0,
    dailyLimits: { easypaisa: { used: 0, max: 3, remaining: 3 }, jazzcash: { used: 0, max: 3, remaining: 3 } }
  });
  const fetchTurnoverStatus = async () => {
    try {
      const data = await apiFetch('/withdraw/turnover-status');
      setTurnover(data);
    } catch (err) {
      // not logged in yet, or backend unreachable — keep defaults
    }
  };
  useEffect(() => { fetchTurnoverStatus(); }, []);

  const refreshBal = () => {
    setRefreshSpin(true);
    fetchBalance();
    setTimeout(() => setRefreshSpin(false), 600);
  };

  const selectGateway = (name) => {
    setCurrentGateway(name);
    setModalGateway(name);
  };

  const acc = accounts[currentGateway];

  const setAllAmount = () => {
    setWithdrawInput(String(Math.floor(balance)));
  };

  // Gateway names shown in the UI -> backend Withdraw.method enum values
  const GATEWAY_TO_METHOD = { JazzCash: 'jazzcash', Easypaisa: 'easypaisa' };

  const executeWithdraw = async () => {
    if (!acc) { showToast(t('wd_toast_add_account_first').replace('{gw}', currentGateway), 'error'); return; }
    const amount = parseInt(withdrawInput, 10);
    if (!amount || amount < 500) { showToast(t('wd_toast_min'), 'error'); return; }
    if (amount > 50000) { showToast(t('wd_toast_max'), 'error'); return; }
    if (amount > balance) { showToast(t('wd_toast_insufficient'), 'error'); return; }
    const methodRemaining = turnover.dailyLimits?.[GATEWAY_TO_METHOD[currentGateway]]?.remaining;
    if (methodRemaining !== undefined && methodRemaining <= 0) {
      showToast(t('wd_toast_limit_reached').replace('{gw}', currentGateway), 'error');
      return;
    }

    if (!hasFundPassword) {
      setPinModalStep('create');
      setPinDraft('');
      setPinConfirmDraft('');
      setPinError('');
      setPinModalOpen(true);
      return;
    }

    setConfirmPinValue('');
    setConfirmPinError('');
    setConfirmPinOpen(true);
  };

  // Called once the user has typed their 6-digit fund password in the confirm modal
  const submitWithdrawWithPin = async (fundPassword) => {
    const amount = parseInt(withdrawInput, 10);
    setSubmittingWithdraw(true);
    try {
      const data = await apiFetch('/withdraw/create', {
        method: 'POST',
        body: {
          amount,
          method: GATEWAY_TO_METHOD[currentGateway] || 'jazzcash',
          accountHolderName: acc.name,
          accountNumber: acc.number,
          upiId: acc.number,
          fundPassword
        }
      });

      showToast(t('wd_toast_submitted'));
      setWithdrawInput('');
      setConfirmPinOpen(false);
      // Backend already deducted the balance — reflect it immediately
      setBalance(data.remainingBalance);
      localStorage.setItem('alfa9_balance', String(data.remainingBalance));
      fetchTurnoverStatus(); // refresh the "remaining today" count
    } catch (err) {
      setConfirmPinError(err.message || t('wd_toast_failed'));
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Sets the fund password for the first time, then immediately proceeds with the withdrawal
  const saveFundPasswordAndWithdraw = async () => {
    if (!/^\d{6}$/.test(pinDraft)) { setPinError(t('wd_pin_must_6')); return; }
    if (pinDraft !== pinConfirmDraft) { setPinError(t('wd_pin_mismatch')); return; }

    setPinSaving(true);
    setPinError('');
    try {
      await apiFetch('/safe/set-password', { method: 'POST', body: { pin: pinDraft } });
      setHasFundPassword(true);
      setPinModalOpen(false);
      showToast(t('wd_toast_pin_set'));
      await submitWithdrawWithPin(pinDraft);
    } catch (err) {
      setPinError(err.message || t('wd_toast_pin_error'));
    } finally {
      setPinSaving(false);
    }
  };

  const openAddModal = () => {
    if (accounts[currentGateway]) return; // already locked — nothing to edit
    setModalGateway(currentGateway);
    setModalFullName('');
    setModalAccountNum('');
    setAddModalOpen(true);
  };

  const saveAccount = async () => {
    const name = modalFullName.trim();
    const number = modalAccountNum.trim();
    if (!name) { showToast(t('wd_toast_enter_name'), 'error'); return; }
    if (!number || number.length < 10) { showToast(t('wd_toast_enter_valid_number'), 'error'); return; }
    try {
      await apiFetch('/user/withdraw-accounts', {
        method: 'POST',
        body: { gateway: modalGateway, name, number }
      });
      const data = { name, number };
      setAccounts((prev) => ({ ...prev, [modalGateway]: data }));
      setAddModalOpen(false);
      showToast(t('wd_toast_account_saved'));
      if (modalGateway !== currentGateway) setCurrentGateway(modalGateway);
    } catch (err) {
      showToast(err.message || t('wd_toast_save_failed'), 'error');
    }
  };

  const openStatusSheet = () => {
    setPendingStatus(selectedStatus);
    setStatusSheetOpen(true);
  };
  const confirmStatus = () => {
    setSelectedStatus(pendingStatus);
    setStatusSheetOpen(false);
  };
  const statusLabel = t(STATUS_OPTIONS.find((s) => s.val === selectedStatus)?.labelKey || 'hist_all');

  const openCalendar = () => setCalOpen(true);

  const calPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const calNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const pickDate = (d) => {
    const today = new Date();
    if (!calStart || (calStart && calEnd)) {
      setCalStart({ d, m: calMonth, y: calYear });
      setCalEnd(null);
    } else {
      const startTs = new Date(calStart.y, calStart.m, calStart.d).getTime();
      const thisTs = new Date(calYear, calMonth, d).getTime();
      if (thisTs < startTs) {
        setCalEnd({ ...calStart });
        setCalStart({ d, m: calMonth, y: calYear });
      } else {
        setCalEnd({ d, m: calMonth, y: calYear });
      }
    }
  };

  const confirmDateRange = () => {
    if (!calStart) { setCalOpen(false); return; }
    const fmt = (o) => `${o.y}/${o.m + 1}/${o.d}`;

    let label = fmt(calStart);
    if (calEnd && (calEnd.d !== calStart.d || calEnd.m !== calStart.m || calEnd.y !== calStart.y)) {
      label += ' – ' + fmt(calEnd);
    }
    setDateLabel(label);
    setCalOpen(false);
  };

  const renderCalDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div className="cal-day empty" key={`e${i}`}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(calYear, calMonth, d);
      const isFuture = thisDate > today;
      const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
      const isStart = calStart && calStart.d === d && calStart.m === calMonth && calStart.y === calYear;
      const isEnd = calEnd && calEnd.d === d && calEnd.m === calMonth && calEnd.y === calYear;
      let inRange = false;
      if (calStart && calEnd) {
        const startTs = new Date(calStart.y, calStart.m, calStart.d).getTime();
        const endTs = new Date(calEnd.y, calEnd.m, calEnd.d).getTime();
        const thisTs = thisDate.getTime();
        inRange = thisTs > startTs && thisTs < endTs;
      }

      const classes = ['cal-day'];
      if (isFuture) classes.push('disabled');
      if (isToday) classes.push('today');
      if (isStart) classes.push('start');
      if (isEnd) classes.push('end');
      if (inRange) classes.push('in-range');

      cells.push(
        <div
          className={classes.join(' ')}
          key={d}
          onClick={!isFuture ? () => pickDate(d) : undefined}
        >
          <span>{d}</span>
          {isStart && <span className="cal-day-label">Start</span>}
          {isEnd && <span className="cal-day-label">End</span>}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="withdraw-page">
      {view === 'main' && (
        <div className="view-panel active">
          <div className="page-header">
            <button className="header-back" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="header-title">{t('acc_withdraw')}</span>
            <button className="header-right-btn" onClick={() => navigate('/account/withdraw-history')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              {t('dep_history_btn')}
            </button>
          </div>

          <div className="balance-hero">
            <div className="balance-glow"></div>
            <div className="balance-label-row">
              <div className="balance-icon-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <rect x="2" y="7" width="20" height="14" rx="3" />
                  <path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="rgba(180,110,0,0.7)" />
                  <path d="M2 10h20" stroke="rgba(180,110,0,0.5)" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="balance-label-text">{t('wd_available_balance')}</span>
            </div>
            <div className="balance-amount-row">
              <span className="balance-amount">Rs{balance.toFixed(2)}</span>
              <button className="balance-refresh" onClick={refreshBal} title="Refresh">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.55s', transform: refreshSpin ? 'rotate(360deg)' : 'none' }}>
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="section-title">{t('wd_select_payment_method')}</div>
          <div className="gateway-tabs">
            {GATEWAYS.map((g) => (
              <div
                key={g}
                className={`gateway-tab${currentGateway === g ? ' active' : ''}`}
                onClick={() => selectGateway(g)}
              >
                <img src={GATEWAY_LOGOS[g]} className="gateway-tab-logo" alt={g} onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="gateway-tab-name">{g.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <div className="section-title">{t('wd_payment_account')}</div>

          {acc ? (
            <div className="saved-account-card">
              <div className="saved-account-left">
                <div className="saved-account-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div className="saved-account-name">{acc.name}</div>
                  <div className="saved-account-number">{acc.number} · {currentGateway}</div>
                </div>
              </div>
              <div className="locked-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t('wd_locked')}
              </div>
            </div>
          ) : (
            <div className="add-account-card" onClick={openAddModal}>
              <div className="add-account-plus">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="add-account-text">{t('wd_add_payment_account')}</span>
            </div>
          )}

          <div className="section-title">{t('wd_withdraw_amount')}</div>
          <div className="amount-input-section">
            <div className="amount-input-wrap">
              <span className="currency-label">PKR</span>
              <input
                type="number"
                placeholder={t('wd_enter_amount_placeholder')}
                min="500"
                max="50000"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
              />
              <button className="all-btn" onClick={setAllAmount}>{t('all')}</button>
            </div>
          </div>
          <div className="withdrawable-info">
            <div className="withdrawable-left">{t('wd_withdrawable_balance')} <span>Rs{balance.toFixed(2)}</span></div>
            <div className="withdrawable-right">{t('wd_received')} <span>Rs0.00</span></div>
          </div>

          <button className="withdraw-btn" onClick={executeWithdraw} disabled={submittingWithdraw}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="5 12 12 19 19 12" /></svg>
            {submittingWithdraw ? t('dep_submitting') : t('wd_withdraw_btn')}
          </button>

          <div className="rules-card">
            <div className="rules-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {t('wd_rules_title')}
            </div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_bet_1')} <strong>Rs{turnover.remaining.toFixed(2)}</strong> {t('wd_rule_bet_2')}</div></div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_time')} <strong>00:00 \u2013 23:59</strong></div></div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_remaining_1')} ({currentGateway}): <strong>{turnover.dailyLimits?.[GATEWAY_TO_METHOD[currentGateway]]?.remaining ?? 3}</strong> / {turnover.dailyLimits?.[GATEWAY_TO_METHOD[currentGateway]]?.max ?? 3}</div></div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_range')} <strong>Rs500 \u2013 Rs50,000</strong></div></div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_confirm_info')}</div></div>
            <div className="rule-item"><div className="rule-dot"></div><div className="rule-text">{t('wd_rule_contact_1')} <strong>{t('wd_rule_contact_2')}</strong> {t('wd_rule_contact_3')}</div></div>
          </div>

          <div className="history-section-heading">
            <div className="history-section-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.4" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
              </svg>
            </div>
            <span>{t('wd_history_section')}</span>
          </div>

          <div className="mini-history-card">
            <svg width="52" height="52" viewBox="0 0 80 60" fill="none" style={{ opacity: 0.35, marginBottom: 12 }}>
              <rect x="10" y="10" width="40" height="50" rx="4" fill="#8B7355" />
              <rect x="18" y="18" width="24" height="4" rx="2" fill="#5A4020" />
              <rect x="18" y="26" width="18" height="4" rx="2" fill="#5A4020" />
              <rect x="18" y="34" width="20" height="4" rx="2" fill="#5A4020" />
              <circle cx="58" cy="42" r="14" fill="#3a2a10" />
              <path d="M52 42h12M58 36v12" stroke="#5A4020" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="mini-history-text">{t('wd_no_transactions')}</div>
            <button className="all-history-btn" onClick={() => navigate('/account/withdraw-history')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              {t('wd_all_history')}
            </button>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {addModalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setAddModalOpen(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t('wd_add_account_modal_title')}
              </div>
              <div className="modal-close" onClick={() => setAddModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>

            <div className="modal-method-selector">
              {GATEWAYS.map((g) => {
                const isLocked = !!accounts[g];
                return (
                  <div
                    key={g}
                    className={`method-pill${modalGateway === g ? ' active' : ''}${isLocked ? ' disabled' : ''}`}
                    onClick={() => { if (!isLocked) setModalGateway(g); }}
                    title={isLocked ? t('wd_locked_tooltip').replace('{gw}', g) : ''}
                  >
                    <img src={GATEWAY_LOGOS[g]} alt={g} onError={(e) => { e.target.style.display = 'none'; }} />
                    <span className="method-pill-name">{g.toUpperCase()}</span>
                    {isLocked && <span className="method-pill-lock">🔒</span>}
                  </div>
                );
              })}
            </div>

            <div className="modal-field">
              <label>{t('wd_full_name')}</label>
              <input className="modal-input" type="text" placeholder={t('wd_full_name_placeholder')} value={modalFullName} onChange={(e) => setModalFullName(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>{t('dep_account_number')}</label>
              <input className="modal-input" type="tel" placeholder="03XXXXXXXXX" value={modalAccountNum} onChange={(e) => setModalAccountNum(e.target.value)} />
            </div>

            <button className="modal-save-btn" onClick={saveAccount}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t('wd_save_account')}
            </button>
          </div>
        </div>
      )}

      {/* STATUS SHEET */}
      {statusSheetOpen && (
        <div className="status-sheet-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setStatusSheetOpen(false); }}>
          <div className="status-sheet">
            <div className="modal-handle"></div>
            <div className="status-sheet-topbar">
              <button className="status-cancel-btn" onClick={() => setStatusSheetOpen(false)}>{t('hist_cancel')}</button>
              <button className="status-confirm-btn" onClick={confirmStatus}>{t('hist_confirm')}</button>
            </div>
            <div className="status-options">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.val}
                  className={`status-option${pendingStatus === s.val ? ' selected' : ''}`}
                  onClick={() => setPendingStatus(s.val)}
                >
                  {t(s.labelKey)}
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
              <span className="cal-title">{t('hist_calendar')}</span>
              <div className="cal-close-btn" onClick={() => setCalOpen(false)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
              <div className="cal-weekday">{t('wd_sun')}</div><div className="cal-weekday">{t('wd_mon')}</div>
              <div className="cal-weekday">{t('wd_tue')}</div><div className="cal-weekday">{t('wd_wed')}</div>
              <div className="cal-weekday">{t('wd_thu')}</div><div className="cal-weekday">{t('wd_fri')}</div>
              <div className="cal-weekday">{t('wd_sat')}</div>
            </div>
            <div className="cal-days">{renderCalDays()}</div>
            <button className="cal-confirm-btn" onClick={confirmDateRange}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t('hist_confirm')}
            </button>
          </div>
        </div>
      )}

      {/* SET FUND PASSWORD MODAL — shown once, the first time a user tries to withdraw */}
      {pinModalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setPinModalOpen(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t('wd_set_fund_password')}
              </div>
              <div className="modal-close" onClick={() => setPinModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <p style={{ color: '#8B7355', fontSize: 13, margin: '0 0 14px' }}>
              {t('wd_pin_setup_desc')}
            </p>
            <div className="modal-field">
              <label>{t('wd_pin_label')}</label>
              <input
                className="modal-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={pinDraft}
                onChange={(e) => setPinDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              />
            </div>
            <div className="modal-field">
              <label>{t('wd_confirm_pin_label')}</label>
              <input
                className="modal-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={pinConfirmDraft}
                onChange={(e) => setPinConfirmDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              />
            </div>
            {pinError && <div style={{ color: '#e05252', fontSize: 12.5, marginBottom: 10 }}>{pinError}</div>}
            <button className="modal-save-btn" disabled={pinSaving} onClick={saveFundPasswordAndWithdraw}>
              {pinSaving ? t('wd_saving') : t('wd_set_pin_withdraw')}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM FUND PASSWORD MODAL — shown every time, right before submitting a withdrawal */}
      {confirmPinOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setConfirmPinOpen(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t('wd_enter_fund_password')}
              </div>
              <div className="modal-close" onClick={() => setConfirmPinOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <div className="modal-field">
              <label>{t('wd_pin_label')}</label>
              <input
                className="modal-input"
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={confirmPinValue}
                onChange={(e) => setConfirmPinValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                autoFocus
              />
            </div>
            {confirmPinError && <div style={{ color: '#e05252', fontSize: 12.5, marginBottom: 10 }}>{confirmPinError}</div>}
            <button
              className="modal-save-btn"
              disabled={submittingWithdraw || confirmPinValue.length !== 6}
              onClick={() => submitWithdrawWithPin(confirmPinValue)}
            >
              {submittingWithdraw ? t('wd_submitting_dots') : t('wd_confirm_withdrawal')}
            </button>
          </div>
        </div>
      )}

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Withdraw;