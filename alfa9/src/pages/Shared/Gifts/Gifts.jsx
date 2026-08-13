import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../utils/api';
import './Gifts.css';

function GiftIconSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="1.5" /><path d="M3 12h18" /><path d="M12 8v13" />
    </svg>
  );
}

function EmptyHistorySvg() {
  return (
    <svg width="90" height="70" viewBox="0 0 120 90" fill="none">
      <defs><linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3A2010" /><stop offset="100%" stopColor="#241407" /></linearGradient></defs>
      <rect x="25" y="15" width="70" height="58" rx="8" fill="url(#emptyGrad)" stroke="#4a3018" strokeWidth="1" />
      <rect x="35" y="28" width="50" height="5" rx="2.5" fill="#4a3018" />
      <rect x="35" y="40" width="35" height="5" rx="2.5" fill="#4a3018" />
      <rect x="35" y="52" width="42" height="5" rx="2.5" fill="#4a3018" />
      <rect x="35" y="64" width="28" height="5" rx="2.5" fill="#4a3018" />
    </svg>
  );
}

function Gifts() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = '') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const loadHistory = () => {
    apiFetch('/gift/my-gifts')
      .then((gifts) => {
        setHistory((gifts || []).filter((g) => g.code && g.claimed).map((g) => ({
          code: g.code,
          amount: `Rs${g.amount.toFixed(2)}`,
          date: new Date(g.claimedAt || g.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
        })));
      })
      .catch(() => {});
  };

  useEffect(() => { loadHistory(); }, []);

  const redeemGift = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { showToast('Please enter a gift code', 'error'); return; }
    if (submitting) return;

    setSubmitting(true);
    apiFetch('/gift/redeem', { method: 'POST', body: { code: trimmed } })
      .then((data) => {
        setCode('');
        showToast(`🎉 Rs${data.amount.toFixed(2)} added to your wallet!`, 'success');
        loadHistory();
      })
      .catch((err) => showToast(err.message || 'Invalid gift code. Please try again.', 'error'))
      .finally(() => setSubmitting(false));
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') redeemGift(); };

  return (
    <div className="gifts-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="page-title">Gift</span>
      </div>

      <div className="hero-banner">
        <img src="/image/giftimagebg.webp" alt="Gift Banner" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="hero-scrim"></div>
      </div>

      <div className="gift-card">
        <div className="gift-icon-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="18" height="13" rx="1.5" /><path d="M3 12h18" /><path d="M12 8v13" />
            <path d="M12 8c-1.2-2.6-3.2-4-4.7-3.1C5.8 5.7 6 8 8 8" /><path d="M12 8c1.2-2.6 3.2-4 4.7-3.1C18.2 5.7 18 8 16 8" />
          </svg>
        </div>
        <div className="gift-hi">Hi</div>
        <div className="gift-subtitle">We have a gift for you</div>
        <div className="gift-label"><GiftIconSvg />Please enter the gift code below</div>
        <div className="gift-input-wrap">
          <span className="gift-input-icon"><GiftIconSvg /></span>
          <input
            type="text"
            className="gift-input"
            placeholder="Please enter gift code"
            maxLength={30}
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="receive-btn" onClick={redeemGift}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Receive
        </button>
      </div>

      <div className="history-card">
        <div className="history-header">
          <div className="history-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 12H15M9 16H13M7 4H4C3 4 2 4.9 2 6V20C2 21.1 3 22 4 22H20C21.1 22 22 21.1 22 20V6C22 4.9 21.1 4 20 4H17M7 4C7 3 7.9 2 9 2H15C16.1 2 17 3 17 4M7 4H17" stroke="#140A03" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="history-title">History</span>
          {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
        </div>
        {history.length === 0 ? (
          <div className="history-empty">
            <EmptyHistorySvg />
            <div className="history-empty-text">No data</div>
          </div>
        ) : (
          <div className="history-list">
            {history.map((h, i) => (
              <div className="history-item" key={i}>
                <div className="history-item-left">
                  <div className="history-item-icon"><GiftIconSvg /></div>
                  <div>
                    <div className="history-item-code">{h.code}</div>
                    <div className="history-item-date">{h.date}</div>
                  </div>
                </div>
                <div className="history-item-amount">{h.amount}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-spacer"></div>

      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Gifts;