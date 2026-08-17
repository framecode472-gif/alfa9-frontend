import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

function AboutUs() {
  const navigate = useNavigate();
  const [page, setPage] = useState('page-main');
  const [logoError, setLogoError] = useState(false);
  const [confIconError, setConfIconError] = useState(false);
  const [riskIconError, setRiskIconError] = useState(false);

  const showPage = (id) => {
    setPage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="about-us-page">
      {/* ══════════════════════ MAIN ABOUT PAGE ══════════════════════ */}
      {page === 'page-main' && (
        <div className="page" id="page-main">
          <div className="header">
            <div className="back-btn" onClick={() => navigate(-1)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="header-title">About Us</div>
            <div className="header-sub">Alfa9 — Pakistan's Premier Gaming Platform</div>
          </div>

          {/* Hero Banner */}
          <div className="about-hero">
            <div className="about-logo-wrap">
              {!logoError && (
                <img src="/image/ultraalf9.png" alt="Alfa9" onError={() => setLogoError(true)} />
              )}
            </div>
            <div className="about-app-name">ALFA9</div>
            <div className="about-version">Version 1.0.0 &nbsp;•&nbsp; Established 2024</div>
            <div className="about-tagline">
              Pakistan's trusted online gaming platform offering exciting games, fair play, and fast payouts — all in one place.
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">50K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Support</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">5 Min</div>
              <div className="stat-label">Fast Payout</div>
            </div>
          </div>

          {/* Documents */}
          <div className="section-label">Legal Documents</div>
          <div className="menu-list">
            <div className="menu-item" onClick={() => showPage('page-confidentiality')}>
              <div className="menu-icon">
                {!confIconError ? (
                  <img
                    src="/image/confidentiality-icon.png"
                    alt="Confidentiality"
                    onError={() => setConfIconError(true)}
                  />
                ) : (
                  <div style={{ display: 'flex', width: '46px', height: '46px', borderRadius: '15px', background: 'linear-gradient(145deg,#2FBE72,#1a8a52)', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="menu-text">
                <div className="menu-title">Confidentiality Agreement</div>
                <div className="menu-sub">Privacy & data protection policy</div>
              </div>
              <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="menu-item" onClick={() => showPage('page-risk')}>
              <div className="menu-icon">
                {!riskIconError ? (
                  <img
                    src="/image/risk-disclosure-icon.png"
                    alt="Risk Disclosure"
                    onError={() => setRiskIconError(true)}
                  />
                ) : (
                  <div style={{ display: 'flex', width: '46px', height: '46px', borderRadius: '15px', background: 'linear-gradient(145deg,#FB8C00,#C25A00)', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="menu-text">
                <div className="menu-title">Risk Disclosure Agreement</div>
                <div className="menu-sub">Terms, risks & conditions of use</div>
              </div>
              <svg className="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4020" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ CONFIDENTIALITY AGREEMENT PAGE ══════════════════════ */}
      {page === 'page-confidentiality' && (
        <div className="page" id="page-confidentiality">
          <div className="inner-header">
            <div className="inner-back-btn" onClick={() => showPage('page-main')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="inner-title">Confidentiality Agreement</div>
            <div className="inner-date">Last updated: January 2024</div>
          </div>

          <div className="agree-badge">
            <div className="agree-badge-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="agree-badge-text">
              By using Alfa9, you agree that your data is handled as described in this <strong>Confidentiality Agreement</strong>.
            </div>
          </div>

          <div className="agreement-wrap">
            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">1</div>
                Information We Collect
              </div>
              <div className="agreement-text">
                <p>Alfa9 collects information necessary to provide you with our gaming services. This includes:</p>
                <ul>
                  <li>Phone number and account credentials</li>
                  <li>Transaction history and financial records</li>
                  <li>Device information and IP address</li>
                  <li>Gaming activity and preferences</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">2</div>
                How We Use Your Information
              </div>
              <div className="agreement-text">
                <p>Your personal information is used <strong>only</strong> for the following purposes:</p>
                <ul>
                  <li>Processing deposits, withdrawals, and game transactions</li>
                  <li>Verifying your identity and preventing fraud</li>
                  <li>Sending account notifications and promotional offers</li>
                  <li>Improving our platform and customer support</li>
                </ul>
                <p>We <strong>do not sell</strong> your personal data to third parties for marketing purposes.</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">3</div>
                Data Security
              </div>
              <div className="agreement-text">
                <p>Alfa9 employs industry-standard security measures to protect your personal information:</p>
                <ul>
                  <li>All data transmitted using <strong>SSL encryption</strong></li>
                  <li>Passwords are stored in encrypted format</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Two-factor authentication available</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">4</div>
                Data Retention
              </div>
              <div className="agreement-text">
                <p>
                  We retain your account data for as long as your account is active or as required by applicable law. Upon
                  account deletion request, your personal data will be removed within <strong>30 days</strong>, except where
                  retention is required for legal compliance.
                </p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">5</div>
                Your Rights
              </div>
              <div className="agreement-text">
                <p>You have the right to:</p>
                <ul>
                  <li>Access the personal data we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt out of promotional communications</li>
                </ul>
                <p>To exercise these rights, contact our support team via Telegram or WhatsApp.</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">6</div>
                Contact Us
              </div>
              <div className="agreement-text">
                <p>For any privacy-related questions or concerns, please contact us:</p>
                <ul>
                  <li><strong>Telegram:</strong> @the_john_David</li>
                  <li><strong>WhatsApp:</strong> +92 328 2287821</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ RISK DISCLOSURE PAGE ══════════════════════ */}
      {page === 'page-risk' && (
        <div className="page" id="page-risk">
          <div className="inner-header">
            <div className="inner-back-btn" onClick={() => showPage('page-main')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div className="inner-title">Risk Disclosure Agreement</div>
            <div className="inner-date">Last updated: January 2024</div>
          </div>

          <div className="agree-badge">
            <div className="agree-badge-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="agree-badge-text">
              Please read this <strong>Risk Disclosure Agreement</strong> carefully before using Alfa9 gaming services.
            </div>
          </div>

          <div className="agreement-wrap">
            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">1</div>
                General Risk Warning
              </div>
              <div className="agreement-text">
                <p>
                  Online gaming and betting involves <strong>financial risk</strong>. You may lose some or all of the money
                  you deposit. Only participate with funds you can afford to lose.
                </p>
                <p>Alfa9 is intended for entertainment purposes. We strongly encourage responsible gaming at all times.</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">2</div>
                Eligibility Requirements
              </div>
              <div className="agreement-text">
                <p>By using Alfa9, you confirm that:</p>
                <ul>
                  <li>You are <strong>18 years of age or older</strong></li>
                  <li>You are legally permitted to participate in online gaming in your region</li>
                  <li>You are acting on your own behalf and not on behalf of any third party</li>
                  <li>Your funds are from legitimate sources</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">3</div>
                Financial Risks
              </div>
              <div className="agreement-text">
                <p>You acknowledge and accept the following financial risks:</p>
                <ul>
                  <li>Game outcomes are determined by <strong>random chance</strong> — no outcome is guaranteed</li>
                  <li>Past wins do not guarantee future results</li>
                  <li>Bonus funds are subject to wagering requirements before withdrawal</li>
                  <li>Transaction fees may apply depending on your payment method</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">4</div>
                Responsible Gaming
              </div>
              <div className="agreement-text">
                <p>Alfa9 promotes responsible gaming. We recommend:</p>
                <ul>
                  <li>Setting a <strong>daily/weekly budget</strong> for gaming</li>
                  <li>Never chasing losses — take breaks when needed</li>
                  <li>Keeping gaming as entertainment, not a source of income</li>
                  <li>Seeking help if gaming affects your daily life or finances</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">5</div>
                Account Responsibility
              </div>
              <div className="agreement-text">
                <p>You are fully responsible for:</p>
                <ul>
                  <li>All activity that occurs under your account</li>
                  <li>Keeping your login credentials secure and confidential</li>
                  <li>Reporting any unauthorized access immediately to support</li>
                  <li>Ensuring your account information remains accurate and up-to-date</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">6</div>
                Limitation of Liability
              </div>
              <div className="agreement-text">
                <p>Alfa9 shall not be liable for any losses arising from:</p>
                <ul>
                  <li>Technical failures, server outages, or connection interruptions</li>
                  <li>Unauthorized access to your account due to your negligence</li>
                  <li>Decisions made based on game outcomes or bonus promotions</li>
                </ul>
                <p>By continuing to use Alfa9, you <strong>accept all terms</strong> stated in this Risk Disclosure Agreement.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutUs;