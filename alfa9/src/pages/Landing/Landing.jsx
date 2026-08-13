import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

/* ============================================================
   ALFA-9 LANDING PAGE
   - Narrow 450px mobile-style card, centered on page
   - Logo -> Login/Register -> Domain check -> Promo -> Domains
     list -> Guide card -> Insights card -> Footer
   - Every CTA ("Enter Alfa9" / "Visit" / "View Live Insights")
     sends the visitor to the Auth form first — Auth itself
     redirects to /home once login/registration succeeds.
   - Bottom-right ticker: fake live withdrawals, rotates every 5s
   ============================================================ */

// ---- fake "official domains" list (display + used by the checker) ----
const OFFICIAL_DOMAINS = [
  'alfa9-official.net',
  'alfa9game.cc',
  'alfa9games.biz',
  'alfa9games.club',
  'alfa9play.co',
  'alfa9games.org',
  'alfa9win.biz',
  'alfa9.vip',
];

// ---- ticker fake-data pools ----
const PHONE_PREFIXES = ['+92 3**', '+92 30*', '+92 33*', '+92 34*'];
function randomPhone() {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const tail = Math.floor(1000 + Math.random() * 8999);
  return `${prefix}**${tail}`;
}
function randomAmount() {
  const amounts = [2500, 4300, 7800, 9300, 12600, 18500, 24000, 31200, 45000, 60000, 88000];
  return amounts[Math.floor(Math.random() * amounts.length)].toLocaleString('en-IN');
}
function randomTicker() {
  return { phone: randomPhone(), amount: randomAmount() };
}

