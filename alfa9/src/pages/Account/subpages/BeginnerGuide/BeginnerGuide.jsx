import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './BeginnerGuide.css';

const NAV_PILLS = [
  {
    id: 'register',
    label: 'Register',
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
  {
    id: 'deposit',
    label: 'Deposit',
    icon: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </>
    ),
  },
  {
    id: 'games',
    label: 'Games',
    icon: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 3l-4 4-4-4" />
      </>
    ),
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    icon: (
      <>
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </>
    ),
  },
  {
    id: 'tips',
    label: 'Tips',
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  },
];

const REGISTER_STEPS = [
  { title: 'Open Alfa9 App', desc: 'Launch the app and tap "Register" on the login screen to create a new account.' },
  { title: 'Enter Phone Number', desc: 'Enter your valid Pakistani mobile number (+92). This will be your login ID.' },
  { title: 'Set a Strong Password', desc: 'Create a password with at least 8 characters. Use letters and numbers for security.' },
  { title: 'Verify & Login', desc: 'Complete verification and log in. Your UID will be assigned automatically.' },
];

const DEPOSIT_STEPS = [
  { title: 'Go to Deposit', desc: 'Tap "Deposit" on your Account page or from the balance card quick actions.' },
  { title: 'Select Payment Method', desc: 'Choose from EasyPaisa, JazzCash, Bank Transfer, or other available methods.' },
  { title: 'Enter Amount', desc: 'Type the amount you want to deposit. Minimum deposit is Rs100.' },
  { title: 'Confirm & Wait', desc: 'Complete the payment and your balance will be updated within 1–5 minutes.' },
];

const WITHDRAW_STEPS = [
  { title: 'Go to Withdraw', desc: 'Tap "Withdraw" on your Account page. Make sure your account is verified.' },
  { title: 'Add Bank/Account', desc: 'Add your EasyPaisa, JazzCash, or bank account number where you want to receive funds.' },
  { title: 'Enter Amount', desc: 'Enter the withdrawal amount. Minimum withdrawal is Rs200. Check any applicable fees.' },
  { title: 'Confirm & Receive', desc: 'Submit the request. Funds will be transferred within 5–30 minutes depending on your bank.' },
];

const WELCOME_BONUS_ROWS = [
  'New users get a **special registration bonus**',
  'First deposit unlock **extra bonus rewards**',
  'Invite friends and earn **referral commissions**',
];

const WITHDRAW_NOTE_ROWS = [
  'You must **deposit at least once** before withdrawing',
  'Bonus funds require **wagering requirements** before withdrawal',
  'Use the **same account** you deposited from for security',
];

function HighlightText({ text }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
      )}
    </>
  );
}

const GAMES = [
  {
    name: 'Lottery',
    type: 'Number-based',
    bg: 'linear-gradient(145deg,#FF8A80,#EF5350,#C62828)',
    icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
  },
  {
    name: 'Live Casino',
    type: 'Real dealers',
    bg: 'linear-gradient(145deg,#81D4FA,#29B6F6,#0277BD)',
    icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />,
  },
  {
    name: 'Slots',
    type: 'Spin & win',
    bg: 'linear-gradient(145deg,#80CBC4,#26A69A,#00695C)',
    icon: <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5S16.33 15 15.5 15zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 10 18.5 10s1.5.67 1.5 1.5S19.33 12 18.5 12z" />,
  },
  {
    name: 'Sports',
    type: 'Bet on sports',
    bg: 'linear-gradient(145deg,#FFB74D,#FB8C00,#E65100)',
    icon: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />,
  },
];

