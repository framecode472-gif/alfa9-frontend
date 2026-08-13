import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import './MyBenefits.css';

const IMG = {
  levelup: '/image/level-up-reward.png',
  monthly: '/image/monthly-reward.png',
  safe: '/image/safe-benefits.png',
  rebate: '/image/rebate-rate.png',
  wallet: '/image/wallet.png',
  spin: '/image/money-icon.png',
};

function MyBenefits() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(''); // 'levelup' | 'monthly' | ''
  const [toast, setToast] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);

  const load = () => {
    setLoadError('');
    apiFetch('/vip/my-status')
      .then((data) => {
        setStatus(data);
        // default the selector to the member's own level (min 1) so the
        // page opens showing rewards that are actually relevant to them
        setSelectedLevel((prev) => (prev === 1 && data.level > 1 ? data.level : prev));
      })
      .catch((err) => setLoadError(err.message || 'Could not load your VIP status'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const myLevel = status?.level || 0;
  const tiers = status?.tiers || [];
  // The card numbers always reflect whichever level is SELECTED (browsable,
  // like the VIP page's level slider) — not just the member's current level.
  // Claiming is still only allowed for the level actually achieved.
  const tier = tiers.find((t) => t.level === selectedLevel) || null;
  const isMyLevel = selectedLevel === myLevel;

  const levelUpClaimed = (status?.levelUpClaimed || []).includes(selectedLevel);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyClaimed = status?.lastMonthlyClaim === monthKey;

  const claimLevelUp = async () => {
    if (!tier || !isMyLevel || levelUpClaimed || busy) return;
    setBusy('levelup');
    try {
      const data = await apiFetch('/vip/claim-levelup', { method: 'POST', body: { level: selectedLevel } });
      showToast(`+Rs${data.coins} & ${data.freeSpins} free spins credited!`);
      load();
    } catch (err) {
      showToast(err.message || 'Could not claim right now');
    } finally {
      setBusy('');
    }
  };

  const claimMonthly = async () => {
    if (!tier || !isMyLevel || monthlyClaimed || busy) return;
    setBusy('monthly');
    try {
      const data = await apiFetch('/vip/claim-monthly', { method: 'POST' });
      showToast(`+Rs${data.coins} & ${data.freeSpins} free spins credited!`);
      load();
    } catch (err) {
      showToast(err.message || 'Could not claim right now');
    } finally {
      setBusy('');
    }
  };

  // What each claim button should say/do, purely a function of the
  // SELECTED level vs the member's ACHIEVED level:
  const levelUpBtn = (() => {
    if (selectedLevel > myLevel) return { label: `Reach VIP${selectedLevel} first`, cls: 'mb-btn-locked', disabled: true };
    if (levelUpClaimed) return { label: 'Received', cls: 'mb-btn-received', disabled: true };
    return { label: busy === 'levelup' ? 'Claiming…' : 'Claim now', cls: 'mb-btn-claim', disabled: busy === 'levelup' };
  })();
  const monthlyBtn = (() => {
    if (selectedLevel > myLevel) return { label: `Reach VIP${selectedLevel} first`, cls: 'mb-btn-locked', disabled: true };
    if (selectedLevel < myLevel) return { label: 'View only', cls: 'mb-btn-locked', disabled: true };
    if (monthlyClaimed) return { label: 'Received', cls: 'mb-btn-received', disabled: true };
    return { label: busy === 'monthly' ? 'Claiming…' : 'Claim now', cls: 'mb-btn-claim', disabled: busy === 'monthly' };
  })();

  return (
    <div className="mb-page">
      <div className="mb-glow" />
      <div className="mb-top-bar">
        <div className="mb-back" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F3DA95" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div className="mb-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" fill="#F3DA95" stroke="#D4AF37" strokeWidth="1" /></svg>
          My Benefits
        </div>
        <div className="mb-my-level">VIP {myLevel} <span style={{ opacity: 0.5, fontSize: 9 }}>· build v3</span></div>
      </div>

      {loading ? (
        <div className="mb-loading">Loading your benefits…</div>
      ) : loadError ? (
        <div className="mb-error">
          <div>⚠ {loadError}</div>
          <button className="mb-btn mb-btn-outline" onClick={() => { setLoading(true); load(); }}>Retry</button>
        </div>
      ) : (
        <>
          <div className="mb-level-picker">
            {tiers.map((t) => (
              <button
                key={t.level}
                className={`mb-level-pill${selectedLevel === t.level ? ' active' : ''}${t.level <= myLevel ? ' achieved' : ''}`}
                onClick={() => setSelectedLevel(t.level)}
              >
                {t.level <= myLevel && <span className="mb-pill-check">✓</span>}
                VIP{t.level}
              </button>
            ))}
          </div>

          <div className="mb-grid">
            {/* Level up rewards */}
            <div className="mb-card">
              <div className="mb-banner mb-banner-levelup">
                <img src={IMG.levelup} alt="Level up rewards" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="mb-banner-shine" />
                <div className="mb-tag mb-tag-coin"><img className="mb-tag-icon" style={{ width: 23, height: 23, objectFit: 'contain' }} src={IMG.wallet} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> {tier ? tier.levelUpCoins.toLocaleString() : 0}</div>
                <div className="mb-tag mb-tag-coin"><img className="mb-tag-icon" style={{ width: 23, height: 23, objectFit: 'contain' }} src={IMG.spin} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> {tier ? tier.levelUpFreeSpins.toLocaleString() : 0}</div>
              </div>
              <div className="mb-body">
                <div className="mb-name">Level up rewards</div>
                <div className="mb-desc">Each account can only receive 1 time per level</div>
              </div>
              <button className={`mb-btn ${levelUpBtn.cls}`} onClick={claimLevelUp} disabled={levelUpBtn.disabled}>{levelUpBtn.label}</button>
            </div>

            {/* Monthly reward */}
            <div className="mb-card">
              <div className="mb-banner mb-banner-monthly">
                <img src={IMG.monthly} alt="Monthly reward" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="mb-banner-shine" />
                <div className="mb-tag mb-tag-coin"><img className="mb-tag-icon" src={IMG.wallet} alt="" onError={(e) => { e.target.style.display = 'none'; }} /> {tier ? tier.monthlyCoins.toLocaleString() : 0}</div>
              </div>
              <div className="mb-body">
                <div className="mb-name">Monthly reward</div>
                <div className="mb-desc">Each account can only receive 1 time per month</div>
              </div>
              <button className={`mb-btn ${monthlyBtn.cls}`} onClick={claimMonthly} disabled={monthlyBtn.disabled}>{monthlyBtn.label}</button>
            </div>

            {/* Safe */}
            <div className="mb-card">
              <div className="mb-banner mb-banner-safe">
                <img src={IMG.safe} alt="Safe" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="mb-banner-shine" />
                <div className="mb-tag mb-tag-rate">{tier ? tier.safeRate : '0%'}</div>
              </div>
              <div className="mb-body">
                <div className="mb-name">Safe</div>
                <div className="mb-desc">Increase the extra income of the safe</div>
              </div>
              <button className="mb-btn mb-btn-outline" onClick={() => navigate('/account/safe')}>Open Safe</button>
            </div>

            {/* Rebate rate */}
            <div className="mb-card">
              <div className="mb-banner mb-banner-rebate">
                <img src={IMG.rebate} alt="Rebate rate" onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="mb-banner-shine" />
                <div className="mb-tag mb-tag-rate">{tier ? tier.rebateRate : '0%'}</div>
              </div>
              <div className="mb-body">
                <div className="mb-name">Rebate rate</div>
                <div className="mb-desc">Increase income of rebate</div>
              </div>
              <button className="mb-btn mb-btn-outline" onClick={() => navigate('/promotion/rebate-ratio')}>Check the details</button>
            </div>
          </div>
        </>
      )}

      <div className={`mb-toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  );
}

export default MyBenefits;