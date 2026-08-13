import { useNavigate, Link } from 'react-router-dom';
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

  return (
    <div className="page-wrapper invitation-rules-page">
      <div className="top-bar">
        <a className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#140A03" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <span className="top-title">Rules</span>
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
        <div className="rules-program">【Promotion Partner】 Program</div>
        <div className="rules-validity">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          This activity is valid for a long time
        </div>
      </div>

      <div className="rules-body">
        <div className="rule-card">
          <div className="rule-num">01</div>
          <div className="rule-text">There are 6 subordinate levels in inviting friends, if A invites B, then B is a level 1 subordinate of A. If B invites C, then C is a level 1 subordinate of B and also a level 2 subordinate of A. If C invites D, then D is a level 1 subordinate of C, at the same time a level 2 subordinate of B and also a level 3 subordinate of A.</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">02</div>
          <div className="rule-text">When inviting friends to register, you must send the invitation link provided or enter the invitation code manually so that your friends become your level 1 subordinates.</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">03</div>
          <div className="rule-text">The invitee registers via the inviter&apos;s invitation code and completes the deposit, shortly after that the commission will be received immediately.</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">04</div>
          <div className="rule-text">The calculation of yesterday&apos;s commission starts every morning at 01:00. After the commission calculation is completed, the commission is rewarded to the wallet and can be viewed through the commission collection record.</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">05</div>
          <div className="rule-text">
            Commission rates vary depending on your agency level on that day<br /><br />
            <b>Number of Teams:</b> How many downline deposits you have to date.<br />
            <b>Team Deposits:</b> The total number of deposits made by your downline in one day.<br />
            <b>Team Deposit:</b> Your downline deposits within one day.
          </div>
        </div>

        <div className="rebate-table-wrap">
          <table className="rebate-table">
            <thead><tr><th>Rebate level</th><th>Team Number</th><th>Team Betting</th><th>Team Deposit</th></tr></thead>
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
            The commission percentage depends on the membership level. The higher the membership level, the higher the bonus percentage. Different game types also have different payout percentages.<br />
            The commission rate is specifically explained as follows.
            <Link className="view-ratio-link" to="/promotion/rebate-ratio">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18.7 8l-5.3 5.3-4-4L3 15.7" /></svg>
              View rebate ratio
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
            </Link>
          </div>
        </div>

        <div className="rule-card">
          <div className="rule-num">07</div>
          <div className="rule-text">TOP20 commission rankings will be randomly awarded with a separate bonus.</div>
        </div>

        <div className="rule-card">
          <div className="rule-num">08</div>
          <div className="rule-text">The final interpretation of this activity belongs to Alfa9.</div>
        </div>

        <div className="footer-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Alfa9 &nbsp;·&nbsp; Play Smart, Play Fair
        </div>
      </div>
    </div>
  );
}

export default InvitationRules;