const TIPS = [
  {
    title: 'Set a Budget',
    desc: 'Always decide how much you are comfortable spending before you start playing. Never bet more than you can afford to lose.',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: 'Claim All Bonuses',
    desc: 'Check the Activity page daily for bonuses, free spins, attendance rewards, and cashback offers to boost your balance.',
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  },
  {
    title: 'Invite Friends',
    desc: "Share your referral link and earn commission on your friends' deposits. More friends = more passive income.",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: 'Keep Account Safe',
    desc: 'Never share your password or OTP with anyone — including support staff. Alfa9 will never ask for your password.',
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    title: 'Use the Safe Feature',
    desc: 'Store your balance in the Safe to earn 0.1% daily interest. Calculated every minute — your money works while you sleep!',
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
];

function BeginnerGuide() {
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState('register');
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState({ register: true, deposit: false, games: false, withdraw: false, tips: false });

  const quickNavWrapRef = useRef(null);
  const sectionRefs = useRef({});

  const goTo = (id) => {
    const el = sectionRefs.current[id];
    const navH = (quickNavWrapRef.current?.offsetHeight || 0) + 10;
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - navH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const sections = Object.values(sectionRefs.current).filter(Boolean);

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePill(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => spyObserver.observe(s));

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView((prev) => ({ ...prev, [entry.target.id]: true }));
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach((s) => revealObserver.observe(s));

    const updateProgress = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (scrolled / max) * 100 : 0);
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      spyObserver.disconnect();
      revealObserver.disconnect();
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div className="beginner-guide-page">
      <div className="scroll-progress">
        <div className="scroll-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* HEADER */}
      <div className="header">
        <span className="ember"></span>
        <span className="ember"></span>
        <span className="ember"></span>
        <span className="ember"></span>
        <div className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="header-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Beginner's Guide
        </div>
        <div className="header-title">Start Winning Today</div>
        <div className="header-sub">Everything you need to know to get started on Alfa9</div>
      </div>

      {/* QUICK NAV */}
      <div className="quick-nav-wrap" ref={quickNavWrapRef}>
        <div className="quick-nav">
          {NAV_PILLS.map((p) => (
            <div
              key={p.id}
              className={`nav-pill ${activePill === p.id ? 'active' : ''}`}
              onClick={() => goTo(p.id)}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {p.icon}
              </svg>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 1: REGISTER */}
      <div
        className={`guide-section ${inView.register ? 'in-view' : ''}`}
        id="register"
        ref={(el) => (sectionRefs.current.register = el)}
      >
        <div className="section-header">
          <div className="section-num">1</div>
          <div>
            <div className="section-title">Create Your Account</div>
            <div className="section-sub">Get started in under 2 minutes</div>
          </div>
        </div>
        <div className="steps-list">
          {REGISTER_STEPS.map((s, i) => (
            <div className="step-item" key={s.title}>
              <div className="step-num">{i + 1}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="highlight-box">
          <div className="highlight-box-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Welcome Bonus
          </div>
          {WELCOME_BONUS_ROWS.map((row) => (
            <div className="highlight-row" key={row}>
              <div className="hlt-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="hlt-text"><HighlightText text={row} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 2: DEPOSIT */}
      <div
        className={`guide-section ${inView.deposit ? 'in-view' : ''}`}
        id="deposit"
        ref={(el) => (sectionRefs.current.deposit = el)}
      >
        <div className="section-header">
          <div className="section-num">2</div>
          <div>
            <div className="section-title">How to Deposit</div>
            <div className="section-sub">Fund your account quickly and safely</div>
          </div>
        </div>
        <div className="steps-list">
          {DEPOSIT_STEPS.map((s, i) => (
            <div className="step-item" key={s.title}>
              <div className="step-num">{i + 1}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="tip-card">
          <div className="tip-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <div className="tip-title">Pro Tip</div>
            <div className="tip-desc">Deposit during promotions to get extra bonus. Check the Activity page for current offers.</div>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 3: GAMES */}
      <div
        className={`guide-section ${inView.games ? 'in-view' : ''}`}
        id="games"
        ref={(el) => (sectionRefs.current.games = el)}
      >
        <div className="section-header">
          <div className="section-num">3</div>
          <div>
            <div className="section-title">Games on Alfa9</div>
            <div className="section-sub">Find the game that suits you best</div>
          </div>
        </div>

        <div className="game-grid">
          {GAMES.map((g) => (
            <div className="game-card" key={g.name}>
              <div className="game-icon" style={{ background: g.bg }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  {g.icon}
                </svg>
              </div>
              <div>
                <div className="game-name">{g.name}</div>
                <div className="game-type">{g.type}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="tip-card">
          <div className="tip-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="tip-title">Beginner Advice</div>
            <div className="tip-desc">Start with smaller bets to learn the game rules. Use demo/practice mode if available before playing with real money.</div>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 4: WITHDRAW */}
      <div
        className={`guide-section ${inView.withdraw ? 'in-view' : ''}`}
        id="withdraw"
        ref={(el) => (sectionRefs.current.withdraw = el)}
      >
        <div className="section-header">
          <div className="section-num">4</div>
          <div>
            <div className="section-title">How to Withdraw</div>
            <div className="section-sub">Get your winnings fast</div>
          </div>
        </div>
        <div className="steps-list">
          {WITHDRAW_STEPS.map((s, i) => (
            <div className="step-item" key={s.title}>
              <div className="step-num">{i + 1}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="highlight-box">
          <div className="highlight-box-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Important Notes
          </div>
          {WITHDRAW_NOTE_ROWS.map((row) => (
            <div className="highlight-row" key={row}>
              <div className="hlt-icon">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="hlt-text"><HighlightText text={row} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider"></div>

      {/* SECTION 5: TIPS */}
      <div
        className={`guide-section ${inView.tips ? 'in-view' : ''}`}
        id="tips"
        ref={(el) => (sectionRefs.current.tips = el)}
      >
        <div className="section-header">
          <div className="section-num">5</div>
          <div>
            <div className="section-title">Pro Tips for Beginners</div>
            <div className="section-sub">Smart strategies to maximize your wins</div>
          </div>
        </div>

        {TIPS.map((t) => (
          <div className="tip-card" key={t.title}>
            <div className="tip-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                {t.icon}
              </svg>
            </div>
            <div>
              <div className="tip-title">{t.title}</div>
              <div className="tip-desc">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="cta-wrap">
<Link className="cta-btn" to="/home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Start Playing Now
        </Link>
        <div className="cta-sub">
          Need help? <Link to="/customer-service">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}

export default BeginnerGuide;