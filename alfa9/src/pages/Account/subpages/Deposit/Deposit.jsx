'use client'

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './Deposit.css';

// Toggle this to re-enable JazzCash later — just flip it back to false.
// While true, tapping the JazzCash card shows a toast telling the user to
// use Easypaisa instead, and does not select JazzCash as the gateway.
const JAZZCASH_UNDER_MAINTENANCE = true;

const AMOUNTS = [
  { val: 300, bonus: '+Rs 10' },
  { val: 500, bonus: '+Rs 20', popular: true },
  { val: 1000, bonus: '+Rs 40', label: 'Rs 1K' },
  { val: 2000, bonus: '+Rs 80', label: 'Rs 2K' },
  { val: 3000, bonus: '+Rs 160', label: 'Rs 3K' },
  { val: 5000, bonus: '+Rs 250', label: 'Rs 5K' },
  { val: 10000, bonus: '+Rs 500', label: 'Rs 10K' },
  { val: 15000, bonus: '+Rs 750', label: 'Rs 15K' },
  { val: 20000, bonus: '+Rs 1000', label: 'Rs 20K' },
  { val: 30000, bonus: '+Rs 1500', label: 'Rs 30K' },
  { val: 50000, bonus: '+Rs 2500', label: 'Rs 50K' },
];

