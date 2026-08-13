import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './Feedback.css';

const TYPES = ['Bug Report', 'Suggestion', 'Payment Issue', 'Other'];
const CONFETTI_COLORS = ['#D4AF37', '#F3DA95', '#C9971F', '#F5E6C8', '#2FBE72', '#E8C458'];

function Feedback() {
  const navigate = useNavigate();

  const [type, setType] = useState('Bug Report');
  const [text, setText] = useState('');
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '', type: '' });
  const fileInputRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg, kind = '') => {
    setToast({ show: true, msg, type: kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews(files.map((f) => ({ url: URL.createObjectURL(f), id: Math.random().toString(36).slice(2), file: f })));
    e.target.value = '';
  };

  const removePreview = (id) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const launchConfetti = () => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 2.6 + Math.random() * 1.8,
      delay: Math.random() * 0.6,
      size: 5 + Math.random() * 6,
      isCircle: Math.random() > 0.5,
    }));
    setConfetti(pieces);
  };

  const submitFeedback = () => {
    const val = text.trim();
    if (!val) { showToast('⚠️ Please describe your issue first'); return; }
    if (val.length < 10) { showToast('⚠️ Please provide more detail'); return; }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('message', val);
    previews.forEach((p) => formData.append('images', p.file));

    apiFetch('/feedback/submit', { method: 'POST', body: formData })
      .then(() => {
        setSubmitting(false);
        setSuccessOpen(true);
        launchConfetti();
        setText('');
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
      })
      .catch((err) => {
        setSubmitting(false);
        showToast('⚠️ ' + (err.message || 'Could not send feedback'));
      });
  };

  const goBack = () => navigate('/account');

  return (
    <div className="feedback-page">
      <div className="top-nav">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="nav-title">Feedback</div>
        <div className="nav-right"></div>
      </div>

      <div className="main-content">
        <div>
          <div className="type-label">Feedback Type</div>
          <div className="type-chips">
            {TYPES.map((t) => (
              <button key={t} type="button" className={`type-chip${type === t ? ' active' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="textarea-card">
          <div className="card-header">
            <div className="card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <div className="card-title">Describe your issue</div>
              <div className="card-sub">More detail = faster resolution</div>
            </div>
          </div>

          <textarea
            className="feedback-textarea"
            placeholder="Welcome to feedback, please give feedback — please describe the problem in detail when providing feedback, preferably attach a screenshot of the problem you encountered, we will immediately process your feedback!"
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="textarea-footer">
            <div className="char-counter"><span>{text.length}</span> / 500</div>
          </div>

          <div className="upload-row">
            <div className="upload-box" onClick={triggerUpload}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Add Photo</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>Attach screenshot to help us understand the issue better (max 3 images)</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </div>

          {previews.length > 0 && (
            <div className="preview-row">
              {previews.map((p) => (
                <div className="preview-item" key={p.id}>
                  <img src={p.url} alt="upload preview" />
                  <div className="preview-remove" onClick={() => removePreview(p.id)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-banner">
          <div className="info-dot"></div>
          <div className="info-text">
            <strong>Note:</strong> Our team reviews all feedback within 24 hours. For urgent issues, please contact <strong>Customer Service</strong> directly for faster assistance.
          </div>
        </div>

        <div className="reward-section">
          <div className="reward-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>MYSTERY REWARD</span>
          </div>
          <div className="reward-title">Send Helpful Feedback</div>
          <div className="reward-sub">Chance to win Mystery Rewards 🎁</div>
          <div className="reward-illustration">
            <img
              src="/image/feedback-illustration.png"
              alt="Feedback Illustration"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const svg = e.currentTarget.nextSibling;
                if (svg) svg.style.display = 'block';
              }}
            />
            <svg style={{ display: 'none' }} width="160" height="140" viewBox="0 0 160 140" fill="none">
              <ellipse cx="80" cy="85" rx="28" ry="32" fill="#1a3a5c" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx="80" cy="48" r="22" fill="#2a5a8c" stroke="#D4AF37" strokeWidth="1.5" />
              <ellipse cx="80" cy="48" rx="14" ry="13" fill="#0d1f3c" opacity="0.7" />
              <circle cx="74" cy="44" r="3" fill="#4fc3f7" opacity="0.6" />
              <path d="M70 38 Q80 34 90 38" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <rect x="42" y="72" width="14" height="10" rx="5" fill="#1a3a5c" stroke="#D4AF37" strokeWidth="1" transform="rotate(-20 42 72)" />
              <rect x="104" y="72" width="14" height="10" rx="5" fill="#1a3a5c" stroke="#D4AF37" strokeWidth="1" transform="rotate(20 104 72)" />
              <rect x="38" y="62" width="10" height="7" rx="3" fill="#F5E6C8" />
              <rect x="64" y="112" width="12" height="18" rx="6" fill="#1a3a5c" stroke="#D4AF37" strokeWidth="1" />
              <rect x="84" y="112" width="12" height="18" rx="6" fill="#1a3a5c" stroke="#D4AF37" strokeWidth="1" />
              <path d="M120 30 L122 24 L124 30 L130 32 L124 34 L122 40 L120 34 L114 32 Z" fill="#D4AF37" opacity="0.8" />
              <path d="M32 55 L33 51 L34 55 L38 56 L34 57 L33 61 L32 57 L28 56 Z" fill="#D4AF37" opacity="0.6" />
              <rect x="105" y="75" width="26" height="22" rx="4" fill="#D4AF37" opacity="0.9" />
              <line x1="118" y1="75" x2="118" y2="97" stroke="#140A03" strokeWidth="1.5" />
              <line x1="105" y1="86" x2="131" y2="86" stroke="#140A03" strokeWidth="1.5" />
              <path d="M118 20 L135 28 L122 32 L118 20 Z" fill="#26A69A" opacity="0.9" />
              <path d="M122 32 L128 38 L118 20 Z" fill="#00695C" opacity="0.7" />
              <path d="M55 118 Q65 128 85 122 Q100 116 110 122" stroke="#29B6F6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
              <circle cx="48" cy="110" r="4" fill="#26A69A" opacity="0.7" />
              <circle cx="130" cy="110" r="6" fill="none" stroke="#8B7355" strokeWidth="1.5" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="submit-section">
          <button type="button" className={`submit-btn${submitting ? ' loading' : ''}`} onClick={submitFeedback}>
            {submitting ? (<><span className="spinner"></span>Sending...</>) : 'Submit Feedback'}
          </button>
        </div>
      </div>

      <div className={`success-overlay${successOpen ? ' show' : ''}`}>
        <div>
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}vw`,
                background: c.color,
                width: `${c.size}px`,
                height: `${c.isCircle ? c.size : c.size * 1.8}px`,
                borderRadius: c.isCircle ? '50%' : '2px',
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="success-rings">
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="ring"></div>
          <div className="success-badge">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <svg className="sparkle" style={{ top: -4, left: 8, animationDelay: '0s' }} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" /></svg>
          <svg className="sparkle" style={{ bottom: 2, right: 4, animationDelay: '0.5s' }} width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" /></svg>
          <svg className="sparkle" style={{ top: 20, right: -6, animationDelay: '1s' }} width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" /></svg>
        </div>

        <div className="success-title">Feedback Sent! 🎉</div>
        <div className="success-sub">Thank you! Our team will review your feedback within 24 hours.</div>
        <div className="reward-chip">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span>You're eligible for a Mystery Reward!</span>
        </div>
        <button className="success-back-btn" onClick={goBack}>Back to Account</button>
      </div>

      <div className={`toast${toast.show ? ' show' : ''}${toast.type ? ' ' + toast.type : ''}`}>{toast.msg}</div>
    </div>
  );
}

export default Feedback;