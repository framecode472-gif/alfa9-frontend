import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './AboutUs.css';

function AboutUs() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
            <div className="header-title">{t('au_title')}</div>
            <div className="header-sub">{t('au_subtitle')}</div>
          </div>

          {/* Hero Banner */}
          <div className="about-hero">
            <div className="about-logo-wrap">
              {!logoError && (
                <img src="/image/ultraalf9.png" alt="Alfa9" onError={() => setLogoError(true)} />
              )}
            </div>
            <div className="about-app-name">{t('au_app_name')}</div>
            <div className="about-version">{t('au_version')} &nbsp;\u2022&nbsp; {t('au_established')}</div>
            <div className="about-tagline">
              {t('au_tagline')}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">50K+</div>
              <div className="stat-label">{t('au_active_users')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">24/7</div>
              <div className="stat-label">{t('au_support')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">5 Min</div>
              <div className="stat-label">{t('au_fast_payout')}</div>
            </div>
          </div>

          {/* Documents */}
          <div className="section-label">{t('au_legal_documents')}</div>
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
                <div className="menu-title">{t('au_confidentiality_title')}</div>
                <div className="menu-sub">{t('au_confidentiality_sub')}</div>
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
                <div className="menu-title">{t('au_risk_title')}</div>
                <div className="menu-sub">{t('au_risk_sub')}</div>
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
            <div className="inner-title">{t('au_confidentiality_title')}</div>
            <div className="inner-date">{t('au_last_updated')}</div>
          </div>

          <div className="agree-badge">
            <div className="agree-badge-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9971F" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="agree-badge-text">
              {t('au_conf_badge')} <strong>{t('au_confidentiality_title')}</strong>.
            </div>
          </div>

          <div className="agreement-wrap">
            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">1</div>
                Information We Collect
              </div>
              <div className="agreement-text">
                <p>{t('au_c1_intro')}</p>
                <ul>
                  <li>{t('au_c1_i1')}</li>
                  <li>{t('au_c1_i2')}</li>
                  <li>{t('au_c1_i3')}</li>
                  <li>{t('au_c1_i4')}</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">2</div>
                How We Use Your Information
              </div>
              <div className="agreement-text">
                <p>{t('au_c2_intro_1')} <strong>{t('au_c2_intro_2')}</strong> {t('au_c2_intro_3')}</p>
                <ul>
                  <li>{t('au_c2_i1')}</li>
                  <li>{t('au_c2_i2')}</li>
                  <li>{t('au_c2_i3')}</li>
                  <li>{t('au_c2_i4')}</li>
                </ul>
                <p>{t('au_c2_outro_1')} <strong>{t('au_c2_outro_2')}</strong> {t('au_c2_outro_3')}</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">3</div>
                Data Security
              </div>
              <div className="agreement-text">
                <p>{t('au_c3_intro')}</p>
                <ul>
                  <li>{t('au_c3_i1')} <strong>{t('au_c3_i1b')}</strong></li>
                  <li>{t('au_c3_i2')}</li>
                  <li>{t('au_c3_i3')}</li>
                  <li>{t('au_c3_i4')}</li>
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
                  {t('au_c4_text_1')} <strong>{t('au_c4_text_2')}</strong>{t('au_c4_text_3')}
                </p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">5</div>
                Your Rights
              </div>
              <div className="agreement-text">
                <p>{t('au_c5_intro')}</p>
                <ul>
                  <li>{t('au_c5_i1')}</li>
                  <li>{t('au_c5_i2')}</li>
                  <li>{t('au_c5_i3')}</li>
                  <li>{t('au_c5_i4')}</li>
                </ul>
                <p>{t('au_c5_outro')}</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">6</div>
                Contact Us
              </div>
              <div className="agreement-text">
                <p>{t('au_c6_intro')}</p>
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
            <div className="inner-title">{t('au_risk_title')}</div>
            <div className="inner-date">{t('au_last_updated')}</div>
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
              {t('au_risk_badge')} <strong>{t('au_risk_title')}</strong> {t('au_risk_badge_2')}
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
                  {t('au_r1_p1_1')} <strong>{t('au_r1_p1_2')}</strong>{t('au_r1_p1_3')}
                </p>
                <p>{t('au_r1_p2')}</p>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">2</div>
                Eligibility Requirements
              </div>
              <div className="agreement-text">
                <p>{t('au_r2_intro')}</p>
                <ul>
                  <li>{t('au_r2_i1_1')} <strong>{t('au_r2_i1_2')}</strong></li>
                  <li>{t('au_r2_i2')}</li>
                  <li>{t('au_r2_i3')}</li>
                  <li>{t('au_r2_i4')}</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">3</div>
                Financial Risks
              </div>
              <div className="agreement-text">
                <p>{t('au_r3_intro')}</p>
                <ul>
                  <li>{t('au_r3_i1_1')} <strong>{t('au_r3_i1_2')}</strong> {t('au_r3_i1_3')}</li>
                  <li>{t('au_r3_i2')}</li>
                  <li>{t('au_r3_i3')}</li>
                  <li>{t('au_r3_i4')}</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">4</div>
                Responsible Gaming
              </div>
              <div className="agreement-text">
                <p>{t('au_r4_intro')}</p>
                <ul>
                  <li>{t('au_r4_i1_1')} <strong>{t('au_r4_i1_2')}</strong> {t('au_r4_i1_3')}</li>
                  <li>{t('au_r4_i2')}</li>
                  <li>{t('au_r4_i3')}</li>
                  <li>{t('au_r4_i4')}</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">5</div>
                Account Responsibility
              </div>
              <div className="agreement-text">
                <p>{t('au_r5_intro')}</p>
                <ul>
                  <li>{t('au_r5_i1')}</li>
                  <li>{t('au_r5_i2')}</li>
                  <li>{t('au_r5_i3')}</li>
                  <li>{t('au_r5_i4')}</li>
                </ul>
              </div>
            </div>

            <div className="agreement-section">
              <div className="agreement-section-title">
                <div className="agreement-section-num">6</div>
                Limitation of Liability
              </div>
              <div className="agreement-text">
                <p>{t('au_r6_intro')}</p>
                <ul>
                  <li>{t('au_r6_i1')}</li>
                  <li>{t('au_r6_i2')}</li>
                  <li>{t('au_r6_i3')}</li>
                </ul>
                <p>{t('au_r6_outro_1')} <strong>{t('au_r6_outro_2')}</strong> {t('au_r6_outro_3')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutUs;