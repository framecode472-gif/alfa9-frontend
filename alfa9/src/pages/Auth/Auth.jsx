import { useState, useRef, useEffect } from 'react';
import { addRegisterNotif, addLoginNotif } from '../Shared/Notification/notifUtils';
import { useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

// ===== API HELPER =====
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiCall(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }
  return data;
}

// Stores the real session after login/register so the rest of the app
// (Deposit, Withdraw, Wallet, etc.) can read balance/profile with it.
function storeSession(data) {
  localStorage.setItem('alfa9_token', data.token);
  localStorage.setItem('alfa9_user', JSON.stringify(data.user));
  localStorage.setItem('alfa9_balance', String(data.user?.balance ?? 0));
}

const STRENGTH_COLORS = ['#d40000', '#e5b80b', '#2FBE72'];
const STRENGTH_LABELS = ['Weak', 'Good', 'Strong'];

function getStrengthScore(val) {
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10 || (/[A-Z]/.test(val) && /[0-9]/.test(val))) score++;
  if (val.length >= 10 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// normalizeId is still used to sanity-check the login/register identifier
// fields before sending them to the real backend.
const USERS_KEY = 'alfa9_users';
const SESSION_KEY = 'alfa9_session';

function normalizeId(val) {
  return val.trim().toLowerCase();
}

// ── reusable eye icons (open = visible, off = hidden) ──
function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── login tabs (phone / mail) ──
  const [loginMode, setLoginMode] = useState('phone');
  const [loginValue, setLoginValue] = useState('0'); // phone starts with a fixed leading 0
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signInMsg, setSignInMsg] = useState(''); // credential-check error (wrong password / no account)

  // ── flip card: login <-> register ──
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  // ── password visibility ──
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);

  // ── register account field + auto-advance to password once a valid email is typed ──
  const [regAccount, setRegAccount] = useState('');
  const regPasswordRef = useRef(null);
  const regAutoAdvancedRef = useRef(false);

  const handleRegAccountChange = (e) => {
    const val = e.target.value;
    setRegAccount(val);
    setJoinMsg('');

    const isValidEmail = EMAIL_RE.test(val);

    if (isValidEmail && !regAutoAdvancedRef.current) {
      regAutoAdvancedRef.current = true;
      setTimeout(() => regPasswordRef.current?.focus(), 120);
    }
    if (!isValidEmail) {
      regAutoAdvancedRef.current = false;
    }
  };

  // ── register password strength ──
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [joinMsg, setJoinMsg] = useState(''); // registration error (duplicate account / mismatch / too short)
  const [regReferralCode, setRegReferralCode] = useState('');
  const strengthScore = getStrengthScore(regPassword);
  const strengthColor = regPassword.length > 0 ? STRENGTH_COLORS[Math.max(strengthScore - 1, 0)] : null;
  const strengthLabel = regPassword.length === 0 ? 'Password strength' : STRENGTH_LABELS[Math.max(strengthScore - 1, 0)];

  // ── forgot password modal ──
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1, 2, 3
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const identifierRef = useRef(null);
  const otpRefs = useRef([]);

  // keep both faces the SAME height (always the taller of the two) so
  // flipping login <-> register never leaves extra empty space below the card
  useEffect(() => {
    const syncHeight = () => {
      if (!containerRef.current) return;
      const frontH = frontRef.current?.scrollHeight || 0;
      const backH = backRef.current?.scrollHeight || 0;
      containerRef.current.style.height = Math.max(frontH, backH) + 'px';
    };
    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, [flipped, loginError, regPassword, signInMsg, joinMsg]);

  // Pick up a referral code from a shared invite link (?ref=CODE) or the
  // "Create Account" navigation from Landing, and jump straight to the
  // register form with the code pre-filled — this was previously dropped
  // entirely, so links shared via "Copy Invitation Link" never carried the
  // code through to registration.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setRegReferralCode(ref);
      setFlipped(true);
    } else if (location.state?.mode === 'register') {
      setFlipped(true);
    }
  }, [location.search, location.state]);

  // manual tab click
  const toggleLoginMode = (m) => {
    setLoginError('');
    setSignInMsg('');
    setLoginMode(m);
    if (m === 'phone') {
      if (!loginValue || /[a-zA-Z@]/.test(loginValue)) setLoginValue('0');
    } else {
      if (/^[0-9]*$/.test(loginValue)) setLoginValue('');
    }
  };

  // Auto-detect phone vs email as the user types, and enforce phone formatting.
  const handleLoginInputChange = (e) => {
    const raw = e.target.value;
    setLoginError('');
    setSignInMsg('');

    if (loginMode === 'mail') {
      setLoginValue(raw);
      return;
    }

    if (/[a-zA-Z@]/.test(raw)) {
      setLoginMode('mail');
      setLoginValue(raw);
      return;
    }

    let digits = raw.replace(/[^0-9]/g, '');
    if (!digits.startsWith('0')) digits = '0' + digits;
    digits = '0' + digits.slice(1).replace(/^0+/, '');
    if (digits.length > 11) digits = digits.slice(0, 11);

    setLoginValue(digits);
  };

  const handleLoginBlur = () => {
    if (loginMode === 'phone') {
      if (loginValue.length > 1 && loginValue.length !== 11) {
        setLoginError('Please enter a valid 11-digit phone number');
      } else {
        setLoginError('');
      }
    } else {
      if (loginValue.length > 0 && !EMAIL_RE.test(loginValue)) {
        setLoginError('Please enter a valid email address');
      } else {
        setLoginError('');
      }
    }
  };

  // ── SIGN IN: real backend call (phone or email both work) ──
  const [signingIn, setSigningIn] = useState(false);
  const handleSignIn = async () => {
    setSignInMsg('');

    if (loginError) return; // fix the format error first
    const id = normalizeId(loginValue);
    if (!id || id === '0') {
      setSignInMsg('Please enter your phone number or email.');
      return;
    }
    if (!loginPassword) {
      setSignInMsg('Please enter your password.');
      return;
    }

    setSigningIn(true);
    try {
      const data = await apiCall('/auth/login', { identifier: id, password: loginPassword });
      storeSession(data);
      localStorage.setItem(SESSION_KEY, id); // kept for any older code still reading this
      addLoginNotif();
      sessionStorage.setItem('alfa9_show_welcome', '1');
      sessionStorage.setItem('alfa9_show_splash', '1');
      navigate('/home');
    } catch (err) {
      setSignInMsg(err.message === 'User not found'
        ? 'No account found with these details. Please register first.'
        : err.message === 'Invalid credentials'
          ? 'Incorrect password. Please try again.'
          : err.message);
    } finally {
      setSigningIn(false);
    }
  };

  // ── JOIN NOW: real backend call (phone or email both work) ──
  const [joining, setJoining] = useState(false);
  const handleJoinNow = async () => {
    setJoinMsg('');

    const id = normalizeId(regAccount);
    if (!id) {
      setJoinMsg('Please enter a phone number or email.');
      return;
    }
    if (regPassword.length < 6) {
      setJoinMsg('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setJoinMsg('Passwords do not match.');
      return;
    }

    setJoining(true);
    try {
      const data = await apiCall('/auth/register', {
        identifier: id,
        password: regPassword,
        referralCode: regReferralCode || undefined
      });
      storeSession(data);
      localStorage.setItem(SESSION_KEY, id); // kept for any older code still reading this
      addRegisterNotif(id);
      sessionStorage.setItem('alfa9_show_welcome', '1');
      sessionStorage.setItem('alfa9_show_splash', '1');
      navigate('/home');
    } catch (err) {
      setJoinMsg(err.message);
    } finally {
      setJoining(false);
    }
  };

  const openForgotModal = () => {
    setForgotStep(1);
    setForgotIdentifier('');
    setForgotError('');
    setForgotOpen(true);
  };
  const closeForgotModal = () => setForgotOpen(false);

  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const forgotSendCode = async () => {
    if (!forgotIdentifier.trim()) {
      identifierRef.current?.focus();
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      await apiCall('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setOtp(['', '', '', '']);
      setForgotStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      setForgotError(err.message || 'Failed to send code');
    } finally {
      setForgotLoading(false);
    }
  };

  const forgotReset = async () => {
    if (forgotNewPass.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    const code = otp.join('');
    if (code.length < 4) {
      setForgotError('Enter the full 4-digit code');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      await apiCall('/auth/reset-password', {
        identifier: forgotIdentifier.trim(),
        otp: code,
        newPassword: forgotNewPass
      });
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-fx">
        <div className="float-chip gold"></div>
        <div className="float-chip red"></div>
        <div className="float-chip gold"></div>
        <div className="float-chip red"></div>
        <div className="float-chip gold"></div>
      </div>

      <div className="scene">
        <div
          className={`auth-container ${flipped ? 'flipped' : ''}`}
          id="authContainer"
          ref={containerRef}
        >
          {/* ══════ FRONT FACE: LOGIN ══════ */}
          <div className="face face-front" ref={frontRef}>
            <div className="header">
              <img src="/image/ultraalf9.png" alt="ALFA 9" className="logo-img" />
              <div className="header-tagline">Pakistan's Premier Gaming Platform</div>
            </div>

            <div className="face-body">
              <div className="tabs-nav">
                <div
                  className="tab-indicator"
                  style={{ transform: loginMode === 'phone' ? 'translateX(0%)' : 'translateX(100%)' }}
                ></div>
                <div className={`tab-btn ${loginMode === 'phone' ? 'active' : ''}`} onClick={() => toggleLoginMode('phone')}>
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  Phone Login
                </div>
                <div className={`tab-btn ${loginMode === 'mail' ? 'active' : ''}`} onClick={() => toggleLoginMode('mail')}>
                  <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  Email Login
                </div>
              </div>

              <div className="form-section">
                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm">
                      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    </span>
                    <span>{loginMode === 'phone' ? 'Phone Number' : 'Email Address'}</span>
                  </label>
                  <div className={`input-control ${loginError ? 'has-error' : ''}`}>
                    {loginMode === 'phone' && <span className="cc">+92</span>}
                    <input
                      type="text"
                      value={loginValue}
                      onChange={handleLoginInputChange}
                      onBlur={handleLoginBlur}
                      onFocus={() => setLoginError('')}
                      placeholder={loginMode === 'phone' ? '0300 1234567' : 'Enter your email'}
                      inputMode={loginMode === 'phone' ? 'numeric' : 'email'}
                    />
                  </div>
                  {loginError && <div className="field-error">⚠ {loginError}</div>}
                </div>

                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm">
                      <svg viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>
                    </span>
                    Password
                  </label>
                  <div className="input-control">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setSignInMsg(''); }}
                    />
                    <button
                      type="button"
                      className={`eye-btn ${showLoginPass ? 'active' : ''}`}
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPass ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>

                {signInMsg && <div className="field-error" style={{ marginTop: '-10px', marginBottom: '14px' }}>⚠ {signInMsg}</div>}

                <div className="check-wrap">
                  <input type="checkbox" defaultChecked /> Remember Me
                </div>

                <button type="button" className="btn-prime" onClick={handleSignIn} disabled={signingIn}>
                  <svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                  {signingIn ? 'Signing In...' : 'Sign In'}
                </button>

                <button type="button" className="btn-second" onClick={() => setFlipped(true)}>
                  <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                  Create Account
                </button>

                <div className="help-grid">
                  <div className="help-card" onClick={openForgotModal}>
                    <span className="icon-chip md"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg></span>
                    <span>Forgot Password</span>
                  </div>
                  <div className="help-card" onClick={() => window.open('https://wa.me/923163533206', '_blank')}>
                    <span className="icon-chip md"><svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg></span>
                    <span>Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════ BACK FACE: REGISTER ══════ */}
          <div className="face face-back" ref={backRef}>
            <div className="header">
              <img src="/image/ultraalf9.png" alt="ALFA 9" className="logo-img" />
              <div className="header-tagline">Join the Winning Circle</div>
            </div>

            <div className="face-body">
              <div className="reg-title-wrap">
                <div className="reg-title">REGISTER</div>
                <div className="reg-sub">Takes less than a minute</div>
              </div>
              <div className="form-section">
                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm"><svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></span>
                    Account
                  </label>
                  <div className="input-control">
                    <input
                      type="text"
                      placeholder="Phone number or Email"
                      value={regAccount}
                      onChange={handleRegAccountChange}
                    />
                  </div>
                </div>

                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
                    Set Password
                  </label>
                  <div className="input-control">
                    <input
                      ref={regPasswordRef}
                      type={showRegPass ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); setJoinMsg(''); }}
                    />
                    <button
                      type="button"
                      className={`eye-btn ${showRegPass ? 'active' : ''}`}
                      onClick={() => setShowRegPass(!showRegPass)}
                      aria-label={showRegPass ? 'Hide password' : 'Show password'}
                    >
                      {showRegPass ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  <div className="strength-row">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="strength-bar"
                        style={{ background: i < strengthScore && regPassword.length > 0 ? strengthColor : 'rgba(255,255,255,0.08)' }}
                      ></div>
                    ))}
                  </div>
                  <div className="strength-label" style={{ color: strengthColor || '' }}>{strengthLabel}</div>
                </div>

                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
                    Confirm
                  </label>
                  <div className="input-control">
                    <input
                      type={showConfPass ? 'text' : 'password'}
                      placeholder="Re-type password"
                      value={regConfirmPassword}
                      onChange={(e) => { setRegConfirmPassword(e.target.value); setJoinMsg(''); }}
                    />
                    <button
                      type="button"
                      className={`eye-btn ${showConfPass ? 'active' : ''}`}
                      onClick={() => setShowConfPass(!showConfPass)}
                      aria-label={showConfPass ? 'Hide password' : 'Show password'}
                    >
                      {showConfPass ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>

                <div className="field-box">
                  <label className="field-label">
                    <span className="icon-chip sm"><svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></span>
                    Invitation
                  </label>
                  <div className="input-control">
                    <input
                      type="text"
                      placeholder="Optional code"
                      value={regReferralCode}
                      onChange={(e) => setRegReferralCode(e.target.value)}
                    />
                  </div>
                </div>

                {joinMsg && <div className="field-error" style={{ marginBottom: '14px' }}>⚠ {joinMsg}</div>}

                <div className="check-wrap">
                  <input type="checkbox" defaultChecked /> I agree to <b>【Privacy Policy】</b>
                </div>

                <button type="button" className="btn-prime" onClick={handleJoinNow} disabled={joining}>
                  <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  {joining ? 'Creating Account...' : 'Join Now'}
                </button>

                <button type="button" className="btn-second" onClick={() => { setFlipped(false); setJoinMsg(''); }}>
                  <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Already a Member? Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ FORGOT PASSWORD MODAL ══════ */}
      <div className={`modal-overlay ${forgotOpen ? 'show' : ''}`}>
        <div className="modal-box">
          <div className="modal-close" onClick={closeForgotModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </div>

          {/* STEP 1: enter phone/email */}
          <div className={`modal-step ${forgotStep === 1 ? 'active' : ''}`}>
            <div className="modal-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
            </div>
            <div className="modal-title">Reset Password</div>
            <div className="modal-sub">Enter the phone number or email linked to your account and we'll send you a verification code.</div>
            <div className="modal-input-control">
              <input
                type="text"
                ref={identifierRef}
                placeholder="Phone number or Email"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
              />
            </div>
            {forgotError && forgotStep === 1 && <div className="modal-error">{forgotError}</div>}
            <button type="button" className="modal-btn" onClick={forgotSendCode} disabled={forgotLoading}>
              {forgotLoading ? 'Sending…' : 'Send Verification Code'}
            </button>
          </div>

          {/* STEP 2: OTP + new password */}
          <div className={`modal-step ${forgotStep === 2 ? 'active' : ''}`}>
            <div className="modal-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div className="modal-title">Verify &amp; Set New Password</div>
            <div className="modal-sub">
              {forgotIdentifier
                ? `A 4-digit code was sent to ${forgotIdentifier}. Enter it below along with your new password.`
                : 'A 4-digit code was sent. Enter it below along with your new password.'}
            </div>
            <div className="otp-row">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={digit}
                  ref={(el) => (otpRefs.current[i] = el)}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                />
              ))}
            </div>
            <div className="modal-input-control">
              <input
                type={showForgotPass ? 'text' : 'password'}
                placeholder="New password"
                value={forgotNewPass}
                onChange={(e) => setForgotNewPass(e.target.value)}
              />
              <button
                type="button"
                className={`eye-btn ${showForgotPass ? 'active' : ''}`}
                onClick={() => setShowForgotPass(!showForgotPass)}
                aria-label={showForgotPass ? 'Hide password' : 'Show password'}
              >
                {showForgotPass ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            <button type="button" className="modal-btn" onClick={forgotReset} disabled={forgotLoading}>
              {forgotLoading ? 'Resetting…' : 'Reset Password'}
            </button>
            {forgotError && forgotStep === 2 && <div className="modal-error">{forgotError}</div>}
            <div className="modal-resend">Didn't get a code? <b onClick={forgotSendCode}>Resend</b></div>
          </div>

          {/* STEP 3: success */}
          <div className={`modal-step ${forgotStep === 3 ? 'active' : ''}`}>
            <div className="modal-success-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div className="modal-title">Password Reset!</div>
            <div className="modal-sub">Your password has been updated successfully. You can now sign in with your new password.</div>
            <button type="button" className="modal-btn" onClick={closeForgotModal}>Back to Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;