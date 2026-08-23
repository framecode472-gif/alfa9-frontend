import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../../../components/Footer/Footer.jsx';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './Wallet.css';

function Wallet() {
  const { t } = useLanguage();
  const [mainBalance, setMainBalance] = useState(() => parseFloat(localStorage.getItem('alfa9_balance') || '0'));
  const [thirdBalance, setThirdBalance] = useState(() => parseFloat(localStorage.getItem('alfa9_third_balance') || '0'));
  const [swapped, setSwapped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [countdownPct, setCountdownPct] = useState(0);
  const [countdownLabel, setCountdownLabel] = useState('Confirm Transfer');
  const [toast, setToast] = useState({ msg: '', show: false });
  const recallTimerRef = useRef(null);

  const total = mainBalance + thirdBalance;
  const mainPct = total > 0 ? Math.round((mainBalance / total) * 100) : 0;
  const thirdPct = total > 0 ? Math.round((thirdBalance / total) * 100) : 0;

  const circleBg = (pct) => {
    const deg = Math.round(pct * 3.6);
    return deg > 0
      ? `conic-gradient(#D4AF37 ${deg}deg, rgba(212,175,55,0.08) ${deg}deg)`
      : `conic-gradient(rgba(212,175,55,0.08) 360deg)`;
  };

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  };

  const openTransferModal = () => {
    setSwapped(false);
    setAmountInput('');
    resetConfirmBtn();
    setModalOpen(true);
  };

  const cancelRecalling = () => {
    if (recallTimerRef.current) {
      clearInterval(recallTimerRef.current);
      recallTimerRef.current = null;
    }
    resetConfirmBtn();
  };

  const closeModal = () => {
    cancelRecalling();
    setModalOpen(false);
  };

  const resetConfirmBtn = () => {
    setConfirming(false);
    setCountdownPct(0);
    setCountdownLabel(t('wallet_confirm_transfer'));
  };

  const swapWallets = () => {
    setSwapped((s) => !s);
    setAmountInput('');
    cancelRecalling();
  };

  const setAllAmount = () => {
    const avail = swapped ? thirdBalance : mainBalance;
    setAmountInput(avail.toFixed(2));
  };

  const doTransfer = (amt) => {
    let nextMain = mainBalance;
    let nextThird = thirdBalance;
    if (!swapped) {
      nextMain -= amt;
      nextThird += amt;
    } else {
      nextThird -= amt;
      nextMain += amt;
    }
    setMainBalance(nextMain);
    setThirdBalance(nextThird);
    localStorage.setItem('alfa9_balance', nextMain.toFixed(2));
    localStorage.setItem('alfa9_third_balance', nextThird.toFixed(2));
    setModalOpen(false);
    showToast(t('wallet_toast_success') + amt.toFixed(2));
    resetConfirmBtn();
  };

  const startRecalling = () => {
    const amt = parseFloat(amountInput || '0');
    if (!amt || amt <= 0) { showToast(t('wallet_toast_enter_valid')); return; }
    const avail = swapped ? thirdBalance : mainBalance;
    if (amt > avail) { showToast(t('wallet_toast_insufficient')); return; }

    setConfirming(true);
    const DURATION = 5000;
    const INTERVAL = 50;
    let elapsed = 0;
    let secs = 5;
    setCountdownLabel(`${t('wallet_recalling')} ${secs}`);

    recallTimerRef.current = setInterval(() => {
      elapsed += INTERVAL;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setCountdownPct(pct);

      const remaining = Math.ceil((DURATION - elapsed) / 1000);
      if (remaining !== secs) {
        secs = remaining;
        setCountdownLabel(secs > 0 ? `${t('wallet_recalling')} ${secs}` : t('wallet_transferring'));
      }

      if (elapsed >= DURATION) {
        clearInterval(recallTimerRef.current);
        recallTimerRef.current = null;
        doTransfer(amt);
      }
    }, INTERVAL);
  };

  useEffect(() => () => { if (recallTimerRef.current) clearInterval(recallTimerRef.current); }, []);

  return (
    <div className="wallet-page">
      <div className="header">
        <span className="ember"></span><span className="ember"></span><span className="ember"></span>
        <div className="header-top">
          <Link to="/account" className="back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <span className="header-title">{t('wallet_title')}</span>
          <div className="header-right"></div>
        </div>
        <div className="balance-hero">
          <div className="wallet-icon-wrap">
            <img src="/image/walletimage.png" alt="Wallet" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="balance-amount">Rs{total.toFixed(2)}</div>
          <div className="balance-sub">{t('wallet_total_balance')}</div>
        </div>
      </div>

      <div className="main-card">
        <div className="wallets-row">
          <div className="wallet-item">
            <div className="wallet-circle" style={{ background: circleBg(mainPct) }}>
              <div className="wallet-circle-inner"><span className="circle-pct">{mainPct}%</span></div>
            </div>
            <div className="wallet-label-row">
              <div className="wallet-amount">Rs{mainBalance.toFixed(2)}</div>
              <div className="wallet-name">{t('wallet_main_wallet')}</div>
            </div>
          </div>
          <div className="wallets-divider"></div>
          <div className="wallet-item">
            <div className="wallet-circle" style={{ background: circleBg(thirdPct) }}>
              <div className="wallet-circle-inner"><span className="circle-pct">{thirdPct}%</span></div>
            </div>
            <div className="wallet-label-row">
              <div className="wallet-amount">Rs{thirdBalance.toFixed(2)}</div>
              <div className="wallet-name">{t('wallet_3rd_party_wallet')}</div>
            </div>
          </div>
        </div>
        <button className="transfer-btn" onClick={openTransferModal}>⇄ &nbsp; {t('wallet_transfer_btn')}</button>
      </div>

      <div className="actions-row">
        <Link className="act-item" to="/account/deposit">
          <div className="act-icon">
            <img src="/image/deposit-wallet.png" alt="Deposit" />
          </div>
          <span className="act-label">{t('acc_deposit')}</span>
        </Link>
        <Link className="act-item" to="/account/withdraw">
          <div className="act-icon">
            <img src="/image/withdrawal-wallet.png" alt="Withdraw" />
          </div>
          <span className="act-label">{t('acc_withdraw')}</span>
        </Link>
        <Link className="act-item" to="/account/deposit-history">
          <div className="act-icon">
            <img src="/image/deposit.png" alt="Deposit History" />
          </div>
          <span className="act-label">{t('wallet_deposit_history')}</span>
        </Link>
        <Link className="act-item" to="/account/withdraw-history">
          <div className="act-icon">
            <img src="/image/withdrwal-image.png" alt="Withdrawal History" />
          </div>
          <span className="act-label">{t('wallet_withdrawal_history')}</span>
        </Link>
      </div>

      <div className="section-label">{t('wallet_game_wallets')}</div>
      <div className="game-wallets">
        <div className="gw-card" onClick={() => showToast(t('wallet_toast_argame'))}>
          <div className="gw-top-row">
            <div className="gw-icon-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 9l10 6 10-6-10-6z" fill="white" opacity="0.9" /><path d="M2 15l10 6 10-6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" /></svg></div>
            <span className="gw-transfer-link">{t('wallet_transfer_link')} ›</span>
          </div>
          <div className="gw-amount">0.00</div>
          <div className="gw-name">ARGame</div>
          <div className="gw-bar-wrap"><div className="gw-bar-fill" style={{ width: '0%' }}></div></div>
        </div>
        <div className="gw-card" onClick={() => showToast(t('wallet_toast_lottery'))}>
          <div className="gw-top-row">
            <div className="gw-icon-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white" opacity="0.85" /><text x="12" y="16" fontSize="9" fill="#7C3AED" fontWeight="bold" textAnchor="middle">★</text></svg></div>
            <span className="gw-transfer-link">{t('wallet_transfer_link')} ›</span>
          </div>
          <div className="gw-amount">0.00</div>
          <div className="gw-name">{t('cat_lottery')}</div>
          <div className="gw-bar-wrap"><div className="gw-bar-fill" style={{ width: '0%' }}></div></div>
        </div>
        <div className="gw-card" onClick={() => showToast(t('wallet_toast_sports'))}>
          <div className="gw-top-row">
            <div className="gw-icon-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill="white" opacity="0.85" /><path d="M8 12a4 4 0 0 0 8 0" stroke="#059669" strokeWidth="2" /></svg></div>
            <span className="gw-transfer-link">{t('wallet_transfer_link')} ›</span>
          </div>
          <div className="gw-amount">0.00</div>
          <div className="gw-name">{t('cat_sports')}</div>
          <div className="gw-bar-wrap"><div className="gw-bar-fill" style={{ width: '0%' }}></div></div>
        </div>
        <div className="gw-card" onClick={() => showToast(t('wallet_toast_casino'))}>
          <div className="gw-top-row">
            <div className="gw-icon-badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="3" fill="white" opacity="0.85" /><circle cx="8" cy="12" r="1.5" fill="#D97706" /><circle cx="12" cy="12" r="1.5" fill="#D97706" /><circle cx="16" cy="12" r="1.5" fill="#D97706" /></svg></div>
            <span className="gw-transfer-link">{t('wallet_transfer_link')} ›</span>
          </div>
          <div className="gw-amount">0.00</div>
          <div className="gw-name">{t('cat_casino')}</div>
          <div className="gw-bar-wrap"><div className="gw-bar-fill" style={{ width: '0%' }}></div></div>
        </div>
      </div>

      <Footer active="account" />

      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.msg}</div>

      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-sheet">
          <div className="modal-handle"></div>
          <div className="modal-title">{t('wallet_modal_title')}</div>
          <div className="modal-subtitle">{swapped ? `${t('wallet_3rd_party_short')} \u2192 ${t('wallet_main_wallet')}` : `${t('wallet_main_wallet')} \u2192 ${t('wallet_3rd_party_short')}`}</div>
          <div className="modal-dir-row">
            <div className="modal-dir-box">
              <div className="dir-label">{t('wallet_from')}</div>
              <div className="dir-val">{swapped ? t('wallet_3rd_party_short') : t('wallet_main_wallet')}</div>
            </div>
            <button className="modal-swap-btn" onClick={swapWallets} title="Swap direction">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round"><path d="M7 16V4m0 0L4 7m3-3l3 3" /><path d="M17 8v12m0 0l3-3m-3 3l-3-3" /></svg>
            </button>
            <div className="modal-dir-box">
              <div className="dir-label">{t('wallet_to')}</div>
              <div className="dir-val">{swapped ? t('wallet_main_wallet') : t('wallet_3rd_party_short')}</div>
            </div>
          </div>
          <div className="modal-amount-row">
            <span className="modal-amount-label">Rs</span>
            <input className="modal-amount-input" type="number" placeholder="0.00" min="0" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
            <button className="modal-all-btn" onClick={setAllAmount}>{t('all')}</button>
          </div>
          <button className="modal-confirm-btn" disabled={confirming} onClick={startRecalling}>
            <div className="btn-countdown-fill" style={{ width: `${countdownPct}%` }}></div>
            <span className="btn-label">{countdownLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Wallet;