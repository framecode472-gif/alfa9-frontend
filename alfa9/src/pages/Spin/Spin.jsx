import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import './Spin.css';

/* Segment order matches the reference layout, clockwise from 12 o'clock.
   These must line up with how spin-bg.png's 8 wedges are actually drawn —
   if labels look shifted vs the image, tweak WHEEL_IMAGE_OFFSET below. */
const SEGMENTS = [
  { label: 'Rs50,000', icon: '/image/spin-icon-1.png' },
  { label: 'Rs30,000', icon: '/image/spin-icon-2.png' },
  { label: 'Rs20,000', icon: '/image/spin-icon-3.png' },
  { label: 'Rs10,000', icon: '/image/spin-icon-4.png' },
  { label: 'Rs200',    icon: '/image/spin-icon-7.png' },
  { label: 'Rs50',     icon: '/image/spin-icon-8.png' },
  { label: 'Rs20',     icon: '/image/spin-icon-6.png' },
  { label: 'Rs5',      icon: '/image/spin-icon-5.png' },
];

const SEG_ANGLE = 360 / SEGMENTS.length;

// ===== REFERRAL SPIN — separate reward pool, same wheel graphic =====
// Earned by inviting friends who go on to deposit (see spinRewards.js on
// the backend — every approved deposit from someone you referred = +1
// spin here). Mostly small prizes; Rs1000 only appears once you have 20+
// referrals, and even then it's capped at 2 lifetime wins.
const REFERRAL_SEGMENTS = [
  { label: 'Rs1000', icon: '/image/spin-icon-1.png' },
  { label: 'Rs500',  icon: '/image/spin-icon-2.png' },
  { label: 'Rs200',  icon: '/image/spin-icon-3.png' },
  { label: 'Rs100',  icon: '/image/spin-icon-4.png' },
  { label: 'Rs100',  icon: '/image/spin-icon-7.png' },
  { label: 'Rs50',   icon: '/image/spin-icon-8.png' },
  { label: 'Rs50',   icon: '/image/spin-icon-6.png' },
  { label: 'Rs20',   icon: '/image/spin-icon-5.png' },
];
// If spin-bg.png's wedges don't start exactly at the 12 o'clock seam,
// nudge this value (in degrees) until the labels sit inside the right wedge.
const WHEEL_IMAGE_OFFSET = 0;
const EXTRA_SPINS = 6;
const SPIN_DURATION = 4200;

// TESTING ONLY — deposit/backend not wired up yet, so spins are unlimited
// for now to make it easy to test the wheel repeatedly. Flip this to false
// once the real deposit → spin-count logic is connected.


const HISTORY_KEY = 'alfa9_spin_history';
const SPIN_COUNT_KEY = 'alfa9_spin_count';
const DEFAULT_DAILY_SPINS = 3;

/* Consistent icon used across all three action buttons + the History
   section header, matching the reference screenshots (same document base
   icon, only the small corner badge changes: ? / chat / star). */
function DocIcon({ badge }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 2.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6.5 2.5Z"
        fill="none" stroke="#d4af37" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 2.5V6a1 1 0 0 0 1 1h3.5" fill="none" stroke="#d4af37" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="8" y1="11" x2="16" y2="11" stroke="#d4af37" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="14" x2="16" y2="14" stroke="#d4af37" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="17" x2="12.5" y2="17" stroke="#d4af37" strokeWidth="1.4" strokeLinecap="round" />
      {badge && (
        <g>
          <circle cx="18" cy="18" r="5.4" fill="#1C1109" stroke="#d4af37" strokeWidth="1.3" />
          {badge === 'question' && (
            <text x="18" y="20.6" textAnchor="middle" fontSize="7" fontWeight="700" fill="#d4af37">?</text>
          )}
          {badge === 'chat' && (
            <circle cx="18" cy="18" r="1.6" fill="#d4af37" />
          )}
          {badge === 'star' && (
            <path d="M18 15.3l.9 1.8 2 .3-1.45 1.4.34 2-1.79-.94-1.79.94.34-2-1.45-1.4 2-.3z" fill="#d4af37" />
          )}
        </g>
      )}
    </svg>
  );
}