function normalizeDomain(v) {
  return v
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

function Landing() {
  const navigate = useNavigate();

  // ── live withdraw ticker ──
  const [ticker, setTicker] = useState(randomTicker());
  const [tickerVisible, setTickerVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTicker(randomTicker());
        setTickerVisible(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── domain checker ──
  const [checkInput, setCheckInput] = useState('');
  const [checkResult, setCheckResult] = useState(null); // null | 'ok' | 'bad'
  const inputRef = useRef(null);

  const handleCheck = () => {
    if (!checkInput.trim()) {
      inputRef.current?.focus();
      return;
    }
    const normalized = normalizeDomain(checkInput);
    const match = OFFICIAL_DOMAINS.some((d) => normalizeDomain(d) === normalized);
    setCheckResult(match ? 'ok' : 'bad');
  };
  const handleCheckKey = (e) => {
    if (e.key === 'Enter') handleCheck();
  };

  const goLogin = () => navigate('/auth');
  const goRegister = () => navigate('/auth', { state: { mode: 'register' } });
  // every "Enter / Visit / View" CTA sends the visitor to the Auth form first
  const goAuth = () => navigate('/auth');

  return (
    <div className="landing-page">
      <div className="lp-shell">
        {/* ── LOGO + AUTH BUTTONS ── */}
        <div className="lp-top">
          <img src="/image/ultraalf9.png" alt="Alfa9" className="lp-logo" />
          <div className="lp-auth-btns">
            <button className="lp-btn lp-btn-ghost" onClick={goLogin}>Log in</button>
            <button className="lp-btn lp-btn-gold" onClick={goRegister}>Register</button>
          </div>
        </div>

        {/* ── DOMAIN CHECK BAR ── */}
        <div className="lp-check-box">
          <div className="lp-check-row">
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter a domain to verify"
              value={checkInput}
              onChange={(e) => { setCheckInput(e.target.value); setCheckResult(null); }}
              onKeyDown={handleCheckKey}
            />
            <button className="lp-check-btn" onClick={handleCheck}>Check</button>
          </div>
          {checkResult === 'ok' && (
            <div className="lp-check-result ok">This domain is verified.</div>
          )}
          {checkResult === 'bad' && (
            <div className="lp-check-result bad">This domain is not verified. Please use one of the official domains listed below.</div>
          )}
        </div>

        {/* ── PROMO CARD ── */}
        <div className="lp-card lp-promo-card">
          <img src="/image/alfa-9.com-bg.jpeg" alt="Alfa9" className="lp-promo-img" />
          <div className="lp-promo-title">Alfa9 Login</div>
          <p className="lp-text">
            Alfa9 is a trusted online platform where players can reach official login
            pages, download the Alfa9 app, and explore online features safely. This
            page explains how to log in, install the app, and use Alfa9 through
            official domains only — helping you avoid fake links and unofficial tools.
          </p>
          <button className="lp-btn lp-btn-gold lp-btn-lg" onClick={goAuth}>Enter Alfa9</button>
        </div>

        {/* ── VERIFIED OFFICIAL DOMAINS ── */}
        <div className="lp-card">
          <div className="lp-card-title"><span className="lp-icon">🔒</span> Verified Official Domains</div>
          <div className="lp-domain-list">
            {OFFICIAL_DOMAINS.map((domain, i) => (
              <div className="lp-domain-row" key={domain}>
                <span className="lp-domain-num">{i + 1}</span>
                <span className="lp-domain-name">{domain}</span>
                <button className="lp-btn lp-btn-gold lp-btn-sm" onClick={goAuth}>Visit</button>
              </div>
            ))}
          </div>
        </div>

        {/* ── GUIDE CARD ── */}
        <div className="lp-card lp-guide-card">
          <div className="lp-card-title"><span className="lp-icon">🎯</span> Alfa9 — Official Login &amp; App Guide</div>

          <div className="lp-highlight-box">
            Alfa9 login help, APK download guidance, online access &amp; VIP info — in one page
          </div>

          <p className="lp-text">
            Alfa9 (also written as Alfa-9) is the platform players use to reach
            official login pages, install the app safely, and understand how online
            access works. This guide is written to help you find the correct Alfa9
            login, app download steps, and safe access rules without confusion.
          </p>
          <p className="lp-text">
            For safety, always use verified access methods and avoid unknown
            third-party links or modified APK files. If you're unsure, use the domain
            verification box above before you log in or register.
          </p>

          <div className="lp-subhead"><span className="lp-icon sm">🛡️</span> Alfa9 Login &amp; Password Help</div>
          <p className="lp-text">
            Sign in to Alfa9 using your registered phone number or email along with
            your password, either on the official website or inside the mobile app.
            If you forgot your password, follow the official reset option shown on
            the platform.
          </p>
          <ul className="lp-list">
            <li>Use the same registered number you used during sign-up.</li>
            <li>Double-check the domain before entering your password.</li>
            <li>If login fails, refresh the page, clear cache, or try again shortly.</li>
          </ul>

          <div className="lp-subhead"><span className="lp-icon sm">📱</span> Alfa9 App, APK &amp; Download Guide</div>
          <p className="lp-text">
            Users commonly search for the Alfa9 app, Alfa9 APK, and Alfa9 app
            download to install on Android. The safest method is downloading only
            through the verified official domains listed on this page.
          </p>
          <ul className="lp-list">
            <li>Alfa9 app: official mobile app access for supported devices.</li>
            <li>Alfa9 APK: the Android installation file format used for setup.</li>
            <li>Alfa9 download: usually refers to the latest official version.</li>
          </ul>

          <div className="lp-subhead"><span className="lp-icon sm">🎮</span> Alfa9 Game Online &amp; Play Access</div>
          <p className="lp-text">
            After login, players can access the Alfa9 game section from the
            dashboard — Slots, Lottery, Fishing, Casino, Sports, and Rummy. Keeping
            your app updated usually improves loading speed and stability.
          </p>

          <div className="lp-subhead"><span className="lp-icon sm">⭐</span> Alfa9 VIP Information</div>
          <p className="lp-text">
            Alfa9 VIP is searched by users looking for membership-level features and
            benefits. VIP options depend on platform rules and account status —
            always confirm VIP information directly inside your dashboard.
          </p>
          <ul className="lp-list">
            <li>Check your VIP status inside your account dashboard.</li>
            <li>Do not install modified "VIP APK" files from unknown sources.</li>
            <li>Use official announcements and verified support channels for VIP questions.</li>
          </ul>

          <div className="lp-subhead lp-subhead-warn"><span className="lp-icon sm">⚠️</span> Important Safety Notice for Alfa9 Users</div>
          <p className="lp-text">
            Some users search for Alfa9 hacks, mod apps, or guaranteed results. There
            is no legitimate hack, and using unofficial software can cause account
            suspension or loss of access. Always verify the domain, use official
            login pages, and rely on trusted support links.
          </p>
        </div>

        <div className="lp-official-line">
          Official platform: <span className="gold-text lp-link" onClick={goAuth}>Alfa9</span>
        </div>

        {/* ── LIVE INSIGHTS CARD ── */}
        <div className="lp-card lp-ai-card">
          <div className="lp-promo-title">Live Game Insights Panel</div>
          <p className="lp-text">
            The Insights Panel is a simple tracking tool built to study recent Alfa9
            round outcomes and highlight patterns as they happen. By following recent
            results and frequency trends, players get a clearer picture of the overall
            game flow.
          </p>
          <p className="lp-text">
            Important notice: this panel is provided strictly for informational
            purposes. It does not offer guaranteed accuracy, fixed returns, or
            financial assurance. Always play responsibly and make decisions based on
            your own judgment.
          </p>
          <button className="lp-btn lp-btn-gold lp-btn-lg" onClick={goAuth}>View Live Insights</button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-copyright">© {new Date().getFullYear()} Alfa9. All rights reserved.</div>
        <div className="lp-footer-links">
          <span onClick={goAuth}>Terms &amp; Conditions</span>
          <span onClick={goAuth}>Privacy Policy</span>
          <span onClick={goAuth}>Responsible Gaming</span>
          <span onClick={goAuth}>Age Verification</span>
          <span onClick={goAuth}>Disclaimer</span>
          <span onClick={goAuth}>About Us</span>
          <span onClick={goAuth}>Contact Us</span>
          <span onClick={goAuth}>Payment Methods</span>
        </div>
        <div className="lp-footer-links2">
          <span onClick={goAuth}>Blog</span>
          <span onClick={goAuth}>Game Guide</span>
        </div>
      </footer>

      {/* ── LIVE WITHDRAW TICKER ── */}
      <div className={`lp-ticker ${tickerVisible ? 'show' : ''}`}>
        System: {ticker.phone} just withdrew Rs {ticker.amount}
      </div>
    </div>
  );
}

export default Landing;