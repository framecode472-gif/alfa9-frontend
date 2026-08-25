import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext.jsx';
import './InvitationRules.css';

const REBATE_LEVELS = [
  { level: 'L0', team: 0, betting: 0, deposit: 0 },
  { level: 'L1', team: 5, betting: '600K', deposit: '100K' },
  { level: 'L2', team: 10, betting: '1.50M', deposit: '200K' },
  { level: 'L3', team: 20, betting: '3.50M', deposit: '500K' },
  { level: 'L4', team: 35, betting: '7M', deposit: '1,000K' },
  { level: 'L5', team: 80, betting: '15M', deposit: '2M' },
  { level: 'L6', team: 200, betting: '50M', deposit: '7M' },
  { level: 'L7', team: 500, betting: '150M', deposit: '30M' },
  { level: 'L8', team: 1000, betting: '500M', deposit: '100M' },
  { level: 'L9', team: 5000, betting: '1,500M', deposit: '300M' },
];

function InvitationRules() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="page-wrapper invitation-rules-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">{t('irl_title')}</span>
      </div>

      <div className="rules-intro">
        <div className="intro-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="rules-program">{t('irl_program')}</div>
        <div className="rules-validity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          {t('irl_validity')}
        </div>
      </div>

      <div className="rules-body">
        <div className="rule-card">
          <div className="rule-num">01</div>
          <div className="rule-text">{t('irl_rule1')}</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">02</div>
          <div className="rule-text">{t('irl_rule2')}</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">03</div>
          <div className="rule-text">{t('irl_rule3')}</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">04</div>
          <div className="rule-text">{t('irl_rule4')}</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">05</div>
          <div className="rule-text">
            {t('irl_rule5_1')}<br /><br />
            <b>{t('irl_rule5_teams')}</b> {t('irl_rule5_teams_desc')}<br />
            <b>{t('irl_rule5_deposits')}</b> {t('irl_rule5_deposits_desc')}<br />
            <b>{t('irl_rule5_deposit')}</b> {t('irl_rule5_deposit_desc')}
          </div>
        </div>

        <div className="rebate-table-wrap">
          <table className="rebate-table">
            <thead><tr><th>{t('irl_table_rebate_level')}</th><th>{t('irl_table_team_number')}</th><th>{t('irl_table_team_betting')}</th><th>{t('irl_table_team_deposit')}</th></tr></thead>
            <tbody>
              {REBATE_LEVELS.map((row) => (
                <tr key={row.level}>
                  <td><div className="level-cell"><div className="level-badge">{row.level}</div></div></td>
                  <td>{row.team}</td>
                  <td>{row.betting}</td>
                  <td>{row.deposit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rule-card">
          <div className="rule-num">06</div>
          <div className="rule-text">
            {t('irl_rule6_1')}<br />
            {t('irl_rule6_2')}
            <Link className="view-ratio-link" to="/promotion/rebate-ratio">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18.7 8l-5.3 5.3-4-4L3 15.7" /></svg>
              {t('irl_view_ratio')}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
            </Link>
          </div>
        </div>

        <div className="rule-card">
          <div className="rule-num">07</div>
          <div className="rule-text">{t('irl_rule7')}</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">08</div>
          <div className="rule-text">{t('irl_rule8')}</div>
        </div>

        <div className="footer-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Alfa9 &nbsp;\u00b7&nbsp; {t('irl_footer')}
        </div>
      </div>
    </div>
  );
}

export default InvitationRules;