function Deposit() {
  // Updated version
  const navigate = useNavigate();
  const [view, setView] = useState('main'); // 'main' | 'process' | 'history'
  const [gateway, setGateway] = useState(JAZZCASH_UNDER_MAINTENANCE ? 'Easypaisa' : 'JazzCash');
  const [amount, setAmount] = useState(300);
  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem('alfa9_balance') || '0'));
  const [screenshot, setScreenshot] = useState(null);   // preview data URL, for <img>
  const [screenshotFile, setScreenshotFile] = useState(null); // actual File, for upload
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const fileInputRef = useRef(null);

  const showToast = (msg, type = '') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  };

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

  const refreshBal = () => {
    setRefreshing(true);
    fetchBalance();
    setTimeout(() => setRefreshing(false), 600);
  };

  const executeDeposit = () => {
    if (!amount || amount < 300 || amount > 50000) {
      showToast('Amount 300 aur 50,000 ke darmiyan hona chahiye.', 'error');
      return;
    }
    setScreenshot(null);
    setScreenshotFile(null);
    setSubmitted(false);
    setView('process');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Gateway names shown in the UI -> backend Deposit.method enum values
  const GATEWAY_TO_METHOD = { JazzCash: 'jazzcash', Easypaisa: 'easypaisa' };

  const submitScreenshotAction = async () => {
    if (submitted) { navigate('/home'); return; }
    if (!screenshotFile) { showToast('Pehle payment ka screenshot upload karein!', 'error'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('method', GATEWAY_TO_METHOD[gateway] || 'jazzcash');
      formData.append('screenshot', screenshotFile);

      await apiFetch('/deposit/create', { method: 'POST', body: formData });

      showToast('Screenshot submitted! Verification pending.');
      setSubmitted(true);
    } catch (err) {
      showToast(err.message || 'Deposit request failed. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="deposit-page">
      {view === 'main' && (
        <div className="view-panel active">
          <div className="page-header">
            <button className="header-back" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="header-title">Deposit</span>
            <button className="header-right-btn" onClick={() => navigate('/account/deposit-history')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              History
            </button>
          </div>

          <div className="balance-hero">
            <div className="balance-glow"></div>
            <div className="balance-label-row">
              <div className="balance-icon-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="2" y="7" width="20" height="14" rx="3" /><path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="rgba(180,110,0,0.7)" /><path d="M2 10h20" stroke="rgba(180,110,0,0.5)" strokeWidth="1.5" /></svg></div>
              <span className="balance-label-text">Balance</span>
            </div>
            <div className="balance-amount-row">
              <span className="balance-amount">Rs{balance.toFixed(2)}</span>
              <button className="balance-refresh" onClick={refreshBal} title="Refresh">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" style={{ transition: refreshing ? 'transform 0.55s' : 'none', transform: refreshing ? 'rotate(360deg)' : 'none' }}>
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="section-title">1. Choose Gateway</div>
          <div className="gateway-grid">
            <div
              className={`gateway-card ${gateway === 'JazzCash' ? 'active' : ''} ${JAZZCASH_UNDER_MAINTENANCE ? 'disabled' : ''}`}
              onClick={() => {
                if (JAZZCASH_UNDER_MAINTENANCE) {
                  showToast('JazzCash abhi available nahi hai. Easypaisa best hai, us se deposit karein.', 'error');
                  return;
                }
                setGateway('JazzCash');
              }}
            >
              <div className="gateway-info">
                <img src="/image/Jazzcash.png" className="gateway-logo" alt="JazzCash" onError={(e) => { e.target.style.display = 'none'; }} />
                <div><div className="gateway-name">JazzCash</div><div className="gateway-type">{JAZZCASH_UNDER_MAINTENANCE ? 'Unavailable' : 'Manual Pay'}</div></div>
              </div>
              {JAZZCASH_UNDER_MAINTENANCE ? (
                <span className="bonus-tag" style={{ background: '#3a3a3a', color: '#bbb' }}>Maintenance</span>
              ) : (
                <span className="bonus-tag">+2% Bonus</span>
              )}
              <div className="active-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            </div>
            <div className={`gateway-card ${gateway === 'Easypaisa' ? 'active' : ''}`} onClick={() => setGateway('Easypaisa')}>
              <div className="gateway-info">
                <img src="/image/Easypaisa.png" className="gateway-logo" alt="Easypaisa" onError={(e) => { e.target.style.display = 'none'; }} />
                <div><div className="gateway-name">Easypaisa</div><div className="gateway-type">Manual Pay</div></div>
              </div>
              <span className="bonus-tag">+2% Bonus</span>
              <div className="active-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            </div>
          </div>

          <div className="section-title">2. Select Deposit Amount</div>
          <div className="amount-grid">
            {AMOUNTS.map((a) => (
              <div key={a.val} className={`amount-card ${amount === a.val ? 'active' : ''} ${a.popular ? 'popular' : ''}`} onClick={() => setAmount(a.val)}>
                <div className="amount-val">{a.label || `Rs ${a.val}`}</div>
                <div className="amount-bonus">{a.bonus}</div>
              </div>
            ))}
          </div>

          <div className="input-wrap">
            <span className="currency-label">PKR</span>
            <input type="number" value={amount} min={300} max={50000} placeholder="Enter amount" onChange={(e) => setAmount(parseInt(e.target.value) || '')} />
          </div>

          <button className="deposit-btn" onClick={executeDeposit}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            DEPOSIT NOW
          </button>
        </div>
      )}

      {view === 'process' && (
        <div className="view-panel active">
          <div className="page-header">
            <button className="header-back" onClick={() => setView('main')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="header-title">Submit Payment</span>
            <div style={{ width: '36px' }}></div>
          </div>

          <div className="payment-card">
            <p className="instruction-text">Niche diye gaye account par rakam bhejein aur payment ka screenshot upload karein.</p>
            <div className="account-box">
              <div className="info-row"><span className="info-label">Method</span><span className="info-value gold">{gateway}</span></div>
              <div className="info-row"><span className="info-label">Account Number</span><span className="info-value gold">03163533206</span></div>
              <div className="info-row"><span className="info-label">Account Name</span><span className="info-value">Asif Soomro</span></div>
              <div className="info-row"><span className="info-label">Amount to Send</span><span className="info-value gold">Rs {amount.toLocaleString()}</span></div>
            </div>

            <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <span className="upload-text">{screenshot ? '✓ Screenshot Selected' : 'Upload Payment Screenshot'}</span>
              <span className="upload-subtext">Tap to select image</span>
              <input ref={fileInputRef} type="file" id="fileInput" accept="image/*" onChange={handleFileSelect} />
            </div>

            {screenshot && (
              <div className="preview-container">
                <img src={screenshot} className="preview-img" alt="Screenshot preview" />
              </div>
            )}
          </div>

          <button className="submit-btn" onClick={submitScreenshotAction} disabled={submitting}>
            {submitted ? (
              <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>GO TO WEBSITE</>
            ) : submitting ? (
              'SUBMITTING...'
            ) : (
              <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>SUBMIT PROOF</>
            )}
          </button>
        </div>
      )}

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Deposit;