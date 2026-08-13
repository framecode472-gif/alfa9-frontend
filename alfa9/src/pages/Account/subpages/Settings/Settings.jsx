import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const AVATARS = [
  '/image/ava-1.webp', '/image/ava-2.png', '/image/ava-3.png',
  '/image/ava-4.png', '/image/ava-5.png', '/image/ava-6.png',
  '/image/ava-7.png', '/image/ava-8.png', '/image/ava-9.png',
  '/image/ava-10.png', '/image/ava-11.png', '/image/ava-12.png',
  '/image/ava-13.png', '/image/ava-14.png',
];

/* ══ Shared keys so Account & Settings always agree ══ */
const AVATAR_STORAGE_KEY = 'alfa9_avatar';
const AVATAR_EVENT = 'alfa9-avatar-change';

const EYE_OPEN = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EYE_CLOSED = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const OTP_COOLDOWN_SECS = 60;
const OTP_STORE_KEY = 'alfa9_otp_store';

function getOtpStore() {
  try {
    const raw = localStorage.getItem(OTP_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// otp = null when a real backend is handling verification (nothing to compare locally,
// this just persists the cooldown timer). otp = code when using the local dev fallback.
function startOtpTimer(email, otp = null) {
  const expiry = Date.now() + OTP_COOLDOWN_SECS * 1000;
  localStorage.setItem(OTP_STORE_KEY, JSON.stringify({ email, otp, expiry }));
  return expiry;
}

function clearOtpStore() {
  localStorage.removeItem(OTP_STORE_KEY);
}

function getRemainingOtpSecs() {
  const store = getOtpStore();
  if (!store) return 0;
  const remaining = Math.ceil((store.expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

// Pushes the OTP as a notification into the same list the Notification page reads,
// instead of exposing the code directly in the UI/toast.
function pushOtpNotification(email, otp) {
  try {
    const key = 'alfa9_notifs';
    const raw = localStorage.getItem(key);
    const notifs = raw ? JSON.parse(raw) : [];
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    notifs.unshift({
      id: 'notif_' + Date.now(),
      title: 'VERIFICATION CODE',
      body: `Your verification code for binding ${email} is ${otp}. Do not share this code with anyone. It will expire shortly.`,
      date: dateStr,
      ts: now.getTime(),
    });
    localStorage.setItem(key, JSON.stringify(notifs));
  } catch {
    /* noop */
  }
}

function Settings() {
  const navigate = useNavigate();
  const [view, setView] = useState('settings'); // settings | avatar | password | mail

  const [nickname, setNickname] = useState(() => {
    const n = localStorage.getItem('alfa9_username') || localStorage.getItem('alfa9_name');
    return n && n.trim() ? n.trim().toUpperCase() : 'USER';
  });
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);

  const [uid] = useState(() => localStorage.getItem('alfa9_uid') || '1184061');

  const [avatar, setAvatar] = useState(() => localStorage.getItem(AVATAR_STORAGE_KEY) || AVATARS[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(avatar);

  const [email, setEmail] = useState(() => localStorage.getItem('alfa9_email') || '');
  const [emailInput, setEmailInput] = useState(() => {
    const store = getOtpStore();
    return store && Date.now() <= store.expiry ? store.email : '';
  });
  const [otpInput, setOtpInput] = useState('');
  const [otpSecs, setOtpSecs] = useState(0);
  const otpTimerRef = useRef(null);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [oldPassVisible, setOldPassVisible] = useState(false);
  const [newPassVisible, setNewPassVisible] = useState(false);
  const [confirmPassVisible, setConfirmPassVisible] = useState(false);

  const [toast, setToast] = useState({ show: false, msg: '' });
  const toastTimer = useRef(null);

  const tickOtpCountdown = () => {
    clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      const remaining = getRemainingOtpSecs();
      setOtpSecs(remaining);
      if (remaining <= 0) clearInterval(otpTimerRef.current);
    }, 1000);
  };

  useEffect(() => {
    const remaining = getRemainingOtpSecs();
    if (remaining > 0) {
      setOtpSecs(remaining);
      tickOtpCountdown();
    }
    return () => clearInterval(otpTimerRef.current);
  }, []);

  // ══ Keep avatar in sync with the Account page (and any other tab)
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
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  };

  const openView = (v) => {
    setView(v);
    window.scrollTo(0, 0);
    if (v === 'avatar') setSelectedAvatar(avatar);
  };

  // Tapping an avatar applies it immediately — no separate "Confirm Selection"
  // click needed. Also broadcasts the change so the Account page (or any other
  // open tab) updates itself instantly, without a page reload.
  const applyAvatar = (url) => {
    if (!url) return;
    localStorage.setItem(AVATAR_STORAGE_KEY, url);
    setAvatar(url);
    setSelectedAvatar(url);
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: url }));
    showToast('Avatar updated successfully!');
    openView('settings');
  };

  const openNicknameModal = () => { setNicknameInput(nickname); setNicknameModalOpen(true); };
  const confirmNickname = () => {
    const val = nicknameInput.trim();
    if (!val) { showToast('Enter a nickname'); return; }
    const upper = val.toUpperCase();
    setNickname(upper);
    localStorage.setItem('alfa9_username', val);
    setNicknameModalOpen(false);
    showToast('Nickname updated!');
  };

  const copyUID = () => {
    navigator.clipboard.writeText(uid).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = uid; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    });
    showToast('UID Copied: ' + uid);
  };

  const savePassword = () => {
    if (!oldPass) { showToast('Enter current password'); return; }
    if (newPass.length < 6) { showToast('Password must be 6+ characters'); return; }
    if (newPass !== confirmPass) { showToast('Passwords do not match'); return; }
    localStorage.setItem('alfa9_pass', newPass);
    showToast('Password changed successfully!');
    setOldPass(''); setNewPass(''); setConfirmPass('');
    setTimeout(() => openView('settings'), 1200);
  };

  const sendOTP = () => {
    const em = emailInput.trim();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      showToast('Please enter a valid email');
      return;
    }
    fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, appName: 'Alfa-9' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          showToast('OTP sent to ' + em);
          startOtpTimer(em); // real backend verifies the code, we only persist the cooldown
          setOtpSecs(OTP_COOLDOWN_SECS);
          tickOtpCountdown();
        } else {
          showToast(data.message || 'Failed to send OTP');
        }
      })
      .catch(() => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        startOtpTimer(em, otp);
        pushOtpNotification(em, otp);
        showToast('OTP sent — check your notifications');
        setOtpSecs(OTP_COOLDOWN_SECS);
        tickOtpCountdown();
      });
  };

  const onBindSuccess = (em) => {
    localStorage.setItem('alfa9_email', em);
    setEmail(em);
    clearOtpStore();
    clearInterval(otpTimerRef.current);
    setOtpSecs(0);
    setOtpInput('');
    showToast('Email bound successfully!');
    setTimeout(() => openView('settings'), 1200);
  };

  const bindEmail = () => {
    const em = emailInput.trim();
    const otp = otpInput.trim();
    if (!em) { showToast('Enter your email'); return; }
    if (!otp || otp.length < 6) { showToast('Enter the 6-digit OTP'); return; }
    fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, otp }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) onBindSuccess(em);
        else showToast(data.message || 'Invalid OTP');
      })
      .catch(() => {
        const store = getOtpStore();
        if (!store || store.email !== em) {
          showToast('Request a new code for this email');
        } else if (Date.now() > store.expiry) {
          showToast('Your code has expired. Request a new one.');
        } else if (store.otp === otp) {
          onBindSuccess(em);
        } else {
          showToast('Invalid OTP. Check code.');
        }
      });
  };

  return (
    <div className="settings-page">
      {view === 'settings' && (
        <div className="view active">
          <div className="page-header">
            <div className="back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </div>
            <span className="page-title">Settings Center</span>
            <div className="header-right"></div>
          </div>

          <div className="profile-card">
            <div className="avatar-row" onClick={() => openView('avatar')}>
              <div className="avatar-left">
                <div className="avatar-ring">
                  <img className="avatar-img" src={avatar} alt="Avatar" onError={(e) => { e.currentTarget.style.background = '#2a1a08'; }} />
                </div>
                <div className="avatar-label-col">
                  <span className="avatar-label">Profile photo</span>
                  <span className="avatar-hint">Change avatar</span>
                </div>
              </div>
              <div className="row-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </div>

            <div className="info-row" onClick={openNicknameModal}>
              <span className="info-label">Nickname</span>
              <div className="info-right">
                <span className="info-value">{nickname}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </div>

            <div className="info-row" style={{ cursor: 'default' }}>
              <span className="info-label">UID</span>
              <div className="info-right">
                <span className="info-value">{uid}</span>
                <div className="uid-copy-btn" onClick={copyUID}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="section-label">Security Information</div>
          <div className="settings-list">
            <div className="set-row" onClick={() => openView('password')}>
              <div className="set-ico lock-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="set-text">
                <div className="set-name">Login Password</div>
                <div className="set-sub">Change your account password</div>
              </div>
              <div className="set-right">
                <span className="set-badge">Edit</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </div>

            <div className="set-row" onClick={() => openView('mail')}>
              <div className="set-ico mail-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="set-text">
                <div className="set-name">Bind Mailbox</div>
                <div className="set-sub">{email || 'Bind your email for security'}</div>
              </div>
              <div className="set-right">
                <span className={`set-badge${email ? ' bound' : ' bind'}`}>{email ? 'Bound' : 'To Bind'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            </div>

            <div className="set-row" style={{ cursor: 'default' }}>
              <div className="set-ico ver-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="set-text">
                <div className="set-name">App Version</div>
                <div className="set-sub">Current version</div>
              </div>
              <div className="set-right">
                <span className="set-badge ver">v1.0.9</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'avatar' && (
        <div className="view active">
          <div className="page-header">
            <div className="back-btn" onClick={() => openView('settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </div>
            <span className="page-title">Change Avatar</span>
            <div className="header-right"></div>
          </div>

          <div className="avatar-grid">
            {AVATARS.map((url, i) => (
              <div key={url} className={`av-item${url === selectedAvatar ? ' selected' : ''}`} onClick={() => applyAvatar(url)}>
                <img className="av-img" src={url} alt={`avatar ${i + 1}`} />
                <div className="av-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
            ))}
          </div>
          {/* Tap any avatar above to apply it instantly — no confirm step needed. */}
        </div>
      )}

      {view === 'password' && (
        <div className="view active">
          <div className="page-header">
            <div className="back-btn" onClick={() => openView('settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </div>
            <span className="page-title">Change Login Password</span>
            <div className="header-right"></div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <div className="form-label-row">
                <div className="form-label-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <span className="form-label-text">Login Password</span>
              </div>
              <div className="form-input-wrap">
                <input className="form-input" type={oldPassVisible ? 'text' : 'password'} placeholder="Enter current password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
                <button className="eye-btn" onClick={() => setOldPassVisible((v) => !v)}>{oldPassVisible ? EYE_OPEN : EYE_CLOSED}</button>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <div className="form-label-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <span className="form-label-text">New Login Password</span>
              </div>
              <div className="form-input-wrap">
                <input className="form-input" type={newPassVisible ? 'text' : 'password'} placeholder="Enter new password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <button className="eye-btn" onClick={() => setNewPassVisible((v) => !v)}>{newPassVisible ? EYE_OPEN : EYE_CLOSED}</button>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <div className="form-label-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <span className="form-label-text">Confirm New Password</span>
              </div>
              <div className="form-input-wrap">
                <input className="form-input" type={confirmPassVisible ? 'text' : 'password'} placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                <button className="eye-btn" onClick={() => setConfirmPassVisible((v) => !v)}>{confirmPassVisible ? EYE_OPEN : EYE_CLOSED}</button>
              </div>
            </div>

            <div className="forgot-link">Forgot original login password &rsaquo;</div>

            <button className="primary-btn" onClick={savePassword}>Save Changes</button>
          </div>
        </div>
      )}

      {view === 'mail' && (
        <div className="view active">
          <div className="page-header">
            <div className="back-btn" onClick={() => openView('settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </div>
            <span className="page-title">Bind Mailbox</span>
            <div className="header-right"></div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <div className="form-label-row">
                <div className="mail-label-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span className="form-label-text">Mail</span>
              </div>
              <div className="form-input-wrap">
                <input className="form-input" type="email" placeholder="Please input your email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <div className="code-label-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" style={{ position: 'relative', zIndex: 2 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="form-label-text">Verification Code</span>
              </div>
              <div className="form-input-wrap">
                <input className="form-input" type="number" placeholder="Please enter the confirmation code" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                <button className="send-otp-btn" disabled={otpSecs > 0} onClick={sendOTP}>{otpSecs > 0 ? `${otpSecs}s` : 'Send'}</button>
              </div>
              {otpSecs <= 0 && getOtpStore() && (
                <div className="otp-status">Your code has expired. Tap Send to get a new one.</div>
              )}
            </div>

            <button className="primary-btn" onClick={bindEmail}>Bind</button>
          </div>
        </div>
      )}

      {nicknameModalOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setNicknameModalOpen(false); }}>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-title-row">
              <div className="modal-line"></div>
              <span className="modal-title">Change Nickname</span>
              <div className="modal-line right"></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,var(--gold-dark),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Nickname</span>
            </div>
            <input className="modal-input" type="text" placeholder="Enter new nickname" maxLength={20} value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} />
            <button className="modal-confirm-btn" onClick={confirmNickname}>Confirm</button>
          </div>
        </div>
      )}

      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Settings;