/* Content for the three info panels — matches the reference screenshots. */
const DEPOSIT_TIERS = [
  { amount: 'Rs1,000.00',     spins: '+1',  time: '00:00-23:59' },
  { amount: 'Rs10,000.00',    spins: '+2',  time: '00:00-23:59' },
  { amount: 'Rs50,000.00',    spins: '+3',  time: '00:00-23:59' },
  { amount: 'Rs100,000.00',   spins: '+4',  time: '00:00-23:59' },
  { amount: 'Rs200,000.00',   spins: '+6',  time: '00:00-23:59' },
  { amount: 'Rs1,000,000.00', spins: '+10', time: '00:00-23:59' },
];

const ACTIVITY_DETAIL_RULES = [
  'Members must reach the single deposit amount and cumulative deposit amount to be eligible to participate in the lottery',
  'Conditions for withdrawal of wheel rewards: 1 times turnover required.',
  'If you receive monetary rewards, there is no need to apply, the system will automatically add them to your member ID (please contact customer service to receive physical rewards)',
  'The lottery round starts every morning at 00:00. After making your deposit, you need to wait 5 minutes before the draw wheel starts.',
];

const ACTIVITY_RULE_CARDS = [
  {
    num: '01',
    text: 'The event is effective from now on. The discount can only be used once per address, per email address, per phone number and for the same payment method (debit/credit card/bank account) and IP address;',
    sub: 'If a member applies repeatedly, the company reserves the right to cancel or withdraw member bonuses.',
  },
  {
    num: '02',
    text: 'All offers are specially designed for players.',
    sub: 'If any group or individual is found to be dishonestly withdrawing bonuses or threatening or abusing company offers, the company reserves the right to freeze or cancel the account and account balance of that group or individual.',
  },
  {
    num: '03',
    text: 'The platform reserves the right of final outcome of this event;',
    sub: 'and the right to modify or terminate the campaign without prior notice; these terms apply to all offers.',
  },
];

function segCenterAngle(i) {
  return WHEEL_IMAGE_OFFSET + i * SEG_ANGLE + SEG_ANGLE / 2;
}

