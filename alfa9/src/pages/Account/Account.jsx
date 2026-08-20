import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addLogoutNotif } from '../Shared/Notification/notifUtils';
import { apiFetch } from '../../utils/api';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './Account.css';

/* ══ SHARED AVATAR LIST — must be identical to Settings page ══ */
/* NOTE: paths must start with "/" (not "./") so they always resolve
   from the site root, regardless of which route (e.g. /account or
   /account/settings) the page is currently on. Using "./" was the
   bug that made avatars break / not match between pages. */
const AVATARS = [
  '/image/ava-1.webp', '/image/ava-2.png',  '/image/ava-3.png',
  '/image/ava-4.png',  '/image/ava-5.png',  '/image/ava-6.png',
  '/image/ava-7.png',  '/image/ava-8.png',  '/image/ava-9.png',
  '/image/ava-10.png', '/image/ava-11.png', '/image/ava-12.png',
  '/image/ava-13.png', '/image/ava-14.png',
];

/* ══ Shared keys so Account & Settings always agree ══ */
const AVATAR_STORAGE_KEY = 'alfa9_avatar';
const AVATAR_EVENT = 'alfa9-avatar-change';

export default function Account() {
  const navigate = useNavigate();
  const { t, language, languages } = useLanguage();
  const [showLangSwitcher, setShowLangSwitcher] = useState(false);
  const currentLangNative = languages.find((l) => l.code === language)?.native || 'English';

  const [userName, setUserName] = useState('USER');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [uid, setUid] = useState('—');
  const [balance, setBalance] = useState(0);
  const [vipLevel, setVipLevel] = useState(0);
  const [lastLoginTime, setLastLoginTime] = useState('—');

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [nameInput, setNameInput] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const toastTimerRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const nameInputRef = useRef(null);

  // initial load — same behaviour as original inline script
  useEffect(() => {
    const name = localStorage.getItem('alfa9_username') || localStorage.getItem('alfa9_name');
    if (name && name.trim()) setUserName(name.trim().toUpperCase());

    const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (savedAvatar) setAvatar(savedAvatar);

    const bal = parseFloat(localStorage.getItem('alfa9_balance') || '0');
    setBalance(bal);

    const stored = localStorage.getItem('alfa9_last_login');
    if (stored) setLastLoginTime(stored);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    localStorage.setItem('alfa9_last_login', ts);

    // Real balance + UID from the backend — the localStorage value above is
    // just a fast first paint; it can go stale after playing a game, so we
    // always confirm against the DB right after.
    fetchRealProfile();
  }, []);

  const fetchRealProfile = async () => {
    try {
      const data = await apiFetch('/user/profile');
      setBalance(data.user.balance);
      setUid(data.user.uid || (data.user._id ? data.user._id.slice(-6) : '—'));
      setVipLevel(data.user.vip?.level || 0);
      localStorage.setItem('alfa9_balance', String(data.user.balance));
    } catch (err) {
      // not logged in yet, or backend unreachable — the cached values above still show
    }
  };

  // ══ Keep avatar in sync with the Settings page (and any other tab)
  // instantly — no reload needed in either direction. ══
  useEffect(() => {
    const onAvatarEvent = (e) => {
      if (e.detail) {
        setAvatar(e.detail);
        setSelectedAvatar(e.detail);
      }
    };
    const onStorage = (e) => {
      if (e.key === AVATAR_STORAGE_KEY && e.newValue) {
        setAvatar(e.newValue);
        setSelectedAvatar(e.newValue);
      }
    };
    window.addEventListener(AVATAR_EVENT, onAvatarEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AVATAR_EVENT, onAvatarEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    setToastShow(true);
    toastTimerRef.current = setTimeout(() => setToastShow(false), 2200);
  };

  const openAvatarModal = () => {
    const currentAvatar = localStorage.getItem(AVATAR_STORAGE_KEY) || AVATARS[0];
    setSelectedAvatar(currentAvatar);
    setAvatarModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAvatarModal = () => {
    setAvatarModalOpen(false);
    document.body.style.overflow = '';
  };

  // Tapping an avatar applies it immediately — no separate "Confirm" click needed.
  // Also broadcasts the change so the Settings page (or any other open tab)
  // updates itself instantly, without a page reload.
  const applyAvatar = (url) => {
    if (!url) return;
    localStorage.setItem(AVATAR_STORAGE_KEY, url);
    setAvatar(url);
    setSelectedAvatar(url);
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: url }));
    closeAvatarModal();
    showToast('Avatar updated!');
  };

  const openNameModal = () => {
    const current = localStorage.getItem('alfa9_username') || localStorage.getItem('alfa9_name') || '';
    setNameInput(current);
    setNameModalOpen(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => nameInputRef.current && nameInputRef.current.focus(), 300);
  };

  const closeNameModal = () => {
    setNameModalOpen(false);
    document.body.style.overflow = '';
  };

  const wordCount = nameInput.trim() === '' ? 0 : nameInput.trim().split(/\s+/).length;

  const handleNameInput = (e) => {
    const val = e.target.value;
    const words = val.trim() === '' ? [] : val.trim().split(/\s+/);
    if (words.length > 8) {
      setNameInput(words.slice(0, 8).join(' '));
    } else {
      setNameInput(val);
    }
  };

  const saveName = () => {
    const val = nameInput.trim();
    if (!val) { showToast('Name cannot be empty'); return; }
    localStorage.setItem('alfa9_username', val);
    localStorage.setItem('alfa9_name', val);
    setUserName(val.toUpperCase());
    closeNameModal();
    showToast('Name updated!');
  };

  const copyUID = () => {
    navigator.clipboard.writeText(uid).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = uid;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    showToast('UID Copied: ' + uid);
  };

  const refreshBalance = () => {
    setRefreshing(true);
    fetchRealProfile().finally(() => {
      setTimeout(() => setRefreshing(false), 650);
      showToast('Balance refreshed');
    });
  };

  const openLogoutModal = () => {
    setLogoutModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLogoutModal = () => {
    setLogoutModalOpen(false);
    document.body.style.overflow = '';
  };

const confirmLogout = () => {
    addLogoutNotif();
    // Previously only 3 keys were cleared here (username/name/balance), while
    // the auth token, cached user object, avatar, and last-login timestamp —
    // plus the old shared payment-account cache — all stayed behind. That's
    // exactly why a brand-new account could appear to "already have" a
    // previous account's Easypaisa/JazzCash number: nothing was ever wiped.
    localStorage.removeItem('alfa9_token');
    localStorage.removeItem('alfa9_user');
    localStorage.removeItem('alfa9_username');
    localStorage.removeItem('alfa9_name');
    localStorage.removeItem('alfa9_balance');
    localStorage.removeItem('alfa9_avatar');
    localStorage.removeItem('alfa9_last_login');
    localStorage.removeItem('alfa9_session');
    closeLogoutModal();
    navigate('/auth');   // ✅ ab seedha login form khulega
};

  return (
    <div className="account-page">
      <div className="hero">
        <span className="ember"></span><span className="ember"></span><span className="ember"></span>
        <div className="hero-row">
          <div className="avatar-wrap" onClick={openAvatarModal}>
            <div className="avatar-ring">
              <img
                className="avatar-img"
                src={avatar}
                alt="Avatar"
                onError={(e) => { e.target.style.background = '#2a1a08'; }}
              />
            </div>
            <div className="vip-badge">VIP {vipLevel}</div>
          </div>
          <div className="hero-info">
            <div className="name-row">
              <div className="hero-name">{userName}</div>
              <div className="name-edit-btn" onClick={openNameModal}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </div>
            <div className="uid-row">
              <span className="uid-label">{t('acc_uid')}</span>
              <span className="uid-value">{uid}</span>
              <div className="uid-copy" onClick={copyUID} title="Copy UID">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
            </div>
            <div className="last-login">{t('acc_last_login')} <span>{lastLoginTime}</span></div>
          </div>
        </div>
      </div>

      <div className="balance-card">
        <div className="balance-label">{t('acc_total_balance')}</div>
        <div className="balance-row">
          <div className="balance-amount">Rs{balance.toFixed(2)}</div>
          <div className={`refresh-btn${refreshing ? ' spinning' : ''}`} onClick={refreshBalance} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
        </div>
        <div className="quick-actions">
          <div className="qa-item" onClick={() => navigate('/account/wallet')}>
            <div className="qa-icon wallet"><img src="./image/account-wallet.png" alt="Wallet" /></div>
            <span className="qa-label">{t('acc_wallet')}</span>
          </div>
          <div className="qa-item" onClick={() => navigate('/account/deposit')}>
            <div className="qa-icon deposit"><img src="./image/deposit-wallet.png" alt="Deposit" /></div>
            <span className="qa-label">{t('acc_deposit')}</span>
          </div>
          <div className="qa-item" onClick={() => navigate('/account/withdraw')}>
            <div className="qa-icon withdraw"><img src="./image/withdrawal-wallet.png" alt="Withdraw" /></div>
            <span className="qa-label">{t('acc_withdraw')}</span>
          </div>
          <div className="qa-item" onClick={() => navigate('/account/vip')}>
            <div className="qa-icon vip"><img src="./image/VIP-wallet.png" alt="VIP" /></div>
            <span className="qa-label">{t('acc_vip')}</span>
          </div>
        </div>
      </div>

      <div className="safe-banner" onClick={() => navigate('/account/safe')}>
        <div className="safe-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="15" rx="2" fill="rgba(20,10,3,0.5)" stroke="#140A03" strokeWidth="1" />
            <circle cx="12" cy="13" r="3.5" stroke="#140A03" strokeWidth="1.5" />
            <circle cx="12" cy="13" r="1.2" fill="#140A03" />
            <path d="M8 6V4a4 4 0 0 1 8 0v2" stroke="#140A03" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="safe-info">
          <div className="safe-title">{t('acc_safe')}</div>
          <div className="safe-desc">{t('acc_safe_desc')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="safe-amount">Rs0.00</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      </div>

      <div className="section-label">{t('acc_my_history')}</div>
      <div className="history-grid">
        <Link className="hist-card" to="/account/game-history">
          <div className="hist-icon"><img src="./image/Game History.png" alt="Game History" /></div>
          <div className="hist-text"><div className="hist-title">{t('acc_game_history')}</div><div className="hist-sub">{t('acc_game_history_sub')}</div></div>
        </Link>
        <Link className="hist-card" to="/account/transaction">
          <div className="hist-icon"><img src="./image/Transaction.png" alt="Transaction" /></div>
          <div className="hist-text"><div className="hist-title">{t('acc_transaction')}</div><div className="hist-sub">{t('acc_transaction_sub')}</div></div>
        </Link>
        <Link className="hist-card" to="/account/deposit-history">
          <div className="hist-icon"><img src="./image/deposit.png" alt="Deposit History" /></div>
          <div className="hist-text"><div className="hist-title">{t('acc_deposit')}</div><div className="hist-sub">{t('acc_deposit_sub')}</div></div>
        </Link>
        <Link className="hist-card" to="/account/withdraw-history">
          <div className="hist-icon"><img src="./image/withdrwal-image.png" alt="Withdraw History" /></div>
          <div className="hist-text"><div className="hist-title">{t('acc_withdraw')}</div><div className="hist-sub">{t('acc_withdraw_sub')}</div></div>
        </Link>
      </div>

      <div className="section-label">{t('acc_settings_more')}</div>
      <div className="settings-list">
        <Link className="set-item" to="/notification">
          <div className="set-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div>
          <span className="set-label">{t('acc_notification')}</span>
          <svg className="set-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link className="set-item" to="/gifts">
          <div className="set-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></div>
          <span className="set-label">{t('acc_gifts')}</span>
          <svg className="set-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link className="set-item" to="/account/game-stats">
          <div className="set-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></div>
          <span className="set-label">{t('acc_game_stats')}</span>
          <svg className="set-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <a className="set-item" href="#" onClick={(e) => { e.preventDefault(); setShowLangSwitcher(true); }}>
          <div className="set-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></div>
          <span className="set-label">{t('language')}</span>
          <span className="set-value">{currentLangNative}</span>
          <svg className="set-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </a>
      </div>

      <div className="section-label">{t('acc_service_center')}</div>
      <div className="service-grid">
        <div className="svc-card" onClick={() => navigate('/account/settings')}>
          <div className="svc-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></div>
          <span className="svc-label">{t('acc_settings')}</span>
        </div>
        <div className="svc-card" onClick={() => navigate('/account/feedback')}>
          <div className="svc-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
          <span className="svc-label">{t('acc_feedback')}</span>
        </div>
        <div className="svc-card" onClick={() => navigate('/notification')}>
          <div className="svc-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg></div>
          <span className="svc-label">{t('acc_announcement')}</span>
        </div>

        <div className="svc-card" onClick={() => navigate('/customer-service')}>
          <div className="svc-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="url(#cs-gold)" />
              <circle cx="8.5" cy="11" r="1.2" fill="#140A03" />
              <circle cx="12" cy="11" r="1.2" fill="#140A03" />
              <circle cx="15.5" cy="11" r="1.2" fill="#140A03" />
              <defs>
                <linearGradient id="cs-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F3DA95" />
                  <stop offset="50%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#7A581C" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="svc-label">{t('acc_customer_service')}</span>
        </div>

        <div className="svc-card" onClick={() => navigate('/account/beginner-guide')}>
          <div className="svc-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg></div>
          <span className="svc-label">{t('acc_beginner_guide')}</span>
        </div>

        <div className="svc-card" onClick={() => navigate('/account/about-us')}>
          <div className="svc-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></div>
          <span className="svc-label">{t('acc_about_us')}</span>
        </div>
      </div>

      <button className="logout-btn" onClick={openLogoutModal}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
        </svg>
        {t('logout')}
      </button>

      <div className="casino-sticky-container">
        <div className="casino-footer-bar">
          <Link to="/home" className="casino-nav-item" style={{ textDecoration: 'none' }}>
            <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 46 42" fill="none" filter="url(#account-luxury-3d)">
              <path d="M9 29C9 20 14 15 23 15C32 15 37 20 37 29H9Z" fill="url(#account-ruby-gradient)" opacity="0.85" />
              <path d="M7 27C7 25 9 24 12 24H34C37 24 39 25 39 27V31C39 33 37 34 34 34H12C9 34 7 33 7 31V27Z" fill="url(#account-gold-5d)" />
              <circle cx="14" cy="29" r="1.5" fill="#FFFBF0" /><circle cx="23" cy="29" r="1.5" fill="#FFFBF0" /><circle cx="32" cy="29" r="1.5" fill="#FFFBF0" />
              <path d="M23 4L27.5 17L23 25L18.5 17L23 4Z" fill="url(#account-gold-5d)" />
              <path d="M11 9L16.5 19L13 25L8.5 19L11 9Z" fill="url(#account-gold-5d)" />
              <path d="M35 9L37.5 19L33 25L29.5 19L35 9Z" fill="url(#account-gold-5d)" />
              <circle cx="23" cy="2" r="2" fill="url(#account-gold-5d)" /><circle cx="11" cy="7" r="1.5" fill="url(#account-gold-5d)" /><circle cx="35" cy="7" r="1.5" fill="url(#account-gold-5d)" />
              <path d="M9 34H37V36H9V34Z" fill="url(#account-gold-5d)" />
            </svg>
            <span className="casino-nav-text">Home</span>
          </Link>
          <Link to="/activity" className="casino-nav-item" style={{ textDecoration: 'none' }}>
            <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 46 42" fill="none" filter="url(#account-luxury-3d)">
              <path d="M6 35C6 35 13 37.5 23 37.5C33 37.5 40 35 40 35V38.5C40 38.5 33 40.5 23 40.5C13 40.5 6 38.5 6 38.5V35Z" fill="url(#account-gold-5d)" />
              <path d="M23 11C23 11 15 7.5 6 10V30.5C15 28 23 31.5 23 31.5C23 31.5 31 28 40 30.5V10C31 7.5 23 11 23 11Z" fill="#FFFBF0" stroke="url(#account-gold-5d)" strokeWidth="1.8" />
              <rect x="22.25" y="9" width="1.5" height="22.5" fill="url(#account-gold-5d)" />
              <path d="M23 3L26 6L23 9L20 6L23 3Z" fill="url(#account-gold-5d)" />
            </svg>
            <span className="casino-nav-text">Activity</span>
          </Link>
          <Link to="/spin" className="casino-wheel-wrapper">
            <div className="wheel-image-container"><img className="wheel-img" src="./image/Spin Wheel.png" alt="Spin" /></div>
            <span className="wheel-text">Get Rs3,000</span>
          </Link>
          <Link to="/promotion" className="casino-nav-item" style={{ textDecoration: 'none' }}>
            <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 45 42" fill="none" filter="url(#account-luxury-3d)">
              <path d="M22.5 12C16 12 10.5 15 10.5 24.5C10.5 33 15 37.5 22.5 37.5C30 37.5 34.5 33 34.5 24.5C34.5 15 29 12 22.5 12Z" fill="url(#account-leather-gradient)" stroke="url(#account-gold-5d)" strokeWidth="1.5" />
              <circle cx="22.5" cy="25.5" r="6" fill="url(#account-gold-5d)" />
              <text x="22.5" y="28.5" fontFamily="sans-serif" fontSize="9px" fontWeight="bold" fill="#140A03" textAnchor="middle">$</text>
            </svg>
            <span className="casino-nav-text">Promotion</span>
          </Link>
          <Link to="/account" className="casino-nav-item active-tab" style={{ textDecoration: 'none' }}>
            <svg className="casino-nav-svg" width="28" height="26" viewBox="0 0 45 42" fill="none" filter="url(#account-luxury-3d)">
              <circle cx="22.5" cy="21" r="18" fill="#1C1109" stroke="url(#account-gold-5d)" strokeWidth="2" />
              <circle cx="22.5" cy="21" r="14" fill="url(#account-leather-gradient)" />
              <path d="M16.5 15.5L19 18L22.5 14.5L26 18L28.5 15.5V20H16.5V15.5Z" fill="url(#account-gold-5d)" />
              <circle cx="22.5" cy="23.5" r="3" fill="url(#account-gold-5d)" />
              <path d="M16 31.5C18 29.5 27 29.5 29 31.5V33.5H16V31.5Z" fill="url(#account-gold-5d)" />
            </svg>
            <span className="casino-nav-text" style={{ color: '#FFF3CD' }}>Account</span>
          </Link>
        </div>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="account-luxury-3d" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feOffset in="blur" dx="0.5" dy="1.5" result="offset" />
              <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1.2" specularExponent="12" lightingColor="#FFEFA6" result="specOut">
                <fePointLight x="-50" y="-100" z="150" />
              </feSpecularLighting>
              <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specChar" />
              <feComposite in="SourceGraphic" in2="specChar" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
            </filter>
            <linearGradient id="account-gold-5d" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7A581C" /><stop offset="25%" stopColor="#D4AF37" />
              <stop offset="45%" stopColor="#FFF3CD" /><stop offset="55%" stopColor="#E1B743" />
              <stop offset="75%" stopColor="#A67C1E" /><stop offset="100%" stopColor="#F3DA95" />
            </linearGradient>
            <linearGradient id="account-ruby-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E52525" /><stop offset="100%" stopColor="#5A0000" />
            </linearGradient>
            <linearGradient id="account-leather-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4E2F13" /><stop offset="100%" stopColor="#140A03" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {avatarModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeAvatarModal(); }}>
          <div className="avatar-modal">
            <div className="modal-handle"></div>
            <div className="modal-title">{t('change_avatar')}</div>
            <div className="avatar-grid">
              {AVATARS.map((url, i) => (
                <div
                  key={url}
                  className={`avatar-option${url === selectedAvatar ? ' selected' : ''}`}
                  onClick={() => applyAvatar(url)}
                >
                  <img src={url} alt={`Avatar ${i + 1}`} />
                  <div className="check-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
              ))}
            </div>
            {/* Tap any avatar above to apply it instantly — no confirm step needed. */}
          </div>
        </div>
      )}

      {nameModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeNameModal(); }}>
          <div className="name-modal">
            <div className="modal-handle"></div>
            <div className="modal-title">{t('edit_name')}</div>
            <div className="name-input-wrap">
              <input
                ref={nameInputRef}
                className="name-input"
                type="text"
                maxLength={40}
                placeholder={t('enter_name_placeholder')}
                value={nameInput}
                onChange={handleNameInput}
              />
              <span className="name-char-count">{wordCount}/8</span>
            </div>
            <div className="name-hint">{t('name_max_words')}</div>
            <div className="name-modal-btns">
              <button className="btn-cancel" onClick={closeNameModal}>{t('cancel')}</button>
              <button className="btn-confirm" onClick={saveName}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {logoutModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeLogoutModal(); }}>
          <div className="name-modal">
            <div className="modal-handle"></div>
            <div className="modal-title">{t('logout_title')}</div>
            <p style={{ color: '#B8935A', fontSize: '14px', textAlign: 'center', margin: '10px 0 22px', lineHeight: '1.5' }}>
              {t('logout_confirm_msg')}
            </p>
            <div className="name-modal-btns">
              <button className="btn-cancel" onClick={closeLogoutModal}>{t('cancel')}</button>
              <button className="btn-confirm" onClick={confirmLogout}>{t('logout_title')}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>

      <LanguageSwitcher open={showLangSwitcher} onClose={() => setShowLangSwitcher(false)} />
    </div>
  );
}