import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../../utils/api';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './PartnerRewards.css';

// Fallback only (shown before the real backend value loads). Must match the
// live app's actual register route (/auth), not a hash-style /#/register path
// that doesn't exist in this app's router.
const INVITE_LINK = `${window.location.origin}/auth?ref=`;

const REWARD_ROWS = [
  { labelKey: 'pr_1st_deposit', bonus: null, isHeader: true },
  { label: 'Rs300 ≤ Amount<Rs1,000 and Turnover ≥ Rs1,500', bonus: 'Rs30' },
  { label: 'Rs1,000 ≤ Amount<Rs5,000 and Turnover ≥ Rs5,000', bonus: 'Rs100' },
  { label: 'Rs5,000 ≤ Amount<Rs10,000 and Turnover ≥ Rs25,000', bonus: 'Rs300' },
  { label: 'Rs10,000 ≤ Amount<Rs50,000 and Turnover ≥ Rs50,000', bonus: 'Rs500' },
  { label: 'Amount ≥ Rs50,000 and Turnover ≥ Rs250,000', bonus: 'Rs1,500' },

  { labelKey: 'pr_2nd_deposit', bonus: null, isHeader: true },
  { label: 'Rs500 ≤ Amount<Rs3,000 and Turnover ≥ Rs2,500', bonus: 'Rs50' },
  { label: 'Rs3,000 ≤ Amount<Rs10,000 and Turnover ≥ Rs15,000', bonus: 'Rs150' },
  { label: 'Rs10,000 ≤ Amount<Rs50,000 and Turnover ≥ Rs50,000', bonus: 'Rs500' },
  { label: 'Amount ≥ Rs50,000 and Turnover ≥ Rs250,000', bonus: 'Rs2,000' },

  { labelKey: 'pr_3rd_deposit', bonus: null, isHeader: true },
  { label: 'Rs1,000 ≤ Amount<Rs5,000 and Turnover ≥ Rs5,000', bonus: 'Rs100' },
  { label: 'Rs5,000 ≤ Amount<Rs10,000 and Turnover ≥ Rs25,000', bonus: 'Rs300' },
  { label: 'Rs10,000 ≤ Amount<Rs50,000 and Turnover ≥ Rs50,000', bonus: 'Rs700' },
  { label: 'Amount ≥ Rs50,000 and Turnover ≥ Rs250,000', bonus: 'Rs2,000' },
];

function PartnerRewards() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [summary, setSummary] = useState({ inviteLink: INVITE_LINK, invitationCount: 0, effectiveInvitationCount: 0, invitationTotalBonus: 0 });

  useEffect(() => {
    apiFetch('/promotion/partner-rewards-summary')
      .then((data) => setSummary({
        inviteLink: data.inviteLink || INVITE_LINK,
        invitationCount: data.invitationCount || 0,
        effectiveInvitationCount: data.effectiveInvitationCount || 0,
        invitationTotalBonus: data.invitationTotalBonus || 0
      }))
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const copyLink = () => {
    navigator.clipboard
      .writeText(summary.inviteLink)
      .then(() => showToast('\u2713 ' + t('promo_toast_link_copied')))
      .catch(() => showToast('\u2713 ' + t('promo_toast_link_copied')));
  };

  return (
    <div className="page-wrapper partner-rewards-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">{t('pr_title')}</span>
      </div>

      <div className="reward-hero">
        <div className="reward-hero-text">
          <div className="reward-hero-title">{t('pr_hero_title')}</div>
          <div className="reward-hero-amount">Rs2,000.00</div>
        </div>
      </div>

      <div className="info-stack">
        <div className="info-row"><span className="info-label">{t('pr_invitation_count')}</span><span className="info-value">{summary.invitationCount}</span></div>
        <div className="info-row"><span className="info-label">{t('pr_effective_count')}</span><span className="info-value green">{summary.effectiveInvitationCount}</span></div>
        <div className="info-row"><span className="info-label">{t('pr_total_bonus')}</span><span className="info-value red">Rs{summary.invitationTotalBonus.toFixed(2)}</span></div>
      </div>

      <div className="invite-record-link" onClick={() => navigate('/promotion/invitation-record')}>
        {t('pr_invitation_record')}
      </div>

      <div className="link-section">
        <div className="link-section-title">
          <div className="link-bar"></div>
          <span className="link-title">{t('pr_invitation_link')}</span>
        </div>
        <div className="link-box">
          <div className="link-text">{INVITE_LINK}</div>
          <div className="link-copy-btn" onClick={copyLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="rules-card">
        <div className="rules-header">
          <svg className="rules-header-icon" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5V4.5C4 3.4 4.9 2.5 6 2.5H20V21.5H6C4.9 21.5 4 20.6 4 19.5Z" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M4 19.5C4 18.4 4.9 17.5 6 17.5H20" stroke="#D4AF37" strokeWidth="1.8" />
          </svg>
          <span className="rules-header-text">{t('promo_invitation_rules')}</span>
        </div>
        <div className="rules-sub">{t('pr_rules_sub_1')} <b>7</b> {t('pr_rules_sub_2')}</div>

        <table className="reward-table">
          <thead><tr><th>{t('pr_table_when')}</th><th>{t('pr_table_bonus')}</th></tr></thead>
          <tbody>
            {REWARD_ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.isHeader ? <span className="deposit-cell">{t(row.labelKey)}</span> : (
                  <span dangerouslySetInnerHTML={{ __html: row.label.replace(' and ', '<br/>and ') }} />
                )}</td>
                <td className={row.bonus ? 'bonus-cell' : ''}>{row.bonus || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="note-text">{t('pr_note')}</div>

        <div className="eg-list">
          <div className="eg-item"><span className="eg-dot"></span><span>{t('pr_eg1').split('**')[0]}<b className="hl">Rs299.00</b>{t('pr_eg1').split('**')[2]}<b className="hl">Rs1,500.00</b>{t('pr_eg1').split('**')[4]}</span></div>
          <div className="eg-item"><span className="eg-dot"></span><span>{t('pr_eg2')}</span></div>
          <div className="eg-item"><span className="eg-dot"></span><span>{t('pr_eg3')}</span></div>
        </div>
      </div>

      {toast.show && <div className="toast show">{toast.msg}</div>}
    </div>
  );
}

export default PartnerRewards;