function Spin() {
  const navigate = useNavigate();

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(0);
  // Which wheel is active. 'deposit' = the original recharge-based wheel
  // (unchanged). 'referral' = the new invite-based wheel — same graphic,
  // different prize pool and a different earning source.
  const [mode, setMode] = useState('deposit');
  const [referralSpinsLeft, setReferralSpinsLeft] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [thousandEligible, setThousandEligible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2500);
  };
  const [totalSpinsToday, setTotalSpinsToday] = useState(0);
  const [totalRecharge, setTotalRecharge] = useState(0);
  const [history, setHistory] = useState([]);
  const [resultPrize, setResultPrize] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null | 'description' | 'details' | 'rules'
  const spinTimeoutRef = useRef(null);

  const loadStatus = () => {
    apiFetch('/spin/status')
      .then((data) => {
        setSpinsLeft(data.spinsAvailable || 0);
        setTotalSpinsToday(data.totalSpinsToday || 0);
        setTotalRecharge(data.totalRecharge || 0);
      })
      .catch(() => {}); // guest — page still renders with 0 spins
  };

  useEffect(() => {
    loadStatus();
    apiFetch('/spin/referral-status')
      .then((data) => {
        setReferralSpinsLeft(data.spinsAvailable || 0);
        setReferralCount(data.referralCount || 0);
        setThousandEligible((data.referralCount || 0) >= data.thousandRequiresReferrals);
      })
      .catch(() => {});
    apiFetch('/spin/history')
      .then((data) => {
        setHistory((data.history || []).map((h) => ({
          time: new Date(h.createdAt).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
          }).replace(',', ''),
          type: h.source === 'referral' ? 'Referral Spin' : 'Wheel Spin',
          prize: h.prizeLabel
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => () => clearTimeout(spinTimeoutRef.current), []);

  const handleSpin = () => {
    if (spinning) return;
    const currentSpinsLeft = mode === 'referral' ? referralSpinsLeft : spinsLeft;
    if (currentSpinsLeft <= 0) {
      showToast(mode === 'referral'
        ? 'No referral spins left — invite friends and get them to deposit to earn more!'
        : 'No spins left today — deposit to unlock more!');
      return;
    }
    setSpinning(true);

    const activeSegments = mode === 'referral' ? REFERRAL_SEGMENTS : SEGMENTS;
    const endpoint = mode === 'referral' ? '/spin/referral-play' : '/spin/play';

    apiFetch(endpoint, { method: 'POST' })
      .then((data) => {
        const prize = data.prize; // { label, amount } — decided server-side
        const prizeIndex = Math.max(0, activeSegments.findIndex((s) => s.label === prize.label));
        const segCenter = segCenterAngle(prizeIndex);

        const currentMod = ((rotation % 360) + 360) % 360;
        const desiredMod = ((360 - segCenter) % 360 + 360) % 360;
        let delta = desiredMod - currentMod;
        if (delta < 0) delta += 360;
        delta += 360 * EXTRA_SPINS;

        const jitter = (Math.random() - 0.5) * (SEG_ANGLE * 0.5);
        const targetRotation = rotation + delta + jitter;
        setRotation(targetRotation);

        spinTimeoutRef.current = setTimeout(() => {
          setSpinning(false);
          if (mode === 'referral') setReferralSpinsLeft(data.spinsAvailable);
          else setSpinsLeft(data.spinsAvailable);
          const now = new Date();
          const timeStr = now.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }).replace(',', '');
          setHistory((h) => [{ time: timeStr, type: mode === 'referral' ? 'Referral Spin' : 'Wheel Spin', prize: prize.label }, ...h].slice(0, 20));
          setResultPrize(activeSegments[prizeIndex]);
        }, SPIN_DURATION);
      })
      .catch((err) => {
        setSpinning(false);
        showToast(err.message || 'Could not spin right now');
      });
  };

  const isOutOfSpins = (mode === 'referral' ? referralSpinsLeft : spinsLeft) <= 0;
  const activeSegments = mode === 'referral' ? REFERRAL_SEGMENTS : SEGMENTS;

  return (
    <div className="spin-page">
      {/* HEADER */}
      <header className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span className="page-title">Wheel Spin</span>
        <button
          className="header-spacer"
          aria-label="Scroll to spin history"
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
            <path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="9"></circle>
          </svg>
        </button>
      </header>

      {/* HERO BANNER (full pre-made artwork) */}
      <div className="hero-banner">
        <img src="/image/spin-hero bg.png" alt="Wheel Spin" className="hero-banner-img" />
      </div>

      {/* WHEEL MODE TOGGLE — Deposit Spin (original) vs Referral Spin (new) */}
      <div className="spin-mode-toggle">
        <button
          className={`spin-mode-btn ${mode === 'deposit' ? 'active' : ''}`}
          onClick={() => !spinning && setMode('deposit')}
        >
          Deposit Spin
        </button>
        <button
          className={`spin-mode-btn ${mode === 'referral' ? 'active' : ''}`}
          onClick={() => !spinning && setMode('referral')}
        >
          Referral Spin
        </button>
      </div>

      {/* STATS ROW */}
      <div className="stats-row">
        {mode === 'deposit' ? (
          <>
            <div className="stat-card">
              <span className="stat-label">Total Recharge Today</span>
              <span className="stat-value">Rs{totalRecharge.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Spins Left Today</span>
              <span className="stat-value">{spinsLeft}</span>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <span className="stat-label">Referral Spins Left</span>
              <span className="stat-value">{referralSpinsLeft}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Referrals</span>
              <span className="stat-value">{referralCount}{!thousandEligible ? ' / 20 for Rs1000' : ''}</span>
            </div>
          </>
        )}
      </div>
      {mode === 'referral' && (
        <p className="spin-mode-hint">
          Earn 1 free spin every time someone you referred makes a deposit.
          {!thousandEligible && ' Reach 20 total referrals to unlock a shot at the Rs1000 prize.'}
        </p>
      )}

      {/* WHEEL */}
      <div className="wheel-section">
        <div className="wheel-wrap">
          <div className="wheel-ring-glow" aria-hidden="true"></div>
          <div
            className="wheel-disc"
            style={{ '--wheel-rotation': `${rotation}deg` }}
          >
            <img src="/image/spin-bg.png" alt="" className="wheel-disc-img" draggable="false" />

            {activeSegments.map((seg, i) => (
              <div
                key={seg.label + i}
                className={`wheel-segment-label seg-${i}`}
              >
                <div className="wheel-segment-label-inner">
                  <span className={`seg-text ${seg.label === 'Rs50,000' || seg.label === 'Rs1000' ? 'jackpot' : ''}`}>{seg.label}</span>
                  <img src={seg.icon} alt={seg.label} className="seg-icon-img" />
                </div>
              </div>
            ))}
          </div>

          <div className="wheel-hub">
            <button
              className={`go-btn-wrap ${spinning || isOutOfSpins ? 'disabled' : ''}`}
              onClick={handleSpin}
              disabled={spinning}
              aria-label="Spin the wheel"
            >
              <img src="/image/spin-btn.png" alt="" className="go-btn-img" />
              {(spinning || isOutOfSpins) && (
                <span className="go-btn-overlay">{spinning ? '···' : '0 LEFT'}</span>
              )}
            </button>
          </div>
        </div>

        {isOutOfSpins ? (
          <button className="recharge-cta" onClick={() => navigate('/account')}>
            No spins left · Recharge to unlock more
          </button>
        ) : (
          <p className="rules-note">Each recharge of Rs1,000 unlocks 1 additional spin. One tap, one prize — good luck!</p>
        )}
      </div>

      {/* ACTION ICONS */}
      <div className="action-icons-row">
        <button className="action-icon-card" onClick={() => setActivePanel('description')}>
          <DocIcon badge="question" />
          <span>Event Description</span>
        </button>
        <button className="action-icon-card" onClick={() => setActivePanel('details')}>
          <DocIcon badge="chat" />
          <span>Event Details</span>
        </button>
        <button className="action-icon-card" onClick={() => setActivePanel('rules')}>
          <DocIcon badge="star" />
          <span>Activity Rules</span>
        </button>
      </div>

      {/* HISTORY */}
      <section className="history-section">
        <div className="section-header">
          <div className="section-title">
            <span className="title-bar"></span>
            <DocIcon />
            <span>Spin History</span>
          </div>
        </div>

        <div className="history-table">
          <div className="history-head">
            <span>Spin Time</span>
            <span>Reward Type</span>
            <span>Prize</span>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">No spins yet — give the wheel a try!</div>
          ) : (
            history.map((h, i) => (
              <div className="history-row" key={i}>
                <span>{h.time}</span>
                <span>{h.type}</span>
                <span className="prize-cell">{h.prize}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="bottom-spacer"></div>

      {/* INFO PANELS */}
      {activePanel === 'description' && (
        <div className="spin-subpanel">
          <header className="spin-subpanel-header">
            <button className="back-btn" onClick={() => setActivePanel(null)} aria-label="Close panel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className="page-title">Event Description</span>
            <div className="header-spacer" style={{ visibility: 'hidden' }}></div>
          </header>
          <div className="spin-subpanel-body">
            <div className="spin-subpanel-section">
              <div className="spin-subpanel-bar">Activity time</div>
              <p className="spin-subpanel-text">From now on</p>
            </div>
            <div className="spin-subpanel-section">
              <div className="spin-subpanel-bar">Validity period</div>
              <p className="spin-subpanel-text">Official website notification shall prevail</p>
            </div>
            <div className="spin-subpanel-note">
              Members whose single deposit amount or accumulated deposit amount reaches the set amount can participate in the lottery.
            </div>
            <div className="spin-subpanel-section">
              <div className="spin-subpanel-bar">Conditions of participation</div>
              <p className="spin-subpanel-text">
                Members who meet the requirements for <span className="spin-subpanel-highlight">Vip0, Vip1, Vip2, Vip3, Vip4, Vip5, Vip6, Vip7, Vip8, Vip9, Vip10</span> are eligible to participate in the Wheel Spin event. Members must bind a bank card before joining. Stand a chance to win hundreds of millions in cash and many other exciting prizes. Get ready for daily surprises and amazing rewards!
              </p>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'details' && (
        <div className="spin-subpanel">
          <header className="spin-subpanel-header">
            <button className="back-btn" onClick={() => setActivePanel(null)} aria-label="Close panel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className="page-title">Activity details</span>
            <div className="header-spacer" style={{ visibility: 'hidden' }}></div>
          </header>
          <div className="spin-subpanel-body">
            <div className="spin-subpanel-table">
              <div className="spin-subpanel-table-head">
                <span>Task</span>
                <span>Number of spins</span>
                <span>spin time</span>
              </div>
              {DEPOSIT_TIERS.map((tier) => (
                <div className="spin-subpanel-table-row" key={tier.amount}>
                  <span className="spin-subpanel-task">
                    <span className="spin-subpanel-highlight">{tier.amount}</span>
                    <span className="spin-subpanel-task-sub">Total DepositBalance</span>
                  </span>
                  <span className="spin-subpanel-spins">{tier.spins}</span>
                  <span className="spin-subpanel-time">{tier.time}</span>
                </div>
              ))}
            </div>

            <div className="spin-subpanel-section" style={{ marginTop: 16 }}>
              <div className="spin-subpanel-bar">Rules</div>
              <ul className="spin-subpanel-rules">
                {ACTIVITY_DETAIL_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="spin-subpanel-example">
              <strong>For example:</strong> If a member makes cumulative deposits reaching <span className="spin-subpanel-highlight">Rs1,000,000.00</span> on the same day, they will receive <span className="spin-subpanel-highlight">10</span> lucky draw opportunities. The draw is valid for the same day and cannot be rolled over to the next day!
            </div>
          </div>
        </div>
      )}

      {activePanel === 'rules' && (
        <div className="spin-subpanel">
          <header className="spin-subpanel-header">
            <button className="back-btn" onClick={() => setActivePanel(null)} aria-label="Close panel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <span className="page-title">Activity Rules</span>
            <div className="header-spacer" style={{ visibility: 'hidden' }}></div>
          </header>
          <div className="spin-subpanel-body">
            {ACTIVITY_RULE_CARDS.map((card) => (
              <div className="spin-subpanel-rule-card" key={card.num}>
                <div className="spin-subpanel-rule-badge">{card.num}</div>
                <p className="spin-subpanel-text">{card.text}</p>
                <p className="spin-subpanel-text spin-subpanel-text-muted">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {resultPrize && (
        <div className="result-overlay" onClick={() => setResultPrize(null)}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="result-glow"></div>
            <div className="result-rays" aria-hidden="true"></div>
            <img src={resultPrize.icon} alt="" className="result-icon-img" />
            <span className="result-title">Congratulations!</span>
            <span className="result-amount">You won {resultPrize.label}</span>
            <button className="result-btn" onClick={() => setResultPrize(null)}>Claim Reward</button>
          </div>
        </div>
      )}

      {/* WARNING TOAST — e.g. tapping spin with none left */}
      <div className={`spin-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}

export default Spin;